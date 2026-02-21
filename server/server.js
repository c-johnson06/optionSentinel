/**
 * OptionSentinel Proxy Server
 * 
 * Run with: node server.js
 * Or for dev: npx nodemon server.js
 */

require('dotenv').config();
console.log('KEY:', process.env.TRADIER_API_KEY);
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// ─── Config ────────────────────────────────────────────────────────────────

const TRADIER_API_KEY = process.env.TRADIER_API_KEY || 'YOUR_KEY_HERE';
const BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.tradier.com/v1'
    : 'https://sandbox.tradier.com/v1';

const TRADIER_HEADERS = {
    'Authorization': `Bearer ${TRADIER_API_KEY}`,
    'Accept': 'application/json',
};

// Tickers the live feed scans on a loop
const FEED_TICKERS = ['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'META'];

// ─── Helpers ───────────────────────────────────────────────────────────────

const ensureArray = (obj) => {
    if (!obj) return [];
    return Array.isArray(obj) ? obj : [obj];
};

const tradierFetch = async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, { headers: TRADIER_HEADERS });
    if (!res.ok) throw new Error(`Tradier error ${res.status} on ${path}`);
    return res.json();
};

// ─── Unusual Flow Scoring ──────────────────────────────────────────────────
// 
// This is the core IP of the app. We score each contract 0-100 and only
// surface the truly unusual ones. Scoring criteria:
//   1. Volume/OI ratio  – the higher, the more "new money" is flowing in
//   2. Premium size     – whales write big checks
//   3. Time sensitivity – short-dated options signal conviction
//

const scoreContract = (contract) => {
    const volume = contract.volume || 0;
    const oi = contract.open_interest || 1;
    const price = contract.last || contract.ask || 0;
    const premium = volume * price * 100;

    if (volume < 50) return 0; // Ignore noise

    let score = 0;

    // Vol/OI ratio (max 40 pts)
    const ratio = volume / oi;
    if (ratio >= 10) score += 40;
    else if (ratio >= 5) score += 30;
    else if (ratio >= 2) score += 20;
    else if (ratio >= 1) score += 10;

    // Premium size (max 40 pts)
    if (premium >= 1_000_000) score += 40;
    else if (premium >= 500_000) score += 30;
    else if (premium >= 100_000) score += 20;
    else if (premium >= 50_000) score += 10;

    // Short-dated = urgency (max 20 pts)
    const exp = new Date(contract.expiration_date);
    const daysOut = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
    if (daysOut <= 7) score += 20;
    else if (daysOut <= 21) score += 10;
    else if (daysOut <= 45) score += 5;

    return score;
};

const scanTicker = async (ticker) => {
    try {
        const expData = await tradierFetch(`/markets/options/expirations?symbol=${ticker}`);
        const expirations = ensureArray(expData?.expirations?.date);
        if (expirations.length === 0) return [];

        const chainData = await tradierFetch(
            `/markets/options/chains?symbol=${ticker}&expiration=${expirations[0]}&greeks=true`
        );
        const chain = ensureArray(chainData?.options?.option);

        return chain
            .map((contract) => {
                const score = scoreContract(contract);
                const premium = (contract.volume || 0) * (contract.last || contract.ask || 0) * 100;
                return { contract, score, premium, ticker };
            })
            .filter(({ score }) => score >= 20) // Only surface meaningful flow
            .map(({ contract, score, premium, ticker }) => ({
                id: contract.symbol,
                ticker: ticker.toUpperCase(),
                strike: contract.strike,
                volume: contract.volume,
                openInterest: contract.open_interest,
                expiration: contract.expiration_date,
                cost: contract.last || contract.ask,
                type: contract.option_type === 'call' ? 'Call' : 'Put',
                sentiment: contract.option_type === 'call' ? 'Bullish' : 'Bearish',
                premium,
                score,
                greeks: contract.greeks || null,
                impliedVolatility: contract.greeks?.mid_iv || null,
            }));
    } catch (err) {
        console.error(`[scan] ${ticker}: ${err.message}`);
        return [];
    }
};

// ─── REST Routes ───────────────────────────────────────────────────────────

// GET /api/quote/:ticker
app.get('/api/quote/:ticker', async (req, res) => {
    try {
        const symbol = req.params.ticker.toUpperCase();
        const data = await tradierFetch(`/markets/quotes?symbols=${symbol}`);
        const quotes = ensureArray(data?.quotes?.quote);

        if (!quotes.length || !quotes[0]) {
            return res.status(404).json({ error: 'Symbol not found' });
        }

        const q = quotes[0];
        res.json({
            ticker: q.symbol,
            price: q.last,
            change: q.change,
            changePercent: q.change_percentage,
            description: q.description,
            volume: q.volume,
            high: q.high,
            low: q.low,
            open: q.open,
            prevclose: q.prevclose,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/options/expirations/:ticker
app.get('/api/options/expirations/:ticker', async (req, res) => {
    try {
        const symbol = req.params.ticker.toUpperCase();
        const data = await tradierFetch(`/markets/options/expirations?symbol=${symbol}`);
        res.json(ensureArray(data?.expirations?.date));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/options/chain/:ticker/:expiration
app.get('/api/options/chain/:ticker/:expiration', async (req, res) => {
    try {
        const { ticker, expiration } = req.params;
        const symbol = ticker.toUpperCase();
        const data = await tradierFetch(
            `/markets/options/chains?symbol=${symbol}&expiration=${expiration}&greeks=true`
        );
        res.json(ensureArray(data?.options?.option));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/search?q=TSLA
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]);

        const data = await tradierFetch(`/markets/lookup?q=${q}`);
        const results = ensureArray(data?.securities?.security)
            .filter(s => s.type === 'stock' || s.type === 'etf');

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/flow — on-demand scan (for pull-to-refresh)
app.get('/api/flow', async (req, res) => {
    try {
        const tickers = req.query.tickers
            ? req.query.tickers.split(',')
            : FEED_TICKERS;

        const settled = await Promise.allSettled(FEED_TICKERS.map(scanTicker));
        const results = settled
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        const flow = results.flat().sort((a, b) => b.score - a.score);

        res.json(flow);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── WebSocket Live Feed ───────────────────────────────────────────────────
//
// When a client connects, we immediately push the current flow scan,
// then push updates every 30 seconds. Each message is a full array
// of scored unusual flow events sorted by score descending.
//

const broadcastFlow = async () => {
    if (wss.clients.size === 0) return; // No one listening, skip the API call

    try {
        const results = await Promise.all(FEED_TICKERS.map(scanTicker));
        const flow = results.flat().sort((a, b) => b.score - a.score);
        const payload = JSON.stringify({ type: 'flow_update', data: flow, timestamp: Date.now() });

        wss.clients.forEach((client) => {
            if (client.readyState === 1) { // OPEN
                client.send(payload);
            }
        });
    } catch (err) {
        console.error('[ws] Broadcast error:', err.message);
    }
};

wss.on('connection', (ws) => {
    console.log('[ws] Client connected');

    // Push immediately on connect so the app doesn't wait 30s
    broadcastFlow();

    ws.on('close', () => console.log('[ws] Client disconnected'));
    ws.on('error', (err) => console.error('[ws] Error:', err.message));
});

// Broadcast on a fixed interval
const BROADCAST_INTERVAL_MS = 30_000; // 30 seconds
setInterval(broadcastFlow, BROADCAST_INTERVAL_MS);

// ─── Start ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`OptionSentinel server running on port ${PORT}`);
    console.log(`REST:      http://localhost:${PORT}/api/`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
});