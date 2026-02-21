/**
 * SkeletonLoader
 *
 * Animated shimmer placeholder used while data is loading.
 * Uses React Native's Animated API — no external dependencies.
 *
 * Usage:
 *   <SkeletonLoader width={200} height={20} borderRadius={6} />
 *   <SkeletonTradeCard />
 *   <SkeletonDetailScreen />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Base shimmer block ────────────────────────────────────────────────────

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: object;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 16,
    borderRadius = 6,
    style,
}) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [shimmer]);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#374151',
                    opacity,
                },
                style,
            ]}
        />
    );
};

// ─── Trade card skeleton ───────────────────────────────────────────────────

export const SkeletonTradeCard: React.FC = () => (
    <View style={styles.card}>
        {/* Header row: ticker + sentiment badge + premium */}
        <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
                <SkeletonLoader width={64} height={24} borderRadius={6} />
                <SkeletonLoader width={72} height={20} borderRadius={6} style={styles.ml8} />
            </View>
            <SkeletonLoader width={56} height={28} borderRadius={8} />
        </View>

        {/* Detail grid: 4 items, 2 per row */}
        <View style={styles.detailGrid}>
            {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.detailItem}>
                    <SkeletonLoader width={48} height={10} borderRadius={4} />
                    <SkeletonLoader width={80} height={16} borderRadius={4} style={styles.mt4} />
                </View>
            ))}
        </View>
    </View>
);

// ─── Detail screen skeleton ────────────────────────────────────────────────

export const SkeletonDetailScreen: React.FC = () => (
    <View style={styles.detailContainer}>
        {/* Company name + price */}
        <SkeletonLoader width={160} height={16} borderRadius={6} />
        <SkeletonLoader width={140} height={48} borderRadius={8} style={styles.mt12} />
        <SkeletonLoader width={120} height={18} borderRadius={6} style={styles.mt8} />

        {/* Stats grid */}
        <View style={styles.statsGrid}>
            {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.statCard}>
                    <SkeletonLoader width={56} height={10} borderRadius={4} />
                    <SkeletonLoader width='80%' height={18} borderRadius={4} style={styles.mt6} />
                </View>
            ))}
        </View>

        {/* Section title */}
        <SkeletonLoader width={130} height={22} borderRadius={6} style={styles.mt32} />

        {/* Filter pills */}
        <View style={styles.filterRow}>
            {[60, 60, 52].map((w, i) => (
                <SkeletonLoader key={i} width={w} height={32} borderRadius={20} style={styles.mr8} />
            ))}
        </View>

        {/* Option rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.optionRow}>
                <View style={{ flex: 2 }}>
                    <SkeletonLoader width={72} height={16} borderRadius={4} />
                    <SkeletonLoader width={56} height={12} borderRadius={4} style={styles.mt4} />
                </View>
                <SkeletonLoader width={40} height={16} borderRadius={4} />
                <SkeletonLoader width={40} height={16} borderRadius={4} />
                <SkeletonLoader width={44} height={16} borderRadius={4} />
            </View>
        ))}
    </View>
);

// ─── Feed screen skeleton (stacked cards) ─────────────────────────────────

export const SkeletonFeed: React.FC = () => (
    <View style={styles.feedContainer}>
        {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonTradeCard key={i} />
        ))}
    </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // TradeCard
    card: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailItem: {
        width: '47%',
        marginBottom: 8,
    },

    // Detail screen
    detailContainer: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 24,
    },
    statCard: {
        width: '47.5%',
        backgroundColor: '#1f2937',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#374151',
    },
    filterRow: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },

    // Feed
    feedContainer: {
        paddingTop: 4,
    },

    // Spacing utilities
    ml8: { marginLeft: 8 },
    mt4: { marginTop: 4 },
    mt6: { marginTop: 6 },
    mt8: { marginTop: 8 },
    mt12: { marginTop: 12 },
    mt32: { marginTop: 32 },
    mr8: { marginRight: 8 },
});