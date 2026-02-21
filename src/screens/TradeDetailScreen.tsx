import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { OptionContract } from '../types';
import { fetchStockPrice, fetchOptionsExpirations, fetchOptionChain } from '../services/api';
import { ArrowLeft, TrendingUp, TrendingDown, Bell } from 'lucide-react-native';
import { SkeletonDetailScreen } from '../components/SkeletonLoader';
import PriceChart from '../components/PriceChart';
import PriceAlertModal from '../components/PriceAlertModal';

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

const TradeDetailScreen = ({ route, navigation }: any) => {
    const { trade, ticker: passedTicker } = route.params ?? {};
    const ticker = passedTicker || trade?.ticker;

    const [stockData, setStockData]       = useState<any>(null);
    const [options, setOptions]           = useState<OptionContract[]>([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'call' | 'put'>('all');
    const [alertVisible, setAlertVisible] = useState(false);

    if (!ticker) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#f9fafb" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Error</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.center}>
                    <Text style={styles.noDataText}>No ticker provided</Text>
                </View>
            </SafeAreaView>
        );
    }

    useEffect(() => { loadData(); }, [ticker]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const price = await fetchStockPrice(ticker);
            setStockData(price);
            const expirations = await fetchOptionsExpirations(ticker);
            if (expirations.length > 0) {
                const chain = await fetchOptionChain(ticker, expirations[0]);
                setOptions([...chain].sort((a, b) => (b.open_interest ?? 0) - (a.open_interest ?? 0)));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load market data');
        } finally {
            setLoading(false);
        }
    };

    const isPositive = (stockData?.change || 0) >= 0;
    const filteredOptions = options.filter(opt =>
        activeFilter === 'all' ? true : opt.option_type === activeFilter
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerNav}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{ticker}</Text>
                <TouchableOpacity
                    onPress={() => setAlertVisible(true)}
                    style={styles.bellButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Bell size={20} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <SkeletonDetailScreen />
                ) : (
                    <>
                        {/* Price */}
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

                        {/* Chart — passes ticker for data fetching */}
                        <View style={styles.chartSection}>
                            <PriceChart
                                ticker={ticker}
                                height={180}
                            />
                        </View>

                        {/* Stats grid */}
                        <View style={styles.statsGrid}>
                            {[
                                { label: 'VOLUME',     value: stockData?.volume     ? formatVolume(stockData.volume) : '—' },
                                { label: 'DAY RANGE',  value: stockData?.low && stockData?.high ? `$${stockData.low.toFixed(0)}–$${stockData.high.toFixed(0)}` : '—' },
                                { label: 'OPEN',       value: stockData?.open       ? `$${stockData.open.toFixed(2)}` : '—' },
                                { label: 'PREV CLOSE', value: stockData?.prevclose  ? `$${stockData.prevclose.toFixed(2)}` : '—' },
                            ].map(({ label, value }) => (
                                <View key={label} style={styles.statCard}>
                                    <Text style={styles.statLabel}>{label}</Text>
                                    <Text style={styles.statValue}>{value}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Options chain */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Options Chain</Text>
                            <Text style={styles.sectionSubtitle}>Sorted by Open Interest</Text>
                        </View>

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

                        {filteredOptions.length > 0 && (
                            <View style={styles.columnHeader}>
                                <Text style={[styles.columnLabel, { flex: 2 }]}>STRIKE / EXP</Text>
                                <Text style={[styles.columnLabel, { flex: 1, textAlign: 'center' }]}>OI</Text>
                                <Text style={[styles.columnLabel, { flex: 1, textAlign: 'center' }]}>VOL</Text>
                                <Text style={[styles.columnLabel, { flex: 1, textAlign: 'right' }]}>LAST</Text>
                            </View>
                        )}

                        {filteredOptions.length > 0 ? (
                            filteredOptions.slice(0, 20).map(item => {
                                const isCall = item.option_type === 'call';
                                return (
                                    <View key={item.symbol} style={styles.optionRow}>
                                        <View style={{ flex: 2 }}>
                                            <View style={styles.strikeRow}>
                                                <Text style={styles.optionStrike}>${item.strike}</Text>
                                                <View style={[styles.typeBadge, { backgroundColor: isCall ? '#10b98115' : '#ef444415' }]}>
                                                    <Text style={[styles.typeBadgeText, { color: isCall ? '#10b981' : '#ef4444' }]}>
                                                        {isCall ? 'C' : 'P'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.optionExp}>{item.expiration_date}</Text>
                                        </View>
                                        <Text style={[styles.optionStat, { flex: 1, textAlign: 'center' }]}>{formatOI(item.open_interest)}</Text>
                                        <Text style={[styles.optionStat, { flex: 1, textAlign: 'center' }]}>{formatVolume(item.volume)}</Text>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <Text style={styles.optionPrice}>${(item.last ?? item.ask ?? 0).toFixed(2)}</Text>
                                            <Text style={[styles.optionChange, { color: (item.change || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                                                {(item.change || 0) >= 0 ? '+' : ''}{(item.change || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.noDataText}>No options data available</Text>
                        )}

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity
                            style={styles.alertButton}
                            onPress={() => setAlertVisible(true)}
                        >
                            <Bell size={18} color="#fff" />
                            <Text style={styles.alertButtonText}>Set Price Alert</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            <PriceAlertModal
                visible={alertVisible}
                ticker={ticker}
                currentPrice={stockData?.price ?? null}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#111827' },
    center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerNav:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
    headerTitle:     { fontSize: 18, fontWeight: 'bold', color: '#f9fafb' },
    backButton:      { padding: 4 },
    bellButton:      { padding: 4 },
    scrollContent:   { paddingBottom: 60 },
    priceSection:    { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
    companyName:     { fontSize: 16, color: '#9ca3af', fontWeight: '500', marginBottom: 8 },
    priceValue:      { fontSize: 42, fontWeight: '800', color: '#f9fafb', marginBottom: 8 },
    priceChangeRow:  { flexDirection: 'row', alignItems: 'center' },
    priceChangeText: { fontSize: 16, fontWeight: 'bold', marginLeft: 4, marginRight: 8 },
    todayLabel:      { fontSize: 14, color: '#6b7280' },
    chartSection:    { paddingHorizontal: 20, marginBottom: 28 },
    statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32, paddingHorizontal: 20 },
    statCard:        { width: '47.5%', backgroundColor: '#1f2937', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#374151' },
    statLabel:       { fontSize: 10, fontWeight: '800', color: '#6b7280', letterSpacing: 1, marginBottom: 4 },
    statValue:       { fontSize: 16, fontWeight: '700', color: '#f9fafb' },
    sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, paddingHorizontal: 20 },
    sectionTitle:    { fontSize: 20, fontWeight: 'bold', color: '#f9fafb' },
    sectionSubtitle: { fontSize: 12, color: '#6b7280' },
    filterRow:       { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 20 },
    filterPill:      { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    filterPillActive:     { backgroundColor: '#3b82f620', borderColor: '#3b82f6' },
    filterPillText:       { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    filterPillTextActive: { color: '#3b82f6' },
    columnHeader:    { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#374151', marginBottom: 4 },
    columnLabel:     { fontSize: 10, fontWeight: '800', color: '#4b5563', letterSpacing: 0.8 },
    optionRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
    strikeRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
    optionStrike:    { fontSize: 16, fontWeight: '700', color: '#f9fafb' },
    typeBadge:       { width: 20, height: 20, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
    typeBadgeText:   { fontSize: 10, fontWeight: '900' },
    optionExp:       { fontSize: 12, color: '#6b7280', marginTop: 3 },
    optionStat:      { fontSize: 14, fontWeight: '600', color: '#d1d5db' },
    optionPrice:     { fontSize: 14, fontWeight: '700', color: '#f9fafb' },
    optionChange:    { fontSize: 11, fontWeight: '600', marginTop: 2 },
    noDataText:      { color: '#6b7280', textAlign: 'center', marginTop: 20, fontSize: 15, paddingHorizontal: 20 },
    errorText:       { color: '#ef4444', textAlign: 'center', marginTop: 12, paddingHorizontal: 20, fontSize: 13 },
    alertButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', height: 56, borderRadius: 16, marginTop: 40, marginHorizontal: 20, marginBottom: 20 },
    alertButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default TradeDetailScreen;