import { IsNumber, IsOptional, IsObject } from 'class-validator';

export class RegisterClickDto {
  @IsNumber()
  supplierId: number;

  @IsNumber()
  @IsOptional()
  productId?: number;

  @IsObject()
  @IsOptional()
  sessionInfo?: any;
}

export class ClickMetricsQueryDto {
  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  supplierId?: number;
}
