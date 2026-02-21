import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    FlatList,
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Plus, Check } from 'lucide-react-native';
import { searchSymbols } from '../services/api';
import SearchHeader from '../components/SearchHeader';
import { useWatchlist } from '../context/WatchlistContext';

const SearchScreen = ({ navigation }: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { watchlist, addTicker } = useWatchlist();

    // Robinhood-style search: results appear as you type
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const performSearch = async (query: string) => {
        setLoading(true);
        try {
            const results = await searchSymbols(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStock = (ticker: string) => {
        // Navigate to detail screen which will show price and options
        navigation.navigate('TradeDetail', { ticker });
    };

    const handleAddToWatchlist = async (item: any) => {
        const added = await addTicker(item.symbol);
        if (added) {
            Alert.alert('Success', `${item.symbol} added to watchlist`);
        } else {
            Alert.alert('Info', `${item.symbol} is already in your watchlist`);
        }
    };

    const renderStockItem = ({ item }: { item: any }) => {
        const isAdded = watchlist.includes(item.symbol);
        return (
            <TouchableOpacity 
                style={styles.stockResultItem}
                onPress={() => handleSelectStock(item.symbol)}
            >
                <View style={styles.stockTextContainer}>
                    <Text style={styles.stockSymbolText}>{item.symbol}</Text>
                    <Text style={styles.stockDescriptionText} numberOfLines={1}>
                        {item.description}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.plusIconContainer}
                    onPress={() => handleAddToWatchlist(item)}
                    disabled={isAdded}
                >
                    {isAdded ? (
                        <Check size={22} color="#10b981" />
                    ) : (
                        <Plus size={22} color="#3b82f6" />
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Search</Text>
                <Text style={styles.subtitle}>Discover stocks and options</Text>
            </View>
            
            <SearchHeader 
                value={searchQuery} 
                onChangeText={setSearchQuery}
            />

            {loading && searchQuery.length >= 2 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.symbol}
                    renderItem={renderStockItem}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        searchQuery.length >= 2 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.infoText}>Start typing to search symbols</Text>
                            </View>
                        )
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
    stockResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    stockTextContainer: {
        flex: 1,
    },
    stockSymbolText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    stockDescriptionText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 2,
    },
    plusIconContainer: {
        padding: 8,
    },
    listContent: {
        paddingBottom: 120,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '500',
    },
    infoText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default SearchScreen;
