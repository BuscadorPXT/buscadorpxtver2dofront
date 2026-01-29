import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto);
    const saved = await this.notificationsRepository.save(notification);

    if (saved.isGlobal) {
      this.notificationsGateway.emitToAll(saved);
    } else if (saved.userId) {
      this.notificationsGateway.emitToUser(saved.userId, saved);
    }
    
    return saved;
  }

  async findAll(): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      where: [
        { userId },
        { isGlobal: true },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      where: [
        { userId, isRead: false },
        { isGlobal: true, isRead: false },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return await this.notificationsRepository.count({
      where: [
        { userId, isRead: false },
        { isGlobal: true, isRead: false },
      ],
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return await this.notificationsRepository.save(notification);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id);

    if (notification.userId !== userId && !notification.isGlobal) {
      throw new NotFoundException('Notificação não encontrada');
    }

    notification.isRead = true;
    return await this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      [
        { userId, isRead: false },
        { isGlobal: true, isRead: false },
      ],
      { isRead: true }
    );
  }

  async remove(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationsRepository.remove(notification);
  }
}
