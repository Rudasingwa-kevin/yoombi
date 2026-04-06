import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Award, Star, Zap, ChevronRight } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface MembershipCardProps {
    points: number;
    tier: 'Emerald' | 'Gold' | 'Sapphire' | 'Black Diamond';
}

const MembershipCard = ({ points, tier }: MembershipCardProps) => {
    const { colors, isDark } = useTheme();

    const getTierColor = () => {
        switch (tier) {
            case 'Emerald': return '#10B981';
            case 'Gold': return '#F59E0B';
            case 'Sapphire': return '#3B82F6';
            case 'Black Diamond': return '#111827';
            default: return colors.secondary;
        }
    };

    const nextTierPoints = 5000;
    const progress = Math.min(points / nextTierPoints, 1);
    const tierColor = getTierColor();

    return (
        <View style={[styles.container, { backgroundColor: tier === 'Black Diamond' ? '#1A1A1A' : colors.white, shadowColor: colors.shadow }]}>
            <View style={styles.header}>
                <View style={styles.tierContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: tierColor + '20' }]}>
                        <Award color={tierColor} size={24} />
                    </View>
                    <View>
                        <Text style={[styles.tierLabel, { color: colors.textSecondary }]}>Membership Tier</Text>
                        <Text style={[styles.tierName, { color: tier === 'Black Diamond' ? '#FFFFFF' : colors.primary }]}>{tier} Club</Text>
                    </View>
                </View>
                <View style={styles.pointsBadge}>
                    <Zap color={colors.secondary} size={14} fill={colors.secondary} />
                    <Text style={[styles.pointsText, { color: colors.secondary }]}>{(points ?? 0).toLocaleString()} PTS</Text>
                </View>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Next Tier: Gold</Text>
                    <Text style={[styles.progressValue, { color: colors.text }]}>{Math.round(progress * 100)}%</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: tierColor }]} />
                </View>
                <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                    {(nextTierPoints - (points ?? 0)).toLocaleString()} points to unlock Gold benefits
                </Text>

            </View>

            <View style={[styles.divider, { backgroundColor: colors.background }]} />

            <View style={styles.footer}>
                <View style={styles.benefitItem}>
                    <Star color={colors.secondary} size={16} />
                    <Text style={[styles.benefitText, { color: tier === 'Black Diamond' ? '#AAAAAA' : colors.textSecondary }]}>
                        Priority Discovery
                    </Text>
                </View>
                <View style={styles.benefitItem}>
                    <ChevronRight color={colors.gray} size={18} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width - 40,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        ...SHADOWS.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    tierContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tierLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tierName: {
        fontSize: 20,
        fontWeight: '800',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '800',
    },
    progressSection: {
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressValue: {
        fontSize: 12,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    remainingText: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    benefitText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default MembershipCard;
