import { Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { HeatmapQueryDto } from './dto/tracking.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private jwtService: JwtService,
  ) {}

  @Get('heatmap')
  async getHeatmap(@Query() query: HeatmapQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const limit = query.limit || 1000;

    return this.analyticsService.getHeatmapData(startDate, endDate, limit);
  }

  @Get('top-pages')
  async getTopPages(@Query('limit') limit?: number) {
    return this.analyticsService.getTopPages(limit || 20);
  }

  @Get('stats')
  async getGeneralStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getGeneralStats(start, end);
  }

  @Get('active-sessions')
  async getActiveSessions(@Query('minutes') minutes?: number) {
    return this.analyticsService.getActiveSessions(minutes || 30);
  }

  @Post('page-leave')
  async handlePageLeave(@Request() req, @Query('token') token?: string) {
    try {

      let userId = req.user?.sub;
      
      if (!userId && token) {

        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET || 'your-secret-key',
          });
          userId = payload.sub;
          console.log('[AnalyticsController] page-leave: userId extracted from query token:', userId);
        } catch (err) {
          console.error('[AnalyticsController] Invalid token in query:', err.message);
        }
      }

      if (!userId) {
        console.log('[AnalyticsController] page-leave: no user found');
        return { success: false };
      }

      console.log('[AnalyticsController] page-leave received for user:', userId);

      await this.analyticsService.endLastActivePageView(userId);
      
      return { success: true };
    } catch (error) {
      console.error('[AnalyticsController] Error handling page-leave:', error);
      return { success: false };
    }
  }
}
