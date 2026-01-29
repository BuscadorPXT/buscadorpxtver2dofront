import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;
}

export class UpdateSystemSettingDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateZApiSettingsDto {
  @IsString()
  @IsNotEmpty()
  clientToken: string;

  @IsString()
  @IsNotEmpty()
  instanceId: string;

  @IsString()
  @IsNotEmpty()
  instanceToken: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;
}

export class UpdateMailjetSettingsDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  apiSecret: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @IsString()
  @IsOptional()
  senderName?: string;
}
