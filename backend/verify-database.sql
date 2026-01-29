-- Script de verificação da estrutura do banco de dados
-- Execute este script no banco de produção para verificar inconsistências

-- 1. Verificar estrutura da tabela user_sessions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;
"id"	"uuid"	"NO"	"uuid_generate_v4()"
"userId"	"integer"	"NO"	
"ipAddress"	"character varying"	"NO"	
"userAgent"	"text"	"YES"	
"lastActivityAt"	"timestamp without time zone"	"NO"	"now()"
"createdAt"	"timestamp without time zone"	"NO"	"now()"
"updatedAt"	"timestamp without time zone"	"NO"	"now()"


-- 2. Verificar se a tabela page_views existe (NÃO deveria existir)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'page_views'
) as page_views_exists;

false

-- 3. Verificar índices da tabela user_sessions
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_sessions';
"PK_e93e031a5fed190d4789b6bfd83"	"CREATE UNIQUE INDEX ""PK_e93e031a5fed190d4789b6bfd83"" ON public.user_sessions USING btree (id)"
"IDX_55fa4db8406ed66bc704432842"	"CREATE INDEX ""IDX_55fa4db8406ed66bc704432842"" ON public.user_sessions USING btree (""userId"")"
"IDX_2904024eefc78b5832daff179b"	"CREATE INDEX ""IDX_2904024eefc78b5832daff179b"" ON public.user_sessions USING btree (""ipAddress"")"
"IDX_1f04707a77dae48b72dffd2c89"	"CREATE INDEX ""IDX_1f04707a77dae48b72dffd2c89"" ON public.user_sessions USING btree (""lastActivityAt"")"
"IDX_2ae8bc486835d68ae74ba4488a"	"CREATE UNIQUE INDEX ""IDX_2ae8bc486835d68ae74ba4488a"" ON public.user_sessions USING btree (""userId"", ""ipAddress"")"


-- 4. Verificar foreign keys da tabela user_sessions
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='user_sessions';

  "FK_55fa4db8406ed66bc7044328427"	"user_sessions"	"userId"	"users"	"id"

-- 5. Testar query do analytics.service.ts
-- Esta query NÃO deve dar erro
SELECT 
  COUNT(DISTINCT session."userId") as unique_users,
  COUNT(*) as total_sessions
FROM user_sessions session
WHERE session."createdAt" >= NOW() - INTERVAL '30 days';
1	1
-- 6. Verificar se existem campos de geolocalização (NÃO deveriam existir)
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'user_sessions'
  AND column_name IN ('country', 'country_code', 'region', 'city', 'latitude', 'longitude', 'connected_at');
null