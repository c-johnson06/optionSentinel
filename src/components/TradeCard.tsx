import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface Trade {
    ticker: string;
    sentiment: string;
    premium?: number;
    volume: number;
    cost: number;
    strike: number;
    type: string;
    expiration: string;
    score?: number;
}

interface TradeCardProps {
    trade: Trade;
}

// ─── Score bar helpers ─────────────────────────────────────────────────────

/**
 * Returns a color and label for a given flow score (0–100).
 * 
 *   80–100  → green  "Very High"   — rare, institutional-grade conviction
 *   50–79   → yellow "High"        — elevated, worth watching
 *   20–49   → orange "Moderate"    — above threshold but less unusual
 *    0–19   → grey   "Low"         — filtered out before reaching cards
 */
const scoreAppearance = (score: number): { color: string; label: string } => {
    if (score >= 80) return { color: '#10b981', label: 'Very High' };
    if (score >= 50) return { color: '#f59e0b', label: 'High' };
    return { color: '#f97316', label: 'Moderate' };
};

// ─── Component ─────────────────────────────────────────────────────────────

const TradeCard: React.FC<TradeCardProps> = ({ trade }) => {
    const isBullish = trade.sentiment === 'Bullish';
    const premium = trade.premium || trade.volume * trade.cost * 100;
    const score = trade.score ?? 0;
    const { color: scoreColor, label: scoreLabel } = scoreAppearance(score);

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
        return num.toFixed(0);
    };

    return (
        <View style={styles.card}>
            {/* ── Header: ticker + sentiment badge + premium ── */}
            <View style={styles.header}>
                <View style={styles.tickerContainer}>
                    <Text style={styles.ticker}>{trade.ticker}</Text>
                    <View style={[
                        styles.sentimentBadge,
                        { backgroundColor: isBullish ? '#10b98115' : '#ef444415' }
                    ]}>
                        {isBullish
                            ? <TrendingUp size={12} color="#10b981" />
                            : <TrendingDown size={12} color="#ef4444" />
                        }
                        <Text style={[
                            styles.sentimentText,
                            { color: isBullish ? '#10b981' : '#ef4444' }
                        ]}>
                            {trade.sentiment}
                        </Text>
                    </View>
                </View>
                <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>${formatNumber(premium)}</Text>
                </View>
            </View>

            {/* ── Detail grid ── */}
            <View style={styles.details}>
                <View style={styles.detailItem}>
                    <Text style={styles.label}>STRIKE</Text>
                    <Text style={styles.value}>${trade.strike} {trade.type}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.label}>EXPIRATION</Text>
                    <Text style={styles.value}>{trade.expiration}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.label}>VOLUME</Text>
                    <Text style={styles.value}>{trade.volume.toLocaleString()}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.label}>COST</Text>
                    <Text style={styles.value}>${trade.cost.toFixed(2)}</Text>
                </View>
            </View>

            {/* ── Flow score bar ── */}
            <View style={styles.scoreSection}>
                <View style={styles.scoreLabelRow}>
                    <Text style={styles.scoreLabel}>FLOW SCORE</Text>
                    <Text style={[styles.scoreValue, { color: scoreColor }]}>
                        {score} <Text style={styles.scoreSubLabel}>/ 100 · {scoreLabel}</Text>
                    </Text>
                </View>
                {/* Track */}
                <View style={styles.scoreTrack}>
                    {/* Fill — width is percentage of score out of 100 */}
                    <View style={[
                        styles.scoreFill,
                        {
                            width: `${Math.min(score, 100)}%` as any,
                            backgroundColor: scoreColor,
                        }
                    ]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#374151',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    tickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ticker: {
        fontSize: 22,
        fontWeight: '900',
        color: '#f9fafb',
        marginRight: 8,
    },
    sentimentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sentimentText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    premiumBadge: {
        backgroundColor: '#3b82f620',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    premiumText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#3b82f6',
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    detailItem: {
        minWidth: '45%',
        marginBottom: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 1,
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    // Score bar
    scoreSection: {
        marginTop: 4,
    },
    scoreLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 1,
    },
    scoreValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    scoreSubLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6b7280',
    },
    scoreTrack: {
        height: 5,
        backgroundColor: '#374151',
        borderRadius: 3,
        overflow: 'hidden',
    },
    scoreFill: {
        height: '100%',
        borderRadius: 3,
    },
});

export default TradeCard;