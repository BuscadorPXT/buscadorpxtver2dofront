import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { PlansSeeder } from './plans.seeder';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) { }

  async run() {
    console.log('🌱 Iniciando seeds do banco de dados...');

    const userCount = await this.dataSource.getRepository(User).count();
    if (userCount > 0) {
      console.log('📊 Banco já possui dados. Pulando seeds...');
      return;
    }

    await this.seedPlans();
    await this.seedUsers();
    await this.seedSuppliers();
    await this.seedProducts();

    console.log('✅ Seeds executados com sucesso!');
  }

  private async seedPlans() {
    const plansSeeder = new PlansSeeder(this.dataSource);
    await plansSeeder.run();
  }

  private async seedUsers() {
    console.log('👤 Criando usuários...');

    const userRepository = this.dataSource.getRepository(User);

    const adminUser = userRepository.create({
      name: 'Administrador',
      email: 'admin@sistema.com',
      password: await bcrypt.hash('admin123', 10),
      isApproved: true,
      isAdmin: true,
    });

    const testUser = userRepository.create({
      name: 'João Silva',
      email: 'joao@teste.com',
      password: await bcrypt.hash('123456', 10),
      isApproved: true,
      isAdmin: false,
    });

    await userRepository.save([adminUser, testUser]);
    console.log('✅ Usuários criados: admin@sistema.com e joao@teste.com');
  }

  private async seedSuppliers() {
    console.log('🏢 Criando fornecedores...');

    const supplierRepository = this.dataSource.getRepository(Supplier);

    const suppliers = [
      {
        name: 'TechSupply Brasil',
        whatsappNumber: '5511999887766',
        description: 'Especializada em produtos eletrônicos e tecnologia'
      },
      {
        name: 'Casa & Decoração Ltda',
        whatsappNumber: '5511888776655',
        description: 'Móveis e decoração para sua casa'
      },
      {
        name: 'Moda & Estilo',
        whatsappNumber: '5511777665544',
        description: 'Roupas e acessórios da moda'
      }
    ];

    for (const supplierData of suppliers) {
      const supplier = supplierRepository.create(supplierData);
      await supplierRepository.save(supplier);
    }

    console.log('✅ Fornecedores criados com números WhatsApp');
  }

  private async seedProducts() {
    console.log('📱 Criando produtos...');

    const productRepository = this.dataSource.getRepository(Product);
    const supplierRepository = this.dataSource.getRepository(Supplier);

    const techSupply = await supplierRepository.findOne({ where: { name: 'TechSupply Brasil' } });
    const casaDecoracao = await supplierRepository.findOne({ where: { name: 'Casa & Decoração Ltda' } });
    const modaEstilo = await supplierRepository.findOne({ where: { name: 'Moda & Estilo' } });

    const products = [

      {
        name: 'Smartphone Samsung Galaxy S24',
        description: 'Smartphone Android com 128GB de armazenamento, câmera tripla de 50MP e tela AMOLED de 6.1 polegadas.',
        price: 2899.99,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        storage: '128GB',
        color: 'Azul',
        category: 'Tecnologia',
        region: 'Norte',
        supplierId: techSupply?.id
      },
      {
        name: 'iPhone 15 Pro',
        description: 'iPhone com chip A17 Pro, sistema de câmera Pro avançado e design em titânio.',
        price: 7499.99,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        storage: '256GB',
        color: 'Preto',
        category: 'Tecnologia',
        region: 'Norte',
        supplierId: techSupply?.id
      },
      {
        name: 'Notebook Dell Inspiron 15',
        description: 'Notebook com processador Intel Core i5, 8GB RAM, SSD 256GB e tela de 15.6 polegadas Full HD.',
        price: 3499.99,
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        storage: '512GB',
        color: 'Branco',
        category: 'Tecnologia',
        region: 'Norte',
        supplierId: techSupply?.id
      },
      {
        name: 'MacBook Air M2',
        description: 'MacBook Air com chip M2, 8GB de memória unificada e SSD de 256GB.',
        price: 8999.99,
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        storage: '256GB',
        color: 'Branco',
        category: 'Tecnologia',
        region: 'Norte',
        supplierId: techSupply?.id
      },
      {
        name: 'Tablet iPad Air',
        description: 'iPad Air com tela Liquid Retina de 10,9 polegadas e chip M1.',
        price: 4299.99,
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        storage: '64GB',
        color: 'Verde',
        category: 'Tecnologia',
        region: 'Norte',
        supplierId: techSupply?.id
      },

      {
        name: 'Sofá 3 Lugares Retrátil',
        description: 'Sofá confortável com 3 lugares, retrátil e reclinável, tecido suede.',
        price: 1899.99,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        storage: undefined,
        color: 'Verde',
        category: 'Casa & Decoração',
        region: 'Sul',
        supplierId: casaDecoracao?.id
      },
      {
        name: 'Mesa de Jantar 6 Lugares',
        description: 'Mesa de jantar em madeira maciça com capacidade para 6 pessoas, acabamento natural.',
        price: 1299.99,
        imageUrl: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=400',
        storage: undefined,
        color: 'Branco',
        category: 'Casa & Decoração',
        region: 'Sul',
        supplierId: casaDecoracao?.id
      },
      {
        name: 'Guarda-Roupa 3 Portas',
        description: 'Guarda-roupa espaçoso com 3 portas de correr, espelho e gavetas internas.',
        price: 899.99,
        imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
        storage: undefined,
        color: 'Preto',
        category: 'Casa & Decoração',
        region: 'Sul',
        supplierId: casaDecoracao?.id
      },
      {
        name: 'Cama Box Casal',
        description: 'Cama box casal com colchão de molas ensacadas e base de madeira.',
        price: 1599.99,
        imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400',
        storage: undefined,
        color: 'Branco',
        category: 'Casa & Decoração',
        region: 'Sul',
        supplierId: casaDecoracao?.id
      },
      {
        name: 'Rack para TV 65"',
        description: 'Rack moderno para TV até 65 polegadas com prateleiras e gavetas.',
        price: 699.99,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        storage: undefined,
        color: 'Preto',
        category: 'Casa & Decoração',
        region: 'Sul',
        supplierId: casaDecoracao?.id
      },

      {
        name: 'Jaqueta de Couro Masculina',
        description: 'Jaqueta de couro sintético, estilo casual urbano, tamanhos P ao GG.',
        price: 299.99,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        storage: undefined,
        color: 'Preto',
        category: 'Moda & Estilo',
        region: 'Centro',
        supplierId: modaEstilo?.id
      },
      {
        name: 'Tênis Esportivo Nike Air',
        description: 'Tênis para corrida e caminhada, tecnologia Air, solado antiderrapante.',
        price: 399.99,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        storage: undefined,
        color: 'Branco',
        category: 'Moda & Estilo',
        region: 'Centro',
        supplierId: modaEstilo?.id
      },
      {
        name: 'Vestido Longo Feminino',
        description: 'Vestido longo em tecido fluido, ideal para ocasiões especiais.',
        price: 189.99,
        imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
        storage: undefined,
        color: 'Azul',
        category: 'Moda & Estilo',
        region: 'Centro',
        supplierId: modaEstilo?.id
      },
      {
        name: 'Relógio Smartwatch',
        description: 'Smartwatch com monitor cardíaco, GPS e resistência à água.',
        price: 899.99,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        storage: '32GB',
        color: 'Preto',
        category: 'Moda & Estilo',
        region: 'Centro',
        supplierId: modaEstilo?.id
      },
      {
        name: 'Óculos de Sol Ray-Ban',
        description: 'Óculos de sol clássico com proteção UV400 e armação resistente.',
        price: 459.99,
        imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
        storage: undefined,
        color: 'Preto',
        category: 'Moda & Estilo',
        region: 'Centro',
        supplierId: modaEstilo?.id
      },
      {
        name: 'Bolsa Feminina de Couro',
        description: 'Bolsa feminina em couro legítimo com compartimentos internos.',
        price: 249.99,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        storage: undefined,
        color: 'Vermelho',
        category: 'Moda & Estilo',
        region: 'Centro',
        supplierId: modaEstilo?.id
      }
    ];

    for (const productData of products) {
      const product = productRepository.create(productData);
      await productRepository.save(product);
    }

    console.log('✅ 16 produtos criados com dados completos (storage, cor, categoria, região)');
  }
}