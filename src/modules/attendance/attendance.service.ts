import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { PunchInDto } from './dto/punch-in.dto';
import { PunchOutDto } from './dto/punch-out.dto';
import { TrackLocationDto } from './dto/track-location.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
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
      .exec();

    if (!shift) {
      throw new NotFoundException(
        `No attendance record found for user on date ${date}`,
      );
    }

    const totalDistanceKm = this.calculateTotalDistance(shift.path);
    const holdingPoints = this.calculateHoldingPoints(shift.path);

    return {
      userId: shift.userId,
      date: shift.date,
      status: shift.status,
      punchInTime: shift.punchInTime,
      punchInLocation: shift.punchInLocation,
      punchOutTime: shift.punchOutTime,
      punchOutLocation: shift.punchOutLocation,
      path: shift.path,
      holdingPoints,
      totalDistanceKm,
    };
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
