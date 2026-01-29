import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(supplierData: Partial<Supplier>): Promise<Supplier> {
    const supplier = this.supplierRepository.create(supplierData);
    return await this.supplierRepository.save(supplier);
  }

  async findAll(): Promise<Supplier[]> {
    return await this.supplierRepository.find({
      relations: ['products'],
      order: {
        priority: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<Supplier | null> {
    return await this.supplierRepository.findOne({
      where: { id },
      relations: ['products'],
    });
  }

  async update(id: number, supplierData: Partial<Supplier>): Promise<Supplier | null> {
    await this.supplierRepository.update(id, supplierData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.supplierRepository.delete(id);
  }

  async getSuppliersStats(date?: string) {

    let effectiveDate = date;
    if (!effectiveDate) {

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      effectiveDate = `${day}-${month}`;
    }

    const suppliersWithProductCount = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.supplier', 'supplier')
      .where('product.sheetDate = :date', { date: effectiveDate })
      .andWhere('product.price > 0')
      .andWhere('product.price IS NOT NULL')
      .select('supplier.id', 'id')
      .addSelect('supplier.name', 'name')
      .addSelect('supplier.priority', 'priority')
      .addSelect('COUNT(DISTINCT product.id)', 'productCount')
      .groupBy('supplier.id')
      .addGroupBy('supplier.name')
      .addGroupBy('supplier.priority')
      .orderBy('supplier.priority', 'ASC', 'NULLS LAST')
      .addOrderBy('supplier.name', 'ASC')
      .getRawMany();

    const suppliersWithValidProducts = suppliersWithProductCount.filter(s => parseInt(s.productCount) > 0);
    const totalSuppliers = suppliersWithValidProducts.length;
    const activeSuppliers = totalSuppliers;
    const inactiveSuppliers = 0;

    const totalProducts = suppliersWithValidProducts.reduce((sum, s) => sum + parseInt(s.productCount), 0);

    const suppliers = suppliersWithValidProducts.map(s => ({
      id: s.id,
      name: s.name,
      productCount: parseInt(s.productCount),
      isActive: true,
      priority: s.priority ? parseInt(s.priority) : null,
    }));

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      totalProducts,
      suppliers,
    };
  }

  async getSupplierDetails(supplierName: string, date?: string) {
    const mostRecentDateSubquery = this.supplierRepository
      .createQueryBuilder()
      .select('MAX(product.sheetDate)', 'maxDate')
      .from('products', 'product')
      .where('product.sheetDate IS NOT NULL')
      .andWhere('product.price > 0')
      .andWhere('product.price IS NOT NULL')
      .getQuery();

    const effectiveDate = date || `(${mostRecentDateSubquery})`;
    
    const baseQuery = this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoin('supplier.products', 'product')
      .where('supplier.name = :supplierName', { supplierName })
      .andWhere('product.price > 0')
      .andWhere('product.price IS NOT NULL');

    if (date) {
      baseQuery.andWhere('product.sheetDate = :date', { date });
    } else {
      baseQuery.andWhere(`product.sheetDate = ${effectiveDate}`);
    }

    const totalProducts = await baseQuery
      .select('COUNT(product.id)', 'count')
      .getRawOne();

    const uniqueVariants = await baseQuery
      .select('COUNT(DISTINCT CONCAT(product.name, product.storage, product.color, product.region))', 'count')
      .getRawOne();

    const allProductsQuery = this.supplierRepository
      .createQueryBuilder()
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('product.storage', 'storage')
      .addSelect('product.color', 'color')
      .addSelect('product.price', 'price')
      .addSelect('product.supplierId', 'supplierId')
      .from('products', 'product')
      .where('product.price > 0')
      .andWhere('product.price IS NOT NULL');

    if (date) {
      allProductsQuery.andWhere('product.sheetDate = :date', { date });
    } else {
      allProductsQuery.andWhere(`product.sheetDate = ${effectiveDate}`);
    }

    const allProducts = await allProductsQuery.getRawMany();

    const productsByVariant = new Map();
    allProducts.forEach(product => {
      const key = `${product.name}-${product.storage}-${product.color}`;
      if (!productsByVariant.has(key)) {
        productsByVariant.set(key, []);
      }
      productsByVariant.get(key).push(product);
    });

    let lowestPriceCount = 0;
    const supplier = await this.supplierRepository.findOne({
      where: { name: supplierName },
    });

    if (supplier) {
      productsByVariant.forEach((products) => {
        const lowestPrice = Math.min(...products.map(p => Number(p.price)));
        const lowestPriceProduct = products.find(p => Number(p.price) === lowestPrice);
        
        if (lowestPriceProduct && lowestPriceProduct.supplierId === supplier.id) {
          lowestPriceCount++;
        }
      });
    }

    return {
      totalProducts: parseInt(totalProducts.count) || 0,
      uniqueVariants: parseInt(uniqueVariants.count) || 0,
      lowestPriceCount,
    };
  }
}
