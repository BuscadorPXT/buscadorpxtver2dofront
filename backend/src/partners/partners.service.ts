import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { Partner } from './entities/partner.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private partnerRepository: Repository<Partner>,
  ) {}

  async create(createPartnerDto: CreatePartnerDto): Promise<Partner> {
    const partner = this.partnerRepository.create(createPartnerDto);
    return await this.partnerRepository.save(partner);
  }

  async findAll(): Promise<Partner[]> {
    return await this.partnerRepository.find({
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  async findActive(): Promise<Partner[]> {
    const now = new Date();
    
    return await this.partnerRepository
      .createQueryBuilder('partner')
      .where('partner.isActive = :isActive', { isActive: true })
      .andWhere(
        '(partner.startDate IS NULL OR partner.startDate <= :now)',
        { now }
      )
      .andWhere(
        '(partner.endDate IS NULL OR partner.endDate >= :now)',
        { now }
      )
      .orderBy('partner.displayOrder', 'ASC')
      .addOrderBy('partner.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Partner> {
    const partner = await this.partnerRepository.findOne({
      where: { id },
    });

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    return partner;
  }

  async update(id: number, updatePartnerDto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    
    Object.assign(partner, updatePartnerDto);
    
    return await this.partnerRepository.save(partner);
  }

  async remove(id: number): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnerRepository.remove(partner);
  }

  async toggleActive(id: number): Promise<Partner> {
    const partner = await this.findOne(id);
    partner.isActive = !partner.isActive;
    return await this.partnerRepository.save(partner);
  }

  async updateOrder(id: number, displayOrder: number): Promise<Partner> {
    const partner = await this.findOne(id);
    partner.displayOrder = displayOrder;
    return await this.partnerRepository.save(partner);
  }
}
