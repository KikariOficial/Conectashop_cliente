import os
import time
import uuid
from datetime import datetime

import requests


REST_BASE_URL = os.getenv("REST_BASE_URL")
LOG_FILE = "logs.txt"


def salvar_log(
    timestamp,
    protocolo,
    cliente,
    servidor,
    request_id,
    operacao,
    target,
    status,
    duration_ms,
    resultado
):

    log = (
        f"timestamp={timestamp} | "
        f"protocol={protocolo} | "
        f"client={cliente} | "
        f"server={servidor} | "
        f"requestId={request_id} | "
        f"operation={operacao} | "
        f"target={target} | "
        f"status={status} | "
        f"durationMs={duration_ms} | "
        f"result={resultado}"
    )

    with open(LOG_FILE, "a", encoding="utf-8") as arquivo:
        arquivo.write(log + "\n")


def executar_requisicao(
    teste,
    metodo,
    endpoint,
    dados,
    status_esperado,
    codigo_esperado=None,
    resposta_esperada=None
):

    request_id = str(uuid.uuid4())

    url = REST_BASE_URL + endpoint

    cliente = "C01"
    servidor = REST_BASE_URL.replace("http://", "").replace("https://", "")

    headers = {
        "X-Client-Team": cliente,
        "X-Request-ID": request_id,
        "Content-Type": "application/json"
    }

    inicio = time.perf_counter()

    try:

        if metodo == "GET":

            response = requests.get(
                url,
                headers=headers
            )

        elif metodo == "POST":

            response = requests.post(
                url,
                headers=headers,
                json=dados
            )

        else:

            print("Método HTTP não suportado.")
            return

        fim = time.perf_counter()

        duration_ms = round((fim - inicio) * 1000, 2)

        resposta = response.json()

        request_id_recebido = response.headers.get("X-Request-ID")

        correlacao_ok = request_id_recebido == request_id

        passou = response.status_code == status_esperado

        if codigo_esperado is not None:
            passou = passou and resposta.get("code") == codigo_esperado

        if resposta_esperada is not None:
            passou = passou and resposta == resposta_esperada

        passou = passou and correlacao_ok

        resultado = "PASS" if passou else "FAIL"

        timestamp = datetime.now().isoformat(timespec="seconds")

        salvar_log(
            timestamp,
            "REST",
            cliente,
            servidor,
            request_id,
            metodo,
            endpoint,
            response.status_code,
            duration_ms,
            resultado
        )

        print()
        print("=" * 50)
        print("Teste:", teste)
        print("Protocolo: REST")
        print("Cliente:", cliente)
        print("Servidor:", servidor)
        print("Operação:", metodo)
        print("Target:", endpoint)
        print("Request ID:", request_id)
        print("Request ID recebido:", request_id_recebido)
        print("Correlação:", "OK" if correlacao_ok else "ERRO")
        print("Status:", response.status_code)
        print("Duração:", duration_ms, "ms")
        print("Resultado:", resultado)
        print("Resposta:", resposta)
        print("=" * 50)

    except requests.exceptions.RequestException as erro:

        fim = time.perf_counter()

        duration_ms = round((fim - inicio) * 1000, 2)

        timestamp = datetime.now().isoformat(timespec="seconds")

        salvar_log(
            timestamp,
            "REST",
            cliente,
            servidor,
            request_id,
            metodo,
            endpoint,
            "CONNECTION_ERROR",
            duration_ms,
            "FAIL"
        )

        print()
        print("=" * 50)
        print("Teste:", teste)
        print("Protocolo: REST")
        print("Cliente:", cliente)
        print("Servidor:", servidor)
        print("Operação:", metodo)
        print("Target:", endpoint)
        print("Request ID:", request_id)
        print("Status: ERRO DE CONEXÃO")
        print("Duração:", duration_ms, "ms")
        print("Resultado: FAIL")
        print("Erro:", erro)
        print("=" * 50)


# ==================================================
# R1
# ==================================================

executar_requisicao(
    teste="R1",
    metodo="GET",
    endpoint="/api/v1/products/KB-100",
    dados=None,
    status_esperado=200,
    resposta_esperada={
        "sku": "KB-100",
        "name": "Teclado Mecânico",
        "unitPriceCents": 25990
    }
)


# ==================================================
# R2
# ==================================================

executar_requisicao(
    teste="R2",
    metodo="GET",
    endpoint="/api/v1/products/XX-999",
    dados=None,
    status_esperado=404,
    codigo_esperado="PRODUCT_NOT_FOUND"
)


# ==================================================
# R3
# ==================================================

executar_requisicao(
    teste="R3",
    metodo="POST",
    endpoint="/api/v1/quotes",
    dados={
        "items": [
            {
                "sku": "KB-100",
                "quantity": 2
            },
            {
                "sku": "MS-200",
                "quantity": 1
            }
        ]
    },
    status_esperado=200,
    resposta_esperada={
        "subtotalCents": 64970,
        "discountPercent": 5,
        "discountCents": 3248,
        "totalCents": 61722
    }
)


# ==================================================
# R4
# ==================================================

executar_requisicao(
    teste="R4",
    metodo="POST",
    endpoint="/api/v1/quotes",
    dados={
        "items": [
            {
                "sku": "MN-400",
                "quantity": 1
            }
        ]
    },
    status_esperado=200,
    resposta_esperada={
        "subtotalCents": 119990,
        "discountPercent": 10,
        "discountCents": 11999,
        "totalCents": 107991
    }
)


# ==================================================
# R5
# ==================================================

executar_requisicao(
    teste="R5",
    metodo="POST",
    endpoint="/api/v1/quotes",
    dados={
        "items": [
            {
                "sku": "XX-999",
                "quantity": 1
            }
        ]
    },
    status_esperado=422,
    codigo_esperado="INVALID_PRODUCT"
)