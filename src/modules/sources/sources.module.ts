import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { Source, SourceSchema } from './schemas/source.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Source.name, schema: SourceSchema },
    ]),
  ],
  controllers: [SourcesController],
  providers: [SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
