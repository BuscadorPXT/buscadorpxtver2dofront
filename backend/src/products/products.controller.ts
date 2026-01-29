import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ValidationPipe, Query, Logger } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { EncryptionService } from '../encryption/encryption.service';
import { CacheService } from '../cache/cache.service';
import { CurrencyService } from '../currency/currency.service';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  
  constructor(
    private productsService: ProductsService,
    private encryptionService: EncryptionService,
    private cacheService: CacheService,
    private currencyService: CurrencyService,
  ) {}

  @Get('autocomplete')
  async getAutocomplete(@Query('q') query: string) {
    const results = await this.productsService.getAutocomplete(query);
    const encryptedData = this.encryptionService.encrypt(results);
    return { data: encryptedData };
  }

  @Get('stats')
  async getStats() {
    return this.productsService.getStats();
  }

  @Get('filters')
  async getFilterOptions(
    @Query('category') category?: string | string[],
    @Query('color') color?: string | string[],
    @Query('storage') storage?: string | string[],
    @Query('region') region?: string | string[],
    @Query('supplier') supplier?: string | string[],
    @Query('search') search?: string,
    @Query('date') date?: string,
  ) {
    return this.productsService.getFilterOptions({
      category,
      color,
      storage,
      region,
      supplier,
      search,
      date,
    });
  }

  @Get()
  async findAll(
    @Query('category') category?: string | string[],
    @Query('color') color?: string | string[],
    @Query('storage') storage?: string | string[],
    @Query('region') region?: string | string[],
    @Query('supplier') supplier?: string | string[],
    @Query('categories') categories?: string,
    @Query('colors') colors?: string,
        @Query('storages') storages?: string,
    @Query('regions') regions?: string,
    @Query('suppliers') suppliers?: string,
    @Query('search') search?: string,
    @Query('exact') exact?: string,
    @Query('createdToday') createdToday?: string,
    @Query('date') date?: string,
  ) {
    const createdTodayBool = createdToday === 'true';
    const exactBool = exact === 'true';

    const processedCategories = categories ? categories.split(',').map(c => c.trim()) : (Array.isArray(category) ? category : category ? [category] : undefined);
    const processedColors = colors ? colors.split(',').map(c => c.trim()) : (Array.isArray(color) ? color : color ? [color] : undefined);
    const processedStorages = storages ? storages.split(',').map(s => s.trim()) : (Array.isArray(storage) ? storage : storage ? [storage] : undefined);
    const processedRegions = regions ? regions.split(',').map(r => r.trim()) : (Array.isArray(region) ? region : region ? [region] : undefined);
    const processedSuppliers = suppliers ? suppliers.split(',').map(s => s.trim()) : (Array.isArray(supplier) ? supplier : supplier ? [supplier] : undefined);

    const hasComplexFilters = !!(
      processedCategories?.length ||
      processedColors?.length ||
      processedStorages?.length ||
      processedRegions?.length ||
      processedSuppliers?.length ||
      search ||
      createdTodayBool
    );

    if (!hasComplexFilters) {

      let targetDate = date;
      if (!targetDate) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        targetDate = `${day}-${month}`;
      }

      console.log(`⚡ Tentando servir do cache de arquivo para data: ${targetDate}`);
      
      const cachedPayload = await this.cacheService.getCachedPayload(targetDate);
      
      if (cachedPayload && cachedPayload.products?.length > 0) {
        console.log(`✅ Cache HIT! Servindo ${cachedPayload.products.length} produtos do arquivo`);

        const dollarQuote = await this.currencyService.getDollarQuote();

        const result = {
          data: cachedPayload.products,
          total: cachedPayload.products.length,
          totalSuppliers: cachedPayload.stats.totalSuppliers,
          dollarRate: dollarQuote.currentRate,
          dollarVariation: dollarQuote.variationPercent,
        };

        const encryptedData = this.encryptionService.encrypt(result);
        return { data: encryptedData };
      }
      
      this.logger.warn(`⚠️  Cache MISS para data ${targetDate}, fallback para banco de dados`);
    }

    const products = await this.productsService.findAllWithFilters({
      category: processedCategories,
      color: processedColors,
      storage: processedStorages,
      region: processedRegions,
      supplier: processedSuppliers,
      search,
      exact: exactBool,
      createdToday: createdTodayBool,
      date,
    });

    const encryptedData = this.encryptionService.encrypt(products);
    return { data: encryptedData };
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body(ValidationPipe) productData: any) {
    return await this.productsService.create(productData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: number, @Body(ValidationPipe) productData: any) {
    return await this.productsService.update(id, productData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: number) {
    return await this.productsService.delete(id);
  }
}
