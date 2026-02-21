import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    FlatList,
    View,
    Text,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { useFlowFeed } from '../hooks/useFlowFeed';
import TradeCard from '../components/TradeCard';

const FeedScreen = ({ navigation }: any) => {
    const { trades, connected, lastUpdated, refreshing, refresh } = useFlowFeed();

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

            {lastUpdated && (
                <Text style={styles.lastUpdated}>Updated {formattedTime}</Text>
            )}

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
                        onRefresh={refresh}
                        tintColor="#3b82f6"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {connected ? 'No unusual flow detected' : 'Connecting to live feed...'}
                        </Text>
                        <Text style={styles.infoText}>
                            {connected
                                ? 'Whales are quiet right now. Pull to refresh.'
                                : 'This will populate automatically when connected.'}
                        </Text>
                    </View>
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