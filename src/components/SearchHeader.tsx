import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface SearchHeaderProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmitEditing?: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ value, onChangeText, onSubmitEditing }) => {
    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Search size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Search by ticker (e.g. TSLA)"
                    placeholderTextColor="#6b7280"
                    value={value}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmitEditing}
                    returnKeyType="search"
                    autoCapitalize="characters"
                    autoCorrect={false}
                />
                {value.length > 0 ? (
                    <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
                        <X size={18} color="#6b7280" />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        backgroundColor: '#111827',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        color: '#f9fafb',
        fontSize: 16,
        fontWeight: '500',
    },
    clearButton: {
        padding: 4,
    },
});

export default SearchHeader;
