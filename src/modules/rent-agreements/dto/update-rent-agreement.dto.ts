import { PartialType } from '@nestjs/swagger';
import { CreateRentAgreementDto } from './create-rent-agreement.dto';

export class UpdateRentAgreementDto extends PartialType(
  CreateRentAgreementDto,
) {}
