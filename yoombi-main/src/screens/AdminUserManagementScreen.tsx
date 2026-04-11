import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Alert, ScrollView } from 'react-native';
import { ChevronLeft, Search, Filter, User, Shield, ShieldOff, Mail, Calendar, Store, Trash2 } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { userService } from '../services/api';
import { UserAccountDTO } from '../types/dto';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AdminUserManagementScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'OWNER' | 'USER'>('ALL');
    const [users, setUsers] = useState<UserAccountDTO[]>([]);

    useEffect(() => {
        userService.getAll(1, 50)
            .then(res => setUsers(res.data || []))
            .catch(e => console.warn('[AdminUserManagement] Failed to fetch users:', e));
    }, []);

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleToggleBlock = (userId: string, isBlocked: boolean) => {
        Alert.alert(
            isBlocked ? 'Unblock User' : 'Block User',
            `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            if (isBlocked) {
                                await userService.unblock(userId);
                            } else {
                                await userService.block(userId);
                            }
                            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !isBlocked } : u));
                        } catch (e) {
                            Alert.alert('Error', 'Failed to update user status.');
                        }
                    },
                    style: isBlocked ? 'default' : 'destructive'
                },
            ]
        );
    };

    const renderUserItem = ({ item }: { item: UserAccountDTO }) => (
        <View style={[styles.userCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
            <View style={styles.userInfoRow}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                    ) : (
                        <Text style={[styles.avatarText, { color: isDark ? colors.secondary : 'white' }]}>{(item.name || 'U')[0]}</Text>
                    )}
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                    <View style={styles.roleBadgeContainer}>
                        <View style={[styles.roleBadge, { backgroundColor: item.role === 'ADMIN' ? '#3B82F620' : item.role === 'OWNER' ? '#C5A05920' : '#64748B20' }]}>
                            <Text style={[styles.roleText, { color: item.role === 'ADMIN' ? '#3B82F6' : item.role === 'OWNER' ? '#C5A059' : '#64748B' }]}>{item.role}</Text>
                        </View>
                        {item.isBlocked && (
                            <View style={[styles.roleBadge, { backgroundColor: '#EF444420', marginLeft: 8 }]}>
                                <Text style={[styles.roleText, { color: '#EF4444' }]}>BLOCKED</Text>
                            </View>
                        )}
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => handleToggleBlock(item.id, !!item.isBlocked)}
                    style={[styles.actionBtn, { backgroundColor: item.isBlocked ? '#10B98120' : '#EF444420' }]}
                >
                    {item.isBlocked ? (
                        <Shield color="#10B981" size={20} />
                    ) : (
                        <ShieldOff color="#EF4444" size={20} />
                    )}
                </TouchableOpacity>
            </View>
            
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            
            <View style={styles.userFooter}>
                <View style={styles.footerItem}>
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>Joined {item.joinDate}</Text>
                </View>
                {item.role === 'OWNER' && (
                    <View style={styles.footerItem}>
                        <Store size={12} color={colors.secondary} />
                        <Text style={[styles.footerText, { color: colors.secondary, fontWeight: '700' }]}>
                            {item.hasRestaurant ? `Owns ${item.restaurantName || 'a restaurant'}` : 'No restaurant assigned'}
                        </Text>
                    </View>
                )}
                <TouchableOpacity style={styles.footerItem}>
                    <Mail size={12} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>Contact</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>User Management</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <Search color={colors.textSecondary} size={20} />
                    <TextInput
                        placeholder="Search users..."
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {(['ALL', 'ADMIN', 'OWNER', 'USER'] as const).map((role) => (
                        <TouchableOpacity
                            key={role}
                            onPress={() => setFilterRole(role)}
                            style={[
                                styles.filterBadge,
                                { backgroundColor: colors.white },
                                filterRole === role && { backgroundColor: colors.primary }
                            ]}
                        >
                            <Text style={[
                                styles.filterBadgeText,
                                { color: colors.textSecondary },
                                filterRole === role && { color: isDark ? colors.secondary : colors.white }
                            ]}>
                                {role.charAt(0) + role.slice(1).toLowerCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <User size={64} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
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
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        ...SHADOWS.light,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        ...TYPOGRAPHY.bodyMedium,
    },
    filterBar: {
        marginBottom: 8,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        ...SHADOWS.light,
    },
    filterBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    userCard: {
        padding: 16,
        borderRadius: 24,
        marginBottom: 16,
        ...SHADOWS.medium,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
    },
    userEmail: {
        ...TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    roleBadgeContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    userFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 11,
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
});

export default AdminUserManagementScreen;
