import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { google } from 'googleapis';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class SheetsService {
  private readonly logger = new Logger(SheetsService.name);
  private sheets;
  private syncStatus: {
    isRunning: boolean;
    lastSync: Date | null;
    lastResult: {
      added: number;
      updated: number;
      deleted: number;
      errors: number;
      total: number;
    } | null;
    error: string | null;
  } = {
      isRunning: false,
      lastSync: null,
      lastResult: null,
      error: null,
    };

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private cacheService: CacheService,
  ) {
    this.initializeSheets();
  }

  private initializeSheets() {
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      this.logger.warn('⚠️  GOOGLE_SHEETS_SPREADSHEET_ID não configurado no .env');
      return;
    }

    try {

      if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        console.log('🔑 Usando credenciais diretas do .env');

        const auth = new google.auth.JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API inicializada com JWT direto');
        return;
      }

      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
        console.log('📄 Usando arquivo JSON de credenciais');

        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API inicializada com arquivo JSON');
        return;
      }

      this.logger.warn('⚠️  Nenhuma credencial do Google configurada');
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar Google Sheets API:', error.message);
    }
  }

  async getMostRecentSheet(): Promise<string | null> {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      if (!spreadsheetId) {
        this.logger.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID não está definido no .env');
        return null;
      }

      if (!this.sheets) {
        this.logger.error('❌ Google Sheets API não foi inicializada corretamente');
        return null;
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheets = response.data.sheets || [];

      const dateSheets = sheets
        .map(sheet => sheet.properties?.title)
        .filter(title => title && /^\d{2}-\d{2}$/.test(title))
        .sort((a, b) => {
          const [dayA, monthA] = a.split('-').map(Number);
          const [dayB, monthB] = b.split('-').map(Number);

          if (monthA !== monthB) return monthB - monthA;
          return dayB - dayA;
        });

      if (dateSheets.length === 0) {
        this.logger.warn('Nenhuma aba com formato DD-MM encontrada');
        return null;
      }

      console.log(`Aba mais recente encontrada: ${dateSheets[0]}`);
      return dateSheets[0];
    } catch (error) {
      this.logger.error('Erro ao buscar abas da planilha:', error);
      throw error;
    }
  }

  async getAvailableDates(): Promise<string[]> {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      if (!spreadsheetId) {
        this.logger.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID não está definido no .env');
        return [];
      }

      if (!this.sheets) {
        this.logger.error('❌ Google Sheets API não foi inicializada corretamente');
        return [];
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheets = response.data.sheets || [];

      const dateSheets = sheets
        .map(sheet => sheet.properties?.title)
        .filter(title => title && /^\d{2}-\d{2}$/.test(title))
        .sort((a, b) => {
          const [dayA, monthA] = a.split('-').map(Number);
          const [dayB, monthB] = b.split('-').map(Number);

          if (monthA !== monthB) return monthB - monthA;
          return dayB - dayA;
        });

      return dateSheets;
    } catch (error) {
      this.logger.error('Erro ao buscar datas disponíveis:', error);
      return [];
    }
  }

  async getSuppliersData(): Promise<any[]> {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'FORNECEDORES!A:C',
      });

      const rows = response.data.values || [];

      if (rows.length === 0) {
        this.logger.warn('Aba FORNECEDORES está vazia');
        return [];
      }

      const [header, ...dataRows] = rows;

      return dataRows.map(row => ({
        fornecedor: row[0]?.trim() || '',
        telefone: row[1]?.trim() || '',
        endereco: row[2]?.trim() || '',
      }));
    } catch (error) {
      this.logger.warn('Aba FORNECEDORES não encontrada ou erro ao ler:', error.message);
      return [];
    }
  }

  async getSheetData(sheetName: string): Promise<any[]> {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:H`,
      });

      const rows = response.data.values || [];

      if (rows.length === 0) {
        this.logger.warn(`Aba ${sheetName} está vazia`);
        return [];
      }

      const [header, ...dataRows] = rows;

      return dataRows.map(row => ({
        fornecedor: row[0]?.trim() || '',
        categoria: row[1]?.trim() || '',
        modelo: row[2]?.trim() || '',
        gb: row[3]?.trim() || null,
        regiao: row[4]?.trim() || null,
        cor: row[5]?.trim() || null,
        preco: row[6]?.trim() || '',
        timestamp: row[7]?.trim() || '',
      }));
    } catch (error) {
      this.logger.error(`Erro ao buscar dados da aba ${sheetName}:`, error);
      throw error;
    }
  }

  async syncProducts(): Promise<{
    added: number;
    updated: number;
    deleted: number;
    errors: number;
    total: number;
  }> {
    if (this.syncStatus.isRunning) {

      const maxSyncTime = 10 * 60 * 1000;
      const timeSinceLastSync = this.syncStatus.lastSync 
        ? Date.now() - this.syncStatus.lastSync.getTime() 
        : 0;
      
      if (timeSinceLastSync > maxSyncTime) {
        this.logger.error(`⚠️ Sincronização travada há ${Math.floor(timeSinceLastSync / 1000)}s, resetando...`);
        this.syncStatus.isRunning = false;
      } else {
        this.logger.warn('Sincronização já está em execução, pulando...');
        return this.syncStatus.lastResult || { added: 0, updated: 0, deleted: 0, errors: 0, total: 0 };
      }
    }

    this.syncStatus.isRunning = true;
    this.syncStatus.error = null;
    this.syncStatus.lastSync = new Date();
    console.log('Iniciando sincronização de produtos...');

    let added = 0;
    let updated = 0;
    let deleted = 0;
    let errors = 0;

    try {

      const syncAllDates = process.env.SYNC_ALL_DATES === 'true';

      const today = new Date();
      const todaySheet = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      let sortedDates: string[];

      if (syncAllDates) {

        console.log('🔄 Modo SYNC_ALL_DATES ativado - Processando TODAS as datas');
        const allDates = await this.getAvailableDates();

        if (allDates.length === 0) {
          this.logger.error('Nenhuma aba válida encontrada para sincronização');
          return { added: 0, updated: 0, deleted: 0, errors: 0, total: 0 };
        }

        sortedDates = allDates.filter(d => d !== todaySheet);
        if (allDates.includes(todaySheet)) {
          sortedDates.unshift(todaySheet);
          console.log(`⭐ Aba do dia atual (${todaySheet}) será processada PRIMEIRO`);
        }

        console.log(`Encontradas ${sortedDates.length} abas para processar: ${sortedDates.join(', ')}`);
      } else {

        console.log(`📅 Modo otimizado - Processando APENAS a aba do dia atual: ${todaySheet}`);

        const allDates = await this.getAvailableDates();
        if (!allDates.includes(todaySheet)) {
          this.logger.warn(`⚠️  Aba do dia atual (${todaySheet}) não encontrada na planilha`);
          console.log(`Abas disponíveis: ${allDates.join(', ')}`);
          return { added: 0, updated: 0, deleted: 0, errors: 0, total: 0 };
        }

        sortedDates = [todaySheet];
      }

      const suppliersData = await this.getSuppliersData();
      const suppliersPhoneMap = new Map<string, { telefone: string; endereco?: string }>();

      suppliersData.forEach(s => {
        if (s.fornecedor && s.telefone) {
          suppliersPhoneMap.set(s.fornecedor, {
            telefone: s.telefone,
            endereco: s.endereco || null
          });
        }
      });

      console.log(`Carregados ${suppliersPhoneMap.size} fornecedores da aba FORNECEDORES`);

      const productIdsInSheet = new Set<number>();
      const supplierNamesInSheet = new Set<string>();

      for (const sheetDate of sortedDates) {
        const isToday = sheetDate === todaySheet;
        this.logger.debug(`${isToday ? '⭐ ' : ''}Processando aba: ${sheetDate}${isToday ? ' (DIA ATUAL)' : ''}`);

        const sheetData = await this.getSheetData(sheetDate);
        this.logger.debug(`Encontrados ${sheetData.length} produtos na aba ${sheetDate}`);

        for (const row of sheetData) {
          try {
            const result = await this.processProductRow(row, sheetDate, suppliersPhoneMap);

            if (result) {
              productIdsInSheet.add(result.productId);
              this.logger.debug(`Rastreando produto ID: ${result.productId} - ${row.modelo} (aba: ${sheetDate})`);

              if (result.isNew) {
                added++;
              } else {
                updated++;
              }
            }

            if (row.fornecedor) {
              supplierNamesInSheet.add(row.fornecedor);
            }
          } catch (error) {
            this.logger.error(`Erro ao processar produto ${row.modelo} da aba ${sheetDate}:`, error.message);
            errors++;
          }
        }
      }

      console.log('Verificando produtos obsoletos...');

      if (syncAllDates) {

        const allProducts = await this.productRepository.find();
        const productsToDelete = allProducts.filter(p => !productIdsInSheet.has(p.id));

        console.log(`Total de produtos no banco: ${allProducts.length}`);
        console.log(`Total de produtos processados: ${productIdsInSheet.size}`);
        console.log(`Produtos a deletar: ${productsToDelete.length}`);

        if (productsToDelete.length > 0) {
          console.log(`Removendo ${productsToDelete.length} produtos obsoletos de todas as datas...`);
          for (const product of productsToDelete) {
            await this.productRepository.delete(product.id);
            deleted++;
            this.logger.debug(`Produto removido: ${product.name} (ID: ${product.id})`);
          }
        }
      } else {

        const todayProducts = await this.productRepository.find({
          where: { sheetDate: todaySheet }
        });
        const productsToDelete = todayProducts.filter(p => !productIdsInSheet.has(p.id));

        console.log(`Total de produtos do dia atual no banco: ${todayProducts.length}`);
        console.log(`Total de produtos processados hoje: ${productIdsInSheet.size}`);
        console.log(`Produtos do dia atual a deletar: ${productsToDelete.length}`);

        if (productsToDelete.length > 0) {
          console.log(`Removendo ${productsToDelete.length} produtos obsoletos do dia atual (${todaySheet})...`);
          for (const product of productsToDelete) {
            await this.productRepository.delete(product.id);
            deleted++;
            this.logger.debug(`Produto removido: ${product.name} (ID: ${product.id})`);
          }
        }
      }

      console.log('Verificando fornecedores obsoletos...');
      const allSuppliers = await this.supplierRepository.find({ relations: ['products'] });
      const suppliersToDelete = allSuppliers.filter(s =>
        !supplierNamesInSheet.has(s.name) && (!s.products || s.products.length === 0)
      );

      if (suppliersToDelete.length > 0) {
        console.log(`Removendo ${suppliersToDelete.length} fornecedores obsoletos sem produtos...`);
        for (const supplier of suppliersToDelete) {
          await this.supplierRepository.delete(supplier.id);
          this.logger.debug(`Fornecedor removido: ${supplier.name} (ID: ${supplier.id})`);
        }
      }

      console.log(
        `Sincronização concluída: ${added} adicionados, ${updated} atualizados, ${deleted} removidos, ${errors} erros`,
      );

      const result = {
        added,
        updated,
        deleted,
        errors,
        total: added + updated,
      };

      const hasChanges = added > 0 || updated > 0 || deleted > 0;
      if (hasChanges) {
        console.log('🔄 Detectadas mudanças nos produtos, regenerando cache...');
        try {

          this.cacheService.invalidate();
          console.log('🗑️  Cache em memória invalidado');

          await this.cacheService.generateAndCachePayload();
          console.log('✅ Cache regenerado com sucesso!');
        } catch (error) {
          this.logger.error('❌ Erro ao regenerar cache:', error.message);
        }
      } else {
        console.log('ℹ️ Nenhuma mudança detectada, cache não será regenerado');
      }

      this.syncStatus.lastResult = result;
      this.syncStatus.lastSync = new Date();
      this.syncStatus.isRunning = false;

      return result;
    } catch (error) {
      this.logger.error('Erro na sincronização de produtos:', error);
      this.syncStatus.error = error.message;
      this.syncStatus.isRunning = false;
      throw error;
    }
  }

  getSyncStatus() {
    return {
      ...this.syncStatus,
      lastSync: this.syncStatus.lastSync?.toISOString(),
    };
  }

  private async processProductRow(
    row: any,
    sheetDate: string,
    suppliersPhoneMap: Map<string, { telefone: string; endereco?: string }>
  ): Promise<{ productId: number; isNew: boolean } | null> {

    let supplier = await this.supplierRepository.findOne({
      where: { name: row.fornecedor },
    });

    const supplierData = suppliersPhoneMap.get(row.fornecedor);
    const phoneNumber = supplierData?.telefone || '';
    const address = supplierData?.endereco || undefined;

    if (!supplier) {
      supplier = this.supplierRepository.create({
        name: row.fornecedor,
        whatsappNumber: phoneNumber,
        address: address,
        description: `Fornecedor importado da planilha`,
      });
      supplier = await this.supplierRepository.save(supplier);
      console.log(`Novo fornecedor criado: ${row.fornecedor}${phoneNumber ? ` (Tel: ${phoneNumber})` : ''}${address ? ` - ${address}` : ''}`);
    } else {

      let needsUpdate = false;

      if (phoneNumber && supplier.whatsappNumber !== phoneNumber) {
        supplier.whatsappNumber = phoneNumber;
        needsUpdate = true;
      }

      if (address && supplier.address !== address) {
        supplier.address = address;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await this.supplierRepository.save(supplier);
        console.log(`Dados atualizados para fornecedor: ${row.fornecedor}${phoneNumber ? ` (Tel: ${phoneNumber})` : ''}${address ? ` - ${address}` : ''}`);
      }
    }

    let price = 0;
    if (row.preco) {
      const priceStr = row.preco
        .replace(/R\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .trim();
      price = parseFloat(priceStr) || 0;
    }

    const normalizedRegion = row.regiao?.trim() || null;
    
    const existingProducts = await this.productRepository.find({
      where: {
        name: row.modelo,
        supplierId: supplier.id,
        color: row.cor,
        storage: row.gb,
        region: normalizedRegion,
        sheetDate: sheetDate,
      },
    });

    let product = existingProducts.length > 0 ? existingProducts[0] : null;

    const productData = {
      name: row.modelo,
      description: `${row.categoria} - ${row.gb || 'N/A'} - ${row.cor || 'N/A'}`,
      price,
      category: row.categoria,
      storage: row.gb || null,
      region: row.regiao || null,
      color: row.cor || null,
      supplierId: supplier.id,
      imageUrl: this.getDefaultImageUrl(row.categoria),
      sheetDate,
      sheetTimestamp: row.timestamp || null,
    };

    if (product) {

      if (existingProducts.length > 1) {
        const duplicateIds = existingProducts.slice(1).map(p => p.id);
        this.logger.warn(`⚠️  Encontrados ${existingProducts.length} produtos duplicados (${row.modelo}), removendo ${duplicateIds.length} em batch...`);

        await this.productRepository.delete(duplicateIds);
        console.log(`   🗑️  Deletados ${duplicateIds.length} duplicados: IDs [${duplicateIds.join(', ')}]`);
      }

      await this.productRepository.update(product.id, productData);
      this.logger.debug(`Produto atualizado: ${row.modelo}`);
      return { productId: product.id, isNew: false };
    } else {

      product = this.productRepository.create(productData);
      const savedProduct = await this.productRepository.save(product);
      this.logger.debug(`Novo produto criado: ${row.modelo}`);
      return { productId: savedProduct.id, isNew: true };
    }
  }

  private getDefaultImageUrl(category: string): string {
    const categoryMap: Record<string, string> = {
      'Tecnologia': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      'Casa & Decoração': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      'Moda & Estilo': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    };

    return categoryMap[category] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
  }

  async getSyncStats() {
    const totalProducts = await this.productRepository.count();
    const totalSuppliers = await this.supplierRepository.count();

    return {
      totalProducts,
      totalSuppliers,
      lastSync: new Date().toISOString(),
    };
  }

  async compareSheetWithDatabase(sheetDate: string) {
    try {
      console.log(`🔍 Comparando aba ${sheetDate} com banco de dados...`);

      const sheetData = await this.getSheetData(sheetDate);
      console.log(`📊 Produtos na planilha ATUAL (aba ${sheetDate}): ${sheetData.length}`);

      const validSheetData = sheetData.filter(row => {
        if (!row.preco) return false;
        const priceStr = row.preco
          .replace(/R\$/g, '')
          .replace(/\./g, '')
          .replace(/,/g, '.')
          .trim();
        const price = parseFloat(priceStr) || 0;
        return price > 0;
      });
      console.log(`📊 Produtos VÁLIDOS na planilha (preço > 0): ${validSheetData.length}`);

      const dbProducts = await this.productRepository.find({
        where: { sheetDate },
        relations: ['supplier'],
      });
      console.log(`💾 Produtos no banco (${sheetDate}): ${dbProducts.length}`);

      const sheetMap = new Map<string, any>();
      const dbMap = new Map<string, any>();

      validSheetData.forEach(row => {
        const region = row.regiao?.trim() || '';
        const key = `${row.modelo}|${row.fornecedor}|${row.cor || ''}|${row.gb || ''}|${region}`.toLowerCase();
        sheetMap.set(key, row);
      });

      dbProducts.forEach(product => {
        const region = product.region?.trim() || '';
        const key = `${product.name}|${product.supplier?.name}|${product.color || ''}|${product.storage || ''}|${region}`.toLowerCase();
        dbMap.set(key, product);
      });

      const missingInDb: any[] = [];
      for (const [key, row] of sheetMap) {
        if (!dbMap.has(key)) {
          missingInDb.push({
            modelo: row.modelo,
            fornecedor: row.fornecedor,
            cor: row.cor,
            gb: row.gb,
            preco: row.preco,
            categoria: row.categoria,
          });
        }
      }

      const missingInSheet: any[] = [];
      for (const [key, product] of dbMap) {
        if (!sheetMap.has(key)) {
          missingInSheet.push({
            id: product.id,
            name: product.name,
            supplier: product.supplier?.name,
            color: product.color,
            storage: product.storage,
            price: product.price,
          });
        }
      }

      const failureReasons: any[] = [];
      for (const row of missingInDb) {
        const reasons: string[] = [];

        if (!row.preco || row.preco === 'R$ 0,00' || row.preco === '0') {
          reasons.push('preço inválido ou zero');
        }

        if (!row.modelo || row.modelo.trim() === '') {
          reasons.push('modelo vazio');
        }
        if (!row.fornecedor || row.fornecedor.trim() === '') {
          reasons.push('fornecedor vazio');
        }

        if (reasons.length > 0) {
          failureReasons.push({
            produto: row.modelo,
            motivos: reasons,
          });
        }
      }

      console.log(`❌ Produtos faltando no banco: ${missingInDb.length}`);
      console.log(`⚠️  Produtos no banco mas não na planilha: ${missingInSheet.length}`);

      return {
        sheetDate,
        summary: {
          totalInSheet: sheetData.length,
          totalValidInSheet: validSheetData.length,
          totalInDatabase: dbProducts.length,
          missingInDatabaseCount: missingInDb.length,
          missingInSheetCount: missingInSheet.length,
          expectedInDatabase: validSheetData.length,
          difference: validSheetData.length - dbProducts.length,
          matchRate: ((dbProducts.length / validSheetData.length) * 100).toFixed(2) + '%',
        },
        missingInDatabase: missingInDb.slice(0, 50),
        missingInSheet: missingInSheet.slice(0, 20),
        failureReasons: failureReasons.slice(0, 30),
        analysis: {
          likelyIssues: [
            failureReasons.length > 0 ? `${failureReasons.length} produtos com dados inválidos` : null,
            missingInDb.length > 0 ? `${missingInDb.length} produtos não foram importados` : null,
          ].filter(Boolean),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao comparar Sheets com banco:`, error);
      throw error;
    }
  }

  async findDuplicatesInSheet(sheetDate: string) {
    try {
      console.log(`🔍 Buscando duplicatas na planilha (aba ${sheetDate})...`);

      const sheetData = await this.getSheetData(sheetDate);
      console.log(`📊 Total de linhas na planilha: ${sheetData.length}`);

      const productCounts = new Map<string, { count: number; rows: any[]; lineNumbers: number[] }>();

      for (let i = 0; i < sheetData.length; i++) {
        const row = sheetData[i];

        if (!row.preco) continue;
        const priceStr = row.preco
          .replace(/R\$/g, '')
          .replace(/\./g, '')
          .replace(/,/g, '.')
          .trim();
        const price = parseFloat(priceStr) || 0;
        if (price <= 0) continue;

        const key = `${row.modelo}|${row.fornecedor}|${row.cor}|${row.gb}|${row.regiao || ''}`.toLowerCase();
        
        if (!productCounts.has(key)) {
          productCounts.set(key, { count: 0, rows: [], lineNumbers: [] });
        }
        
        const entry = productCounts.get(key)!;
        entry.count++;
        entry.rows.push(row);
        entry.lineNumbers.push(i + 2);
      }

      const duplicates: any[] = [];
      let totalDuplicateLines = 0;

      for (const [key, data] of productCounts) {
        if (data.count > 1) {
          const [modelo, fornecedor, cor, gb] = key.split('|');
          duplicates.push({
            modelo: data.rows[0].modelo,
            fornecedor: data.rows[0].fornecedor,
            cor: data.rows[0].cor || null,
            gb: data.rows[0].gb || null,
            categoria: data.rows[0].categoria,
            occurrences: data.count,
            lineNumbers: data.lineNumbers,
            prices: data.rows.map(r => r.preco),
            timestamps: data.rows.map(r => r.timestamp || null),
          });
          totalDuplicateLines += (data.count - 1);
        }
      }

      duplicates.sort((a, b) => b.occurrences - a.occurrences);

      console.log(`🔄 Encontradas ${duplicates.length} produtos duplicados`);
      console.log(`📋 Total de linhas duplicadas (extras): ${totalDuplicateLines}`);

      return {
        sheetDate,
        summary: {
          totalRows: sheetData.length,
          uniqueProducts: productCounts.size,
          duplicatedProducts: duplicates.length,
          totalDuplicateLines: totalDuplicateLines,
          efficiency: ((productCounts.size / sheetData.length) * 100).toFixed(2) + '%',
        },
        duplicates: duplicates,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar duplicatas:`, error);
      throw error;
    }
  }
}
