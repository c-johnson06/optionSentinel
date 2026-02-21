/**
 * OptionSentinel Proxy Server
 *
 * Run with: node server.js
 * Or for dev: npx nodemon server.js
 */

require('dotenv').config();
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

// ─── Dynamic Ticker Management ─────────────────────────────────────────────

const FEED_TICKERS = ['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'META'];
// Track which tickers are being requested by "Premium" users
const dynamicTickers = new Map(); // ticker -> count of active subscribers

const getTickersToScan = () => {
    const dynamicList = Array.from(dynamicTickers.keys());
    // Combine defaults with dynamic ones, max 20 total to protect API limits
    return [...new Set([...FEED_TICKERS, ...dynamicList])].slice(0, 20);
};

// ─── TTL Cache ─────────────────────────────────────────────────────────────

const cache = new Map();

const cacheGet = (key) => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
    return entry.value;
};

const cacheSet = (key, value, ttlMs) => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) cache.delete(key);
    }
}, 60_000);

// ─── Helpers ───────────────────────────────────────────────────────────────

const ensureArray = (obj) => {
    if (!obj) return [];
    return Array.isArray(obj) ? obj : [obj];
};

const tradierFetch = async (path, ttlMs = null) => {
    if (ttlMs !== null) {
        const cached = cacheGet(path);
        if (cached !== null) return cached;
    }
    const res = await fetch(`${BASE_URL}${path}`, { headers: TRADIER_HEADERS });
    if (!res.ok) throw new Error(`Tradier error ${res.status} on ${path}`);
    const data = await res.json();
    if (ttlMs !== null) cacheSet(path, data, ttlMs);
    return data;
};

/** ISO date string offset by `days` from today. */
const dateOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

// ─── Unusual Flow Scoring ──────────────────────────────────────────────────
//
// Scores each option contract 0-100 based on three signals:
//
//   1. Volume/OI ratio  (max 40 pts) — new money entering vs existing positions
//   2. Premium size     (max 40 pts) — dollar value; filters out retail noise
//   3. Time sensitivity (max 20 pts) — short-dated = conviction on near-term catalyst
//
// Only contracts scoring >= 20 are surfaced.
//

const scoreContract = (contract, underlyingQuote) => {
    const stockPrice = underlyingQuote?.last || 0;
    const stockADV = underlyingQuote?.average_daily_volume || 1;
    const ticker = underlyingQuote?.symbol || 'UNKNOWN';

    const { 
        volume = 0, last = 0, open_interest = 0, 
        bid = 0, ask = 0, strike = 0, option_type = '', 
        expiration_date = '', symbol = '' 
    } = contract;

    const premium = volume * last * 100;

    const isETF = ['SPY', 'QQQ', 'IWM', 'DIA', 'VXX'].includes(ticker);
    const isMegaCap = ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'META', 'GOOGL'].includes(ticker);

    if (isETF && premium < 1_000_000) return { score: 0 }; // Ignore < $1M on SPY
    if (isMegaCap && premium < 100_000) return { score: 0 }; // Ignore < $100k on TSLA
    if (premium < 25_000) return { score: 0 }; // Ignore all "tiny" trades under $25k

    let score = 0;
    
    // Premium Intensity (Higher score for bigger $ bets)
    if (premium >= 1_000_000) score += 40;
    else if (premium >= 500_000) score += 30;
    else if (premium >= 100_000) score += 20;
    else if (premium >= 50_000) score += 10;

    // Volume/OI Ratio (The "Unusual" Factor)
    const ratio = volume / (open_interest || 1);
    if (ratio >= 5) score += 30;
    else if (ratio >= 2) score += 20;
    else if (ratio >= 1) score += 10;

    // Aggression (Trade at Ask)
    const isAtAsk = last >= ((bid + ask) / 2);
    if (isAtAsk) score += 20;

    // Urgency (Short-dated)
    const exp = new Date(expiration_date);
    const daysOut = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
    if (daysOut <= 7) score += 10;

    // Sentiment Calculation
    let sentiment = 'Neutral';
    if (option_type === 'call') {
        sentiment = isAtAsk ? 'Bullish' : 'Bearish (Sell)';
    } else {
        sentiment = isAtAsk ? 'Bearish' : 'Bullish (Sell)';
    }

    return {
        symbol,
        score: Math.min(score, 100),
        sentiment,
        details: {
            premium: premium.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            volOiRatio: ratio.toFixed(2),
            daysToExp: daysOut
        }
    };
};

