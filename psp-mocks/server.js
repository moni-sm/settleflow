// Standalone Mock PSP Microservices for SettleFlow
// Runs 3 distinct payment provider instances without external dependencies:
// - PSP Alpha (Port 8081): Fast, tier-1 provider (5% failure rate, ~120ms latency)
// - PSP Beta  (Port 8082): Unstable provider (60% failure rate, ~750ms latency)
// - PSP Gamma (Port 8083): Multi-currency regional provider (15% failure rate, ~250ms latency)

const http = require('http');
const url = require('url');

const providers = [
  {
    id: 'psp-alpha',
    name: 'PSP Alpha',
    code: 'ALPHA',
    port: 8081,
    paymentPaths: ['/v1/payments', '/pay'],
    failureRate: 0.05,
    avgLatencyMs: 120,
    supportedCurrencies: ['EUR', 'USD', 'GBP'],
    enabled: true,
    stats: { total: 0, successes: 0, failures: 0 },
    settlementLedger: [
      { id: '88213', reference: 'TXN-88213', playerId: 'player_101', amount: 50.0, currency: 'EUR', status: 'SETTLED', timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: '88210', reference: 'TXN-88210', playerId: 'player_204', amount: 25.0, currency: 'GBP', status: 'SETTLED', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: '88209', reference: 'TXN-88209', playerId: 'player_317', amount: 15.0, currency: 'EUR', status: 'SETTLED', timestamp: new Date(Date.now() - 7200000).toISOString() }
    ]
  },
  {
    id: 'psp-beta',
    name: 'PSP Beta',
    code: 'BETA',
    port: 8082,
    paymentPaths: ['/v1/charges', '/pay'],
    failureRate: 0.60,
    avgLatencyMs: 750,
    supportedCurrencies: ['EUR', 'USD', 'SEK'],
    enabled: true,
    stats: { total: 0, successes: 0, failures: 0 },
    settlementLedger: [
      { id: '88211', reference: 'TXN-88211', playerId: 'player_089', amount: 500.0, currency: 'EUR', status: 'SETTLED', timestamp: new Date(Date.now() - 2400000).toISOString() },
      // Discrepancy intentional for reconciliation demo:
      { id: '88147', reference: 'TXN-88147', playerId: 'player_089', amount: 75.5, currency: 'EUR', status: 'SETTLED', timestamp: new Date(Date.now() - 10800000).toISOString() }
    ]
  },
  {
    id: 'psp-gamma',
    name: 'PSP Gamma',
    code: 'GAMMA',
    port: 8083,
    paymentPaths: ['/v2/settle', '/pay'],
    failureRate: 0.15,
    avgLatencyMs: 250,
    supportedCurrencies: ['GBP', 'EUR', 'NOK'],
    enabled: true,
    stats: { total: 0, successes: 0, failures: 0 },
    settlementLedger: [
      { id: '88212', reference: 'TXN-88212', playerId: 'player_412', amount: 200.0, currency: 'EUR', status: 'SETTLED', timestamp: new Date(Date.now() - 1200000).toISOString() },
      { id: '88208', reference: 'TXN-88208', playerId: 'player_101', amount: 100.0, currency: 'EUR', status: 'SETTLED', timestamp: new Date(Date.now() - 8600000).toISOString() }
    ]
  }
];

