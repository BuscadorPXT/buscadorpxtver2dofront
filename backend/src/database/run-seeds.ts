import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from './seeds/database.seeder';

async function runSeeds() {
  console.log('🚀 Executando seeds...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    
    const seeder = new DatabaseSeeder(dataSource);
    await seeder.run();
    
    await app.close();
    console.log('🎉 Seeds executados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    process.exit(1);
  }
}

runSeeds();