const scanTicker = async (ticker) => {
    try {
        const isDynamic = dynamicTickers.has(ticker.toUpperCase());
        
        // 1. Fetch Quote & Expirations
        const [quoteData, expData] = await Promise.all([
            tradierFetch(`/markets/quotes?symbols=${ticker}`, 10_000),
            tradierFetch(`/markets/options/expirations?symbol=${ticker}`, 60_000)
        ]);

        const quote = quoteData?.quotes?.quote;
        const expirations = ensureArray(expData?.expirations?.date);

        if (!quote || expirations.length === 0) return [];

        // 2. Scan the first TWO expirations (Whales often trade 1-2 weeks out)
        // For dynamic tickers, we go deeper.
        const expsToScan = expirations.slice(0, isDynamic ? 3 : 1);
        const chainPromises = expsToScan.map(exp => 
            tradierFetch(`/markets/options/chains?symbol=${ticker}&expiration=${exp}&greeks=true`, 20_000)
        );
        
        const chainsResults = await Promise.all(chainPromises);
        const allContracts = chainsResults.flatMap(data => ensureArray(data?.options?.option));

        // 3. Map and Score
        const threshold = isDynamic ? 30 : 40; // More inclusive for followed stocks

        return allContracts
            .map((contract) => {
                const result = scoreContract(contract, quote);
                const premium = (contract.volume || 0) * (contract.last || contract.ask || 0) * 100;
                
                return { 
                    ...result, 
                    contract, 
                    premium, 
                    ticker: ticker.toUpperCase() 
                };
            })
            .filter(({ score }) => score >= threshold)
            .map(({ contract, score, sentiment, premium, ticker, details }) => ({
                id: contract.symbol,
                ticker,
                strike: contract.strike,
                volume: contract.volume,
                openInterest: contract.open_interest,
                expiration: contract.expiration_date,
                cost: contract.last || contract.ask,
                type: contract.option_type === 'call' ? 'Call' : 'Put',
                sentiment,
                premium,
                score,
                details,
                impliedVolatility: contract.greeks?.mid_iv || null,
            }));
    } catch (err) {
        console.error(`[scan] ${ticker} Error: ${err.message}`);
        return [];
    }
};

// ─── REST Routes ───────────────────────────────────────────────────────────

