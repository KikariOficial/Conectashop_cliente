from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class ServidorTeste(BaseHTTPRequestHandler):

    def do_GET(self):

        request_id = self.headers.get("X-Request-ID")

        if self.path == "/api/v1/products/KB-100":

            produto = {
                "sku": "KB-100",
                "name": "Teclado Mecânico",
                "unitPriceCents": 25990
            }

            resposta = json.dumps(produto).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("X-Request-ID", request_id)
            self.end_headers()

            self.wfile.write(resposta)

        elif self.path == "/api/v1/products/XX-999":

            erro = {
                "code": "PRODUCT_NOT_FOUND",
                "message": "Produto não encontrado",
                "requestId": request_id
            }

            resposta = json.dumps(erro).encode("utf-8")

            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("X-Request-ID", request_id)
            self.end_headers()

            self.wfile.write(resposta)

    def do_POST(self):

        if self.path == "/api/v1/quotes":

            tamanho = int(self.headers.get("Content-Length"))

            dados = self.rfile.read(tamanho)

            pedido = json.loads(dados)

            print("Dados recebidos:", pedido)

            # R3
            if pedido["items"] == [
                {"sku": "KB-100", "quantity": 2},
                {"sku": "MS-200", "quantity": 1}
            ]:

                resposta = {
                    "subtotalCents": 64970,
                    "discountPercent": 5,
                    "discountCents": 3248,
                    "totalCents": 61722
                }

                resposta_json = json.dumps(resposta).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header(
                    "X-Request-ID",
                    self.headers.get("X-Request-ID")
                )
                self.end_headers()

                self.wfile.write(resposta_json)

            # R4
            elif pedido["items"] == [
                {"sku": "MN-400", "quantity": 1}
            ]:

                resposta = {
                    "subtotalCents": 119990,
                    "discountPercent": 10,
                    "discountCents": 11999,
                    "totalCents": 107991
                }

                resposta_json = json.dumps(resposta).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header(
                    "X-Request-ID",
                    self.headers.get("X-Request-ID")
                )
                self.end_headers()

                self.wfile.write(resposta_json)

            # R5
            elif pedido["items"] == [
                {"sku": "XX-999", "quantity": 1}
            ]:

                erro = {
                    "code": "INVALID_PRODUCT",
                    "message": "Produto inválido",
                    "requestId": self.headers.get("X-Request-ID")
                }

                resposta_json = json.dumps(erro).encode("utf-8")

                self.send_response(422)
                self.send_header("Content-Type", "application/json")
                self.send_header(
                    "X-Request-ID",
                    self.headers.get("X-Request-ID")
                )
                self.end_headers()

                self.wfile.write(resposta_json)


servidor = HTTPServer(("localhost", 8000), ServidorTeste)

print("Servidor de teste iniciado em http://localhost:8000")

servidor.serve_forever()