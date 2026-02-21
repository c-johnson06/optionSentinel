import React, { useState, useMemo } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    FlatList,
    View,
    Text,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { Wifi, WifiOff, Bookmark } from 'lucide-react-native';
import { useFlowFeed } from '../hooks/useFlowFeed';
import { useWatchlist } from '../context/WatchlistContext';
import TradeCard from '../components/TradeCard';
import { SkeletonFeed } from '../components/SkeletonLoader';

const FeedScreen = ({ navigation }: any) => {
    const { trades, connected, lastUpdated, refreshing, refresh, sendMessage } = useFlowFeed();
    const { watchlist } = useWatchlist();
    const [filterByWatchlist, setFilterByWatchlist] = useState(false);

    // Sync subscriptions with the server for the "Premium" following feature
    React.useEffect(() => {
        if (connected && filterByWatchlist && watchlist.length > 0) {
            console.log('[Feed] Subscribing to watchlist:', watchlist);
            sendMessage({
                type: 'subscribe',
                tickers: watchlist,
                isPremium: true, // HARDCODED for demonstration; normally verified via Auth/Supabase
            });
        }
    }, [connected, filterByWatchlist, watchlist, sendMessage]);

    // Derived trades based on filter state
    const filteredTrades = useMemo(() => {
        if (!filterByWatchlist) return trades;
        return trades.filter(t => watchlist.includes(t.ticker.toUpperCase()));
    }, [trades, filterByWatchlist, watchlist]);

    // Show skeletons when connected but no data has arrived yet (first load)
    const isInitialLoad = connected && trades.length === 0 && !lastUpdated;
    // Also show skeletons briefly while disconnected and empty
    const showSkeleton = trades.length === 0 && !lastUpdated;

    const formattedTime = lastUpdated
        ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Connecting...';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Live Flow</Text>
                    <Text style={styles.subtitle}>Institutional unusual activity</Text>
                </View>
                <View style={styles.statusContainer}>
                    {connected
                        ? <Wifi size={18} color="#10b981" />
                        : <WifiOff size={18} color="#ef4444" />
                    }
                    <Text style={[styles.statusText, { color: connected ? '#10b981' : '#ef4444' }]}>
                        {connected ? 'Live' : 'Reconnecting'}
                    </Text>
                </View>
            </View>

            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterChip, !filterByWatchlist && styles.activeFilterChip]}
                    onPress={() => setFilterByWatchlist(false)}
                >
                    <Text style={[styles.filterText, !filterByWatchlist && styles.activeFilterText]}>All Flow</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.filterChip, filterByWatchlist && styles.activeFilterChip]}
                    onPress={() => setFilterByWatchlist(true)}
                >
                    <Text style={[styles.filterText, filterByWatchlist && styles.activeFilterText]}>Following</Text>
                </TouchableOpacity>
            </View>

            {lastUpdated && (
                <Text style={styles.lastUpdated}>Updated {formattedTime}</Text>
            )}

            {showSkeleton ? (
                // Skeleton feed — shown on first load before WebSocket delivers data.
                // Wrapped in ScrollView so pull-to-refresh still works.
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                            tintColor="#3b82f6"
                        />
                    }
                >
                    <SkeletonFeed />
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredTrades}
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
                            onRefresh={refresh}
                            tintColor="#3b82f6"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {filterByWatchlist ? 'No flow for your watchlist' : 'No unusual flow detected'}
                            </Text>
                            <Text style={styles.infoText}>
                                {filterByWatchlist 
                                    ? 'Try adding more tickers to your watchlist or switch to All Flow.'
                                    : 'Whales are quiet right now. Pull to refresh.'}
                            </Text>
                        </View>
                    }
                />
            )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: '#374151',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#374151',
    },
    activeFilterChip: {
        borderColor: '#3b82f660',
        backgroundColor: '#3b82f610',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    activeFilterText: {
        color: '#3b82f6',
    },
    lastUpdated: {
        fontSize: 12,
        color: '#4b5563',
        marginBottom: 12,
    },
    listContent: {
        paddingBottom: 120,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    infoText: {
        color: '#4b5563',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default FeedScreen;