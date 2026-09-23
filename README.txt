ConectaShop — Cliente

Cliente desenvolvido pela equipe C01 para o Laboratório de Interoperabilidade REST e gRPC do projeto ConectaShop.

Neste momento, este projeto contém a implementação do cliente REST em Python. O cliente gRPC será desenvolvido separadamente pela equipe responsável por essa implementação.

1. Tecnologias utilizadas
Python 3.12.10
Biblioteca requests
Ambiente virtual Python (venv)
Protocolo REST/HTTP
Formato de dados JSON
2. Estrutura do projeto
Conectashop_cliente/
│
├── .venv/
├── rest_cliente.py
├── test_server.py
└── logs.txt
Arquivos
rest_cliente.py — cliente responsável pelas requisições REST e execução dos testes R1–R5.
test_server.py — servidor local utilizado para validar o cliente durante o desenvolvimento.
logs.txt — registro das execuções dos testes REST.
.venv/ — ambiente virtual utilizado para as dependências do projeto.
3. Instalação

Criar o ambiente virtual:

python -m venv .venv

Ativar o ambiente virtual no Windows:

.venv\Scripts\activate

Instalar a dependência:

pip install requests
4. Configuração

O endereço do servidor REST não é fixado diretamente no código.

A variável de ambiente REST_BASE_URL deve ser configurada antes da execução.

Exemplo:

set REST_BASE_URL=http://localhost:8000

Para verificar a configuração:

echo %REST_BASE_URL%

O cliente utiliza essa variável para determinar o servidor REST de destino.

5. Execução

Com o servidor REST disponível, executar:

python rest_cliente.py

Durante a execução, o cliente realiza os testes definidos pelo contrato REST:

R1 — consulta do produto KB-100
R2 — consulta do produto inexistente XX-999
R3 — cálculo de cotação com KB-100 e MS-200
R4 — cálculo de cotação com MN-400
R5 — tentativa de cotação com produto inexistente

Cada requisição utiliza um X-Request-ID único.

O cliente também verifica se o X-Request-ID recebido na resposta corresponde ao identificador enviado na requisição.

6. Testes REST

Os testes implementados seguem os casos definidos no contrato do ConectaShop.

Teste	Operação	Resultado esperado
R1	GET /api/v1/products/KB-100	HTTP 200
R2	GET /api/v1/products/XX-999	HTTP 404 / PRODUCT_NOT_FOUND
R3	POST /api/v1/quotes	HTTP 200
R4	POST /api/v1/quotes	HTTP 200
R5	POST /api/v1/quotes	HTTP 422 / INVALID_PRODUCT

Os testes locais R1–R5 foram executados com sucesso.

7. Headers

As requisições REST utilizam os headers obrigatórios definidos pelo contrato:

X-Client-Team: C01
X-Request-ID: <UUID>
Content-Type: application/json

O cliente gera um novo UUID para cada requisição.

Também é verificado se o servidor retorna o mesmo X-Request-ID, permitindo a correlação entre requisição e resposta.

8. Logs

As execuções são registradas no arquivo:

logs.txt

Cada registro contém:

timestamp
protocol
client
server
requestId
operation
target
status
durationMs
result

Exemplo:

timestamp=2026-09-16T20:41:24 | protocol=REST | client=C01 | server=localhost:8000 | requestId=d9137f41-d877-4363-a6c2-6d1d0cc43d1b | operation=POST | target=/api/v1/quotes | status=422 | durationMs=2019.58 | result=PASS
9. Observação sobre o servidor de teste

O arquivo test_server.py foi utilizado apenas durante o desenvolvimento e validação local do cliente.

Ele não representa a implementação definitiva do servidor REST do projeto.

Durante a etapa de integração, o cliente deverá utilizar os servidores REST fornecidos pelas demais equipes, configurando a variável REST_BASE_URL conforme o endereço recebido.

10. Equipe

Equipe: C01

Implementação: Cliente REST em Python.

#
#
#
#
#
#

# Cliente gRPC - ConectaShop

Este projeto contém o desenvolvimento do Cliente gRPC para o cenário do ConectaShop, focado em consumir o serviço `ShippingService`.

## Pré-requisitos
- [Node.js](https://nodejs.org/en/) (versão 18+ recomendada)
- NPM (incluso no Node.js)

## Instalação
Na pasta do projeto, instale as dependências:
```bash
npm install
```

## Como configurar e executar

Você pode apontar o cliente para qualquer servidor configurando a variável de ambiente `GRPC_TARGET`. Caso não informada, o padrão será `localhost:50051`. Opcionalmente, pode configurar o `CLIENT_TEAM` (padrão: `C01`).

```bash
# Executar apontando para um servidor específico
GRPC_TARGET=host:porta node client.js

# Exemplo contra um ambiente local
GRPC_TARGET=localhost:50051 node client.js
```

Se desejar testar com um mock local:
1. Em um terminal, inicie o servidor:
```bash
node server.js
```
2. Em outro terminal, execute os testes com o cliente:
```bash
node client.js
```