import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { id },
      relations: ['plan']
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { email },
      relations: ['plan']
    });
  }

  async approveUser(id: number): Promise<User | null> {
    await this.userRepository.update(id, { isApproved: true });
    return await this.findById(id);
  }

  async makeAdmin(id: number): Promise<User | null> {
    await this.userRepository.update(id, { isAdmin: true });
    return await this.findById(id);
  }

  async removeAdmin(id: number): Promise<User | null> {
    await this.userRepository.update(id, { isAdmin: false });
    return await this.findById(id);
  }

  async toggleActive(id: number, isActive: boolean): Promise<User | null> {
    await this.userRepository.update(id, { isActive });
    return await this.findById(id);
  }

  async updateMaxConcurrentIps(id: number, maxConcurrentIps: number | null): Promise<User | null> {
    await this.userRepository.update(id, { maxConcurrentIps });
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async createPasswordResetToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.userRepository.update(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    return token;
  }

  async findByResetToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: MoreThan(new Date()),
      },
    });
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async updateNotificationPreferences(
    userId: number,
    preferences: {
      enableWhatsAppNotifications?: boolean;
      enableEmailNotifications?: boolean;
      enableBillingNotifications?: boolean;
    },
  ): Promise<User | null> {
    const updateData: Partial<User> = {};
    
    if (typeof preferences.enableWhatsAppNotifications === 'boolean') {
      updateData.enableWhatsAppNotifications = preferences.enableWhatsAppNotifications;
    }
    if (typeof preferences.enableEmailNotifications === 'boolean') {
      updateData.enableEmailNotifications = preferences.enableEmailNotifications;
    }
    if (typeof preferences.enableBillingNotifications === 'boolean') {
      updateData.enableBillingNotifications = preferences.enableBillingNotifications;
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(userId, updateData);
    }
    
    return await this.findById(userId);
  }

  async getNotificationPreferences(userId: number): Promise<{
    enableWhatsAppNotifications: boolean;
    enableEmailNotifications: boolean;
    enableBillingNotifications: boolean;
  } | null> {
    const user = await this.findById(userId);
    if (!user) return null;
    
    return {
      enableWhatsAppNotifications: user.enableWhatsAppNotifications,
      enableEmailNotifications: user.enableEmailNotifications,
      enableBillingNotifications: user.enableBillingNotifications,
    };
  }
}
