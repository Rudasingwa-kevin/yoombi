import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ChevronLeft, Store, CheckCircle, XCircle, Info, Calendar, User, Trash2, Flame } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { restaurantService, adminService } from '../services/api';
import { RestaurantDTO } from '../types/dto';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AdminRestaurantModerationScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }
    const [items, setItems] = useState<RestaurantDTO[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchRestaurants = async () => {
        setIsLoading(true);
        try {
            const res = await restaurantService.getAll();
            setItems(res || []);
        } catch (e) {
            console.warn('[AdminRestaurantModeration] Failed to fetch restaurants:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const filteredItems = showAll ? items : items.filter(r => !r.isApproved);

    const handleApprove = (id: string, name: string) => {
        Alert.alert(
            'Approve Restaurant',
            `Are you sure you want to approve "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await restaurantService.approve(id);
                            fetchRestaurants();
                        } catch (e) { Alert.alert('Error', 'Failed to approve restaurant.'); }
                    },
                    style: 'default'
                },
            ]
        );
    };

    const handleReject = (id: string, name: string) => {
        Alert.alert(
            'Reject Application',
            `Are you sure you want to reject "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    onPress: async () => {
                        try {
                            await restaurantService.reject(id);
                            fetchRestaurants();
                        } catch (e) { Alert.alert('Error', 'Failed to reject restaurant.'); }
                    },
                    style: 'destructive'
                },
            ]
        );
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete Restaurant',
            `Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone and will remove all menu items and reviews.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    onPress: async () => {
                        try {
                            await adminService.deleteRestaurant(id);
                            fetchRestaurants();
                        } catch (e) { Alert.alert('Error', 'Failed to delete restaurant.'); }
                    },
                    style: 'destructive'
                },
            ]
        );
    };

    const handleManage = (id: string, name: string) => {
        Alert.alert(
            'Manage Restaurant',
            'Select an area to manage as an Admin:',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Profile Settings', onPress: () => navigation.navigate('ManageRestaurant', { restaurantId: id }) },
                { text: 'Menu Management', onPress: () => navigation.navigate('MenuManagement', { restaurantId: id }) },
                { text: 'Content', onPress: () => navigation.navigate('OwnerContent', { restaurantId: id }) },
                { text: 'DELETE Restaurant', onPress: () => handleDelete(id, name), style: 'destructive' },
            ]
        );
    };

    const handleToggleTrending = async (id: string, name: string, currentStatus: boolean) => {
        try {
            await restaurantService.update(id, { isTrending: !currentStatus });
            Alert.alert(
                !currentStatus ? 'Trending Status Enabled' : 'Trending Status Disabled',
                `"${name}" is now ${!currentStatus ? 'trending' : 'no longer trending'}.`
            );
            fetchRestaurants();
        } catch (e) {
            Alert.alert('Error', 'Failed to update trending status.');
        }
    };

    const renderPendingItem = ({ item }: { item: RestaurantDTO }) => (
        <View style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.secondary + '20' }]}>
                    <Store color={colors.secondary} size={24} />
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.restaurantName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.cuisineText, { color: colors.textSecondary }]}>{item.cuisine}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                    <User size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>Owner ID: <Text style={{ color: colors.text, fontWeight: '600' }}>{item.ownerId}</Text></Text>
                </View>
                <View style={styles.detailItem}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>Applied {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>

            <View style={[styles.descriptionBox, { backgroundColor: colors.background }]}>
                <Info size={14} color={colors.textSecondary} style={{ marginTop: 2 }} />
                <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{item.description}</Text>
            </View>

            <View style={styles.actions}>
                {!item.isApproved ? (
                    <>
                        <TouchableOpacity 
                            style={[styles.rejectBtn, { borderColor: '#EF4444' }]} 
                            onPress={() => handleReject(item.id, item.name)}
                        >
                            <XCircle color="#EF4444" size={20} />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.approveBtn, { backgroundColor: colors.primary }]} 
                            onPress={() => handleApprove(item.id, item.name)}
                        >
                            <CheckCircle color={isDark ? colors.secondary : colors.white} size={20} />
                            <Text style={[styles.approveBtnText, { color: isDark ? colors.secondary : colors.white }]}>Approve</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity 
                        style={[styles.manageBtn, { backgroundColor: colors.secondary }]} 
                        onPress={() => handleManage(item.id, item.name)}
                    >
                        <User color={isDark ? colors.primary : colors.white} size={20} />
                        <Text style={[styles.manageBtnText, { color: isDark ? colors.primary : colors.white }]}>Manage</Text>
                    </TouchableOpacity>
                )}
                
                {item.isApproved && (
                    <TouchableOpacity 
                        style={[
                            styles.trendingToggleBtn, 
                            { 
                                backgroundColor: item.isTrending ? '#FF9F1C' : colors.primary + '10',
                                borderColor: item.isTrending ? '#FF9F1C' : colors.primary + '30'
                            }
                        ]} 
                        onPress={() => handleToggleTrending(item.id, item.name, !!item.isTrending)}
                    >
                        <Flame color={item.isTrending ? colors.white : colors.primary} size={20} />
                        <Text style={[
                            styles.trendingText, 
                            { color: item.isTrending ? colors.white : colors.primary }
                        ]}>
                            {item.isTrending ? 'Trending' : 'Boost'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Restaurant Moderation</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={renderPendingItem}
                contentContainerStyle={styles.listContent}
                refreshing={isLoading}
                onRefresh={fetchRestaurants}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.statusInfo, { color: colors.textSecondary }]}>
                                {showAll ? `${items.length} total restaurants` : `${filteredItems.length} awaiting review`}
                            </Text>
                            <TouchableOpacity 
                                style={[styles.toggleBtn, { backgroundColor: showAll ? colors.primary : colors.background }]}
                                onPress={() => setShowAll(!showAll)}
                            >
                                <Text style={[styles.toggleBtnText, { color: showAll ? (isDark ? colors.secondary : colors.white) : colors.textSecondary }]}>
                                    {showAll ? 'Show Pending Only' : 'Show All'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Store size={64} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {showAll ? 'No restaurants found' : 'No pending applications'}
                        </Text>
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
        paddingHorizontal: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    listHeader: {
        marginBottom: 16,
    },
    statusInfo: {
        ...TYPOGRAPHY.bodySmall,
        fontStyle: 'italic',
    },
    card: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        marginLeft: 16,
        flex: 1,
    },
    restaurantName: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
    },
    cuisineText: {
        ...TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    detailsSection: {
        gap: 10,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailText: {
        ...TYPOGRAPHY.bodySmall,
    },
    descriptionBox: {
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    descriptionText: {
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    rejectBtnText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 14,
    },
    approveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    approveBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        ...TYPOGRAPHY.bodyLarge,
        marginTop: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    toggleBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    manageBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 16,
        ...SHADOWS.light,
    },
    manageBtnText: {
        fontWeight: '700',
        fontSize: 15,
    },
    trendingToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        ...SHADOWS.light,
    },
    trendingText: {
        fontWeight: '700',
        fontSize: 14,
    },
});

export default AdminRestaurantModerationScreen;
