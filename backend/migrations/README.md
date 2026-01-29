# Database Migrations

Este diretório contém as migrations SQL para o banco de dados.

## Como Executar

### Usando psql (PostgreSQL CLI)

```bash
# Conectar ao banco de dados
psql -U seu_usuario -d seu_banco -f migrations/001_add_sheet_date_to_products.sql
```

### Usando pgAdmin ou outro cliente

1. Abra o arquivo SQL
2. Execute o script no banco de dados

## Migrations Disponíveis

### 001_add_sheet_date_to_products.sql
- **Descrição**: Adiciona a coluna `sheetDate` à tabela `products`
- **Objetivo**: Armazenar a referência da aba da planilha (formato DD-MM) para cada produto
- **Impacto**: 
  - Adiciona coluna nullable
  - Cria índice para otimização de queries
  - Produtos existentes terão `sheetDate = NULL` até a próxima sincronização

## Notas Importantes

- A coluna `sheetDate` é nullable para permitir produtos existentes
- Após executar a migration, execute uma sincronização manual para popular os dados
- O sistema continuará funcionando mesmo com valores NULL, mas o filtro de data só mostrará produtos com `sheetDate` definido
