const express = require('express');
const app = express();

app.use(express.json());

const produtos = [
    { id: 1, nome: "Notebook", quantidade: 10, preco: 2500.00 },
    { id: 2, nome: "Mouse", quantidade: 50, preco: 60.00 },
    { id: 3, nome: "Teclado", quantidade: 30, preco: 120.00 }
];

// 7. Crie GET /produtos/{id} no Serviço de Estoque.
// 8. Inclua um campo preco no produto e devolva-o na consulta.
app.get('/produtos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const correlationId = req.headers['x-correlation-id'];
    const delayStr = req.query.delay || req.headers['x-delay'] || '0';
    const delay = parseInt(delayStr);

    console.log(`[Estoque] Consultando produto ${id} | Correlation ID: ${correlationId}`);

    setTimeout(() => {
        const produto = produtos.find(p => p.id === id);
        if (produto) {
            res.json(produto);
        } else {
            res.status(404).json({ erro: "Produto não encontrado" });
        }
    }, delay);
});

const PORT = 5001;
app.listen(PORT, "172.16.16.204", () => {
    console.log(`Serviço de Estoque rodando na porta ${PORT}`);
});
