import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, FlatList } from 'react-native';
import { Bell, Mail, Smartphone, ShoppingBag, Info, ShieldCheck, Trash2, CheckCircle, Clock, Megaphone } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useNotifications, NotificationMessage } from '../context/NotificationContext';
import ScreenHeader from '../components/ScreenHeader';

const NotificationItem = ({ icon: Icon, title, description, value, onValueChange }: any) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.itemContainer, { borderBottomColor: colors.gray + '50' }]}>
            <View style={styles.itemLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                    <Icon color={colors.primary} size={20} />
                </View>
                <View style={styles.itemTextContainer}>
                    <Text style={[styles.itemTitle, { color: colors.text, fontWeight: '600' }]}>{title}</Text>
                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>{description}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#767577', true: colors.secondary }}
                thumbColor={value ? (colors.primary === '#0A192F' ? 'white' : colors.primary) : '#f4f3f4'}
            />
        </View>
    );
};

const InboxCard = ({ notification, onPress }: { notification: NotificationMessage, onPress: () => void }) => {
    const { colors } = useTheme();
    
    const getIcon = () => {
        switch (notification.type) {
            case 'PROMOTION': return { icon: Megaphone, color: colors.secondary };
            case 'REWARD': return { icon: CheckCircle, color: '#10B981' };
            default: return { icon: Info, color: '#3B82F6' };
        }
    };

    const { icon: Icon, color } = getIcon();

    return (
        <TouchableOpacity 
            style={[styles.inboxCard, { backgroundColor: colors.white, borderColor: notification.isRead ? 'transparent' : color + '40' }]} 
            onPress={onPress}
        >
            {!notification.isRead && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
            <View style={[styles.inboxIconBox, { backgroundColor: color + '10' }]}>
                <Icon color={color} size={20} />
            </View>
            <View style={styles.inboxContent}>
                <View style={styles.inboxHeader}>
                    <Text style={[styles.inboxTitle, { color: colors.text, fontWeight: notification.isRead ? '600' : '800' }]}>{notification.title}</Text>
                    <Text style={[styles.inboxTime, { color: colors.textSecondary }]}>
                        {new Date(notification.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                </View>
                <Text style={[styles.inboxMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                    {notification.message}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const NotificationsScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [activeTab, setActiveTab] = useState<'INBOX' | 'SETTINGS'>('INBOX');

    const [settings, setSettings] = useState({
        push: true,
        email: false,
        sms: true,
        orders: true,
        offers: false,
        security: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderInbox = () => (
        <View style={styles.inboxContainer}>
            <View style={styles.inboxActions}>
                <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={[styles.actionText, { color: colors.secondary }]}>Mark all as read</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearAll}>
                    <Trash2 color={colors.error} size={20} />
                </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconBox, { backgroundColor: colors.gray + '10' }]}>
                        <Bell color={colors.textSecondary} size={40} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Once you receive promotions or updates, they will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <InboxCard 
                            notification={item} 
                            onPress={() => markAsRead(item.id)} 
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );

    const renderSettings = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App Notifications</Text>
                <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
                    <NotificationItem
                        icon={Smartphone}
                        title="Push Notifications"
                        description="Receive instant alerts on your device"
                        value={settings.push}
                        onValueChange={() => toggleSetting('push')}
                    />
                    <NotificationItem
                        icon={ShoppingBag}
                        title="Order Updates"
                        description="Track your luxury orders and bookings"
                        value={settings.orders}
                        onValueChange={() => toggleSetting('orders')}
                    />
                    <NotificationItem
                        icon={ShieldCheck}
                        title="Security Alerts"
                        description="Get notified about account logins"
                        value={settings.security}
                        onValueChange={() => toggleSetting('security')}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Communication</Text>
                <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
                    <NotificationItem
                        icon={Mail}
                        title="Email Alerts"
                        description="Weekly digests and detailed reports"
                        value={settings.email}
                        onValueChange={() => toggleSetting('email')}
                    />
                    <NotificationItem
                        icon={Info}
                        title="Promotional Offers"
                        description="Exclusive deals and member events"
                        value={settings.offers}
                        onValueChange={() => toggleSetting('offers')}
                    />
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader
                title="Notifications"
                subtitle="Inbox & Settings"
                onBack={() => navigation.goBack()}
                accentIcon={<Bell color="#C5A059" size={16} />}
            />

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'INBOX' && { borderBottomColor: colors.secondary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('INBOX')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'INBOX' ? colors.primary : colors.textSecondary }]}>Inbox</Text>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                            <Text style={styles.badgeText}>{notifications.filter(n => !n.isRead).length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'SETTINGS' && { borderBottomColor: colors.secondary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('SETTINGS')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'SETTINGS' ? colors.primary : colors.textSecondary }]}>Settings</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'INBOX' ? renderInbox() : renderSettings()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 20,
    },
    tab: {
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tabText: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '700',
    },
    badge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    inboxContainer: { flex: 1, paddingHorizontal: 20 },
    inboxActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    listContent: { paddingBottom: 40 },
    inboxCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        ...SHADOWS.light,
    },
    unreadDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    inboxIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inboxContent: { flex: 1, marginLeft: 16 },
    inboxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    inboxTitle: { fontSize: 15 },
    inboxTime: { fontSize: 11 },
    inboxMessage: { fontSize: 13, lineHeight: 18 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { ...TYPOGRAPHY.h3, marginBottom: 8 },
    emptySubtitle: { ...TYPOGRAPHY.bodyMedium, textAlign: 'center', opacity: 0.7 },
    section: { marginBottom: 28 },
    sectionTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 12, marginLeft: 8, textTransform: 'uppercase' },
    sectionCard: {
        borderRadius: 24,
        padding: 8,
        ...SHADOWS.light,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: { flex: 1 },
    itemTitle: { ...TYPOGRAPHY.bodyLarge, fontWeight: '600', marginBottom: 2 },
    itemDescription: { fontSize: 13 },
});

export default NotificationsScreen;
