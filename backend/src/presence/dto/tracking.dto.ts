import { IsString, IsOptional, IsNumber } from 'class-validator';

export class PageViewDto {
  @IsString()
  pagePath: string;

  @IsString()
  @IsOptional()
  pageTitle?: string;

  @IsString()
  @IsOptional()
  referrer?: string;
}

export class PageLeaveDto {
  @IsNumber()
  pageViewId: number;
}

export class HeatmapQueryDto {
  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
