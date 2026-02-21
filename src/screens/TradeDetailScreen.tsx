import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { OptionContract } from '../types';
import { fetchStockPrice, fetchOptionsExpirations, fetchOptionChain } from '../services/api';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react-native';

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatVolume = (num: number): string => {
    if (!num) return '—';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
};

const formatOI = (num: number): string => {
    if (!num) return '—';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
    return num.toLocaleString();
};

// ─── Component ─────────────────────────────────────────────────────────────

const TradeDetailScreen = ({ route, navigation }: any) => {
    const { trade, ticker: passedTicker } = route.params;
    const ticker = passedTicker || trade?.ticker;

    const [stockData, setStockData] = useState<any>(null);
    const [options, setOptions] = useState<OptionContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'call' | 'put'>('all');

    useEffect(() => {
        loadData();
    }, [ticker]);

    const loadData = async () => {
        if (!ticker) return;
        setLoading(true);
        setError(null);
        try {
            const price = await fetchStockPrice(ticker);
            setStockData(price);

            const expirations = await fetchOptionsExpirations(ticker);
            if (expirations.length > 0) {
                const chain = await fetchOptionChain(ticker, expirations[0]);
                // Sort by open interest descending — highest conviction contracts first
                const sorted = [...chain].sort(
                    (a, b) => (b.open_interest ?? 0) - (a.open_interest ?? 0)
                );
                setOptions(sorted);
            }
        } catch (err: any) {
            console.error('Error loading detail data:', err);
            setError(err.message || 'Failed to load market data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            </SafeAreaView>
        );
    }

    const isPositive = (stockData?.change || 0) >= 0;

    const filteredOptions = options.filter(opt => {
        if (activeFilter === 'all') return true;
        return opt.option_type === activeFilter;
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerNav}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{ticker}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Stock Price Section */}
                <View style={styles.priceSection}>
                    <Text style={styles.companyName}>{stockData?.description || ticker}</Text>
                    <Text style={styles.priceValue}>
                        ${stockData?.price?.toFixed(2) ?? '—'}
                    </Text>
                    <View style={styles.priceChangeRow}>
                        {isPositive
                            ? <TrendingUp size={16} color="#10b981" />
                            : <TrendingDown size={16} color="#ef4444" />
                        }
                        <Text style={[styles.priceChangeText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
                            {isPositive ? '+' : ''}{stockData?.change?.toFixed(2) ?? '0.00'}{' '}
                            ({stockData?.changePercent?.toFixed(2) ?? '0.00'}%)
                        </Text>
                        <Text style={styles.todayLabel}>Today</Text>
                    </View>
                </View>

                {/* Statistics Grid — populated from real quote data */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>VOLUME</Text>
                        <Text style={styles.statValue}>
                            {stockData?.volume ? formatVolume(stockData.volume) : '—'}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>DAY RANGE</Text>
                        <Text style={styles.statValue}>
                            {stockData?.low && stockData?.high
                                ? `$${stockData.low.toFixed(0)}–$${stockData.high.toFixed(0)}`
                                : '—'
                            }
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>OPEN</Text>
                        <Text style={styles.statValue}>
                            {stockData?.open ? `$${stockData.open.toFixed(2)}` : '—'}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>PREV CLOSE</Text>
                        <Text style={styles.statValue}>
                            {stockData?.prevclose ? `$${stockData.prevclose.toFixed(2)}` : '—'}
                        </Text>
                    </View>
                </View>

                {/* Options Chain */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Options Chain</Text>
                    <Text style={styles.sectionSubtitle}>Sorted by Open Interest</Text>
                </View>

                {/* Call / Put filter pills */}
                <View style={styles.filterRow}>
                    {(['all', 'call', 'put'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                                {f === 'all' ? 'All' : f === 'call' ? 'Calls' : 'Puts'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Column Headers */}
                {filteredOptions.length > 0 && (
                    <View style={styles.columnHeader}>
                        <Text style={[styles.columnLabel, { flex: 2 }]}>STRIKE / EXP</Text>
                        <Text style={[styles.columnLabel, { flex: 1, textAlign: 'center' }]}>OI</Text>
                        <Text style={[styles.columnLabel, { flex: 1, textAlign: 'center' }]}>VOL</Text>
                        <Text style={[styles.columnLabel, { flex: 1, textAlign: 'right' }]}>LAST</Text>
                    </View>
                )}

                {filteredOptions.length > 0 ? (
                    filteredOptions.slice(0, 20).map((item) => {
                        const isCall = item.option_type === 'call';
                        return (
                            <View key={item.symbol} style={styles.optionRow}>
                                <View style={{ flex: 2 }}>
                                    <View style={styles.strikeRow}>
                                        <Text style={styles.optionStrike}>${item.strike}</Text>
                                        <View style={[
                                            styles.typeBadge,
                                            { backgroundColor: isCall ? '#10b98115' : '#ef444415' }
                                        ]}>
                                            <Text style={[
                                                styles.typeBadgeText,
                                                { color: isCall ? '#10b981' : '#ef4444' }
                                            ]}>
                                                {isCall ? 'C' : 'P'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.optionExp}>{item.expiration_date}</Text>
                                </View>

                                <Text style={[styles.optionStat, { flex: 1, textAlign: 'center' }]}>
                                    {formatOI(item.open_interest)}
                                </Text>

                                <Text style={[styles.optionStat, { flex: 1, textAlign: 'center' }]}>
                                    {formatVolume(item.volume)}
                                </Text>

                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={styles.optionPrice}>
                                        ${(item.last ?? item.ask ?? 0).toFixed(2)}
                                    </Text>
                                    <Text style={[
                                        styles.optionChange,
                                        { color: (item.change || 0) >= 0 ? '#10b981' : '#ef4444' }
                                    ]}>
                                        {(item.change || 0) >= 0 ? '+' : ''}{(item.change || 0).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.noDataText}>No options data available</Text>
                )}

                {error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                <TouchableOpacity style={styles.tradeButton}>
                    <Text style={styles.tradeButtonText}>Set Price Alert</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    backButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    priceSection: {
        marginBottom: 24,
    },
    companyName: {
        fontSize: 16,
        color: '#9ca3af',
        fontWeight: '500',
        marginBottom: 8,
    },
    priceValue: {
        fontSize: 42,
        fontWeight: '800',
        color: '#f9fafb',
        marginBottom: 8,
    },
    priceChangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceChangeText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 4,
        marginRight: 8,
    },
    todayLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    // 2x2 grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 32,
    },
    statCard: {
        width: '47.5%',
        backgroundColor: '#1f2937',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#374151',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6b7280',
        letterSpacing: 1,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f9fafb',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#374151',
    },
    filterPillActive: {
        backgroundColor: '#3b82f620',
        borderColor: '#3b82f6',
    },
    filterPillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterPillTextActive: {
        color: '#3b82f6',
    },
    columnHeader: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        marginBottom: 4,
    },
    columnLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4b5563',
        letterSpacing: 0.8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    strikeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    optionStrike: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f9fafb',
    },
    typeBadge: {
        width: 20,
        height: 20,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    optionExp: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 3,
    },
    optionStat: {
        fontSize: 14,
        fontWeight: '600',
        color: '#d1d5db',
    },
    optionPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f9fafb',
    },
    optionChange: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    noDataText: {
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 15,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 12,
        fontSize: 13,
    },
    tradeButton: {
        backgroundColor: '#3b82f6',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    tradeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TradeDetailScreen;