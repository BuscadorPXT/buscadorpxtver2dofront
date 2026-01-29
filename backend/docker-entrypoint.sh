#!/bin/sh
set -e

: "${WAIT_FOR_MS:=0}"
if [ "$WAIT_FOR_MS" -gt 0 ]; then
  echo "Waiting ${WAIT_FOR_MS}ms before start..."
  sleep "$(echo "$WAIT_FOR_MS / 1000" | bc -l)"
fi

# Executar migrations SQL
echo "🔄 Executando migrations SQL..."
node run-migrations.js || {
  echo "❌ Erro ao executar migrations"; exit 1;
}
echo "✅ Migrations concluídas"

# Sincronizar usuários com subscriptions ativas (apenas se houver subscriptions)
echo "🔄 Sincronizando usuários com subscriptions ativas..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" -f sync-subscriptions-to-plans.sql 2>/dev/null || {
  echo "⚠️  Sync de subscriptions falhou ou não necessário (isso é normal se não houver subscriptions ativas)"
}

if [ "${SEED_ON_FIRST_DEPLOY}" = "true" ]; then
  echo "Running seed (SEED_ON_FIRST_DEPLOY=true)..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm run seed || {
      echo "Seed failed"; exit 1;
    }
  else
    node dist/database/run-seeds.js || {
      echo "Seed failed"; exit 1;
    }
  fi
  echo "Seed completed."
fi

exec "$@"
