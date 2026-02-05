import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWebhookDto {
  @IsIn(['upsert', 'delete'])
  action: 'upsert' | 'delete';

  @IsString()
  sheetRowKey: string;

  @IsString()
  aba: string;

  @IsNumber()
  linha: number;

  @IsNumber()
  coluna: number;

  @IsOptional()
  @IsString()
  fornecedor?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  gb?: string;

  @IsOptional()
  @IsString()
  regiao?: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsNumber()
  preco?: number;

  @IsOptional()
  @IsNumber()
  venda?: number;

  @IsOptional()
  @IsString()
  changedAt?: string;
}
