const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './shipping.proto';
const SERVER_TEAM = 'S02'; // Equipe servidor mock

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const shippingProto = grpc.loadPackageDefinition(packageDefinition).shipping.v1;

function Health(call, callback) {
    callback(null, { status: "SERVING", server_team: SERVER_TEAM });
}

function CalculateShipping(call, callback) {
    const metadata = call.metadata;
    const clientTeam = metadata.get('x-client-team');

    if (!clientTeam || clientTeam.length === 0) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "MISSING_CLIENT_TEAM"
        });
    }

    const req = call.request;

    if (!req.request_id || req.request_id.trim() === '') {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "MISSING_REQUEST_ID"
        });
    }

    if (req.weight_grams < 1 || req.weight_grams > 30000) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "INVALID_WEIGHT"
        });
    }

    if (req.zone === 'SHIPPING_ZONE_UNSPECIFIED' || req.zone === 0) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "INVALID_ZONE"
        });
    }

    if (req.mode === 'SHIPPING_MODE_UNSPECIFIED' || req.mode === 0) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "INVALID_MODE"
        });
    }

    let baseTariff = 0;
    let additional = 0;
    let estimatedDays = 0;

    // Regras de negócio
    if (req.mode === 'STANDARD') {
        additional = 400;
        if (req.zone === 'LOCAL') { baseTariff = 1000; estimatedDays = 2; }
        else if (req.zone === 'REGIONAL') { baseTariff = 1800; estimatedDays = 4; }
        else if (req.zone === 'NATIONAL') { baseTariff = 3000; estimatedDays = 7; }
    } else if (req.mode === 'EXPRESS') {
        additional = 600;
        if (req.zone === 'LOCAL') { baseTariff = 1600; estimatedDays = 1; }
        else if (req.zone === 'REGIONAL') { baseTariff = 2800; estimatedDays = 2; }
        else if (req.zone === 'NATIONAL') { baseTariff = 4500; estimatedDays = 3; }
    }

    const kgCobrados = Math.ceil(req.weight_grams / 1000);
    const priceCents = baseTariff + (kgCobrados * additional);

    callback(null, {
        request_id: req.request_id,
        price_cents: priceCents,
        estimated_days: estimatedDays,
        server_team: SERVER_TEAM
    });
}

function main() {
    const server = new grpc.Server();
    server.addService(shippingProto.ShippingService.service, {
        Health: Health,
        CalculateShipping: CalculateShipping
    });
    
    // A porta recomendada no documento é 50051 (lembre-se de parar o pedidos.js antes, pois ele pode estar nela)
    const port = '50052'; 
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), () => {
        console.log(`[SERVER] Mock Servidor gRPC (Equipe ${SERVER_TEAM}) rodando na porta ${port}...`);
    });
}

main();
