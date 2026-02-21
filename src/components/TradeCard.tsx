import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface TradeCardProps {
    trade: any;
}

const TradeCard: React.FC<TradeCardProps> = ({ trade }) => {
    const isBullish = trade.sentiment === "Bullish";
    const premium = trade.premium || (trade.volume * trade.cost * 100);
    
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toFixed(0);
    };
    
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.tickerContainer}>
                    <Text style={styles.ticker}>{trade.ticker}</Text>
                    <View style={[styles.sentimentBadge, { backgroundColor: isBullish ? '#10b98115' : '#ef444415' }]}>
                        {isBullish ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                        <Text style={[styles.sentimentText, { color: isBullish ? '#10b981' : '#ef4444' }]}>{trade.sentiment}</Text>
                    </View>
                </View>
                <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>${formatNumber(premium)}</Text>
                </View>
            </View>
            
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
        paddingVertical: 2,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sentimentText: {
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 4,
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
    type: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
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
});

export default TradeCard;
