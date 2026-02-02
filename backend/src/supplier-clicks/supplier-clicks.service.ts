import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { SupplierClick } from './entities/supplier-click.entity';
import { RegisterClickDto } from './dto/supplier-click.dto';

@Injectable()
export class SupplierClicksService {
  constructor(
    @InjectRepository(SupplierClick)
    private clicksRepository: Repository<SupplierClick>,
  ) {}

  async registerClick(userId: number, dto: RegisterClickDto): Promise<SupplierClick> {
    const click = this.clicksRepository.create({
      userId,
      supplierId: dto.supplierId,
      productId: dto.productId,
      sessionInfo: dto.sessionInfo,
      clickedAt: new Date(),
    });

    return await this.clicksRepository.save(click);
  }

  async getSupplierMetrics(startDate?: Date, endDate?: Date) {
    const query = this.clicksRepository
      .createQueryBuilder('click')
      .leftJoin('click.supplier', 'supplier')
      .select('supplier.id', 'supplierId')
      .addSelect('supplier.name', 'supplierName')
      .addSelect('COUNT(click.id)', 'totalClicks')
      .addSelect('COUNT(DISTINCT click.userId)', 'uniqueUsers')
      .groupBy('supplier.id')
      .addGroupBy('supplier.name')
      .orderBy('totalClicks', 'DESC');

    if (startDate) {
      query.andWhere('click.clickedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('click.clickedAt <= :endDate', { endDate });
    }

    return await query.getRawMany();
  }

  async getTopProductsBySupplier(supplierId: number, startDate?: Date, endDate?: Date, limit: number = 10) {
    const query = this.clicksRepository
      .createQueryBuilder('click')
      .leftJoin('click.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.code', 'productCode')
      .addSelect('COUNT(click.id)', 'totalClicks')
      .addSelect('COUNT(DISTINCT click.userId)', 'uniqueUsers')
      .where('click.supplierId = :supplierId', { supplierId })
      .andWhere('click.productId IS NOT NULL')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.code')
      .orderBy('totalClicks', 'DESC')
      .limit(limit);

    if (startDate) {
      query.andWhere('click.clickedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('click.clickedAt <= :endDate', { endDate });
    }

    return await query.getRawMany();
  }

  async getClicksByPeriod(startDate: Date, endDate: Date, supplierId?: number) {
    const query = this.clicksRepository
      .createQueryBuilder('click')
      .select("DATE_TRUNC('day', click.clickedAt)", 'date')
      .addSelect('COUNT(click.id)', 'clicks')
      .where('click.clickedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy("DATE_TRUNC('day', click.clickedAt)")
      .orderBy("DATE_TRUNC('day', click.clickedAt)", 'ASC');

    if (supplierId) {
      query.andWhere('click.supplierId = :supplierId', { supplierId });
    }

    return await query.getRawMany();
  }

  async getTotalClicks(supplierId?: number, startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.clicksRepository.createQueryBuilder('click');

    if (supplierId) {
      query.where('click.supplierId = :supplierId', { supplierId });
    }
    if (startDate) {
      query.andWhere('click.clickedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('click.clickedAt <= :endDate', { endDate });
    }

    return await query.getCount();
  }
}
