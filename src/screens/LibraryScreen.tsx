import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    FlatList,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { useWatchlist } from '../context/WatchlistContext';
import { Trash2, Eye } from 'lucide-react-native';

const LibraryScreen = ({ navigation }: any) => {
    const { watchlist, addTicker, removeTicker } = useWatchlist();
    const [newTicker, setNewTicker] = useState('');

    const handleAddTicker = async () => {
        if (!newTicker) return;
        const added = await addTicker(newTicker);
        if (added) {
            setNewTicker('');
        } else {
            Alert.alert('Info', `${newTicker.toUpperCase()} is already in your watchlist`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Library</Text>
                <Text style={styles.subtitle}>Watchlist & Alerts</Text>
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter ticker..."
                    placeholderTextColor="#6b7280"
                    value={newTicker}
                    onChangeText={setNewTicker}
                    autoCapitalize="characters"
                    onSubmitEditing={handleAddTicker}
                    returnKeyType="done"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddTicker}>
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={watchlist}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <View style={styles.watchlistCard}>
                        <View>
                            <Text style={styles.watchlistText}>{item}</Text>
                            <Text style={styles.alertStatus}>🔔 Alerts ON</Text>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => navigation.navigate('TradeDetail', { ticker: item })}
                            >
                                <Eye size={18} color="#f9fafb" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeTicker(item)}
                            >
                                <Trash2 size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Watchlist is empty</Text>
                        <Text style={styles.infoText}>Add tickers to receive unusual flow alerts</Text>
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
    inputRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    input: {
        flex: 1,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#f9fafb',
        fontSize: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#374151',
    },
    addButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 120,
    },
    watchlistCard: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    watchlistText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f9fafb',
    },
    alertStatus: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
        marginTop: 4,
    },
    cardActions: {
        flexDirection: 'row',
    },
    viewButton: {
        backgroundColor: '#374151',
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    removeButton: {
        backgroundColor: '#ef444420',
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    infoText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default LibraryScreen;