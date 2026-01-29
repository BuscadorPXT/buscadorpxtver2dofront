import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Repository } from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CacheEventsService } from './cache-events.gateway';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export interface CachedPayload {
  products: any[];
  suppliers: any[];
  stats: any;
  metadata: {
    sheetDate: string;
    generatedAt: string;
    encrypted: boolean;
    version: string;
  };
}

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize = 100;
  private readonly ttl = 5 * 60 * 1000;

  private cachedPayloadsByDate = new Map<string, string>();
  private isGeneratingPayload = false;
  
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private encryptionService: EncryptionService,
    @Inject(forwardRef(() => CacheEventsService))
    private cacheEventsService: CacheEventsService,
  ) { }

  async onModuleInit() {
    console.log('🚀 Inicializando sistema de cache...');

    await this.initializeCacheDirectory();

    console.log('⏳ Gerando payload inicial (aguardando conclusão)...');
    await this.generateAndCachePayload();
    console.log('✅ Sistema de cache inicializado e pronto para uso!');
  }

  private async initializeCacheDirectory(): Promise<void> {
    const cacheDir = this.getCacheDirectory();

    try {
      await fs.mkdir(cacheDir, { recursive: true });
      console.log(`📁 Diretório de cache inicializado: ${cacheDir}`);
    } catch (error) {
      this.logger.error(`Erro ao criar diretório de cache: ${error.message}`);
    }
  }

  private getCacheDirectory(): string {
    return process.env.CACHE_DIRECTORY || './cache';
  }

  private getRegenerationInterval(): number {
    return parseInt(process.env.CACHE_REGENERATION_INTERVAL_MINUTES || '5', 10);
  }

  private isEncryptionEnabled(): boolean {
    return process.env.ENABLE_ENCRYPTION === 'true';
  }

  async getAvailableDates(): Promise<string[]> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.sheetDate', 'sheetDate')
      .where('product.sheetDate IS NOT NULL')
      .andWhere('product.price > 0')
      .orderBy('product.sheetDate', 'DESC')
      .getRawMany();

    return result.map(r => r.sheetDate).filter(Boolean);
  }

  private async generatePayload(sheetDate: string): Promise<CachedPayload> {
    console.log(`🔄 Gerando payload para data: ${sheetDate}...`);

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.sheetDate = :sheetDate', { sheetDate })
      .andWhere('product.price > 0')
      .orderBy('product.name', 'ASC')
      .getMany();

    if (products.length === 0) {
      this.logger.warn(`⚠️  Nenhum produto encontrado para a data ${sheetDate}`);
    }

    const supplierIds = [...new Set(products.map(p => p.supplierId))];
    const suppliers = await this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.id IN (:...ids)', { ids: supplierIds.length > 0 ? supplierIds : [0] })
      .getMany();

    const stats = {
      totalProducts: products.length,
      totalSuppliers: suppliers.length,
      categoriesCount: [...new Set(products.map(p => p.category))].length,
      averagePrice: products.length > 0
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length
        : 0,
    };

    return {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        storage: p.storage,
        color: p.color,
        region: p.region,
        imageUrl: p.imageUrl,
        sheetDate: p.sheetDate,
        sheetTimestamp: p.sheetTimestamp,
        supplier: p.supplier ? {
          id: p.supplier.id,
          name: p.supplier.name,
          whatsappNumber: p.supplier.whatsappNumber,
          address: p.supplier.address,
          priority: p.supplier.priority,
        } : null,
      })),
      suppliers: suppliers.map(s => ({
        id: s.id,
        name: s.name,
        whatsappNumber: s.whatsappNumber,
        address: s.address,
        priority: s.priority,
        productCount: products.filter(p => p.supplierId === s.id).length,
      })),
      stats,
      metadata: {
        sheetDate,
        generatedAt: new Date().toISOString(),
        encrypted: this.isEncryptionEnabled(),
        version: '1.0.0',
      },
    };
  }

  async generateAndCachePayloadForDate(sheetDate: string): Promise<void> {
    try {

      this.cacheEventsService?.emitCacheRegenerating(sheetDate);

      const payload = await this.generatePayload(sheetDate);
      const payloadJson = JSON.stringify(payload);

      const cacheDir = this.getCacheDirectory();
      const isEncrypted = this.isEncryptionEnabled();

      let filename: string;
      let content: string;

      if (isEncrypted) {
        console.log(`🔐 Criptografando payload (${sheetDate})...`);
        content = this.encryptionService.encrypt(payloadJson);
        filename = `payload-${sheetDate}.encrypted`;
      } else {
        content = payloadJson;
        filename = `payload-${sheetDate}.json`;
      }

      const filePath = path.join(cacheDir, filename);

      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ Payload salvo (${sheetDate}): ${filename} (${(content.length / 1024).toFixed(2)} KB)`);

      this.cachedPayloadsByDate.set(sheetDate, filePath);

      this.cacheEventsService?.emitCacheUpdated(
        sheetDate,
        payload.stats.totalProducts,
        payload.stats.totalSuppliers
      );

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar payload para ${sheetDate}:`, error);
      throw error;
    }
  }

  async generateAndCachePayload(): Promise<void> {
    if (this.isGeneratingPayload) {
      this.logger.warn('⚠️  Geração de payload já em andamento, pulando...');
      return;
    }

    this.isGeneratingPayload = true;

    try {
      const syncAllDates = process.env.SYNC_ALL_DATES === 'true';

      if (syncAllDates) {

        console.log('🔄 Gerando cache para TODAS as datas disponíveis...');
        const dates = await this.getAvailableDates();

        for (const date of dates) {
          await this.generateAndCachePayloadForDate(date);
        }

        console.log(`✅ Cache gerado para ${dates.length} datas: ${dates.join(', ')}`);
      } else {

        const today = new Date();
        const todaySheet = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        console.log(`📅 Gerando cache apenas para data atual: ${todaySheet}`);
        await this.generateAndCachePayloadForDate(todaySheet);
      }

      await this.cleanOldCacheFiles();

    } catch (error) {
      this.logger.error('❌ Erro ao gerar payload:', error);
    } finally {
      this.isGeneratingPayload = false;
    }
  }

  async getCachedPayload(date?: string): Promise<CachedPayload | null> {
    try {
      let targetDate = date;

      if (!targetDate) {
        const dates = Array.from(this.cachedPayloadsByDate.keys());
        if (dates.length === 0) {
          this.logger.warn('⚠️  Nenhum payload cacheado disponível');
          return null;
        }

        dates.sort((a, b) => {
          const [dayA, monthA] = a.split('-').map(Number);
          const [dayB, monthB] = b.split('-').map(Number);
          if (monthA !== monthB) return monthB - monthA;
          return dayB - dayA;
        });
        targetDate = dates[0];
        this.logger.debug(`📅 Nenhuma data especificada, usando mais recente: ${targetDate}`);
      }

      const filePath = this.cachedPayloadsByDate.get(targetDate);

      if (!filePath) {
        this.logger.warn(`⚠️  Payload não encontrado para data: ${targetDate}`);
        return null;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const isEncrypted = filePath.endsWith('.encrypted');

      let payloadJson: string;

      if (isEncrypted) {
        this.logger.debug(`🔓 Descriptografando payload (${targetDate})...`);
        payloadJson = this.encryptionService.decrypt(content);
      } else {
        payloadJson = content;
      }

      return JSON.parse(payloadJson);
    } catch (error) {
      this.logger.error(`❌ Erro ao ler payload cacheado (${date}):`, error);
      return null;
    }
  }

  private async cleanOldCacheFiles(): Promise<void> {
    try {
      const cacheDir = this.getCacheDirectory();
      const files = await fs.readdir(cacheDir);
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      const activeFiles = new Set(this.cachedPayloadsByDate.values());

      for (const file of files) {
        if (!file.startsWith('payload-')) continue;

        const filePath = path.join(cacheDir, file);

        if (activeFiles.has(filePath)) continue;

        try {
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > sevenDays) {
            await fs.unlink(filePath);
            console.log(`🗑️  Arquivo antigo removido (${(age / (24 * 60 * 60 * 1000)).toFixed(1)} dias): ${file}`);
          }
        } catch (error) {

        }
      }
    } catch (error) {
      this.logger.error('Erro ao limpar arquivos antigos:', error);
    }
  }

  @Cron('*/5 * * * *')
  async handlePayloadRegeneration(): Promise<void> {
    const interval = this.getRegenerationInterval();
    console.log(`⏰ Executando regeneração de payload (intervalo: ${interval} min)...`);
    await this.generateAndCachePayload();
  }

  private generateKey(prefix: string, params: any): string {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${prefix}:${crypto.createHash('sha256').update(sortedParams).digest('hex')}`;
  }

  get<T>(prefix: string, params: any): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    entry.timestamp = now;

    return entry.data;
  }

  set<T>(prefix: string, params: any, data: T): void {
    const key = this.generateKey(prefix, params);

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    let lowestHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {

      if (entry.hits < lowestHits || (entry.hits === lowestHits && entry.timestamp < oldestTimestamp)) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
        lowestHits = entry.hits;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    const entries = Array.from(this.cache.entries());
    const totalHits = entries.reduce((sum, [, entry]) => sum + entry.hits, 0);
    const now = Date.now();

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      entries: entries.map(([key, entry]) => ({
        key: key.split(':')[0],
        age: Math.floor((now - entry.timestamp) / 1000),
        hits: entry.hits,
      })),
    };
  }

  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  @Cron('*/10 * * * *')
  handleCacheCleanup() {
    const sizeBefore = this.cache.size;
    this.cleanExpired();
    const sizeAfter = this.cache.size;

    if (sizeBefore !== sizeAfter) {
      console.log(`[Cache] Limpeza automática: ${sizeBefore - sizeAfter} entradas removidas`);
    }
  }
}
