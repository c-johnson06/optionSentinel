import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    FlatList,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { scanForUnusualFlow } from '../services/api';
import TradeCard from '../components/TradeCard';

const FeedScreen = ({ navigation }: any) => {
    const [trades, setTrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // List of tickers we'll scan for the "Live Feed"
    const TICKERS_TO_SCAN = ['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL', 'MSFT'];

    useEffect(() => {
        loadFlow();
    }, []);

    const loadFlow = async () => {
        setLoading(true);
        try {
            // In parallel, scan all our target tickers
            const scanPromises = TICKERS_TO_SCAN.map(ticker => scanForUnusualFlow(ticker));
            const results = await Promise.all(scanPromises);
            
            // Flatten the array of arrays and sort by premium (highest first)
            const allUnusualTrades = results.flat().sort((a, b) => b.premium - a.premium);
            
            setTrades(allUnusualTrades);
        } catch (error) {
            console.error('Error loading flow feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadFlow();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Live Flow</Text>
                    <Text style={styles.subtitle}>Institutional unusual activity</Text>
                </View>
                {loading && !refreshing && <ActivityIndicator color="#3b82f6" />}
            </View>

            <FlatList
                data={trades}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => navigation.navigate('TradeDetail', { trade: item })}>
                        <TradeCard trade={item} />
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor="#3b82f6" 
                    />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No unusual flow detected</Text>
                            <Text style={styles.infoText}>Whales are quiet right now. Try refreshing later.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
        paddingHorizontal: 16,
    },
    header: {
        paddingVertical: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#f9fafb',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginTop: 4,
    },
    listContent: {
        paddingBottom: 120, // Space for floating tab bar
    },
});

export default FeedScreen;
