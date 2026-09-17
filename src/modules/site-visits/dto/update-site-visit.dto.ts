import { PartialType } from '@nestjs/swagger';
import { CreateSiteVisitDto } from './create-site-visit.dto';

export class UpdateSiteVisitDto extends PartialType(CreateSiteVisitDto) {}
