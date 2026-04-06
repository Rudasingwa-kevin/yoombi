import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { ChevronLeft, Search, Filter, History, User, Activity, Clock, Info } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { auditService } from '../services/api';
import { AuditLogDTO } from '../types/dto';

const AdminAuditLogsScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { isAdmin } = useAuth();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState<AuditLogDTO[]>([]);

    useEffect(() => {
        auditService.getLogs(1)
            .then(res => setLogs(res.data || (res as any) || []))
            .catch(e => console.warn('[AdminAuditLogsScreen] Failed to fetch logs:', e));
    }, []);

    if (!isAdmin) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.adminName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.targetLabel || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderLogItem = ({ item }: { item: AuditLogDTO }) => (
        <View style={[styles.logCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
            <View style={styles.logHeader}>
                <View style={[styles.actionBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Activity size={12} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>{item.action.toUpperCase()}</Text>
                </View>
                <Text style={[styles.logTime, { color: colors.gray }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            
            <Text style={[styles.logDetail, { color: colors.text }]}>
                <Text style={{ fontWeight: '700' }}>{item.adminName}</Text> {(item.detail || '').toLowerCase()} for <Text style={{ fontWeight: '700' }}>{item.targetLabel || item.targetId}</Text>
            </Text>

            <View style={styles.logFooter}>
                <Clock size={12} color={colors.gray} />
                <Text style={[styles.footerText, { color: colors.gray }]}>Logged by System Audit</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <View style={styles.headerTitleRow}>
                    <History color={colors.secondary} size={20} />
                    <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Audit Logs</Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: colors.white }]}>
                    <Search color={colors.gray} size={20} />
                    <TextInput
                        placeholder="Search logs by action, admin, or target..."
                        placeholderTextColor={colors.gray}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <FlatList
                data={filteredLogs}
                keyExtractor={(item) => item.id}
                renderItem={renderLogItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Info size={14} color={colors.textSecondary} />
                        <Text style={[styles.headerInfo, { color: colors.textSecondary }]}>Showing last 50 administrative actions</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <History size={64} color={colors.gray} style={{ opacity: 0.2 }} />
                        <Text style={[styles.emptyText, { color: colors.gray }]}>No logs found matching your search</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchSection: { padding: 20 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        ...SHADOWS.light,
    },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 14 },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    headerInfo: { fontSize: 11, fontStyle: 'italic' },
    logCard: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        ...SHADOWS.light,
    },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    actionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    actionText: { fontSize: 10, fontWeight: '800' },
    logTime: { fontSize: 10 },
    logDetail: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    logFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
    footerText: { fontSize: 10 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 14 },
});

export default AdminAuditLogsScreen;
