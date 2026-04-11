import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { ChevronLeft, MessageSquare, Clock, CheckCircle, AlertTriangle, Send, User, Mail } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { supportService } from '../services/api';
import { SupportTicketDTO } from '../types/dto';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AdminSupportScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();
    
    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const [tickets, setTickets] = useState<SupportTicketDTO[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicketDTO | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        supportService.getTickets(1)
            .then(res => setTickets(res.data || []))
            .catch(e => console.warn('[AdminSupport] Failed to fetch tickets:', e));
    }, []);

    const handleSolveTicket = (id: string) => {
        Alert.alert(
            'Mark as Solved',
            'Are you sure this issue has been resolved?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Resolve',
                    onPress: async () => {
                        try {
                            await supportService.updateTicketStatus(id, 'RESOLVED');
                            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'RESOLVED' } : t));
                            setSelectedTicket(null);
                        } catch (e) { Alert.alert('Error', 'Failed to update ticket.'); }
                    }
                },
            ]
        );
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        try {
            await supportService.updateTicketStatus(selectedTicket.id, selectedTicket.status, replyText.trim());
            Alert.alert('Reply Sent', 'Your response has been sent to the user.');
            setReplyText('');
        } catch (e) {
            Alert.alert('Error', 'Failed to send reply.');
        }
    };

    const renderTicketItem = ({ item }: { item: SupportTicketDTO }) => (
        <TouchableOpacity 
            style={[styles.ticketCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}
            onPress={() => setSelectedTicket(item)}
        >
            <View style={styles.ticketHeader}>
                <View style={styles.ticketInfo}>
                    <Text style={[styles.ticketSubject, { color: colors.text }]}>{item.subject}</Text>
                    <Text style={[styles.ticketUser, { color: colors.textSecondary }]}>from {item.userName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'OPEN' ? colors.secondary + '20' : '#10B98120' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'OPEN' ? colors.secondary : '#10B981' }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.ticketFooter}>
                <View style={styles.footerItem}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.footerItem}>
                    <AlertTriangle size={12} color={item.priority === 'HIGH' ? '#EF4444' : item.priority === 'MEDIUM' ? '#F59E0B' : '#64748B'} />
                    <Text style={[styles.footerText, { color: item.priority === 'HIGH' ? '#EF4444' : item.priority === 'MEDIUM' ? '#F59E0B' : '#64748B' }]}>{item.priority}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Support Inbox</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                renderItem={renderTicketItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={[styles.statusInfo, { color: colors.textSecondary }]}>
                            {tickets.filter(t => t.status === 'OPEN').length} active inquiries
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MessageSquare size={64} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No support tickets</Text>
                    </View>
                }
            />

            {/* Ticket Detail Modal / Overlay */}
            {selectedTicket && (
                <View style={[styles.detailOverlay, { backgroundColor: colors.background }]}>
                    <View style={[styles.header, { backgroundColor: colors.white }]}>
                        <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                            <ChevronLeft color={colors.primary} size={28} />
                        </TouchableOpacity>
                        <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Ticket Details</Text>
                        <TouchableOpacity onPress={() => handleSolveTicket(selectedTicket.id)}>
                            <CheckCircle color={selectedTicket.status === 'RESOLVED' ? '#10B981' : colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent}>
                        <View style={[styles.detailCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                            <Text style={[styles.detailSubject, { color: colors.text }]}>{selectedTicket.subject}</Text>
                            <View style={styles.userInfo}>
                                <User size={16} color={colors.textSecondary} />
                                <Text style={[styles.userInfoText, { color: colors.textSecondary }]}>{selectedTicket.userName} • {new Date(selectedTicket.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
                            <Text style={[styles.messageText, { color: colors.text }]}>{selectedTicket.message}</Text>
                        </View>

                        {selectedTicket.status === 'OPEN' && (
                            <View style={[styles.replyBox, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                                <Text style={[styles.replyTitle, { color: colors.primary }]}>Reply to User</Text>
                                <TextInput
                                    style={[styles.replyInput, { color: colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                                    placeholder="Type your response here..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    value={replyText}
                                    onChangeText={setReplyText}
                                />
                                <TouchableOpacity 
                                    style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleSendReply}
                                >
                                    <Send color={isDark ? colors.secondary : 'white'} size={20} />
                                    <Text style={[styles.sendBtnText, { color: isDark ? colors.secondary : 'white' }]}>Send Reply</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    listContent: { padding: 16, paddingBottom: 100 },
    listHeader: { marginBottom: 16 },
    statusInfo: { ...TYPOGRAPHY.bodySmall, fontStyle: 'italic' },
    ticketCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.medium,
    },
    ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    ticketInfo: { flex: 1 },
    ticketSubject: { ...TYPOGRAPHY.h3, fontSize: 16, marginBottom: 4 },
    ticketUser: { fontSize: 12 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800' },
    ticketFooter: { flexDirection: 'row', gap: 16, marginTop: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 11 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { ...TYPOGRAPHY.bodyLarge, marginTop: 16 },
    detailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
    detailScroll: { flex: 1 },
    detailContent: { padding: 16, paddingBottom: 40 },
    detailCard: { padding: 20, borderRadius: 24, marginBottom: 20, ...SHADOWS.medium },
    detailSubject: { ...TYPOGRAPHY.h2, marginBottom: 16 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    userInfoText: { fontSize: 12 },
    divider: { height: 1, marginBottom: 16 },
    messageText: { ...TYPOGRAPHY.bodyLarge, lineHeight: 24 },
    replyBox: { padding: 20, borderRadius: 24, ...SHADOWS.medium },
    replyTitle: { ...TYPOGRAPHY.h3, marginBottom: 16 },
    replyInput: { height: 150, borderWidth: 1, borderRadius: 16, padding: 16, textAlignVertical: 'top', marginBottom: 20 },
    sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
    sendBtnText: { fontWeight: '700', fontSize: 16 },
});

export default AdminSupportScreen;