function sendJson(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function startServer(config) {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
      res.statusCode = 204;
      res.end();
      return;
    }

    // Health check
    if (req.method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, {
        status: 'UP',
        psp: config.id,
        name: config.name,
        port: config.port,
        enabled: config.enabled,
        failureRate: config.failureRate,
        avgLatencyMs: config.avgLatencyMs
      });
    }

    // Status & Metrics
    if (req.method === 'GET' && pathname === '/status') {
      return sendJson(res, 200, {
        psp: config.id,
        name: config.name,
        enabled: config.enabled,
        failureRate: config.failureRate,
        avgLatencyMs: config.avgLatencyMs,
        stats: config.stats,
        settlementCount: config.settlementLedger.length
      });
    }

    // Live Configuration Tuning (e.g. adjust failure rate, latency)
    if (req.method === 'POST' && pathname === '/configure') {
      try {
        const body = await parseJsonBody(req);
        if (body.failureRate !== undefined) config.failureRate = parseFloat(body.failureRate);
        if (body.avgLatencyMs !== undefined) config.avgLatencyMs = parseInt(body.avgLatencyMs, 10);
        if (body.enabled !== undefined) config.enabled = Boolean(body.enabled);

        console.log(`[${config.name}] Updated config -> failureRate=${config.failureRate}, latency=${config.avgLatencyMs}ms, enabled=${config.enabled}`);
        return sendJson(res, 200, { message: 'Config updated', config });
      } catch (err) {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
    }

    // Settlement Report Endpoint (for Reconciliation)
    if (req.method === 'GET' && pathname === '/settlement-report') {
      return sendJson(res, 200, {
        psp: config.id,
        generatedAt: new Date().toISOString(),
        totalSettledCount: config.settlementLedger.length,
        transactions: config.settlementLedger
      });
    }

    // Payment Processing Endpoints
    if (req.method === 'POST' && config.paymentPaths.includes(pathname)) {
      try {
        const body = await parseJsonBody(req);
        config.stats.total++;

        // Simulate network latency with jitter
        const jitter = Math.floor((Math.random() - 0.5) * 50);
        const actualLatency = Math.max(20, config.avgLatencyMs + jitter);

        setTimeout(() => {
          if (!config.enabled) {
            config.stats.failures++;
            return sendJson(res, 503, {
              success: false,
              psp: config.id,
              error: 'PROVIDER_MAINTENANCE',
              message: `${config.name} is temporarily disabled for maintenance`
            });
          }

          // Currency validation
          if (body.currency && !config.supportedCurrencies.includes(body.currency)) {
            config.stats.failures++;
            return sendJson(res, 400, {
              success: false,
              psp: config.id,
              error: 'UNSUPPORTED_CURRENCY',
              message: `${config.name} does not support currency ${body.currency}`
            });
          }

          // Simulated failure check
          const isFailure = Math.random() < config.failureRate;

          if (isFailure) {
            config.stats.failures++;
            console.log(`[${config.name}] ❌ Declined transaction amount=${body.amount} ${body.currency || 'EUR'} (simulated fail rate ${(config.failureRate * 100).toFixed(0)}%)`);
            return sendJson(res, 402, {
              success: false,
              psp: config.id,
              transactionId: body.id,
              error: 'PAYMENT_DECLINED',
              reason: 'Processor decline / issuer timeout simulation',
              latencyMs: actualLatency
            });
          }

          // Success: record in settlement ledger
          config.stats.successes++;
          const settlementRecord = {
            id: body.id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
            reference: body.reference || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
            playerId: body.playerId || 'player_unknown',
            amount: parseFloat(body.amount) || 0,
            currency: body.currency || 'EUR',
            status: 'SETTLED',
            timestamp: new Date().toISOString()
          };
          config.settlementLedger.push(settlementRecord);

          console.log(`[${config.name}] ✅ Approved transaction amount=${settlementRecord.amount} ${settlementRecord.currency} in ${actualLatency}ms`);
          return sendJson(res, 200, {
            success: true,
            psp: config.id,
            transactionId: settlementRecord.id,
            pspReference: `PSP-${config.code}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            status: 'SETTLED',
            latencyMs: actualLatency,
            settledAt: settlementRecord.timestamp
          });
        }, actualLatency);

      } catch (err) {
        return sendJson(res, 400, { error: 'Invalid JSON request payload' });
      }
      return;
    }

    // 404 handler
    sendJson(res, 404, { error: 'Not found', path: pathname });
  });

  server.listen(config.port, () => {
    console.log(`🚀 [${config.name}] listening on http://localhost:${config.port} (Failure rate: ${(config.failureRate * 100).toFixed(0)}%, Latency: ${config.avgLatencyMs}ms)`);
  });

  return server;
}

// Start all 3 mock PSP microservices
console.log('--- Starting SettleFlow Mock PSP Microservices ---');
providers.forEach(startServer);
