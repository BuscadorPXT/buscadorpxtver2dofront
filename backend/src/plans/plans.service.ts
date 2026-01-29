import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

export interface CreatePlanDto {
  name: string;
  description?: string;
  durationType?: 'hours' | 'days';
  hours: number;
  price: number;
  features?: string[];
  color?: string;
  displayOrder?: number;
  whatsappNumber?: string;
  maxConcurrentIps?: number;
  disableSupplierContact?: boolean;
  hideSupplier?: boolean;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  durationType?: 'hours' | 'days';
  hours?: number;
  price?: number;
  isActive?: boolean;
  features?: string[];
  color?: string;
  displayOrder?: number;
  whatsappNumber?: string;
  maxConcurrentIps?: number;
  disableSupplierContact?: boolean;
  hideSupplier?: boolean;
}

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
  ) { }

  async findAll(activeOnly = false): Promise<Plan[]> {
    const query = this.plansRepository
      .createQueryBuilder('plan')
      .orderBy('plan.displayOrder', 'ASC')
      .addOrderBy('plan.price', 'ASC');

    if (activeOnly) {
      query.where('plan.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plano com ID ${id} não encontrado`);
    }
    return plan;
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.plansRepository.create(createPlanDto);
    return this.plansRepository.save(plan);
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    const oldDurationType = plan.durationType || 'days';
    const newDurationType = updatePlanDto.durationType || oldDurationType;

    Object.assign(plan, updatePlanDto);
    const updatedPlan = await this.plansRepository.save(plan);

    if (oldDurationType !== newDurationType) {
      console.warn(`⚠️  Plano ${id} teve o durationType alterado de '${oldDurationType}' para '${newDurationType}'.`);
      console.warn(`⚠️  IMPORTANTE: Ao aplicar este plano a usuários, os dados serão atualizados automaticamente.`);
    }

    return updatedPlan;
  }

  async delete(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.plansRepository.remove(plan);
  }

  async toggleActive(id: string): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.isActive = !plan.isActive;
    return this.plansRepository.save(plan);
  }
}
