import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Switch,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AccountScreen = () => {
    const { user, session, loading: authLoading, signOut } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        const { error, data: { user: newUser } } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else if (!newUser) {
            Alert.alert('Success', 'Confirmation email sent!');
        } else {
            Alert.alert('Success', 'Account created! Please verify your email.');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        setLoading(true);
        await signOut();
        setLoading(false);
    };

    if (authLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Account</Text>
                        <Text style={styles.subtitle}>Sign in to save your watchlist</Text>
                    </View>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#6b7280"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#6b7280"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <TouchableOpacity 
                            style={styles.primaryButton} 
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.secondaryButton}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Text style={styles.secondaryButtonText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome!</Text>
                    <Text style={styles.subtitle}>{user.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Subscription</Text>
                    <View style={styles.card}>
                        <View>
                            <Text style={styles.cardTitle}>Free Plan</Text>
                            <Text style={styles.cardDesc}>Basic unusual flow updates</Text>
                        </View>
                        <TouchableOpacity style={styles.upgradeButton}>
                            <Text style={styles.upgradeButtonText}>Upgrade</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Push Notifications</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#374151', true: '#3b82f6' }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.logoutButton} 
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#ef4444" /> : <Text style={styles.logoutButtonText}>Log Out</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    form: {
        marginTop: 20,
    },
    input: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#f9fafb',
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#374151',
    },
    primaryButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginTop: 30,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f9fafb',
    },
    cardDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    upgradeButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    logoutButton: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    logoutButtonText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default AccountScreen;
