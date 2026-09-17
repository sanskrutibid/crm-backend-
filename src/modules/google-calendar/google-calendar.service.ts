import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { google } from 'googleapis';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { SiteVisit, SiteVisitDocument } from '../site-visits/schemas/site-visit.schema';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(SiteVisit.name) private readonly siteVisitModel: Model<SiteVisitDocument>,
  ) {}

  private getOAuth2Client(user?: UserDocument) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    if (user && user.googleRefreshToken) {
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });

      // Handle token refreshing automatically
      oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
          user.googleRefreshToken = tokens.refresh_token;
        }
        if (tokens.access_token) {
          user.googleAccessToken = tokens.access_token;
          await user.save();
        }
      });
    }

    return oauth2Client;
  }

  generateAuthUrl(): string {
    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  }

  async connect(code: string, userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email;

    user.googleAccessToken = tokens.access_token ?? undefined;
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token ?? undefined;
    }
    user.googleEmail = googleEmail ?? undefined;
    user.googleCalendarConnected = true;

    return await user.save();
  }

  async disconnect(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.googleAccessToken = undefined;
    user.googleRefreshToken = undefined;
    user.googleEmail = undefined;
    user.googleCalendarConnected = false;

    return await user.save();
  }

  async getStatus(userId: string): Promise<{ isConnected: boolean; googleEmail?: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      return { isConnected: false };
    }
    return {
      isConnected: !!user.googleCalendarConnected,
      googleEmail: user.googleEmail,
    };
  }

  /**
   * Helper to parse schedule date and time strings into a single Date object forced to IST (UTC+05:30).
   * Handles "2026-05-26" and "26-May-2026" formats.
   */
  private parseDateTime(dateStr?: string, timeStr?: string): Date | null {
    if (!dateStr || !timeStr) return null;
    try {
      const dStr = dateStr.trim();
      const tStr = timeStr.trim().toLowerCase();

      // Extract hour, minute and am/pm from time like "4:34pm" or "12:00 PM"
      const timeRegex = /(\d+):(\d+)\s*(am|pm)/i;
      const match = tStr.match(timeRegex);
      if (!match) return null;

      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toLowerCase();

      if (ampm === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      }

      let year = 0;
      let month = 0;
      let day = 0;

      if (dStr.includes('-')) {
        const parts = dStr.split('-');
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        } else {
          // DD-MMM-YYYY or DD-MM-YYYY
          const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          day = parseInt(parts[0], 10);
          const monthPart = parts[1].toLowerCase();
          year = parseInt(parts[2], 10);
          month = months.findIndex(m => monthPart.startsWith(m));
          if (month === -1) {
            month = parseInt(parts[1], 10) - 1;
          }
        }
      } else {
        const parsedDate = new Date(dStr);
        if (!isNaN(parsedDate.getTime())) {
          year = parsedDate.getFullYear();
          month = parsedDate.getMonth();
          day = parsedDate.getDate();
        } else {
          const today = new Date();
          year = today.getFullYear();
          month = today.getMonth();
          day = today.getDate();
        }
      }

      const pad = (num: number) => String(num).padStart(2, '0');
      // Construct ISO string with +05:30 timezone offset
      const isoString = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
      const date = new Date(isoString);

      return isNaN(date.getTime()) ? null : date;
    } catch (err) {
      this.logger.error('Error parsing datetime:', err);
      return null;
    }
  }

  async syncEventForLead(leadId: string): Promise<void> {
    try {
      const lead = await this.leadModel.findById(leadId).populate('assignedTo').exec();
      if (!lead) return;

      const assignee = lead.assignedTo as any as UserDocument;
      if (!assignee || !assignee.googleCalendarConnected || !assignee.googleRefreshToken) {
        return;
      }

      const start = this.parseDateTime(lead.scheduleDate, lead.scheduleTime);
      if (!start) return;

      // Default duration to 30 minutes
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      const oauth2Client = this.getOAuth2Client(assignee);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const eventBody = {
        summary: `CRM Lead Follow-up: ${lead.purpose || 'Follow-Up'}`,
        description: `Lead Details:\nRequirement: ${lead.requirement}\nFollowup Note: ${lead.followupNote}\nTemperature: ${lead.temperature}\nStatus: ${lead.status}`,
        start: {
          dateTime: start.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
      };

      if (lead.googleEventId) {
        try {
          await calendar.events.update({
            calendarId: 'primary',
            eventId: lead.googleEventId,
            requestBody: eventBody,
          });
          this.logger.log(`Google Calendar event updated for lead: ${leadId}`);
        } catch (error) {
          // If event was deleted from Google Calendar, create a new one
          if (error.code === 404 || error.code === 410) {
            const response = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: eventBody,
            });
            lead.googleEventId = response.data.id ?? undefined;
            await lead.save();
            this.logger.log(`New Google Calendar event created (after 404) for lead: ${leadId}`);
          } else {
            throw error;
          }
        }
      } else {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
        });
        lead.googleEventId = response.data.id ?? undefined;
        await lead.save();
        this.logger.log(`Google Calendar event created for lead: ${leadId}`);
      }
    } catch (err) {
      this.logger.error(`Failed to sync calendar event for Lead ${leadId}:`, err);
    }
  }

  async syncEventForSiteVisit(siteVisitId: string): Promise<void> {
    try {
      const visit = await this.siteVisitModel.findById(siteVisitId).populate('assignee').exec();
      if (!visit) return;

      const assignee = visit.assignee as any as UserDocument;
      if (!assignee || !assignee.googleCalendarConnected || !assignee.googleRefreshToken) {
        return;
      }

      const start = this.parseDateTime(visit.visitDate, visit.timeIn);
      if (!start) return;

      let end = this.parseDateTime(visit.visitDate, visit.timeOut);
      if (!end || end.getTime() <= start.getTime()) {
        end = new Date(start.getTime() + 60 * 60 * 1000); // default to 1 hour
      }

      const oauth2Client = this.getOAuth2Client(assignee);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const eventBody = {
        summary: `CRM Site Visit: ${visit.visitor} @ ${visit.siteName || 'N/A'}`,
        description: `Site Visit Details:\nVisitor Name: ${visit.visitor}\nVisit Type: ${visit.visitType}\nStatus: ${visit.visitStatus}\nRemark: ${visit.remark || 'N/A'}`,
        start: {
          dateTime: start.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
      };

      if (visit.googleEventId) {
        try {
          await calendar.events.update({
            calendarId: 'primary',
            eventId: visit.googleEventId,
            requestBody: eventBody,
          });
          this.logger.log(`Google Calendar event updated for site visit: ${siteVisitId}`);
        } catch (error) {
          if (error.code === 404 || error.code === 410) {
            const response = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: eventBody,
            });
            visit.googleEventId = response.data.id ?? undefined;
            await visit.save();
            this.logger.log(`New Google Calendar event created (after 404) for site visit: ${siteVisitId}`);
          } else {
            throw error;
          }
        }
      } else {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
        });
        visit.googleEventId = response.data.id ?? undefined;
        await visit.save();
        this.logger.log(`Google Calendar event created for site visit: ${siteVisitId}`);
      }
    } catch (err) {
      this.logger.error(`Failed to sync calendar event for SiteVisit ${siteVisitId}:`, err);
    }
  }

  async deleteEvent(userId: string, eventId?: string): Promise<void> {
    if (!eventId) return;
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user || !user.googleCalendarConnected || !user.googleRefreshToken) {
        return;
      }

      const oauth2Client = this.getOAuth2Client(user);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      this.logger.log(`Google Calendar event deleted: ${eventId}`);
    } catch (err) {
      if (err.code !== 404 && err.code !== 410) {
        this.logger.error(`Failed to delete calendar event ${eventId}:`, err);
      }
    }
  }
}
