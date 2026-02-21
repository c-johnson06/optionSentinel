import React from 'react';
import { StatusBar, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Activity, Search, Bookmark, User } from 'lucide-react-native';

import FeedScreen from './src/screens/FeedScreen';
import TradeDetailScreen from './src/screens/TradeDetailScreen';
import SearchScreen from './src/screens/SearchScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import AccountScreen from './src/screens/AccountScreen';
import { WatchlistProvider } from './src/context/WatchlistContext';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const FeedStack = () => (
    <Stack.Navigator 
        screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: '#111827' },
            animation: 'slide_from_right'
        }}
    >
        <Stack.Screen name="FeedMain" component={FeedScreen} />
        <Stack.Screen name="TradeDetail" component={TradeDetailScreen} />
    </Stack.Navigator>
);

const SearchStack = () => (
    <Stack.Navigator 
        screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: '#111827' },
            animation: 'slide_from_right'
        }}
    >
        <Stack.Screen name="SearchMain" component={SearchScreen} />
        <Stack.Screen name="TradeDetail" component={TradeDetailScreen} />
    </Stack.Navigator>
);

const LibraryStack = () => (
    <Stack.Navigator 
        screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: '#111827' },
            animation: 'slide_from_right'
        }}
    >
        <Stack.Screen name="LibraryMain" component={LibraryScreen} />
        <Stack.Screen name="Search" component={SearchStack} />
        <Stack.Screen name="TradeDetail" component={TradeDetailScreen} />
    </Stack.Navigator>
);

const App = () => {
    return (
        <AuthProvider>
            <WatchlistProvider>
                <SafeAreaProvider>
                    <View style={{ flex: 1, backgroundColor: '#111827' }}>
                    <StatusBar 
                        barStyle="light-content" 
                        backgroundColor="#111827"
                        translucent={false}
                    />
                    <NavigationContainer theme={{
                        dark: true,
                        colors: {
                            primary: '#3b82f6',
                            background: '#111827',
                            card: '#1f2937',
                            text: '#f9fafb',
                            border: '#374151',
                            notification: '#ef4444',
                        },
                        fonts: {
                            regular: {
                                fontFamily: 'System',
                                fontWeight: '400',
                            },
                            medium: {
                                fontFamily: 'System',
                                fontWeight: '500',
                            },
                            bold: {
                                fontFamily: 'System',
                                fontWeight: '700',
                            },
                            heavy: {
                                fontFamily: 'System',
                                fontWeight: '900',
                            },
                        }
                    }}>
                        <Tab.Navigator
                            screenOptions={({ route }) => ({
                                headerShown: false,
                                tabBarIcon: ({ color, size, focused }) => {
                                    let IconComponent;
                                    if (route.name === 'Feed') IconComponent = Activity;
                                    else if (route.name === 'Search') IconComponent = Search;
                                    else if (route.name === 'Library') IconComponent = Bookmark;
                                    else if (route.name === 'Account') IconComponent = User;

                                    return (
                                        <View style={[
                                            styles.iconContainer,
                                            focused && styles.activeIconContainer
                                        ]}>
                                            {IconComponent && <IconComponent size={size} color={color} strokeWidth={focused ? 2.5 : 2} />}
                                        </View>
                                    );
                                },
                                tabBarStyle: styles.tabBar,
                                tabBarItemStyle: {
                                    paddingTop: 17,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                },

                                tabBarActiveTintColor: '#3b82f6',
                                tabBarInactiveTintColor: '#6b7280',
                                tabBarShowLabel: false,
                            })}
                        >
                            <Tab.Screen name="Feed" component={FeedStack} />
                            <Tab.Screen name="Search" component={SearchStack} />
                            <Tab.Screen name="Library" component={LibraryStack} />
                            <Tab.Screen name="Account" component={AccountScreen} />
                        </Tab.Navigator>
                    </NavigationContainer>
                </View>
            </SafeAreaProvider>
        </WatchlistProvider>
        </AuthProvider>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: '#1f2937',
        borderRadius: 24,
        height: 72,
        paddingBottom: 0,
        borderTopWidth: 0,
        // Elevation for Android
        elevation: 12,
        // Shadows for iOS
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
        borderWidth: 1,
        borderColor: '#374151',
    },
    iconContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    activeIconContainer: {
        backgroundColor: '#3b82f615',
    }
});

export default App;
