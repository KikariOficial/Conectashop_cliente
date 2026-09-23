#!/bin/bash

# Testes com delays diferentes para medir o tempo do pedido

echo "--- Teste sem delay ---"
time curl -s -X POST http://localhost:3000/pedidos \
    -H "Content-Type: application/json" \
    -H "x-correlation-id: teste-0s" \
    -d '{"produto_id": 1, "quantidade": 2}'
echo -e "\n"

echo "--- Teste com delay de 1 segundo (1000ms) ---"
time curl -s -X POST http://localhost:3000/pedidos \
    -H "Content-Type: application/json" \
    -H "x-correlation-id: teste-1s" \
    -H "x-delay: 1000" \
    -d '{"produto_id": 2, "quantidade": 1}'
echo -e "\n"

echo "--- Teste com delay de 2 segundos (2000ms) ---"
time curl -s -X POST http://localhost:3000/pedidos \
    -H "Content-Type: application/json" \
    -H "x-correlation-id: teste-2s" \
    -H "x-delay: 2000" \
    -d '{"produto_id": 3, "quantidade": 3}'
echo -e "\n"

echo "--- Teste com delay de 5 segundos (5000ms) - Deve gerar Timeout (503) ---"
time curl -s -X POST http://localhost:3000/pedidos \
    -H "Content-Type: application/json" \
    -H "x-correlation-id: teste-5s" \
    -H "x-delay: 5000" \
    -d '{"produto_id": 1, "quantidade": 1}'
echo -e "\n"
