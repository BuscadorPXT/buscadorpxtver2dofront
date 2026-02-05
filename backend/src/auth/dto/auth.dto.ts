import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    codeId?: string;
    isApproved: boolean;
    isAdmin: boolean;
    plan?: {
      id: string;
      name: string;
      disableSupplierContact: boolean;
      hideSupplier: boolean;
    } | null;
  };
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ValidateResetTokenDto {
  @IsString()
  token: string;
}
