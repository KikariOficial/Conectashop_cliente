const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const pedidos = {};
let proximoId = 1;

// 10. Crie GET /pedidos/{id} utilizando uma pequena estrutura em memória.
app.get('/pedidos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const pedido = pedidos[id];
    
    if (pedido) {
        res.json(pedido);
    } else {
        res.status(404).json({ erro: "Pedido não encontrado" });
    }
});

app.post('/pedidos', async (req, res) => {
    const { produto_id, quantidade } = req.body;
    
    // 12. Adicione um correlation-id simples recebido por header e repasse-o ao Estoque.
    const correlationId = req.headers['x-correlation-id'] || `req-${Date.now()}`;
    const delay = req.headers['x-delay'] || '0'; // para testar o timeout

    // 9. Valide que quantidade do pedido seja maior que zero.
    if (!quantidade || quantidade <= 0) {
        return res.status(400).json({ erro: "A quantidade deve ser maior que zero." });
    }

    try {
        console.log(`[Pedidos] Criando pedido para o produto ${produto_id}, qtd: ${quantidade} | Correlation ID: ${correlationId}`);
        
        // Timeout de 3 segundos (3000 ms) para a requisição ao Estoque
        const response = await axios.get(`http://localhost:3001/produtos/${produto_id}`, {
            headers: { 
                'x-correlation-id': correlationId,
                'x-delay': delay
            },
            timeout: 3000
        });

        const produto = response.data;
        const valor_total = produto.preco * quantidade;

        const novoPedido = {
            id: proximoId++,
            produto_id,
            quantidade,
            valor_total,
            status: 'CRIADO'
        };

        pedidos[novoPedido.id] = novoPedido;

        // 11. Retorne Location no header ao criar um pedido.
        res.status(201).header('Location', `/pedidos/${novoPedido.id}`).json(novoPedido);

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error(`[Pedidos] Timeout ao consultar Estoque | Correlation ID: ${correlationId}`);
            return res.status(503).json({ erro: "Serviço de estoque indisponível no momento (timeout)." });
        } else if (error.response && error.response.status === 404) {
            return res.status(404).json({ erro: "Produto não encontrado no estoque." });
        } else {
            console.error(`[Pedidos] Erro ao consultar estoque: ${error.message}`);
            return res.status(500).json({ erro: "Erro interno no servidor." });
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serviço de Pedidos rodando na porta ${PORT}`);
});
