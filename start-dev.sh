#!/bin/bash
# ─── Ulvior — Levantar los 3 servicios en desarrollo ─────────────────────────
# Uso: ./start-dev.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🛑  Deteniendo procesos anteriores..."
pkill -f "next dev"     2>/dev/null
pkill -f "nest start"   2>/dev/null
pkill -f "uvicorn"      2>/dev/null
sleep 1

echo ""
echo "🚀  Levantando ulvior-api  (puerto 3000)..."
cd "$ROOT/ulvior-api"
nohup npm run start:dev > /tmp/ulvior-api.log 2>&1 &
echo "   PID: $!"

echo "🚀  Levantando ulvior-ai   (puerto 8000)..."
cd "$ROOT/ulvior-ai"
nohup venv/bin/python -m uvicorn main:app --reload --port 8000 > /tmp/ulvior-ai.log 2>&1 &
echo "   PID: $!"

echo "🚀  Levantando ulvior-web  (puerto 5173)..."
cd "$ROOT/ulvior-web"
nohup npm run dev > /tmp/ulvior-web.log 2>&1 &
echo "   PID: $!"

echo ""
echo "⏳  Esperando arranque (12s)..."
sleep 12

echo ""
echo "─────────────────────────────────────────────────"
echo "  ESTADO DE SERVICIOS"
echo "─────────────────────────────────────────────────"

# Web
WEB=$(grep -E "Ready|Error" /tmp/ulvior-web.log 2>/dev/null | tail -1)
echo "  ulvior-web  → ${WEB:-verificar /tmp/ulvior-web.log}"

# API
API=$(grep -E "successfully started|Listening|ERROR" /tmp/ulvior-api.log 2>/dev/null | tail -1)
echo "  ulvior-api  → ${API:-verificar /tmp/ulvior-api.log}"

# AI
AI=$(grep -E "startup complete|Uvicorn running|ERROR" /tmp/ulvior-ai.log 2>/dev/null | tail -1)
echo "  ulvior-ai   → ${AI:-verificar /tmp/ulvior-ai.log}"

echo "─────────────────────────────────────────────────"
echo ""
echo "  Logs en tiempo real:"
echo "    tail -f /tmp/ulvior-web.log"
echo "    tail -f /tmp/ulvior-api.log"
echo "    tail -f /tmp/ulvior-ai.log"
