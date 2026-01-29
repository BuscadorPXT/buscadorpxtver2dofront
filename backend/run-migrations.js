#!/usr/bin/env node
/**
 * Script para executar migrations SQL no PostgreSQL
 * Executa todos os arquivos .sql na pasta migrations/ em ordem alfabética
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'pxt',
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Criar tabela de controle de migrations se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela de controle de migrations criada');

    // Ler todos os arquivos .sql da pasta migrations
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ordem alfabética/numérica

    console.log(`📁 Encontradas ${files.length} migrations`);

    for (const file of files) {
      // Verificar se já foi executada
      const result = await client.query(
        'SELECT id FROM migrations WHERE filename = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Pulando ${file} (já executada)`);
        continue;
      }

      console.log(`🔄 Executando ${file}...`);
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        console.log(`✅ ${file} executada com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao executar ${file}:`, error.message);
        // Continuar com as próximas migrations
      }
    }

    console.log('🎉 Todas as migrations foram processadas!');
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
