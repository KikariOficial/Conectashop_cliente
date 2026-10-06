const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const PROTO_PATH = './shipping.proto';
const GRPC_TARGET = process.env.GRPC_TARGET || 'localhost:50051';
const CLIENT_TEAM = process.env.CLIENT_TEAM || 'C01';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const shippingProto = grpc.loadPackageDefinition(packageDefinition).shipping.v1;
const client = new shippingProto.ShippingService(GRPC_TARGET, grpc.credentials.createInsecure());

function writeLog(logString) {
    console.log(logString);
    fs.appendFileSync('logs.txt', logString + '\n');
}

function callRpc(method, requestData) {
    return new Promise((resolve) => {
        const metadata = new grpc.Metadata();
        metadata.add('x-client-team', CLIENT_TEAM);
        
        const startTime = Date.now();
        const requestId = requestData.request_id || uuidv4();
        
        // requestData object is reused, so set request_id if it's missing
        if (!requestData.request_id && method === 'CalculateShipping') {
            requestData.request_id = requestId;
        }

        client[method](requestData, metadata, (error, response) => {
            const durationMs = Date.now() - startTime;
            resolve({ error, response, durationMs, requestId });
        });
    });
}

function formatDate() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

function buildLogString({ requestId, operation, serverTeam, statusStr, durationMs, result, extra }) {
    const timestamp = formatDate();
    const server = serverTeam || 'UNKNOWN';
    let logStr = `[${timestamp}] protocol=GRPC client=${CLIENT_TEAM} server=${server} requestId=${requestId} operation=${operation} target=${GRPC_TARGET} status=${statusStr} durationMs=${durationMs} result=${result}`;
    if (extra) {
        logStr += ` ${extra}`;
    }
    return logStr;
}

async function runTests() {
    let serverTeam = 'UNKNOWN';
    console.log(`[CLIENT] Iniciando testes gRPC contra: ${GRPC_TARGET}\n`);
    
    // G1: Health()
    let res = await callRpc('Health', {});
    let result = 'FAIL';
    let extra = '';
    let statusStr = res.error ? res.error.code : 'OK';
    
    if (!res.error && res.response.status === 'SERVING') {
        result = 'PASS';
        serverTeam = res.response.server_team || 'UNKNOWN';
        extra = `status=${res.response.status}`;
    } else {
        extra = res.error ? res.error.message : 'Invalid response';
    }
    writeLog(buildLogString({ requestId: res.requestId, operation: 'Health', serverTeam, statusStr, durationMs: res.durationMs, result, extra }));

    // G2: 1500g, LOCAL, STANDARD -> 1800 cents, 2 days
    res = await callRpc('CalculateShipping', {
        weight_grams: 1500,
        zone: 'LOCAL',
        mode: 'STANDARD'
    });
    result = 'FAIL';
    extra = '';
    statusStr = res.error ? res.error.code : 'OK';
    
    if (!res.error && String(res.response.price_cents) === '1800' && parseInt(res.response.estimated_days) === 2) {
        result = 'PASS';
        serverTeam = res.response.server_team || serverTeam;
        extra = `priceCents=${res.response.price_cents} estimatedDays=${res.response.estimated_days}`;
    } else {
        extra = res.error ? res.error.message : `Got price_cents=${res.response.price_cents} estimated_days=${res.response.estimated_days}`;
    }
    writeLog(buildLogString({ requestId: res.requestId, operation: 'CalculateShipping', serverTeam, statusStr, durationMs: res.durationMs, result, extra }));

    // G3: 2500g, REGIONAL, EXPRESS -> 4600 cents, 2 days
    res = await callRpc('CalculateShipping', {
        weight_grams: 2500,
        zone: 'REGIONAL',
        mode: 'EXPRESS'
    });
    result = 'FAIL';
    extra = '';
    statusStr = res.error ? res.error.code : 'OK';
    
    if (!res.error && String(res.response.price_cents) === '4600' && parseInt(res.response.estimated_days) === 2) {
        result = 'PASS';
        serverTeam = res.response.server_team || serverTeam;
        extra = `priceCents=${res.response.price_cents} estimatedDays=${res.response.estimated_days}`;
    } else {
        extra = res.error ? res.error.message : `Got price_cents=${res.response.price_cents} estimated_days=${res.response.estimated_days}`;
    }
    writeLog(buildLogString({ requestId: res.requestId, operation: 'CalculateShipping', serverTeam, statusStr, durationMs: res.durationMs, result, extra }));

    // G4: 1000g, NATIONAL, STANDARD -> 3400 cents, 7 days
    res = await callRpc('CalculateShipping', {
        weight_grams: 1000,
        zone: 'NATIONAL',
        mode: 'STANDARD'
    });
    result = 'FAIL';
    extra = '';
    statusStr = res.error ? res.error.code : 'OK';
    
    if (!res.error && String(res.response.price_cents) === '3400' && parseInt(res.response.estimated_days) === 7) {
        result = 'PASS';
        serverTeam = res.response.server_team || serverTeam;
        extra = `priceCents=${res.response.price_cents} estimatedDays=${res.response.estimated_days}`;
    } else {
        extra = res.error ? res.error.message : `Got price_cents=${res.response.price_cents} estimated_days=${res.response.estimated_days}`;
    }
    writeLog(buildLogString({ requestId: res.requestId, operation: 'CalculateShipping', serverTeam, statusStr, durationMs: res.durationMs, result, extra }));

    // G5: weight_grams=0 -> Status INVALID_ARGUMENT; INVALID_WEIGHT
    res = await callRpc('CalculateShipping', {
        weight_grams: 0,
        zone: 'LOCAL',
        mode: 'STANDARD'
    });
    result = 'FAIL';
    extra = '';
    statusStr = res.error ? res.error.code : 'OK';
    
    if (res.error && res.error.code === grpc.status.INVALID_ARGUMENT && res.error.details.includes('INVALID_WEIGHT')) {
        result = 'PASS';
        extra = `errorDetail=${res.error.details}`;
    } else {
        extra = res.error ? `error=${res.error.code} details=${res.error.details}` : 'Expected INVALID_ARGUMENT error but got success';
    }
    writeLog(buildLogString({ requestId: res.requestId, operation: 'CalculateShipping', serverTeam, statusStr, durationMs: res.durationMs, result, extra }));
    
    console.log("\n[CLIENT] Testes concluídos.");
}

runTests().catch(console.error);
