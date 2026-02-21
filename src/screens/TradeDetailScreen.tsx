import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    FlatList,
    Dimensions
} from 'react-native';
import { OptionsTrade, OptionContract } from '../types';
import { fetchStockPrice, fetchOptionsExpirations, fetchOptionChain } from '../services/api';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TradeDetailScreen = ({ route, navigation }: any) => {
    const { trade, ticker: passedTicker } = route.params;
    const ticker = passedTicker || trade?.ticker;
    
    const [stockData, setStockData] = useState<any>(null);
    const [options, setOptions] = useState<OptionContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                setOptions(chain);
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
                    <Text style={styles.companyName}>{stockData?.description || 'Loading...'}</Text>
                    <Text style={styles.priceValue}>${stockData?.price?.toFixed(2) || '0.00'}</Text>
                    <View style={styles.priceChangeRow}>
                        {isPositive ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />}
                        <Text style={[styles.priceChangeText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
                            {isPositive ? '+' : ''}{stockData?.change?.toFixed(2)} ({stockData?.changePercent?.toFixed(2)}%)
                        </Text>
                        <Text style={styles.todayLabel}>Today</Text>
                    </View>
                </View>

                {/* Statistics Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>MARKET CAP</Text>
                        <Text style={styles.statValue}>---</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>VOL (24H)</Text>
                        <Text style={styles.statValue}>---</Text>
                    </View>
                </View>

                {/* Options Chain Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Options Chain</Text>
                    <Text style={styles.sectionSubtitle}>Next Expiration</Text>
                </View>

                {/* Simple List of Options */}
                {options.length > 0 ? (
                    options.slice(0, 10).map((item) => (
                        <View key={item.symbol} style={styles.optionRow}>
                            <View style={styles.optionInfo}>
                                <Text style={styles.optionStrike}>${item.strike} {item.option_type.toUpperCase()}</Text>
                                <Text style={styles.optionExp}>{item.expiration_date}</Text>
                            </View>
                            <View style={styles.optionPricing}>
                                <Text style={styles.optionPrice}>${(item.last ?? item.ask ?? 0).toFixed(2)}</Text>
                                <Text style={[styles.optionChange, { color: (item.change || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                                    {(item.change || 0) >= 0 ? '+' : ''}{(item.change || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>No options data available</Text>
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
        marginBottom: 32,
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
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1f2937',
        padding: 16,
        borderRadius: 16,
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
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
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
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    optionInfo: {
        flex: 1,
    },
    optionStrike: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    optionExp: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    optionPricing: {
        alignItems: 'flex-end',
    },
    optionPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    optionChange: {
        fontSize: 12,
        marginTop: 2,
    },
    noDataText: {
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 20,
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
