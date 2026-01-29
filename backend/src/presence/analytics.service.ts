import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UserSession } from './entities/user-session.entity';
import { PageView } from './entities/page-view.entity';
import { LocationStats } from './entities/location-stats.entity';
import { PageStats } from './entities/page-stats.entity';
import axios from 'axios';

interface GeolocationData {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    @InjectRepository(PageView)
    private pageViewRepository: Repository<PageView>,
    @InjectRepository(LocationStats)
    private locationStatsRepository: Repository<LocationStats>,
    @InjectRepository(PageStats)
    private pageStatsRepository: Repository<PageStats>,
  ) {}

  async createSession(userId: number, ipAddress: string, userAgent: string): Promise<UserSession> {

    const geoData = await this.getGeolocation(ipAddress);
    console.log(`🌍 [AnalyticsService] Geolocation data for ${ipAddress}:`, geoData);

    let session = await this.userSessionRepository.findOne({
      where: { userId, ipAddress },
    });

    if (session) {

      session.userAgent = userAgent;
      session.lastActivityAt = new Date();
      session.country = geoData.country || session.country;
      session.countryCode = geoData.countryCode || session.countryCode;
      session.region = geoData.region || session.region;
      session.city = geoData.city || session.city;
      session.latitude = geoData.lat || session.latitude;
      session.longitude = geoData.lon || session.longitude;
      session.timezone = geoData.timezone || session.timezone;
      session.isp = geoData.isp || session.isp;
      
      console.log(`🔄 [AnalyticsService] EXISTING SESSION updated - ID: ${session.id} - User: ${userId} - IP: ${ipAddress} - Location: ${session.city}, ${session.region}, ${session.country}`);
    } else {

      session = this.userSessionRepository.create({
        userId,
        ipAddress,
        userAgent,
        country: geoData.country,
        countryCode: geoData.countryCode,
        region: geoData.region,
        city: geoData.city,
        latitude: geoData.lat,
        longitude: geoData.lon,
        timezone: geoData.timezone,
        isp: geoData.isp,
      });
      
      console.log(`🆕 [AnalyticsService] NEW SESSION created - User: ${userId} - IP: ${ipAddress} - Location: ${geoData.city}, ${geoData.region}, ${geoData.country}`);
    }

    const savedSession = await this.userSessionRepository.save(session);

    console.log(`✅ [AnalyticsService] SESSION saved to database - ID: ${savedSession.id}`);

    return savedSession;
  }

  async getActiveUserSessions(userId: number): Promise<UserSession[]> {
    return this.userSessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .orderBy('session.createdAt', 'DESC')
      .getMany();
  }

  async getSessionById(sessionId: string): Promise<UserSession | null> {
    return this.userSessionRepository.findOne({ where: { id: sessionId } });
  }

  async endSession(sessionId: string): Promise<void> {
    const session = await this.userSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      console.log(`⚠️ [AnalyticsService] Session ${sessionId} not found in database`);
      return;
    }

    await this.userSessionRepository.update(sessionId, {
      lastActivityAt: new Date(),
    });

    console.log(`🔚 [AnalyticsService] Session ${sessionId} ended - User ID: ${session.userId}`);
  }

  async trackPageView(
    userId: number,
    sessionId: string,
    pagePath: string,
    pageTitle?: string,
    referrer?: string,
  ): Promise<PageView> {
    console.log(`📊 [AnalyticsService] Tracking page view - User: ${userId}, Session: ${sessionId}, Page: ${pagePath}`);
    
    const pageView = this.pageViewRepository.create({
      userId,
      sessionId,
      pagePath,
      pageTitle,
      referrer,
      enteredAt: new Date(),
    });

    const savedPageView = await this.pageViewRepository.save(pageView);
    console.log(`✅ [AnalyticsService] Page view saved - ID: ${savedPageView.id}`);

    this.updatePageStats(pagePath, userId).catch(err =>
      console.error('[AnalyticsService] Error updating page stats:', err)
    );

    return savedPageView;
  }

  async endPageView(pageViewId: number): Promise<void> {
    const pageView = await this.pageViewRepository.findOne({ where: { id: pageViewId } });
    if (!pageView) return;

    const leftAt = new Date();
    const durationSeconds = Math.floor((leftAt.getTime() - pageView.enteredAt.getTime()) / 1000);

    await this.pageViewRepository.update(pageViewId, {
      leftAt,
      durationSeconds,
    });

    this.updatePageStatsDuration(pageView.pagePath, durationSeconds).catch(err =>
      console.error('[AnalyticsService] Error updating page stats duration:', err)
    );
  }

  async endLastActivePageView(userId: number): Promise<void> {
    console.log(`[AnalyticsService] Ending last active page view for user ${userId}`);

    const activePageView = await this.pageViewRepository.findOne({
      where: {
        userId,
        leftAt: null as any,
      },
      order: {
        enteredAt: 'DESC',
      },
    });

    if (!activePageView) {
      console.log(`[AnalyticsService] No active page view found for user ${userId}`);
      return;
    }

    const leftAt = new Date();
    const durationSeconds = Math.floor((leftAt.getTime() - activePageView.enteredAt.getTime()) / 1000);

    console.log(`[AnalyticsService] Ending page view ${activePageView.id} - Duration: ${durationSeconds}s`);

    await this.pageViewRepository.update(activePageView.id, {
      leftAt,
      durationSeconds,
    });

    this.updatePageStatsDuration(activePageView.pagePath, durationSeconds).catch(err =>
      console.error('[AnalyticsService] Error updating page stats duration:', err)
    );
  }

  async getGeolocation(ipAddress: string): Promise<GeolocationData> {

    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress === 'unknown') {
      return {
        country: 'Local',
        countryCode: 'LC',
        region: 'Local',
        city: 'Local',
        lat: 0,
        lon: 0,
        timezone: 'UTC',
        isp: 'Local Network',
      };
    }

    try {

      const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp&lang=pt`, {
        timeout: 5000,
      });

      console.log(`🌍 [AnalyticsService] Geolocation response for ${ipAddress}:`, response.data);

      if (response.data.status === 'success') {
        return {
          country: response.data.country,
          countryCode: response.data.countryCode,
          region: response.data.regionName || response.data.region,
          city: response.data.city,
          lat: response.data.lat,
          lon: response.data.lon,
          timezone: response.data.timezone,
          isp: response.data.isp || response.data.org,
        };
      } else {
        console.warn(`⚠️ [AnalyticsService] Geolocation failed for ${ipAddress}: ${response.data.message}`);
      }
    } catch (error) {
      console.error('[AnalyticsService] Geolocation error:', error.message);
    }

    return {
      country: 'Local',
      countryCode: 'LC',
      region: 'Local',
      city: 'Local',
      lat: 0,
      lon: 0,
      timezone: 'UTC',
      isp: 'Unknown',
    };
  }

  private async updateLocationStats(geoData: GeolocationData): Promise<void> {

  }

  private async updateLocationStatsOnDisconnect(session: UserSession, durationSeconds: number): Promise<void> {

  }

  private async updatePageStats(pagePath: string, userId: number): Promise<void> {
    console.log(`📈 [AnalyticsService] Updating page stats for: ${pagePath}`);
    const existing = await this.pageStatsRepository.findOne({ where: { pagePath } });

    if (existing) {
      console.log(`📈 [AnalyticsService] Found existing stats, incrementing views: ${existing.totalViews} -> ${existing.totalViews + 1}`);
      await this.pageStatsRepository.update(existing.id, {
        totalViews: existing.totalViews + 1,
        lastAccess: new Date(),
      });
    } else {
      console.log(`📈 [AnalyticsService] Creating new page stats entry for: ${pagePath}`);
      await this.pageStatsRepository.save({
        pagePath,
        totalViews: 1,
        uniqueUsers: 1,
        totalDurationSeconds: '0',
        avgDurationSeconds: 0,
        lastAccess: new Date(),
      });
    }
    console.log(`✅ [AnalyticsService] Page stats updated successfully for: ${pagePath}`);
  }

  private async updatePageStatsDuration(pagePath: string, durationSeconds: number): Promise<void> {
    const existing = await this.pageStatsRepository.findOne({ where: { pagePath } });

    if (existing) {
      const newTotalDuration = BigInt(existing.totalDurationSeconds) + BigInt(durationSeconds);
      const avgDuration = Math.floor(Number(newTotalDuration) / existing.totalViews);

      await this.pageStatsRepository.update(existing.id, {
        totalDurationSeconds: newTotalDuration.toString(),
        avgDurationSeconds: avgDuration,
      });
    }
  }

  async getHeatmapData(startDate?: Date, endDate?: Date, limit: number = 1000) {
    console.log(`🗺️ [AnalyticsService] Fetching heatmap data - limit: ${limit}`);

    const query = this.userSessionRepository
      .createQueryBuilder('session')
      .select([
        'session.country as country',
        'session.countryCode as "countryCode"',
        'session.region as region',
        'session.city as city',
        'session.latitude as latitude',
        'session.longitude as longitude',

        'COUNT(DISTINCT CONCAT(session.userId, \'|\', session.ipAddress, \'|\', DATE(session.createdAt))) as "totalSessions"',
        'COUNT(DISTINCT session.userId) as "totalUsers"',
        'MAX(session.lastActivityAt) as "lastAccess"',

        'AVG(EXTRACT(EPOCH FROM (session.lastActivityAt - session.createdAt))) as "avgDurationSeconds"',
      ])
      .where('session.latitude IS NOT NULL')
      .andWhere('session.longitude IS NOT NULL')
      .groupBy('session.country')
      .addGroupBy('session.countryCode')
      .addGroupBy('session.region')
      .addGroupBy('session.city')
      .addGroupBy('session.latitude')
      .addGroupBy('session.longitude')
      .orderBy('"totalSessions"', 'DESC')
      .limit(limit);

    if (startDate) {
      query.andWhere('session.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('session.createdAt <= :endDate', { endDate });
    }

    const results = await query.getRawMany();
    
    console.log(`🗺️ [AnalyticsService] Found ${results.length} locations in heatmap data`);
    if (results.length > 0) {
      console.log(`🗺️ [AnalyticsService] Sample location:`, results[0]);
    }
    
    return results.map(row => ({
      country: row.country,
      countryCode: row.countryCode,
      region: row.region,
      city: row.city,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      totalSessions: parseInt(row.totalSessions),
      totalUsers: parseInt(row.totalUsers),
      avgDurationSeconds: Math.floor(parseFloat(row.avgDurationSeconds || '0')),
      lastAccess: row.lastAccess,
    }));
  }

  async getTopPages(limit: number = 20) {
    console.log(`🔍 [AnalyticsService] Fetching top ${limit} pages from page_views...`);
    
    const pages = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.pagePath', 'pagePath')
      .addSelect('COUNT(pv.id)', 'totalViews')
      .addSelect('COUNT(DISTINCT pv.userId)', 'uniqueUsers')

      .addSelect(`
        COALESCE(
          SUM(
            CASE 
              WHEN pv.duration_seconds IS NOT NULL THEN pv.duration_seconds
              ELSE EXTRACT(EPOCH FROM (NOW() - pv.entered_at))
            END
          ), 
          0
        )
      `, 'totalDurationSeconds')
      .addSelect(`
        COALESCE(
          AVG(
            CASE 
              WHEN pv.duration_seconds IS NOT NULL THEN pv.duration_seconds
              ELSE EXTRACT(EPOCH FROM (NOW() - pv.entered_at))
            END
          ), 
          0
        )
      `, 'avgDurationSeconds')
      .addSelect('MAX(pv.enteredAt)', 'lastAccess')
      .groupBy('pv.pagePath')
      .orderBy('COUNT(pv.id)', 'DESC')
      .limit(limit)
      .getRawMany();

    console.log(`🔍 [AnalyticsService] Found ${pages.length} pages`);
    if (pages.length > 0) {
      console.log(`🔍 [AnalyticsService] Top page:`, pages[0]);
    }

    return pages.map(page => ({
      pagePath: page.pagePath,
      totalViews: parseInt(page.totalViews, 10),
      uniqueUsers: parseInt(page.uniqueUsers, 10),
      totalDurationSeconds: page.totalDurationSeconds.toString(),
      avgDurationSeconds: Math.floor(parseFloat(page.avgDurationSeconds)),
      lastAccess: page.lastAccess,
    }));
  }

  async getGeneralStats(startDate?: Date, endDate?: Date) {
    console.log(`📊 [AnalyticsService] Getting general stats - startDate: ${startDate}, endDate: ${endDate}`);
    
    const sessionQuery = this.userSessionRepository.createQueryBuilder('session');

    if (startDate) {
      sessionQuery.andWhere('session.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      sessionQuery.andWhere('session.createdAt <= :endDate', { endDate });
    }

    const totalSessions = await sessionQuery.getCount();

    const uniqueUsers = await sessionQuery
      .select('COUNT(DISTINCT session.userId)', 'count')
      .getRawOne();

    const pageViewQuery = this.pageViewRepository.createQueryBuilder('pv');
    
    if (startDate) {
      pageViewQuery.andWhere('pv.enteredAt >= :startDate', { startDate });
    }

    if (endDate) {
      pageViewQuery.andWhere('pv.enteredAt <= :endDate', { endDate });
    }

    const totalPageViews = await pageViewQuery.getCount();

    const avgDurationResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('AVG(pv.durationSeconds)', 'avg')
      .where('pv.durationSeconds IS NOT NULL')
      .getRawOne();

    console.log(`📊 [AnalyticsService] Stats: sessions=${totalSessions}, pageViews=${totalPageViews}, users=${uniqueUsers.count}`);

    return {
      totalSessions,
      totalPageViews,
      uniqueUsers: parseInt(uniqueUsers.count) || 0,
      avgSessionDuration: Math.floor(avgDurationResult.avg || 0),
    };
  }

  async getActiveSessions(minutesAgo: number = 30) {
    const since = new Date(Date.now() - minutesAgo * 60 * 1000);

    return await this.userSessionRepository.find({
      where: {
        lastActivityAt: Between(since, new Date()),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
