/**
 * PriceAlertModal
 *
 * Bottom-sheet modal for setting a price alert on a stock.
 * Writes to the `price_alerts` Supabase table.
 *
 * Required Supabase table (run in the SQL editor):
 *
 *   create table public.price_alerts (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid references auth.users(id) on delete cascade not null,
 *     ticker      text not null,
 *     target      numeric not null,
 *     direction   text not null check (direction in ('above', 'below')),
 *     triggered   boolean not null default false,
 *     created_at  timestamptz not null default now()
 *   );
 *
 *   alter table public.price_alerts enable row level security;
 *
 *   create policy "Users manage own alerts"
 *     on public.price_alerts
 *     for all
 *     using (auth.uid() = user_id)
 *     with check (auth.uid() = user_id);
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { X, Bell, Trash2, TrendingUp, TrendingDown } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PriceAlert {
    id: string;
    ticker: string;
    target: number;
    direction: 'above' | 'below';
    triggered: boolean;
    created_at: string;
}

interface PriceAlertModalProps {
    visible: boolean;
    ticker: string;
    currentPrice: number | null;
    onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
    visible,
    ticker,
    currentPrice,
    onClose,
}) => {
    const { user } = useAuth();
    const [targetInput, setTargetInput] = useState('');
    const [direction, setDirection] = useState<'above' | 'below'>('above');
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    useEffect(() => {
        if (visible && user) fetchAlerts();
    }, [visible, user]);

    const fetchAlerts = async () => {
        setLoadingAlerts(true);
        try {
            const { data, error } = await supabase
                .from('price_alerts')
                .select('*')
                .eq('user_id', user!.id)
                .eq('ticker', ticker)
                .eq('triggered', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAlerts(data ?? []);
        } catch (e) {
            console.error('Error fetching alerts:', e);
        } finally {
            setLoadingAlerts(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            Alert.alert('Sign in required', 'Please sign in to set price alerts.');
            return;
        }

        const target = parseFloat(targetInput);
        if (isNaN(target) || target <= 0) {
            Alert.alert('Invalid price', 'Please enter a valid target price.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('price_alerts')
                .insert({
                    user_id: user.id,
                    ticker,
                    target,
                    direction,
                    triggered: false,
                });

            if (error) throw error;

            setTargetInput('');
            await fetchAlerts();
            Alert.alert('Alert set', `You'll be notified when ${ticker} goes ${direction} $${target.toFixed(2)}.`);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to save alert.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (alertId: string) => {
        try {
            const { error } = await supabase
                .from('price_alerts')
                .delete()
                .eq('id', alertId);

            if (error) throw error;
            setAlerts(prev => prev.filter(a => a.id !== alertId));
        } catch (e) {
            console.error('Error deleting alert:', e);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.sheetWrapper}
            >
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Bell size={20} color="#3b82f6" />
                            <Text style={styles.title}>Price Alerts · {ticker}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Current price chip */}
                    {currentPrice != null && (
                        <Text style={styles.currentPrice}>
                            Current: <Text style={styles.currentPriceValue}>${currentPrice.toFixed(2)}</Text>
                        </Text>
                    )}

                    {/* ── Alert builder ── */}
                    <View style={styles.builderSection}>
                        {/* Direction toggle */}
                        <View style={styles.directionRow}>
                            <TouchableOpacity
                                style={[
                                    styles.directionPill,
                                    direction === 'above' && styles.directionPillActiveGreen,
                                ]}
                                onPress={() => setDirection('above')}
                            >
                                <TrendingUp
                                    size={14}
                                    color={direction === 'above' ? '#10b981' : '#6b7280'}
                                />
                                <Text style={[
                                    styles.directionPillText,
                                    direction === 'above' && styles.directionPillTextGreen,
                                ]}>
                                    Rises above
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.directionPill,
                                    direction === 'below' && styles.directionPillActiveRed,
                                ]}
                                onPress={() => setDirection('below')}
                            >
                                <TrendingDown
                                    size={14}
                                    color={direction === 'below' ? '#ef4444' : '#6b7280'}
                                />
                                <Text style={[
                                    styles.directionPillText,
                                    direction === 'below' && styles.directionPillTextRed,
                                ]}>
                                    Falls below
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Price input + save */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.dollarSign}>$</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    placeholderTextColor="#4b5563"
                                    keyboardType="decimal-pad"
                                    value={targetInput}
                                    onChangeText={setTargetInput}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.saveButtonText}>Set Alert</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Existing alerts ── */}
                    <Text style={styles.existingTitle}>Active Alerts</Text>

                    {!user ? (
                        <Text style={styles.emptyText}>Sign in to view your alerts</Text>
                    ) : loadingAlerts ? (
                        <ActivityIndicator color="#3b82f6" style={styles.loader} />
                    ) : alerts.length === 0 ? (
                        <Text style={styles.emptyText}>No active alerts for {ticker}</Text>
                    ) : (
                        <FlatList
                            data={alerts}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <View style={styles.alertRow}>
                                    <View style={[
                                        styles.alertDirectionDot,
                                        { backgroundColor: item.direction === 'above' ? '#10b98120' : '#ef444420' }
                                    ]}>
                                        {item.direction === 'above'
                                            ? <TrendingUp size={12} color="#10b981" />
                                            : <TrendingDown size={12} color="#ef4444" />
                                        }
                                    </View>
                                    <Text style={styles.alertText}>
                                        {item.direction === 'above' ? 'Above' : 'Below'}{' '}
                                        <Text style={styles.alertTarget}>${item.target.toFixed(2)}</Text>
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item.id)}
                                        style={styles.deleteButton}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Trash2 size={14} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#00000080',
    },
    sheetWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    sheet: {
        backgroundColor: '#1f2937',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderColor: '#374151',
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#374151',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#f9fafb',
    },
    closeButton: {
        padding: 4,
    },
    currentPrice: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 20,
    },
    currentPriceValue: {
        color: '#e5e7eb',
        fontWeight: '700',
    },
    builderSection: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#374151',
    },
    directionRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    directionPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#374151',
    },
    directionPillActiveGreen: {
        backgroundColor: '#10b98115',
        borderColor: '#10b981',
    },
    directionPillActiveRed: {
        backgroundColor: '#ef444415',
        borderColor: '#ef4444',
    },
    directionPillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    directionPillTextGreen: { color: '#10b981' },
    directionPillTextRed: { color: '#ef4444' },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#374151',
        height: 52,
    },
    dollarSign: {
        color: '#6b7280',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 4,
    },
    input: {
        flex: 1,
        color: '#f9fafb',
        fontSize: 18,
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingHorizontal: 20,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    existingTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    emptyText: {
        color: '#4b5563',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 12,
    },
    loader: {
        paddingVertical: 12,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        gap: 10,
    },
    alertDirectionDot: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertText: {
        flex: 1,
        fontSize: 15,
        color: '#d1d5db',
        fontWeight: '500',
    },
    alertTarget: {
        color: '#f9fafb',
        fontWeight: '700',
    },
    deleteButton: {
        padding: 4,
    },
});

export default PriceAlertModal;