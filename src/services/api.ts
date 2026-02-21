/**
 * API Service — OptionSentinel
 *
 * All requests go through our own proxy server.
 * No API keys are stored in the app.
 */

import { Platform } from 'react-native';
import { ChartRange } from '../components/PriceChart';

const SERVER_URL = __DEV__
    ? Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000'
    : 'https://your-deployed-server.up.railway.app';

export const WS_URL = SERVER_URL.replace('http', 'ws');

const apiFetch = async (path: string) => {
    const res = await fetch(`${SERVER_URL}${path}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
};

export const fetchStockPrice = (ticker: string) =>
    apiFetch(`/api/quote/${ticker.trim().toUpperCase()}`);

/** Fetches daily OHLC bars for the given range (1W / 1M / 3M). */
export const fetchPriceHistory = (ticker: string, range: ChartRange) =>
    apiFetch(`/api/history/${ticker.trim().toUpperCase()}?range=${range}`);

export const fetchOptionsExpirations = (ticker: string): Promise<string[]> =>
    apiFetch(`/api/options/expirations/${ticker.trim().toUpperCase()}`);

export const fetchOptionChain = (ticker: string, expiration: string) =>
    apiFetch(`/api/options/chain/${ticker.trim().toUpperCase()}/${expiration}`);

export const searchSymbols = (query: string) =>
    query.length >= 2
        ? apiFetch(`/api/search?q=${encodeURIComponent(query)}`)
        : Promise.resolve([]);

export const fetchUnusualFlow = (tickers?: string[]) => {
    const params = tickers ? `?tickers=${tickers.join(',')}` : '';
    return apiFetch(`/api/flow${params}`);
};