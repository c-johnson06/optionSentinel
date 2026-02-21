import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WatchlistContextType {
    watchlist: string[];
    addTicker: (ticker: string) => Promise<boolean>;
    removeTicker: (ticker: string) => Promise<void>;
    loading: boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch watchlist from Supabase when user changes
    useEffect(() => {
        if (user) {
            fetchWatchlist();
        } else {
            setWatchlist(['AAPL', 'TSLA', 'NVDA']); // Default for guest
        }
    }, [user]);

    const fetchWatchlist = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('watchlists')
                .select('ticker')
                .eq('user_id', user?.id);

            if (error) throw error;
            if (data) {
                setWatchlist(data.map(item => item.ticker));
            }
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const addTicker = async (ticker: string) => {
        const symbol = ticker.toUpperCase().trim();
        if (!symbol) return false;
        if (watchlist.includes(symbol)) return false;

        // Optimistic Update
        setWatchlist((prev) => [...prev, symbol]);

        if (user) {
            try {
                const { error } = await supabase
                    .from('watchlists')
                    .insert([{ user_id: user.id, ticker: symbol }]);
                
                if (error) throw error;
            } catch (error) {
                console.error('Error adding to DB:', error);
                // Rollback on error
                setWatchlist((prev) => prev.filter(t => t !== symbol));
                return false;
            }
        }
        return true;
    };

    const removeTicker = async (ticker: string) => {
        // Optimistic Update
        setWatchlist((prev) => prev.filter((t) => t !== ticker));

        if (user) {
            try {
                const { error } = await supabase
                    .from('watchlists')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('ticker', ticker);
                
                if (error) throw error;
            } catch (error) {
                console.error('Error removing from DB:', error);
                // Rollback on error
                setWatchlist((prev) => [...prev, ticker]);
            }
        }
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, addTicker, removeTicker, loading }}>
            {children}
        </WatchlistContext.Provider>
    );
};

export const useWatchlist = () => {
    const context = useContext(WatchlistContext);
    if (context === undefined) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
};
