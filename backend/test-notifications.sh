#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHNpc3RlbWEuY29tIiwic3ViIjoxLCJpc0FkbWluIjp0cnVlLCJuYW1lIjoiQWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NDUwNTY3MiwiZXhwIjoxNzY0NTkyMDcyfQ.0wDp6H93JxutByYv6PMV8v8MsF7GTNesM1UFaaFg_bo"
PHONE="5585998186858"

echo "✅ Teste 1/7: 5 dias antes..."
curl -s -X POST http://localhost:3000/notifications/whatsapp/test-expiring \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"daysRemaining\": 5}" && echo " ✓"

sleep 2

echo "✅ Teste 2/7: 3 dias antes..."
curl -s -X POST http://localhost:3000/notifications/whatsapp/test-expiring \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"daysRemaining\": 3}" && echo " ✓"

sleep 2

echo "✅ Teste 3/7: 2 dias antes..."
curl -s -X POST http://localhost:3000/notifications/whatsapp/test-expiring \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"daysRemaining\": 2}" && echo " ✓"

sleep 2

echo "✅ Teste 4/7: 1 dia antes..."
curl -s -X POST http://localhost:3000/notifications/whatsapp/test-expiring \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"daysRemaining\": 1}" && echo " ✓"

sleep 2

echo "✅ Teste 5/7: Vence HOJE..."
curl -s -X POST http://localhost:3000/notifications/whatsapp/test-expiring \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"daysRemaining\": 0}" && echo " ✓"

sleep 2

echo "✅ Teste 6/7: Assinatura vencida..."
curl -s -X POST http://localhost:3000/notifications/whatsapp/test-expired \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\"}" && echo " ✓"

sleep 2

echo "✅ Teste 7/7: Teste expirado (3h)..."
curl -s -X POST http://localhost:3000/notifications/whatsapp/test-tester-expired \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\"}" && echo " ✓"

echo ""
echo "🎉 Todos os 7 testes concluídos!"
echo "📱 Verifique o WhatsApp: $PHONE"
