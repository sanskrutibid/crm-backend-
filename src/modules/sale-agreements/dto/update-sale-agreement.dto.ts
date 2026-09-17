import { PartialType } from '@nestjs/swagger';
import { CreateSaleAgreementDto } from './create-sale-agreement.dto';

export class UpdateSaleAgreementDto extends PartialType(
  CreateSaleAgreementDto,
) {}
