import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { LoginHistory, LoginHistoryDocument } from '../login-history/schemas/login-history.schema';
import { PunchInDto } from './dto/punch-in.dto';
import { PunchOutDto } from './dto/punch-out.dto';
import { TrackLocationDto } from './dto/track-location.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(LoginHistory.name)
    private loginHistoryModel: Model<LoginHistoryDocument>,
  ) {}

  /**
   * Registers user shift punch-in, checking for existing active shifts on the current date.
   */
  async punchIn(
    userId: string | null,
    punchInDto: PunchInDto,
  ): Promise<AttendanceDocument> {
    const todayStr = new Date().toISOString().split('T')[0];

    // Check for an active shift on the same day
    const existingActiveShift = await this.attendanceModel
      .findOne({
        userId,
        date: todayStr,
        status: 'ACTIVE',
      })
      .exec();

    if (existingActiveShift) {
      throw new ConflictException(
        'You have already punched in and have an active shift today.',
      );
    }

    const newAttendance = new this.attendanceModel({
      userId,
      date: todayStr,
      punchInTime: new Date(),
      punchInLocation: {
        latitude: punchInDto.latitude,
        longitude: punchInDto.longitude,
        timestamp: new Date(),
      },
      status: 'ACTIVE',
      path: [
        {
          latitude: punchInDto.latitude,
          longitude: punchInDto.longitude,
          timestamp: new Date(),
        },
      ],
    });

    return newAttendance.save();
  }

  /**
   * Registers user shift punch-out, closing and finalizing the shift.
   */
  async punchOut(
    userId: string | null,
    punchOutDto: PunchOutDto,
  ): Promise<AttendanceDocument> {
    const activeShift = await this.attendanceModel
      .findOne({
        userId,
        status: 'ACTIVE',
      })
      .exec();

    if (!activeShift) {
      throw new NotFoundException(
        'No active punched-in shift found. Please punch in first.',
      );
    }

    activeShift.punchOutTime = new Date();
    activeShift.punchOutLocation = {
      latitude: punchOutDto.latitude,
      longitude: punchOutDto.longitude,
      timestamp: new Date(),
    };
    activeShift.status = 'COMPLETED';

    // Append the final punch-out coordinate to the movement path list
    activeShift.path.push({
      latitude: punchOutDto.latitude,
      longitude: punchOutDto.longitude,
      timestamp: new Date(),
    });

    return activeShift.save();
  }

  /**
   * Periodically tracks and appends coordinate logs to the active shift.
   */
  async trackLocation(
    userId: string | null,
    trackLocationDto: TrackLocationDto,
  ): Promise<AttendanceDocument> {
    const activeShift = await this.attendanceModel
      .findOne({
        userId,
        status: 'ACTIVE',
      })
      .exec();

    if (!activeShift) {
      throw new NotFoundException(
        'No active shift found. Location tracking requires a punched-in shift.',
      );
    }

    // Check if the agent has actually moved (minimum 10 meters / 0.01 km)
    if (activeShift.path && activeShift.path.length > 0) {
      const lastPoint = activeShift.path[activeShift.path.length - 1];
      const distance = this.getDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        trackLocationDto.latitude,
        trackLocationDto.longitude,
      );

      // 0.01 km = 10 meters threshold
      if (distance < 0.01) {
        return activeShift;
      }
    }

    activeShift.path.push({
      latitude: trackLocationDto.latitude,
      longitude: trackLocationDto.longitude,
      timestamp: new Date(),
    });

    return activeShift.save();
  }

  /**
   * Generates agent movement metrics including path list and computed stops (holding points).
   */
  async getAgentTimeline(userId: string, date: string): Promise<any> {
    const shift = await this.attendanceModel
      .findOne({
        userId,
        date,
      })
      .sort({ punchInTime: -1 })
      .exec();

    // Query LoginHistory for this user on this day
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    const logins = await this.loginHistoryModel
      .find({
        userId,
        type: 'login',
        timestamp: { $gte: start, $lte: end },
      })
      .sort({ timestamp: 1 })
      .exec();

    const firstLogin = logins[0];
    const loginDetails = firstLogin
      ? {
          time: firstLogin.timestamp,
          ip: firstLogin.ip,
          device: firstLogin.device || firstLogin.userAgent || 'Unknown Device',
          lat: firstLogin.lat,
          long: firstLogin.long,
        }
      : undefined;

    if (!shift) {
      if (logins.length > 0) {
        // Find logout logs
        const logouts = await this.loginHistoryModel
          .find({
            userId,
            type: 'logout',
            timestamp: { $gte: start, $lte: end },
          })
          .sort({ timestamp: -1 })
          .exec();
        const lastLogout = logouts[0];

        const path = logins
          .map((l) => ({
            latitude: l.lat ?? 0,
            longitude: l.long ?? 0,
            timestamp: l.timestamp,
          }))
          .filter((p) => p.latitude !== 0 && p.longitude !== 0);

        return {
          userId,
          date,
          status: lastLogout ? 'COMPLETED' : 'ACTIVE',
          punchInTime: firstLogin.timestamp,
          punchInLocation: {
            latitude: firstLogin.lat ?? 28.5355,
            longitude: firstLogin.long ?? 77.391,
            timestamp: firstLogin.timestamp,
          },
          punchOutTime: lastLogout ? lastLogout.timestamp : undefined,
          punchOutLocation: lastLogout
            ? {
                latitude: lastLogout.lat ?? 28.5355,
                longitude: lastLogout.long ?? 77.391,
                timestamp: lastLogout.timestamp,
              }
            : undefined,
          path,
          holdingPoints: [],
          totalDistanceKm: 0,
          loginDetails,
        };
      }

      throw new NotFoundException(
        `No attendance record found for user on date ${date}`,
      );
    }

    const totalDistanceKm = this.calculateTotalDistance(shift.path || []);
    const holdingPoints = this.calculateHoldingPoints(shift.path || []);

    return {
      userId: shift.userId,
      date: shift.date,
      status: shift.status,
      punchInTime: shift.punchInTime,
      punchInLocation: shift.punchInLocation,
      punchOutTime: shift.punchOutTime,
      punchOutLocation: shift.punchOutLocation,
      path: shift.path || [],
      holdingPoints,
      totalDistanceKm,
      loginDetails,
      manualStatus: shift.manualStatus,
      remarks: shift.remarks,
      workingHours: shift.workingHours,
      lateBy: shift.lateBy,
    };
  }

  /**
   * Saves or updates a manual attendance record marked by an administrator.
   */
  async saveManualAttendance(
    dto: MarkAttendanceDto,
  ): Promise<AttendanceDocument> {
    const {
      userId,
      date,
      status,
      checkIn,
      checkOut,
      workingHours,
      lateBy,
      remarks,
    } = dto;

    // Find if there is an existing record
    let record = await this.attendanceModel.findOne({ userId, date }).exec();

    // Default coordinates Nagpur/Noida
    const defaultLocation = {
      latitude: 21.1458,
      longitude: 79.0882,
      timestamp: new Date(),
    };

    if (!record) {
      record = new this.attendanceModel({
        userId,
        date,
      });
    }

    record.manualStatus = status;
    record.remarks = remarks || '';
    record.workingHours = workingHours || '';
    record.lateBy = lateBy || '';
    record.status = checkOut ? 'COMPLETED' : 'ACTIVE';

    if (checkIn) {
      record.punchInTime = new Date(`${date}T${checkIn}:00`);
      record.punchInLocation = defaultLocation;
    } else {
      record.punchInTime = undefined;
      record.punchInLocation = undefined;
    }

    if (checkOut) {
      record.punchOutTime = new Date(`${date}T${checkOut}:00`);
      record.punchOutLocation = defaultLocation;
    } else {
      record.punchOutTime = undefined;
      record.punchOutLocation = undefined;
    }

    return record.save();
  }

  /**
   * Fetches all attendance records in the database, populated with user details,
   * dynamically synthesizing check-ins from LoginHistory when no explicit record exists.
   */
  async getAllAttendance(): Promise<any[]> {
    // 1. Fetch all explicit attendance documents
    const attendances = await this.attendanceModel.find().populate('userId').exec();

    // Create a set of user-date strings that already have explicit attendance records
    const existingKeys = new Set(
      attendances.map((a) => {
        const uId = a.userId && typeof a.userId === 'object' ? a.userId._id.toString() : (a.userId || '').toString();
        return `${uId}_${a.date}`;
      })
    );

    // 2. Fetch all logins from LoginHistory
    const logins = await this.loginHistoryModel
      .find({ type: 'login' })
      .populate('userId')
      .exec();

    // Sort logins by timestamp ascending so we process the first login of the day
    logins.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // 3. Synthesize attendance for user-dates that have logins but no explicit attendance records
    const synthesized: any[] = [];
    const synthesizedKeys = new Set<string>();

    for (const login of logins) {
      if (!login.userId) continue;
      const uId = typeof login.userId === 'object' ? (login.userId as any)._id.toString() : login.userId.toString();
      const dateStr = login.timestamp.toISOString().split('T')[0];
      const key = `${uId}_${dateStr}`;

      if (!existingKeys.has(key) && !synthesizedKeys.has(key)) {
        // Query if there is a logout on the same day
        const start = new Date(`${dateStr}T00:00:00.000Z`);
        const end = new Date(`${dateStr}T23:59:59.999Z`);
        const logout = await this.loginHistoryModel
          .findOne({
            userId: uId,
            type: 'logout',
            timestamp: { $gte: start, $lte: end },
          })
          .sort({ timestamp: -1 })
          .exec();

        synthesized.push({
          userId: login.userId,
          date: dateStr,
          punchInTime: login.timestamp,
          punchInLocation: {
            latitude: login.lat ?? 28.5355,
            longitude: login.long ?? 77.391,
            timestamp: login.timestamp,
          },
          punchOutTime: logout ? logout.timestamp : undefined,
          punchOutLocation: logout
            ? {
                latitude: logout.lat ?? 28.5355,
                longitude: logout.long ?? 77.391,
                timestamp: logout.timestamp,
              }
            : undefined,
          status: logout ? 'COMPLETED' : 'ACTIVE',
          path: [],
          isSynthesized: true,
        });

        synthesizedKeys.add(key);
      }
    }

    // Combine both arrays and sort by punchInTime descending
    const all = [
      ...attendances.map((a) => (a.toObject ? a.toObject() : a)),
      ...synthesized,
    ];
    all.sort((a, b) => new Date(b.punchInTime).getTime() - new Date(a.punchInTime).getTime());

    return all;
  }

  /**
   * Retrieves the live location of all agents who have punched in today.
   */
  async getLiveLocations(): Promise<any[]> {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find all attendance records for today
    const records = await this.attendanceModel
      .find({ date: todayStr })
      .populate('userId')
      .exec();

    return records.map((record) => {
      const user = record.userId as any;
      const lastPoint =
        record.path && record.path.length > 0
          ? record.path[record.path.length - 1]
          : record.punchInLocation;

      return {
        userId: user?._id?.toString() || record.userId?.toString(),
        userName: user
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : 'Unknown Agent',
        role: user?.role || 'Staff',
        latitude: lastPoint?.latitude || 21.1458,
        longitude: lastPoint?.longitude || 79.0882,
        lastUpdated: lastPoint?.timestamp || record.punchInTime || new Date(),
        status: record.status === 'ACTIVE' ? 'Active' : 'Inactive',
        address: lastPoint?.address || (record.status === 'ACTIVE' ? 'Active Tracking' : 'Last Known Location'),
      };
    });
  }

  // ==========================================
  // Spatial & Geodetic Algorithms
  // ==========================================

  /**
   * Calculates the distance between two coordinates in Kilometers using the Haversine formula.
   */
  private getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in Kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Iterates through path tracking history to calculate cumulative distance traveled.
   */
  private calculateTotalDistance(path: any[]): number {
    let totalDist = 0;
    for (let k = 0; k < path.length - 1; k++) {
      totalDist += this.getDistance(
        path[k].latitude,
        path[k].longitude,
        path[k + 1].latitude,
        path[k + 1].longitude,
      );
    }
    return Math.round(totalDist * 100) / 100; // Round to 2 decimal points
  }

  /**
   * Identifies holding points (stops) dynamically using linear spatial clustering.
   * Group consecutive coordinates within 50 meters spanning 5 minutes or more.
   */
  private calculateHoldingPoints(path: any[]): any[] {
    if (path.length < 2) {
      return [];
    }

    const holdingPoints: any[] = [];
    const MAX_HALT_DISTANCE_M = 50; // Halt boundary radius (50 meters)
    const MIN_HALT_DURATION_MS = 5 * 60 * 1000; // Halt duration limit (5 minutes)

    let i = 0;
    while (i < path.length) {
      let j = i + 1;
      const clusterPoints = [path[i]];

      while (j < path.length) {
        // Measure coordinate distance from the starting cluster point
        const dist =
          this.getDistance(
            path[i].latitude,
            path[i].longitude,
            path[j].latitude,
            path[j].longitude,
          ) * 1000; // Convert to meters

        if (dist <= MAX_HALT_DISTANCE_M) {
          clusterPoints.push(path[j]);
          j++;
        } else {
          break;
        }
      }

      // Check if cluster duration satisfies our holding threshold (>= 5 minutes)
      if (clusterPoints.length >= 2) {
        const startTime = new Date(clusterPoints[0].timestamp);
        const endTime = new Date(
          clusterPoints[clusterPoints.length - 1].timestamp,
        );
        const durationMs = endTime.getTime() - startTime.getTime();

        if (durationMs >= MIN_HALT_DURATION_MS) {
          // Calculate cluster center coordinates (Centroid)
          let sumLat = 0;
          let sumLng = 0;
          clusterPoints.forEach((p) => {
            sumLat += p.latitude;
            sumLng += p.longitude;
          });
          const centroidLat = sumLat / clusterPoints.length;
          const centroidLng = sumLng / clusterPoints.length;
          const durationMinutes =
            Math.round((durationMs / (60 * 1000)) * 10) / 10;

          holdingPoints.push({
            latitude: centroidLat,
            longitude: centroidLng,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            durationMinutes,
            label: `Holding Point (Duration: ${durationMinutes} mins)`,
          });

          // Jump iterator pointer beyond the current halt cluster points
          i = j - 1;
        }
      }
      i++;
    }

    return holdingPoints;
  }
}
