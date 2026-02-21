/**
 * API Service for OptionSentinel
 * 
 * Using Tradier API for stock and options data.
 * Get your API key at: https://developer.tradier.com
 */

// Use 'https://api.tradier.com' for production
const BASE_URL = 'https://sandbox.tradier.com/v1';
const TRADIER_API_KEY = 'ZtGyjSG2GTvPtSERcG6l1fGaRGiA'; // Replace with actual key

const headers = {
    'Authorization': `Bearer ${TRADIER_API_KEY}`,
    'Accept': 'application/json'
};

/**
 * Tradier often returns a single object if there's only one result,
 * but an array if there are multiple. This ensures we always have an array.
 */
const ensureArray = (obj: any) => {
    if (!obj) return [];
    return Array.isArray(obj) ? obj : [obj];
};

export const fetchStockPrice = async (ticker: string) => {
    try {
        const symbol = ticker.trim().toUpperCase();
        if (!symbol) return null;

        const response = await fetch(`${BASE_URL}/markets/quotes?symbols=${symbol}`, { headers });
        
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized: Invalid Tradier API Key.');
            throw new Error(`Market data unavailable (${response.status})`);
        }

        const data = await response.json();
        const quotes = ensureArray(data?.quotes?.quote);
        
        if (quotes.length > 0 && quotes[0] !== null) {
            const quote = quotes[0];
            return {
                price: quote.last,
                change: quote.change,
                changePercent: quote.change_percentage,
                description: quote.description
            };
        }
        return null;
    } catch (error: any) {
        console.error('Error fetching stock price:', error);
        throw error;
    }
};

/**
 * Fetches the option chain for a given ticker and expiration date.
 */
export const fetchOptionChain = async (ticker: string, expiration: string) => {
    try {
        const symbol = ticker.trim().toUpperCase();
        const response = await fetch(`${BASE_URL}/markets/options/chains?symbol=${symbol}&expiration=${expiration}&greeks=true`, { headers });
        
        if (!response.ok) throw new Error('Failed to fetch option chain');

        const data = await response.json();
        return ensureArray(data?.options?.option);
    } catch (error) {
        console.error('Error fetching option chain:', error);
        return [];
    }
};

/**
 * Gets available expiration dates for a symbol.
 */
export const fetchOptionsExpirations = async (ticker: string) => {
    try {
        const symbol = ticker.trim().toUpperCase();
        const response = await fetch(`${BASE_URL}/markets/options/expirations?symbol=${symbol}`, { headers });
        
        if (!response.ok) throw new Error('Failed to fetch expirations');

        const data = await response.json();
        return ensureArray(data?.expirations?.date);
    } catch (error) {
        console.error('Error fetching expirations:', error);
        return [];
    }
};

/**
 * Searches for symbols matching a query (Market Lookup).
 */
export const searchSymbols = async (query: string) => {
    try {
        if (!query || query.length < 2) return [];
        const response = await fetch(`${BASE_URL}/markets/lookup?q=${query}`, { headers });
        
        if (!response.ok) throw new Error('Failed to lookup symbols');

        const data = await response.json();
        return ensureArray(data?.securities?.security).filter(s => s.type === 'stock' || s.type === 'etf');
    } catch (error) {
        console.error('Error searching symbols:', error);
        return [];
    }
};

/**
 * Scans an option chain for "Unusual" activity.
 * Criteria: 
 * 1. Volume > Open Interest (Indicates new aggressive positions)
 * 2. High Premium (Total dollar value of the trade is significant)
 */
export const scanForUnusualFlow = async (ticker: string) => {
    try {
        const expirations = await fetchOptionsExpirations(ticker);
        if (expirations.length === 0) return [];

        // Scan the nearest expiration for high-velocity trades
        const chain = await fetchOptionChain(ticker, expirations[0]);
        
        const unusualTrades = chain.filter((contract: any) => {
            const volume = contract.volume || 0;
            const oi = contract.open_interest || 1; // Avoid division by zero
            const price = contract.last || contract.ask || 0;
            const premium = volume * price * 100;

            // Professional "Unusual" Filters
            const isGoldenSignal = volume > oi && volume > 100; // Vol > OI
            const isWhaleTrade = premium > 50000; // $50k+ in a single strike

            return isGoldenSignal || isWhaleTrade;
        });

        // Map to our internal OptionsTrade format
        return unusualTrades.map((contract: any) => ({
            id: contract.symbol,
            ticker: ticker.toUpperCase(),
            strike: contract.strike,
            volume: contract.volume,
            expiration: contract.expiration_date,
            cost: contract.last || contract.ask,
            type: contract.option_type === 'call' ? 'Call' : 'Put',
            sentiment: contract.option_type === 'call' ? 'Bullish' : 'Bearish',
            premium: (contract.volume * (contract.last || contract.ask) * 100)
        })).sort((a: any, b: any) => b.premium - a.premium); // Show biggest trades first

    } catch (error) {
        console.error(`Error scanning ${ticker}:`, error);
        return [];
    }
};
