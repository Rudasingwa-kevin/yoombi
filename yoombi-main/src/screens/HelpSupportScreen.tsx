import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ChevronLeft, Search, MessageCircle, Phone, Mail, ChevronRight, HelpCircle, Book, Shield, Info } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SHADOWS, SIZES } from '../constants/theme';

const HelpItem = ({ icon: Icon, title, onPress }: any) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity style={[styles.helpItem, { borderBottomColor: colors.gray + '30' }]} onPress={onPress}>
            <View style={styles.helpItemLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                    <Icon color={colors.primary} size={20} />
                </View>
                <Text style={[styles.helpItemTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <ChevronRight color={colors.gray} size={20} />
        </TouchableOpacity>
    );
};

const HelpSupportScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: colors.white }]}
                >
                    <ChevronLeft color={colors.primary} size={24} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h3, { color: colors.primary }]}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.searchSection, { backgroundColor: colors.white }]}>
                    <Search color={colors.gray} size={20} />
                    <TextInput
                        placeholder="Search for help..."
                        placeholderTextColor={colors.gray}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>Frequently Asked</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
                        <HelpItem icon={Book} title="How to make a reservation?" />
                        <HelpItem icon={Shield} title="Privacy & Data Policy" />
                        <HelpItem icon={Info} title="About Yoombi Luxury" />
                        <HelpItem icon={HelpCircle} title="Cancellation Policy" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.gray }]}>Contact Concierge</Text>
                    <View style={styles.contactRow}>
                        <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.white }]}>
                            <View style={[styles.contactIconBox, { backgroundColor: '#E0F2FE' }]}>
                                <MessageCircle color="#0284C7" size={24} />
                            </View>
                            <Text style={[styles.contactTitle, { color: colors.text }]}>Live Chat</Text>
                            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>Wait time: 2m</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.white }]}>
                            <View style={[styles.contactIconBox, { backgroundColor: '#F0FDF4' }]}>
                                <Phone color="#16A34A" size={24} />
                            </View>
                            <Text style={[styles.contactTitle, { color: colors.text }]}>Call Us</Text>
                            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>Premium Line</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.emailCard, { backgroundColor: colors.white }]}>
                        <View style={[styles.contactIconBox, { backgroundColor: '#FEF2F2' }]}>
                            <Mail color="#DC2626" size={24} />
                        </View>
                        <View style={styles.emailTextContent}>
                            <Text style={[styles.contactTitle, { color: colors.text }]}>Email Support</Text>
                            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>concierge@yoombi.com</Text>
                        </View>
                        <ChevronRight color={colors.gray} size={20} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.gray }]}>Yoombi Luxury v1.2.0</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    scrollContent: { padding: 20, paddingBottom: 40 },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 32,
        ...SHADOWS.light,
    },
    searchInput: { flex: 1, marginLeft: 12, ...TYPOGRAPHY.bodyMedium },
    section: { marginBottom: 28 },
    sectionTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', marginBottom: 12, marginLeft: 8, textTransform: 'uppercase' },
    sectionCard: {
        borderRadius: 24,
        padding: 8,
        ...SHADOWS.light,
    },
    helpItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
    },
    helpItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpItemTitle: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600' },
    contactRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    contactCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    contactIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactTitle: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700', marginBottom: 2 },
    contactSubtitle: { fontSize: 11, fontWeight: '500' },
    emailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 16,
        ...SHADOWS.light,
    },
    emailTextContent: { flex: 1, marginLeft: 16 },
    footer: { alignItems: 'center', marginTop: 20 },
    footerText: { fontSize: 12, fontWeight: '500' },
});

export default HelpSupportScreen;
