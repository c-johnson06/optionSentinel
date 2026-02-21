/**
 * useFlowFeed
 *
 * Connects to the OptionSentinel WebSocket server and maintains
 * a live feed of unusual options flow, sorted by score descending.
 *
 * Usage:
 *   const { trades, connected, lastUpdated, refresh } = useFlowFeed();
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL, fetchUnusualFlow } from '../services/api';

export interface FlowTrade {
    id: string;
    ticker: string;
    strike: number;
    volume: number;
    openInterest: number;
    expiration: string;
    cost: number;
    type: 'Call' | 'Put';
    sentiment: 'Bullish' | 'Bearish';
    premium: number;
    score: number;
    greeks: any | null;
    impliedVolatility: number | null;
}

interface UseFlowFeedResult {
    trades: FlowTrade[];
    connected: boolean;
    lastUpdated: Date | null;
    refreshing: boolean;
    refresh: () => Promise<void>;
}

const RECONNECT_DELAY_MS = 5_000;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useFlowFeed = (): UseFlowFeedResult => {
    const [trades, setTrades] = useState<FlowTrade[]>([]);
    const [connected, setConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);

    const connect = useCallback(() => {
        if (!isMounted.current) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted.current) return;
                console.log('[ws] Connected to flow feed');
                setConnected(true);
                reconnectAttempts.current = 0;
            };

            ws.onmessage = (event) => {
                if (!isMounted.current) return;
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'flow_update' && Array.isArray(message.data)) {
                        setTrades(message.data);
                        setLastUpdated(new Date(message.timestamp));
                    }
                } catch (err) {
                    console.error('[ws] Parse error:', err);
                }
            };

            ws.onclose = () => {
                if (!isMounted.current) return;
                setConnected(false);

                if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current += 1;
                    const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttempts.current, 4);
                    console.log(`[ws] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
                    reconnectTimer.current = setTimeout(connect, delay);
                }
            };

            ws.onerror = (err) => {
                console.error('[ws] Error:', err);
                ws.close();
            };
        } catch (err) {
            console.error('[ws] Connection failed:', err);
        }
    }, []);

    // Manual refresh via REST (fallback + pull-to-refresh)
    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const flow = await fetchUnusualFlow();
            setTrades(flow);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('[refresh] Error:', err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        connect();

        return () => {
            isMounted.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [connect]);

    return { trades, connected, lastUpdated, refreshing, refresh };
};