import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AnalyticsService } from './analytics.service';
import { PageViewDto } from './dto/tracking.dto';
import { User } from '../users/entities/user.entity';

interface OnlineUser {
  userId: number;
  email: string;
  name: string;
  isAdmin: boolean;
  socketId: string;
  connectedAt: Date;
  hoursInterval?: NodeJS.Timeout;
  sessionId?: string;
  currentPageViewId?: number;
  currentPage?: string;
  ipAddress?: string;
  userAgent?: string;
}

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 20000,
  pingInterval: 10000,
  connectTimeout: 10000,
  upgradeTimeout: 5000,
  cookie: false,
  serveClient: false,
})
@Injectable()
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, OnlineUser>();
  private userSockets = new Map<number, Set<string>>();

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => SubscriptionsService))
    private subscriptionsService: SubscriptionsService,
    private analyticsService: AnalyticsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    console.log('🔥🔥🔥 ================================================');
    console.log('🔥🔥🔥 [PresenceGateway] CONSTRUCTOR CALLED');
    console.log('🔥🔥🔥 [PresenceGateway] Gateway initialized and ready');
    console.log('🔥🔥🔥 ================================================');
  }

  afterInit(server: Server) {
    console.log('⚡⚡⚡ ================================================');
    console.log('⚡⚡⚡ [PresenceGateway] AFTER INIT CALLED');
    console.log('⚡⚡⚡ [PresenceGateway] WebSocket server initialized');
    console.log('⚡⚡⚡ [PresenceGateway] Server instance:', !!server);
    console.log('⚡⚡⚡ [PresenceGateway] Engine.IO attached:', !!(server as any).engine);
    console.log('⚡⚡⚡ [PresenceGateway] Path:', (server as any).path());
    console.log('⚡⚡⚡ [PresenceGateway] CORS origins:', (server as any)._opts?.cors?.origin);
    console.log('⚡⚡⚡ [PresenceGateway] Transports:', (server as any)._opts?.transports);
    console.log('⚡⚡⚡ [PresenceGateway] Listening for connections...');
    console.log('⚡⚡⚡ ================================================');

    const engine = (server as any).engine;
    if (engine) {
      engine.on('connection', (socket: any) => {
        console.log(`🌐🌐🌐 [Engine.IO] RAW connection established: ${socket.id}`);
        console.log(`🌐🌐🌐 [Engine.IO] Transport: ${socket.transport.name}`);
        console.log(`🌐🌐🌐 [Engine.IO] Remote address: ${socket.request.connection.remoteAddress}`);

        socket.on('upgrade', (transport: any) => {
          console.log(`⬆️⬆️⬆️ [Engine.IO] Transport upgraded to: ${transport.name} for socket ${socket.id}`);
        });
        
        socket.on('upgradeError', (err: any) => {
          console.error(`⚠️⚠️⚠️ [Engine.IO] Upgrade error for socket ${socket.id}:`, err);
        });
      });
      
      engine.on('connection_error', (err: any) => {

        if (err?.context?.name === 'TRANSPORT_MISMATCH') {
          return;
        }
        console.error(`❌❌❌ [Engine.IO] Connection error:`, err);
      });
    }

    server.use((socket, next) => {
      console.log(`🔍🔍🔍 [PresenceGateway] Socket.IO middleware hit for socket: ${socket.id}`);
      
      socket.onAny((eventName, ...args) => {
        console.log(`📨📨📨 [PresenceGateway] Event received: "${eventName}" from socket ${socket.id}`, args);
      });
      
      next();
    });

    server.on('connection', (socket) => {
      console.log(`🔗🔗🔗 [Socket.IO] Socket connected to namespace: ${socket.id}`);
    });
  }

  async handleConnection(client: Socket) {
    console.log(`🎯🎯🎯 [PresenceGateway] ========================================`);
    console.log(`🎯🎯🎯 [PresenceGateway] NEW CONNECTION from ${client.id}`);
    console.log(`🎯🎯🎯 [PresenceGateway] Transport: ${client.conn.transport.name}`);
    console.log(`🎯🎯🎯 [PresenceGateway] IP: ${client.handshake.address}`);
    console.log(`🎯🎯🎯 [PresenceGateway] ========================================`);
    try {

      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      console.log(`[PresenceGateway] Token received: ${token ? 'YES' : 'NO'}`);
      
      if (!token) {
        console.log(`[PresenceGateway] No token provided, disconnecting ${client.id}`);
        client.disconnect();
        return;
      }

      console.log(`[PresenceGateway] Verifying token...`);
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      console.log(`[PresenceGateway] Token verified for user: ${payload.email}`);

      let ipAddress = 'unknown';

      if (client.handshake.headers['x-forwarded-for']) {
        const forwardedIps = (client.handshake.headers['x-forwarded-for'] as string).split(',');
        ipAddress = forwardedIps[0].trim();
        console.log(`[PresenceGateway] IP from X-Forwarded-For: ${ipAddress} (chain: ${forwardedIps.join(', ')})`);
      }

      else if (client.handshake.headers['x-real-ip']) {
        ipAddress = (client.handshake.headers['x-real-ip'] as string).trim();
        console.log(`[PresenceGateway] IP from X-Real-IP: ${ipAddress}`);
      }

      else if (client.handshake.address) {
        ipAddress = client.handshake.address;
        console.log(`[PresenceGateway] IP from handshake.address: ${ipAddress}`);
      }

      else if (client.conn.remoteAddress) {
        ipAddress = client.conn.remoteAddress;
        console.log(`[PresenceGateway] IP from conn.remoteAddress: ${ipAddress}`);
      }

      if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
        ipAddress = '127.0.0.1';
      }
      
      const userAgent = client.handshake.headers['user-agent'] || 'unknown';
      
      console.log(`🌐 [PresenceGateway] Client IP: ${ipAddress}, User Agent: ${userAgent}`);

      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.plan', 'plan')
        .where('user.id = :id', { id: payload.sub })
        .getOne();

      console.log(`📊 [PresenceGateway] User ${payload.email}:`);
      console.log(`   - planId: ${user?.planId}`);
      console.log(`   - plan loaded: ${!!user?.plan}`);
      console.log(`   - plan name: ${user?.plan?.name || 'N/A'}`);
      console.log(`   - maxConcurrentIps from user: ${user?.maxConcurrentIps}`);
      console.log(`   - maxConcurrentIps from plan: ${user?.plan?.maxConcurrentIps}`);

      const maxConcurrentIps = payload.isAdmin ? Infinity : (user?.maxConcurrentIps ?? user?.plan?.maxConcurrentIps ?? 1);
      console.log(`📊 [PresenceGateway] User ${payload.email} - Final Max IPs allowed: ${maxConcurrentIps}`);

      const existingSocketIds = this.userSockets.get(payload.sub) || new Set<string>();
      const currentConnectionCount = existingSocketIds.size;
      
      console.log(`📊 [PresenceGateway] User ${payload.email} has ${currentConnectionCount} existing connections (limit: ${maxConcurrentIps})`);

      if (currentConnectionCount >= maxConcurrentIps) {
        console.log(`🔄 [PresenceGateway] User ${payload.email} will exceed limit after this connection (${currentConnectionCount + 1}/${maxConcurrentIps}), disconnecting oldest connection...`);

        const oldestSocketId = existingSocketIds.values().next().value;
        if (oldestSocketId) {
          const existingSocket = this.server.sockets.sockets.get(oldestSocketId);
          if (existingSocket) {

            existingSocket.emit('duplicateLogin', {
              reason: `Limite de ${maxConcurrentIps} dispositivo(s) simultâneo(s) atingido. Nova sessão detectada.`,
              newSocketId: client.id,
            });

            this.stopHoursTracking(oldestSocketId);

            existingSocket.disconnect(true);
            console.log(`🔄 Old socket ${oldestSocketId} force disconnected`);
          }

          this.onlineUsers.delete(oldestSocketId);
          existingSocketIds.delete(oldestSocketId);
          console.log(`🔄 Old socket cleaned from memory`);
        }
      }

      const session = await this.analyticsService.createSession(
        payload.sub,
        ipAddress,
        userAgent,
      );

      console.log(`✅ [PresenceGateway] SESSION ready in database: ${session.id} for user ${payload.email}`);

      const userInfo: OnlineUser = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        isAdmin: payload.isAdmin || false,
        socketId: client.id,
        connectedAt: new Date(),
        sessionId: session.id,
        ipAddress: ipAddress,
        userAgent,
      };

      this.onlineUsers.set(client.id, userInfo);

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set<string>());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      (client as any).userInfo = userInfo;

      console.log(`[PresenceGateway] User connected: ${userInfo.email} (${client.id})`);
      console.log(`[PresenceGateway] Total online users: ${this.onlineUsers.size}`);
      console.log(`[PresenceGateway] User ${userInfo.email} total sockets: ${this.userSockets.get(payload.sub)?.size || 0}`);
      console.log(`[PresenceGateway] User info stored in Map:`, this.onlineUsers.has(client.id));
      console.log(`[PresenceGateway] User isAdmin:`, userInfo.isAdmin);
      console.log(`[PresenceGateway] Map contents:`, Array.from(this.onlineUsers.entries()).map(([id, u]) => ({ id, email: u.email, isAdmin: u.isAdmin })));

      if (!this.onlineUsers.has(client.id)) {
        console.error(`[PresenceGateway] ERROR: User ${userInfo.email} not found in Map after adding!`);
        this.onlineUsers.set(client.id, userInfo);
        console.log(`[PresenceGateway] Re-added user to Map. Now has:`, this.onlineUsers.has(client.id));
      }

      await this.startHoursTracking(client, userInfo);

      this.broadcastOnlineUsers();

    } catch (error) {
      console.error('[PresenceGateway] WebSocket connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌🔌🔌 [PresenceGateway] DISCONNECT EVENT - Socket ID: ${client.id}`);
    const userInfo = this.onlineUsers.get(client.id);
    
    if (userInfo) {
      console.log(`🔌 User disconnected: ${userInfo.email} (${client.id})`);
      console.log(`🔌 Online users before cleanup: ${this.onlineUsers.size}`);

      if (userInfo.currentPageViewId) {
        this.analyticsService.endPageView(userInfo.currentPageViewId).catch(err =>
          console.error('[PresenceGateway] Error ending page view:', err)
        );
      }

      if (userInfo.sessionId) {
        this.analyticsService.endSession(userInfo.sessionId).catch(err =>
          console.error('[PresenceGateway] Error ending session:', err)
        );
      }

      this.stopHoursTracking(client.id);
      
      this.onlineUsers.delete(client.id);

      const userSocketSet = this.userSockets.get(userInfo.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);

        if (userSocketSet.size === 0) {
          this.userSockets.delete(userInfo.userId);
        }
      }
      
      console.log(`🔌 Online users after cleanup: ${this.onlineUsers.size}`);
      console.log(`🔌 User ${userInfo.email} remaining sockets: ${this.userSockets.get(userInfo.userId)?.size || 0}`);
      console.log(`🔌 Remaining users:`, Array.from(this.onlineUsers.values()).map(u => u.email));

      this.broadcastOnlineUsers();
    } else {
      console.log(`⚠️ [PresenceGateway] Disconnect event for unknown socket: ${client.id}`);
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    console.log(`\n🔥🔥🔥 ========== GET ONLINE USERS REQUEST ========== 🔥🔥🔥`);
    console.log(`[PresenceGateway] ⚡ EVENT RECEIVED! Request from socket ID: ${client.id}`);
    console.log(`[PresenceGateway] Total users in Map: ${this.onlineUsers.size}`);
    console.log(`[PresenceGateway] Map keys:`, Array.from(this.onlineUsers.keys()));
    console.log(`[PresenceGateway] Full Map contents:`, 
      Array.from(this.onlineUsers.entries()).map(([id, u]) => ({ 
        socketId: id, 
        email: u.email, 
        isAdmin: u.isAdmin,
        userId: u.userId 
      }))
    );
    
    let currentUser = this.onlineUsers.get(client.id);

    if (!currentUser && (client as any).userInfo) {
      currentUser = (client as any).userInfo;
      console.log(`[PresenceGateway] User found in socket.userInfo instead of Map`);
    }
    
    console.log(`[PresenceGateway] Looking up user with socket ID: ${client.id}`);
    console.log(`[PresenceGateway] Current user found:`, currentUser ? `YES - ${currentUser.email} (isAdmin: ${currentUser.isAdmin})` : '❌ NOT FOUND IN MAP!');
    console.log(`[PresenceGateway] Socket exists in Map:`, this.onlineUsers.has(client.id));
    console.log(`🔥🔥🔥 ============================================== 🔥🔥🔥\n`);

    if (!currentUser) {
      console.log(`[PresenceGateway] ❌ User NOT FOUND in Map! Connection may be initializing...`);
      console.log(`[PresenceGateway] Debugging: Socket ${client.id} is connected:`, client.connected);
      console.log(`[PresenceGateway] Debugging: Socket handshake:`, {
        auth: client.handshake.auth,
        headers: client.handshake.headers.authorization?.substring(0, 50) + '...'
      });

      setTimeout(() => {
        const retryUser = this.onlineUsers.get(client.id);
        if (retryUser && retryUser.isAdmin) {
          console.log(`[PresenceGateway] Retry successful, processing request for ${retryUser.email}`);
          this.handleGetOnlineUsers(client);
        } else {
          console.log(`[PresenceGateway] Retry failed or user is not admin, sending error`);
          client.emit('error', 'User not found in online users map');
        }
      }, 500);
      return;
    }

    if (!currentUser.isAdmin) {
      console.log(`[PresenceGateway] ❌ User ${currentUser.email} is not admin, sending error`);
      client.emit('error', 'Unauthorized - Admin access required');
      return;
    }

    const users = Array.from(this.onlineUsers.values()).map(user => ({
      userId: user.userId,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      connectedAt: user.connectedAt,
    }));

    console.log(`[PresenceGateway] ✅ Sending ${users.length} online users to admin ${currentUser.email}`);
    client.emit('onlineUsers', users);
  }

  @SubscribeMessage('forceLogout')
  handleForceLogout(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    console.log(`[PresenceGateway] forceLogout request from ${client.id} for userId ${data.userId}`);
    const currentUser = this.onlineUsers.get(client.id);

    if (!currentUser?.isAdmin) {
      console.log(`[PresenceGateway] Unauthorized forceLogout attempt`);
      client.emit('error', 'Unauthorized');
      return;
    }

    const targetSocketIds = this.userSockets.get(data.userId);
    if (targetSocketIds && targetSocketIds.size > 0) {

      for (const targetSocketId of targetSocketIds) {
        const targetSocket = this.server.sockets.sockets.get(targetSocketId);
        if (targetSocket) {

          targetSocket.emit('forceLogout', {
            reason: 'Desativado pelo administrador',
          });

          setTimeout(() => {
            targetSocket.disconnect();
          }, 100);
        }
      }
      
      console.log(`[PresenceGateway] Admin ${currentUser.email} forced logout of user ${data.userId} (${targetSocketIds.size} sockets)`);
      
      client.emit('success', 'User logged out successfully');
      return;
    }

    console.log(`[PresenceGateway] User ${data.userId} not found or already offline`);
    client.emit('error', 'User not found or already offline');
  }

  private broadcastOnlineUsers() {
    console.log(`[PresenceGateway] Broadcasting online users to admins...`);
    const users = Array.from(this.onlineUsers.values()).map(user => ({
      userId: user.userId,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      connectedAt: user.connectedAt,
      currentPage: user.currentPage,
      ipAddress: user.ipAddress,
    }));

    console.log(`[PresenceGateway] Total users to broadcast: ${users.length}`);

    let adminCount = 0;
    this.onlineUsers.forEach((user, socketId) => {
      if (user.isAdmin) {
        adminCount++;
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          console.log(`[PresenceGateway] Sending update to admin: ${user.email}`);
          socket.emit('onlineUsers', users);
        }
      }
    });
    
    console.log(`[PresenceGateway] Broadcast sent to ${adminCount} admin(s)`);
  }

  public forceUserLogout(userId: number) {
    const targetSocketIds = this.userSockets.get(userId);
    if (targetSocketIds && targetSocketIds.size > 0) {
      let disconnected = false;

      for (const targetSocketId of targetSocketIds) {
        const targetSocket = this.server.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit('forceLogout', {
            reason: 'Conta desativada pelo administrador',
          });
          
          setTimeout(() => {
            targetSocket.disconnect();
          }, 100);
          
          disconnected = true;
        }
      }
      return disconnected;
    }
    return false;
  }

  private async startHoursTracking(client: Socket, userInfo: OnlineUser) {
    console.log(`[HoursTracking] Starting hours tracking for ${userInfo.email} (isAdmin: ${userInfo.isAdmin})`);

    try {

      if (userInfo.isAdmin) {
        console.log(`[HoursTracking] User ${userInfo.email} is admin, setting unlimited hours tracking`);

        client.emit('hours-updated', {
          remaining: 999999,
          hoursAvailable: 999999,
          hoursUsed: 0,
          durationType: 'unlimited',
          daysRemaining: 999999,
        });

        console.log(`[HoursTracking] Admin tracking configured successfully for ${userInfo.email}`);
        return;
      }

      const hoursData = await this.subscriptionsService.getUserHours(String(userInfo.userId));
      
      console.log(`[HoursTracking] Current hours for ${userInfo.email}:`, {
        available: hoursData.available,
        used: hoursData.used,
        remaining: hoursData.remaining,
      });

      if (hoursData.remaining <= 0) {
        console.log(`[HoursTracking] User ${userInfo.email} has no hours left, disconnecting...`);
        client.emit('hours-expired', {
          message: 'Suas horas disponíveis esgotaram',
          remaining: 0,
        });
        
        setTimeout(() => {
          client.disconnect();
        }, 1000);
        return;
      }

      client.emit('hours-updated', {
        remaining: hoursData.remaining,
        hoursAvailable: hoursData.available,
        hoursUsed: hoursData.used,
        durationType: hoursData.durationType,
        daysRemaining: hoursData.daysRemaining,
      });

      const interval = setInterval(async () => {
        await this.updateUserHours(client, userInfo);
      }, 60 * 1000);

      userInfo.hoursInterval = interval;
      this.onlineUsers.set(client.id, userInfo);

      console.log(`[HoursTracking] Hours tracking started successfully for ${userInfo.email}`);
    } catch (error) {
      console.error(`[HoursTracking] Error starting hours tracking for ${userInfo.email}:`, error);
    }
  }

  private async updateUserHours(client: Socket, userInfo: OnlineUser) {
    try {
      console.log(`[HoursTracking] Updating hours for ${userInfo.email}...`);

      const minutesUsed = 1;
      const hoursUsed = minutesUsed / 60;

      const result = await this.subscriptionsService.incrementUsage(String(userInfo.userId), hoursUsed);

      console.log(`[HoursTracking] Hours updated for ${userInfo.email}:`, {
        used: hoursUsed.toFixed(4),
        remaining: result.remaining.toFixed(4),
      });

      client.emit('hours-updated', {
        remaining: result.remaining,
        hoursAvailable: result.available,
        hoursUsed: result.used,
        durationType: result.durationType,
        daysRemaining: result.daysRemaining,
      });

      if (result.remaining <= 0) {
        console.log(`[HoursTracking] User ${userInfo.email} ran out of hours, disconnecting...`);

        this.stopHoursTracking(client.id);

        client.emit('hours-expired', {
          message: 'Suas horas disponíveis esgotaram',
          remaining: 0,
        });

        setTimeout(() => {
          client.disconnect();
        }, 1000);
      }
    } catch (error) {
      console.error(`[HoursTracking] Error updating hours for ${userInfo.email}:`, error);
    }
  }

  private stopHoursTracking(socketId: string) {
    const userInfo = this.onlineUsers.get(socketId);
    
    if (userInfo?.hoursInterval) {
      console.log(`[HoursTracking] Stopping hours tracking for ${userInfo.email}`);
      clearInterval(userInfo.hoursInterval);
      userInfo.hoursInterval = undefined;
      this.onlineUsers.set(socketId, userInfo);
    }
  }

  @SubscribeMessage('page-enter')
  async handlePageEnter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PageViewDto,
  ) {
    const userInfo = this.onlineUsers.get(client.id);
    if (!userInfo || !userInfo.sessionId) return;

    try {

      if (userInfo.currentPageViewId) {
        await this.analyticsService.endPageView(userInfo.currentPageViewId);
      }

      const pageView = await this.analyticsService.trackPageView(
        userInfo.userId,
        userInfo.sessionId,
        data.pagePath,
        data.pageTitle,
        data.referrer,
      );

      userInfo.currentPageViewId = pageView.id;
      userInfo.currentPage = data.pagePath;
      this.onlineUsers.set(client.id, userInfo);

      console.log(`[PageTracking] User ${userInfo.email} entered page: ${data.pagePath}`);

      this.broadcastOnlineUsers();
    } catch (error) {
      console.error('[PageTracking] Error tracking page enter:', error);
    }
  }

  @SubscribeMessage('page-leave')
  async handlePageLeave(@ConnectedSocket() client: Socket) {
    const userInfo = this.onlineUsers.get(client.id);
    if (!userInfo || !userInfo.currentPageViewId) return;

    try {
      await this.analyticsService.endPageView(userInfo.currentPageViewId);
      
      console.log(`[PageTracking] User ${userInfo.email} left page: ${userInfo.currentPage}`);

      userInfo.currentPageViewId = undefined;
      userInfo.currentPage = undefined;
      this.onlineUsers.set(client.id, userInfo);
    } catch (error) {
      console.error('[PageTracking] Error tracking page leave:', error);
    }
  }

  @SubscribeMessage('get-online-users-with-location')
  async handleGetOnlineUsersWithLocation(@ConnectedSocket() client: Socket) {
    console.log(`[PresenceGateway] get-online-users-with-location request from ${client.id}`);
    console.log(`[PresenceGateway] Total users in Map: ${this.onlineUsers.size}`);
    console.log(`[PresenceGateway] All online users:`, Array.from(this.onlineUsers.keys()));
    
    let currentUser = this.onlineUsers.get(client.id);

    if (!currentUser && (client as any).userInfo) {
      currentUser = (client as any).userInfo;
      console.log(`[PresenceGateway] User found in socket.userInfo instead of Map`);
    }
    
    console.log(`[PresenceGateway] Current user:`, currentUser ? `${currentUser.email} (isAdmin: ${currentUser.isAdmin})` : 'NOT FOUND');
    
    if (!currentUser) {
      console.log(`[PresenceGateway] User not found in onlineUsers Map or socket.userInfo, connection may be initializing...`);

      setTimeout(() => {
        const retryUser = this.onlineUsers.get(client.id);
        if (retryUser && retryUser.isAdmin) {
          console.log(`[PresenceGateway] Retry successful, processing request for ${retryUser.email}`);
          this.handleGetOnlineUsersWithLocation(client);
        } else {
          console.log(`[PresenceGateway] Retry failed or user is not admin, sending unauthorized error`);
          client.emit('error', 'Unauthorized');
        }
      }, 500);
      return;
    }

    if (!currentUser.isAdmin) {
      console.log(`[PresenceGateway] User ${currentUser.email} is NOT admin, denying access to online users list`);
      client.emit('error', 'Unauthorized - Admin access required');
      return;
    }

    console.log(`[PresenceGateway] ✅ Admin verified: ${currentUser.email}, processing request...`);

    const usersWithLocation = await Promise.all(
      Array.from(this.onlineUsers.values()).map(async (user) => {

        const session = user.sessionId 
          ? await this.analyticsService.getSessionById(user.sessionId)
          : null;

        return {
          userId: user.userId,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          isOnline: true,
          connectedAt: user.connectedAt,
          currentPage: user.currentPage,
          ipAddress: user.ipAddress,
          latitude: session?.latitude || null,
          longitude: session?.longitude || null,
          city: session?.city || null,
          region: session?.region || null,
          country: session?.country || null,
          timezone: session?.timezone || null,
          isp: session?.isp || null,
        };
      })
    );

    console.log(`[PresenceGateway] Sending ${usersWithLocation.length} online users with location to admin ${currentUser.email}`);
    if (usersWithLocation.length > 0) {
      console.log(`[PresenceGateway] Sample user with location:`, usersWithLocation[0]);
    }
    client.emit('online-users-with-location', usersWithLocation);
  }

  disconnectUserSessions(userId: number): void {
    console.log(`🔌 [PresenceGateway] Disconnecting all sessions for user ${userId}`);
    
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) {
      console.log(`ℹ️ [PresenceGateway] No active sessions found for user ${userId}`);
      return;
    }

    console.log(`🔌 [PresenceGateway] Found ${socketIds.size} active session(s) for user ${userId}`);

    socketIds.forEach((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        console.log(`🔌 [PresenceGateway] Disconnecting socket ${socketId}`);
        socket.emit('planUpdated', {
          message: 'Seu plano foi atualizado. Por favor, faça login novamente para aplicar as mudanças.',
        });
        socket.disconnect(true);
      }
    });

    console.log(`✅ [PresenceGateway] All sessions disconnected for user ${userId}`);
  }
}
