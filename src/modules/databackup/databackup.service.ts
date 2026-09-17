import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { BackupLog, BackupLogDocument } from './schemas/backup-log.schema';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class DatabackupService implements OnModuleInit {
  private readonly backupsDir = join(process.cwd(), 'backups');

  constructor(
    @InjectModel(BackupLog.name)
    private readonly backupLogModel: Model<BackupLogDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit() {
    // Ensure backups directory exists
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  async getBackupLogs(): Promise<BackupLog[]> {
    return this.backupLogModel.find().sort({ createdAt: -1 }).exec();
  }

  async createBackup(moduleName: string): Promise<BackupLog> {
    const backupName = 'Manual Request';

    // 1. Create a log in progress
    const tempLog = await this.backupLogModel.create({
      version: backupName,
      modules: moduleName,
      filename: 'Generating...',
      size: 'Calculating...',
      type: 'Manual',
      status: 'In Progress',
      date: new Date(),
    });

    try {
      // 2. Identify collection name
      const collectionMapping: { [key: string]: string } = {
        CONTACT: 'contacts',
        LEAD: 'leads',
        ENQUIRY: 'enquiries',
        PROPERTY: 'properties',
        PROJECT: 'projects',
        SITEVISIT: 'sitevisits',
      };

      const targetCollection =
        collectionMapping[moduleName] || moduleName.toLowerCase() + 's';

      // 3. Dump the database collection
      if (!this.connection.db) {
        throw new Error('Database connection is not established');
      }
      const collection = this.connection.db.collection(targetCollection);
      const docs = await collection.find({}).toArray();

      // Convert to SQL mock file or clean JSON dump
      let dumpContent = `-- PROPERTY NERDS CRM DATABASE BACKUP SNAP\n`;
      dumpContent += `-- Module: ${moduleName}\n`;
      dumpContent += `-- Export Date: ${new Date().toISOString()}\n`;
      dumpContent += `-- Total Records: ${docs.length}\n\n`;

      if (docs.length > 0) {
        dumpContent += `/* SCHEMA INSERTIONS FOR ${targetCollection.toUpperCase()} */\n`;
        docs.forEach((doc) => {
          const idStr = doc._id.toString();
          const { _id, ...cleanDoc } = doc;
          dumpContent += `INSERT INTO ${targetCollection} (_id, data) VALUES ('${idStr}', '${JSON.stringify(cleanDoc).replace(/'/g, "''")}');\n`;
        });
      } else {
        dumpContent += `-- No records found in ${targetCollection} collection.\n`;
      }

      // 4. Save to filesystem
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${moduleName.toLowerCase()}_${timestampStr}.sql`;
      const filePath = join(this.backupsDir, filename);
      fs.writeFileSync(filePath, dumpContent, 'utf-8');

      // 5. Calculate size
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';

      // 6. Update log
      tempLog.filename = filename;
      tempLog.size = sizeMB;
      tempLog.status = 'Completed';
      await tempLog.save();

      return tempLog;
    } catch (err) {
      console.error('Failed to create backup:', err);
      tempLog.status = 'Failed';
      tempLog.filename = 'Error: ' + err.message;
      await tempLog.save();
      throw err;
    }
  }

  async deleteBackup(id: string): Promise<void> {
    const log = await this.backupLogModel.findById(id).exec();
    if (log) {
      if (log.filename && log.filename !== 'Generating...') {
        const filePath = join(this.backupsDir, log.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error('Failed to delete backup file from disk:', e);
          }
        }
      }
      await this.backupLogModel.findByIdAndDelete(id).exec();
    }
  }

  getBackupFilePath(filename: string): string {
    const filePath = join(this.backupsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found on disk');
    }
    return filePath;
  }
}
