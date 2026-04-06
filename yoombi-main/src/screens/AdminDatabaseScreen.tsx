import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { ChevronLeft, Database, Search, Filter, Code, User, Store } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { restaurantService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AdminDatabaseScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }
    const [view, setView] = useState<'restaurants' | 'users'>('restaurants');
    const [data, setData] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (view === 'restaurants') {
            restaurantService.getAll().then(res => setData(res.data || res || [])).catch(()=>setData([]));
        } else {
            setData([]); // Auth users would query userService if fully implemented
        }
    }, [view]);

    const renderRestaurantItem = ({ item }: any) => (
        <View style={[styles.dataCard, { shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.idBadge, { backgroundColor: isDark ? 'rgba(197, 160, 89, 0.1)' : 'rgba(197, 160, 89, 0.2)' }]}>
                    <Text style={[styles.idText, { color: colors.secondary }]}>ID: {item.id}</Text>
                </View>
                <Code size={14} color={colors.secondary} />
            </View>
            <Text style={[styles.dataName, { color: colors.white }]}>{item.name}</Text>
            <Text style={[styles.dataPath, { color: isDark ? '#94A3B8' : '#64748B' }]}>API -{'>'} Database[{item.id}]</Text>

            <View style={[styles.jsonPreview, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.5)' }]}>
                <Text style={[styles.jsonText, { color: isDark ? '#7DD3FC' : '#38BDF8' }]}>
                    {JSON.stringify({
                        area: item.area,
                        cuisine: item.cuisine,
                        rating: item.rating,
                        reviews: item.reviewCount
                    }, null, 2)}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Database color={colors.secondary} size={20} />
                    <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Database Explorer</Text>
                </View>
                <TouchableOpacity>
                    <Search color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            <View style={[styles.filterBar, { backgroundColor: colors.white, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity
                    style={[styles.filterBtn, { backgroundColor: colors.background }, view === 'restaurants' && { backgroundColor: colors.primary }]}
                    onPress={() => setView('restaurants')}
                >
                    <Store size={14} color={view === 'restaurants' ? (isDark ? colors.secondary : colors.white) : colors.textSecondary} />
                    <Text style={[styles.filterText, { color: colors.textSecondary }, view === 'restaurants' && { color: isDark ? colors.secondary : colors.white }]}>Restaurants ({view === 'restaurants' ? data.length : 0})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterBtn, { backgroundColor: colors.background }, view === 'users' && { backgroundColor: colors.primary }]}
                    onPress={() => setView('users')}
                >
                    <User size={14} color={view === 'users' ? (isDark ? colors.secondary : colors.white) : colors.textSecondary} />
                    <Text style={[styles.filterText, { color: colors.textSecondary }, view === 'users' && { color: isDark ? colors.secondary : colors.white }]}>Auth Users</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={renderRestaurantItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={[styles.resultsInfo, { color: colors.textSecondary }]}>Showing raw objects from local data services</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No user records found in current session context.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterBar: {
        flexDirection: 'row',
        padding: 16,
        gap: 10,
        borderBottomWidth: 1,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
    },
    listHeader: {
        marginBottom: 16,
    },
    resultsInfo: {
        ...TYPOGRAPHY.bodySmall,
        fontStyle: 'italic',
    },
    dataCard: {
        backgroundColor: '#1E293B', // Always dark/code-like
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    idBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    idText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    dataName: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
    },
    dataPath: {
        fontSize: 10,
        marginTop: 4,
        fontFamily: 'monospace',
    },
    jsonPreview: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
    },
    jsonText: {
        fontSize: 11,
        fontFamily: 'monospace',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        ...TYPOGRAPHY.bodySmall,
        textAlign: 'center',
    },
});

export default AdminDatabaseScreen;
