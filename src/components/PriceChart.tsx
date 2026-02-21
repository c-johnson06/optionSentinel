/**
 * PriceChart
 *
 * SVG line chart with gradient fill and 1W / 1M / 3M range switcher.
 * Uses react-native-svg (already in the project — no new deps needed).
 *
 * When the server returns no history data (common with Tradier sandbox),
 * the chart falls back to a synthetic random-walk seeded from the current
 * price so the UI never breaks during demos or development.
 * A small "· simulated" tag appears in the performance row when this happens.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { fetchPriceHistory } from '../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────

export type ChartRange = '1W' | '1M' | '3M';

interface Bar {
    date: string;
    close: number;
}

interface PriceChartProps {
    ticker: string;
    /** Passed in from TradeDetailScreen so the fallback generator has a seed. */
    currentPrice?: number | null;
    height?: number;
}

// ─── Synthetic fallback generator ─────────────────────────────────────────

/**
 * Produces a deterministic random-walk price series seeded from `seed`.
 * Deterministic = same ticker always gets the same chart shape, so it
 * doesn't jitter on re-render or look obviously fake.
 */
const generateFallback = (
    seed: number,
    points: number,
    volatility: number,
): number[] => {
    let s = Math.abs(Math.round(seed)) + 1;
    const lcg = () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };

    const out = [seed];
    for (let i = 1; i < points; i++) {
        const delta = (lcg() - 0.5) * 2 * volatility * out[i - 1];
        out.push(Math.max(out[i - 1] + delta, seed * 0.5));
    }
    return out;
};

const RANGE_SETTINGS: Record<ChartRange, { points: number; volatility: number }> = {
    '1W': { points: 7,  volatility: 0.005 },
    '1M': { points: 22, volatility: 0.010 },
    '3M': { points: 65, volatility: 0.015 },
};

// ─── SVG helpers ───────────────────────────────────────────────────────────

const PAD = { top: 12, right: 8, bottom: 24, left: 8 };

const linePath = (
    closes: number[],
    w: number,
    h: number,
    lo: number,
    hi: number,
): string => {
    if (closes.length < 2) return '';
    const range = hi - lo || 1;
    const dw = w - PAD.left - PAD.right;
    const dh = h - PAD.top  - PAD.bottom;
    return closes.map((p, i) => {
        const x = PAD.left + (i / (closes.length - 1)) * dw;
        const y = PAD.top  + (1 - (p - lo) / range) * dh;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
};

const fillPath = (lp: string, w: number, h: number): string => {
    if (!lp) return '';
    return `${lp} L${(w - PAD.right).toFixed(2)},${(h - PAD.bottom).toFixed(2)} L${PAD.left.toFixed(2)},${(h - PAD.bottom).toFixed(2)} Z`;
};

// ─── Component ─────────────────────────────────────────────────────────────

const RANGES: ChartRange[] = ['1W', '1M', '3M'];

const PriceChart: React.FC<PriceChartProps> = ({
    ticker,
    currentPrice,
    height = 180,
}) => {
    const [range, setRange]           = useState<ChartRange>('1M');
    const [closes, setCloses]         = useState<number[]>([]);
    const [loading, setLoading]       = useState(true);
    const [isSynthetic, setIsSynthetic] = useState(false);

    const chartWidth = Dimensions.get('window').width - 40;

    useEffect(() => {
        let cancelled = false;

        const applyFallback = () => {
            // Seed = current price if available, else derive from ticker chars
            const seed = currentPrice ??
                ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 100);
            const { points, volatility } = RANGE_SETTINGS[range];
            if (!cancelled) {
                setCloses(generateFallback(seed, points, volatility));
                setIsSynthetic(true);
                setLoading(false);
            }
        };

        const load = async () => {
            setLoading(true);
            try {
                const bars: Bar[] = await fetchPriceHistory(ticker, range);
                if (cancelled) return;

                if (bars && bars.length >= 2) {
                    setCloses(bars.map(b => b.close));
                    setIsSynthetic(false);
                    setLoading(false);
                } else {
                    applyFallback();
                }
            } catch {
                if (!cancelled) applyFallback();
            }
        };

        load();
        return () => { cancelled = true; };
    }, [ticker, range, currentPrice]);

    const lo = closes.length ? Math.min(...closes) : 0;
    const hi = closes.length ? Math.max(...closes) : 1;
    const first = closes[0] ?? 0;
    const last  = closes[closes.length - 1] ?? 0;
    const isUp  = last >= first;
    const color = isUp ? '#10b981' : '#ef4444';

    const lp = linePath(closes, chartWidth, height, lo, hi);
    const fp = fillPath(lp, chartWidth, height);

    const pct = first ? ((last - first) / first) * 100 : 0;
    const abs = last - first;

    return (
        <View>
            {/* ── Range pills ── */}
            <View style={styles.rangeRow}>
                {RANGES.map(r => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.pill, range === r && styles.pillActive]}
                        onPress={() => setRange(r)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={[styles.pillText, range === r && styles.pillTextActive]}>
                            {r}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Chart ── */}
            <View style={[styles.chartArea, { height }]}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color="#3b82f6" />
                    </View>
                ) : closes.length < 2 ? (
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No data</Text>
                    </View>
                ) : (
                    <>
                        <Svg width={chartWidth} height={height}>
                            <Defs>
                                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0%"   stopColor={color} stopOpacity={0.25} />
                                    <Stop offset="100%" stopColor={color} stopOpacity={0} />
                                </LinearGradient>
                            </Defs>
                            <Path d={fp} fill="url(#grad)" />
                            <Path
                                d={lp}
                                stroke={color}
                                strokeWidth={2}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                        <Text style={[styles.priceTag, { top: PAD.top - 10 }]}>
                            ${hi.toFixed(2)}
                        </Text>
                        <Text style={[styles.priceTag, { bottom: PAD.bottom - 4 }]}>
                            ${lo.toFixed(2)}
                        </Text>
                    </>
                )}
            </View>

            {/* ── Performance summary ── */}
            {!loading && closes.length >= 2 && (
                <View style={styles.perfRow}>
                    <Text style={styles.perfLabel}>
                        {range} performance
                        {isSynthetic && <Text style={styles.simTag}> · simulated</Text>}
                    </Text>
                    <Text style={[styles.perfValue, { color }]}>
                        {isUp ? '+' : ''}{pct.toFixed(2)}%
                        {' · '}
                        {isUp ? '+' : ''}${abs.toFixed(2)}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    rangeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#374151',
    },
    pillActive: {
        backgroundColor: '#3b82f620',
        borderColor: '#3b82f6',
    },
    pillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
    },
    pillTextActive: {
        color: '#3b82f6',
    },
    chartArea: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#111827',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#4b5563',
        fontSize: 13,
    },
    priceTag: {
        position: 'absolute',
        right: 8,
        fontSize: 10,
        color: '#4b5563',
        fontWeight: '600',
    },
    perfRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    perfLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    simTag: {
        fontSize: 11,
        color: '#4b5563',
        fontStyle: 'italic',
    },
    perfValue: {
        fontSize: 13,
        fontWeight: '700',
    },
});

export default PriceChart;