#!/bin/bash
# ─── Ulvior — Cambio de entorno ──────────────────────────────────────────────
# Uso: ./switch-env.sh prod | uat

ENV=${1:-uat}

if [[ "$ENV" != "prod" && "$ENV" != "uat" ]]; then
  echo "❌  Entorno inválido. Usa: prod | uat"
  exit 1
fi

echo "🔄  Cambiando a entorno: $ENV"

# ulvior-api
if [ -f "ulvior-api/.env.$ENV" ]; then
  cp "ulvior-api/.env.$ENV" "ulvior-api/.env"
  echo "✅  ulvior-api  → .env.$ENV"
else
  echo "⚠️   ulvior-api  → .env.$ENV no encontrado"
fi

# ulvior-ai
if [ -f "ulvior-ai/.env.$ENV" ]; then
  cp "ulvior-ai/.env.$ENV" "ulvior-ai/.env"
  echo "✅  ulvior-ai   → .env.$ENV"
else
  echo "⚠️   ulvior-ai   → .env.$ENV no encontrado"
fi

# ulvior-web (solo tiene .env.local, no cambia entre entornos locales)
echo "ℹ️   ulvior-web  → sin cambios (NEXT_PUBLIC_API_URL fijo en localhost:3000)"

echo ""
echo "✅  Listo. Reinicia los servicios para aplicar: ./start-dev.sh"
