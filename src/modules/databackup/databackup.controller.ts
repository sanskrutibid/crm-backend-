import { Controller, Get, Post, Delete, Body, Param, Res, NotFoundException } from '@nestjs/common';
import { DatabackupService } from './databackup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { createReadStream } from 'fs';

@Controller('databackup')
export class DatabackupController {
  constructor(private readonly databackupService: DatabackupService) {}

  @Get()
  async getBackupLogs() {
    return this.databackupService.getBackupLogs();
  }

  @Post('request')
  async createBackup(@Body() createBackupDto: CreateBackupDto) {
    return this.databackupService.createBackup(createBackupDto.module);
  }

  @Delete(':id')
  async deleteBackup(@Param('id') id: string) {
    await this.databackupService.deleteBackup(id);
    return { success: true };
  }

  @Get('download/:filename')
  async downloadBackupFile(@Param('filename') filename: string, @Res() res) {
    try {
      const filePath = this.databackupService.getBackupFilePath(filename);
      const file = createReadStream(filePath);
      
      res.headers({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      res.send(file);
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }
}