// GET /api/quote/:ticker
app.get('/api/quote/:ticker', async (req, res) => {
    try {
        const symbol = req.params.ticker.toUpperCase();
        const data = await tradierFetch(`/markets/quotes?symbols=${symbol}`, 10_000);
        const quotes = ensureArray(data?.quotes?.quote);
        if (!quotes.length || !quotes[0]) return res.status(404).json({ error: 'Symbol not found' });
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

// GET /api/history/:ticker?range=1W|1M|3M
// Returns daily OHLC bars for the given range. Cached for 5 minutes.
app.get('/api/history/:ticker', async (req, res) => {
    try {
        const symbol = req.params.ticker.toUpperCase();
        const range = req.query.range || '1M';
        const daysMap = { '1W': -7, '1M': -30, '3M': -90 };
        const daysBack = daysMap[range] ?? -30;
        const start = dateOffset(daysBack);
        const end = dateOffset(0);

        const path = `/markets/history?symbol=${symbol}&interval=daily&start=${start}&end=${end}`;
        const data = await tradierFetch(path, 5 * 60_000);
        const bars = ensureArray(data?.history?.day);

        res.json(bars.map(bar => ({
            date: bar.date,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/options/expirations/:ticker
app.get('/api/options/expirations/:ticker', async (req, res) => {
    try {
        const symbol = req.params.ticker.toUpperCase();
        const data = await tradierFetch(
            `/markets/options/expirations?symbol=${symbol}`, 60_000
        );
        res.json(ensureArray(data?.expirations?.date));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/options/chain/:ticker/:expiration
app.get('/api/options/chain/:ticker/:expiration', async (req, res) => {
    try {
        const { ticker, expiration } = req.params;
        const data = await tradierFetch(
            `/markets/options/chains?symbol=${ticker.toUpperCase()}&expiration=${expiration}&greeks=true`,
            15_000
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
        const data = await tradierFetch(`/markets/lookup?q=${q}`, 30_000);
        const results = ensureArray(data?.securities?.security)
            .filter(s => s.type === 'stock' || s.type === 'etf');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/flow — on-demand scan (pull-to-refresh fallback)
app.get('/api/flow', async (req, res) => {
    try {
        const tickers = req.query.tickers ? req.query.tickers.split(',') : FEED_TICKERS;
        const settled = await Promise.allSettled(tickers.map(scanTicker));
        const flow = settled
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value)
            .sort((a, b) => b.score - a.score);
        res.json(flow);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/cache/stats — dev endpoint
app.get('/api/cache/stats', (req, res) => {
    const now = Date.now();
    const entries = [...cache.entries()].map(([key, entry]) => ({
        key,
        ttlRemaining: Math.max(0, Math.round((entry.expiresAt - now) / 1000)) + 's',
    }));
    res.json({ size: cache.size, entries });
});

// ─── WebSocket Live Feed ───────────────────────────────────────────────────

const broadcastFlow = async () => {
    if (wss.clients.size === 0) return;
    try {
        const tickers = getTickersToScan();
        const settled = await Promise.allSettled(tickers.map(scanTicker));
        const flow = settled
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value)
            .sort((a, b) => b.score - a.score);
        
        const payload = JSON.stringify({ 
            type: 'flow_update', 
            data: flow, 
            timestamp: Date.now(),
            stats: { scanning: tickers.length, results: flow.length }
        });

        wss.clients.forEach((client) => {
            if (client.readyState === 1) client.send(payload);
        });
        console.log(`[ws] Broadcast: ${tickers.length} tickers, ${flow.length} signals`);
    } catch (err) {
        console.error('[ws] Broadcast error:', err.message);
    }
};

wss.on('connection', (ws) => {
    console.log('[ws] Client connected');
    let clientSubscriptions = new Set();
    let isPremium = false; // Could check a token here later

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            if (msg.type === 'subscribe') {
                // PREMIUM FEATURE: Only allow custom subscriptions for premium users
                if (!msg.isPremium) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Custom flow scanning is a Premium feature.' }));
                    return;
                }

                isPremium = true;
                const newSubs = new Set(msg.tickers.map(t => t.toUpperCase()));
                
                // 1. Decr counts for old subs no longer in newSubs
                clientSubscriptions.forEach(t => {
                    if (!newSubs.has(t)) {
                        const count = dynamicTickers.get(t) || 1;
                        if (count <= 1) dynamicTickers.delete(t);
                        else dynamicTickers.set(t, count - 1);
                    }
                });

                // 2. Incr counts for new subs
                newSubs.forEach(t => {
                    if (!clientSubscriptions.has(t)) {
                        dynamicTickers.set(t, (dynamicTickers.get(t) || 0) + 1);
                    }
                });

                clientSubscriptions = newSubs;
                console.log(`[ws] Client updated subscriptions: ${Array.from(newSubs).join(', ')}`);
                
                // Trigger immediate scan for new tickers
                broadcastFlow();
            }
        } catch (err) {
            console.error('[ws] Message error:', err);
        }
    });

    broadcastFlow();

    ws.on('close', () => {
        // Cleanup: Decr counts for all this client's subscriptions
        clientSubscriptions.forEach(t => {
            const count = dynamicTickers.get(t) || 1;
            if (count <= 1) dynamicTickers.delete(t);
            else dynamicTickers.set(t, count - 1);
        });
        console.log('[ws] Client disconnected');
    });

    ws.on('error', (err) => console.error('[ws] Error:', err.message));
});

setInterval(broadcastFlow, 30_000);

// ─── Start ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`OptionSentinel server running on port ${PORT}`);
    console.log(`REST:      http://localhost:${PORT}/api/`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`Cache:     http://localhost:${PORT}/api/cache/stats`);
});