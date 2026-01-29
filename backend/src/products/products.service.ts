import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CurrencyService } from '../currency/currency.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private currencyService: CurrencyService,
    private cacheService: CacheService,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);

    this.cacheService.invalidate('products');
    
    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['supplier'],
    });
  }

  async findById(id: number): Promise<Product | null> {
    return await this.productRepository.findOne({
      where: { id },
      relations: ['supplier'],
    });
  }

  async findAllWithFilters(filters: {
    category?: string | string[];
    color?: string | string[];
    storage?: string | string[];
    region?: string | string[];
    supplier?: string | string[];
    search?: string;
    exact?: boolean;
    createdToday?: boolean;
    date?: string;
  }): Promise<{ 
    data: Product[]; 
    total: number; 
    totalSuppliers: number; 
    dollarRate: number;
    dollarVariation: number;
  }> {

    const cacheKey = 'products:findAllWithFilters';
    const cachedResult = this.cacheService.get<{ 
      data: Product[]; 
      total: number; 
      totalSuppliers: number; 
      dollarRate: number;
      dollarVariation: number;
    }>(cacheKey, filters);
    
    if (cachedResult) {
      return cachedResult;
    }

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier');

    if (filters.date) {

      query.andWhere('product.sheetDate = :sheetDate', { sheetDate: filters.date });
    } else {

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const todaySheetDate = `${day}-${month}`;
      
      query.andWhere('product.sheetDate = :sheetDate', { sheetDate: todaySheetDate });
    }

    query.andWhere('product.price > 0');
    query.andWhere('product.price IS NOT NULL');

    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      if (categories.length > 0) {
        const categoryConditions = categories.map((_, index) => `LOWER(product.category) = LOWER(:category${index})`).join(' OR ');
        query.andWhere(`(${categoryConditions})`);
        categories.forEach((category, index) => {
          query.setParameter(`category${index}`, category);
        });
      }
    }

    if (filters.color) {
      const colors = Array.isArray(filters.color) ? filters.color : [filters.color];
      if (colors.length > 0) {

        const colorConditions = colors.map((_, index) => `LOWER(product.color) = LOWER(:color${index})`).join(' OR ');
        query.andWhere(`(${colorConditions})`);
        colors.forEach((color, index) => {
          query.setParameter(`color${index}`, color);
        });
      }
    }

    if (filters.storage) {
      const storages = Array.isArray(filters.storage) ? filters.storage : [filters.storage];
      if (storages.length > 0) {
        const storageConditions = storages.map((_, index) => `LOWER(product.storage) = LOWER(:storage${index})`).join(' OR ');
        query.andWhere(`(${storageConditions})`);
        storages.forEach((storage, index) => {
          query.setParameter(`storage${index}`, storage);
        });
      }
    }

    if (filters.region) {
      const regions = Array.isArray(filters.region) ? filters.region : [filters.region];
      if (regions.length > 0) {
        const regionConditions = regions.map((_, index) => `LOWER(product.region) = LOWER(:region${index})`).join(' OR ');
        query.andWhere(`(${regionConditions})`);
        regions.forEach((region, index) => {
          query.setParameter(`region${index}`, region);
        });
      }
    }

    if (filters.supplier) {
      const suppliers = Array.isArray(filters.supplier) ? filters.supplier : [filters.supplier];
      if (suppliers.length > 0) {
        query.andWhere('supplier.name IN (:...suppliers)', { suppliers });
      }
    }

    if (filters.search) {
      if (filters.exact) {
        query.andWhere('LOWER(product.name) = LOWER(:exactSearch)', { 
          exactSearch: filters.search 
        });
      } else {
        query.andWhere(
          '(product.name ILIKE :search OR product.description ILIKE :search OR supplier.name ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }
    }

    const hasFilters = filters.category || filters.color || filters.storage || filters.region || filters.supplier;
    
    if (hasFilters) {

      let scoreExpression = '0';
      
      if (filters.category) {
        const categoryConditions = Array.isArray(filters.category) 
          ? filters.category.map((_, index) => `LOWER(product.category) = LOWER(:scoreCategory${index})`).join(' OR ')
          : `LOWER(product.category) = LOWER(:scoreCategory0)`;
        scoreExpression += ` + CASE WHEN (${categoryConditions}) THEN 1 ELSE 0 END`;
        
        const categoriesArray = Array.isArray(filters.category) ? filters.category : [filters.category];
        categoriesArray.forEach((category, index) => {
          query.setParameter(`scoreCategory${index}`, category);
        });
      }
      if (filters.color) {

        const colorConditions = Array.isArray(filters.color) 
          ? filters.color.map((_, index) => `LOWER(product.color) = LOWER(:scoreColor${index})`).join(' OR ')
          : `LOWER(product.color) = LOWER(:scoreColor0)`;
        scoreExpression += ` + CASE WHEN (${colorConditions}) THEN 1 ELSE 0 END`;
        
        const colorsArray = Array.isArray(filters.color) ? filters.color : [filters.color];
        colorsArray.forEach((color, index) => {
          query.setParameter(`scoreColor${index}`, color);
        });
      }
      if (filters.storage) {
        const storageConditions = Array.isArray(filters.storage) 
          ? filters.storage.map((_, index) => `LOWER(product.storage) = LOWER(:scoreStorage${index})`).join(' OR ')
          : `LOWER(product.storage) = LOWER(:scoreStorage0)`;
        scoreExpression += ` + CASE WHEN (${storageConditions}) THEN 1 ELSE 0 END`;
        
        const storagesArray = Array.isArray(filters.storage) ? filters.storage : [filters.storage];
        storagesArray.forEach((storage, index) => {
          query.setParameter(`scoreStorage${index}`, storage);
        });
      }
      if (filters.region) {
        const regionConditions = Array.isArray(filters.region) 
          ? filters.region.map((_, index) => `LOWER(product.region) = LOWER(:scoreRegion${index})`).join(' OR ')
          : `LOWER(product.region) = LOWER(:scoreRegion0)`;
        scoreExpression += ` + CASE WHEN (${regionConditions}) THEN 1 ELSE 0 END`;
        
        const regionsArray = Array.isArray(filters.region) ? filters.region : [filters.region];
        regionsArray.forEach((region, index) => {
          query.setParameter(`scoreRegion${index}`, region);
        });
      }
      if (filters.supplier) {
        scoreExpression += ' + CASE WHEN supplier.name = ANY(:supplierArray) THEN 1 ELSE 0 END';
        query.setParameter('supplierArray', Array.isArray(filters.supplier) ? filters.supplier : [filters.supplier]);
      }
      
      query.addSelect(`(${scoreExpression})`, 'relevance_score');

    }
    
    if (filters.search) {

      query.addSelect(
        `CASE WHEN LOWER(product.name) = LOWER(:exactSearch) THEN 0 ELSE 1 END`,
        'exact_match_priority'
      );
      query.setParameter('exactSearch', filters.search);
    }

    query.addOrderBy('supplier.priority', 'ASC', 'NULLS LAST');
    
    if (filters.search) {
      query.addOrderBy('exact_match_priority', 'ASC');
    }
    
    if (filters.category || filters.color || filters.storage || filters.region) {
      query.addOrderBy('relevance_score', 'DESC');
    }

    query.addOrderBy('product.price', 'ASC', 'NULLS LAST');
    query.addOrderBy('product.sheetDate', 'DESC', 'NULLS LAST');

    const [data, total] = await query.getManyAndCount();

    const allProductsQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier');

    if (filters.date) {
      allProductsQuery.andWhere('product.sheetDate = :sheetDate', { sheetDate: filters.date });
    } else {

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const todaySheetDate = `${day}-${month}`;
      allProductsQuery.andWhere('product.sheetDate = :statsSheetDate', { statsSheetDate: todaySheetDate });
    }

    allProductsQuery.andWhere('product.price > 0');
    allProductsQuery.andWhere('product.price IS NOT NULL');
    
    if (filters.category) {
      allProductsQuery.andWhere('product.category = :category', { category: filters.category });
    }
    if (filters.color) {
      allProductsQuery.andWhere('product.color = :color', { color: filters.color });
    }
    if (filters.storage) {
      allProductsQuery.andWhere('product.storage = :storage', { storage: filters.storage });
    }
    if (filters.region) {
      allProductsQuery.andWhere('product.region = :region', { region: filters.region });
    }
    if (filters.supplier) {
      allProductsQuery.andWhere('supplier.name = :supplier', { supplier: filters.supplier });
    }
    if (filters.search) {
      allProductsQuery.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR supplier.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const allProducts = await allProductsQuery.getMany();
    const uniqueSuppliers = [...new Set(allProducts.map(p => p.supplier?.name).filter(Boolean))];
    const totalSuppliers = uniqueSuppliers.length;

    const dollarQuote = await this.currencyService.getDollarQuote();

    const result = {
      data,
      total,
      totalSuppliers,
      dollarRate: dollarQuote.currentRate,
      dollarVariation: dollarQuote.variationPercent,
    };

    this.cacheService.set(cacheKey, filters, result);

    return result;
  }

  async update(id: number, productData: Partial<Product>): Promise<Product | null> {
    await this.productRepository.update(id, productData);

    this.cacheService.invalidate('products');
    
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.productRepository.delete(id);

    this.cacheService.invalidate('products');
  }

  async getFilterOptions(filters?: {
    category?: string | string[];
    color?: string | string[];
    storage?: string | string[];
    region?: string | string[];
    supplier?: string | string[];
    search?: string;
    date?: string;
  }): Promise<{
    categories: string[];
    colors: string[];
    storages: string[];
    regions: string[];
    suppliers: { updated: string[]; outdated: string[]; };
  }> {

    const cacheKey = 'products:getFilterOptions';
    const cachedResult = this.cacheService.get<{
      categories: string[];
      colors: string[];
      storages: string[];
      regions: string[];
      suppliers: { updated: string[]; outdated: string[]; };
    }>(cacheKey, filters || {});
    
    if (cachedResult) {
      return cachedResult;
    }

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier');

    if (filters?.date) {

      query.andWhere('product.sheetDate = :sheetDate', { sheetDate: filters.date });
    } else {

      const mostRecentDateResult = await this.productRepository
        .createQueryBuilder('product')
        .select('product.sheetDate')
        .where('product.price > 0')
        .andWhere('product.price IS NOT NULL')
        .andWhere('product.sheetDate IS NOT NULL')
        .orderBy('product.sheetDate', 'DESC')
        .limit(1)
        .getRawOne();

      if (mostRecentDateResult && mostRecentDateResult.product_sheetDate) {
        query.andWhere('product.sheetDate = :sheetDate', { 
          sheetDate: mostRecentDateResult.product_sheetDate 
        });
      }
    }

    query.andWhere('product.price > 0');
    query.andWhere('product.price IS NOT NULL');

    if (filters?.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      if (categories.length > 0) {
        query.andWhere('product.category IN (:...categories)', { categories });
      }
    }

    if (filters?.color) {
      const colors = Array.isArray(filters.color) ? filters.color : [filters.color];
      if (colors.length > 0) {
        query.andWhere('product.color IN (:...colors)', { colors });
      }
    }

    if (filters?.storage) {
      const storages = Array.isArray(filters.storage) ? filters.storage : [filters.storage];
      if (storages.length > 0) {
        query.andWhere('product.storage IN (:...storages)', { storages });
      }
    }

    if (filters?.region) {
      const regions = Array.isArray(filters.region) ? filters.region : [filters.region];
      if (regions.length > 0) {
        query.andWhere('product.region IN (:...regions)', { regions });
      }
    }

    if (filters?.supplier) {
      const suppliers = Array.isArray(filters.supplier) ? filters.supplier : [filters.supplier];
      if (suppliers.length > 0) {
        query.andWhere('supplier.name IN (:...suppliers)', { suppliers });
      }
    }

    if (filters?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR supplier.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const products = await query.getMany();

    const filterValidValues = (value: any) => {
      return value && typeof value === 'string' && value.trim().length > 0;
    };

    const categories = [...new Set(products.map(p => p.category).filter(filterValidValues))].sort();
    const colors = [...new Set(products.map(p => p.color).filter(filterValidValues))].sort();
    const storages = [...new Set(products.map(p => p.storage).filter(filterValidValues))].sort();
    const regions = [...new Set(products.map(p => p.region).filter(filterValidValues))].sort();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const supplierMap = new Map<string, { isUpdated: boolean; priority: number | null }>();
    for (const product of products) {
      const supplierName = product.supplier?.name;
      if (supplierName) {
        const hasRecent = product.createdAt >= startOfToday && product.createdAt <= endOfToday;
        const priority = product.supplier?.priority ?? null;
        
        if (!supplierMap.has(supplierName)) {
          supplierMap.set(supplierName, { isUpdated: hasRecent, priority });
        } else {
          const existing = supplierMap.get(supplierName)!;
          supplierMap.set(supplierName, { 
            isUpdated: existing.isUpdated || hasRecent,
            priority: existing.priority ?? priority
          });
        }
      }
    }

    const updated: string[] = [];
    const outdated: string[] = [];
    
    for (const [name, data] of supplierMap) {
      if (data.isUpdated) {
        updated.push(name);
      } else {
        outdated.push(name);
      }
    }

    const sortByPriority = (a: string, b: string) => {
      const aData = supplierMap.get(a);
      const bData = supplierMap.get(b);
      
      const aPriority = aData?.priority ?? Infinity;
      const bPriority = bData?.priority ?? Infinity;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return a.localeCompare(b);
    };

    updated.sort(sortByPriority);
    outdated.sort(sortByPriority);

    const result = {
      categories,
      colors,
      storages,
      regions,
      suppliers: { updated, outdated },
    };

    this.cacheService.set(cacheKey, filters || {}, result);

    return result;
  }

  async getAutocomplete(query: string): Promise<{
    products: Array<{ name: string; category: string }>;
    categories: string[];
  }> {
    if (!query || query.length < 2) {
      return { products: [], categories: [] };
    }

    const mostRecentDateResult = await this.productRepository
      .createQueryBuilder('product')
      .select('product.sheetDate')
      .where('product.price > 0')
      .andWhere('product.price IS NOT NULL')
      .andWhere('product.sheetDate IS NOT NULL')
      .orderBy('product.sheetDate', 'DESC')
      .limit(1)
      .getRawOne();

    if (!mostRecentDateResult || !mostRecentDateResult.product_sheetDate) {
      return { products: [], categories: [] };
    }

    const mostRecentDate = mostRecentDateResult.product_sheetDate;

    const isNumericSearch = /^\d+$/.test(query.trim());

    const productsQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .select('product.name', 'name')
      .addSelect('MAX(product.category)', 'category')
      .addSelect('MIN(supplier.priority)', 'priority')
      .where('product.name ILIKE :search', { search: `%${query}%` })
      .andWhere('product.sheetDate = :sheetDate', { sheetDate: mostRecentDate })
      .andWhere('product.price > 0')
      .andWhere('product.price IS NOT NULL')
      .groupBy('product.name');

    if (isNumericSearch) {
      productsQuery
        .addSelect(`CASE WHEN LOWER(product.name) LIKE 'iphone%' THEN 0 ELSE 1 END`, 'iphone_priority')
        .orderBy('MIN(supplier.priority)', 'ASC', 'NULLS LAST')
        .addOrderBy('iphone_priority', 'ASC')
        .addOrderBy('product.name', 'ASC');
    } else {
      productsQuery
        .orderBy('MIN(supplier.priority)', 'ASC', 'NULLS LAST')
        .addOrderBy('product.name', 'ASC');
    }

    productsQuery.limit(10);

    const productsResult = await productsQuery.getRawMany();
    
    const productSuggestions = productsResult.map(p => ({
      name: p.name,
      category: p.category || '',
    }));

    const categoriesQuery = this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .where('product.category ILIKE :search', { search: `%${query}%` })
      .andWhere('product.category IS NOT NULL')
      .andWhere('product.sheetDate = :sheetDate', { sheetDate: mostRecentDate })
      .andWhere('product.price > 0')
      .andWhere('product.price IS NOT NULL')
      .limit(3);

    const categoriesResult = await categoriesQuery.getRawMany();
    const categories = categoriesResult.map(r => r.category);

    return {
      products: productSuggestions,
      categories,
    };
  }

  async getStats(): Promise<{
    totalProducts: number;
    totalSuppliers: number;
  }> {

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const todaySheetDate = `${day}-${month}`;

    const totalProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.price > 0')
      .andWhere('product.price IS NOT NULL')
      .andWhere('product.sheetDate = :sheetDate', { sheetDate: todaySheetDate })
      .getCount();

    const totalSuppliers = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.supplier', 'supplier')
      .where('product.price > 0')
      .andWhere('product.price IS NOT NULL')
      .andWhere('product.sheetDate = :sheetDate', { sheetDate: todaySheetDate })
      .select('COUNT(DISTINCT supplier.id)', 'count')
      .getRawOne();

    return {
      totalProducts,
      totalSuppliers: parseInt(totalSuppliers.count) || 0,
    };
  }
}
