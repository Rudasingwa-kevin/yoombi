import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useToast } from '../context/ToastContext';
import { restaurantService, menuService, reviewService } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';

const RATING_CATEGORIES = [
    { id: 'food', label: 'Food Quality' },
    { id: 'service', label: 'Service' },
    { id: 'ambiance', label: 'Ambiance' },
    { id: 'value', label: 'Value for Money' },
];

const ReviewScreen = ({ route, navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const { addPoints } = useRestaurant();
    const toast = useToast();
    const { restaurantId, restaurantName } = route.params;

    const [ratings, setRatings] = useState<Record<string, number>>({
        food: 0,
        service: 0,
        ambiance: 0,
        value: 0,
    });
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleRating = (category: string, value: number) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 4;
 
    const handleSubmit = async () => {
        if (Object.values(ratings).some(r => r === 0)) {
            toast.warning('Incomplete Rating', 'Please rate all categories before submitting.');
            return;
        }
 
        setSubmitting(true);
 
        try {
            await reviewService.create({
                restaurantId,
                rating: overallRating,
                comment
            });
            
            addPoints(15);
            toast.success('Review Submitted! 🌟', 'Thank you! You earned +15 Loyalty Points.');
            setTimeout(() => navigation.goBack(), 1200);
        } catch (error) {
            console.error('[ReviewScreen] Submit error:', error);
            toast.error('Submission Failed', 'An error occurred while saving your review.');
        } finally {
            setSubmitting(false);
        }
    };

    const StarInput = ({ value, onChange, size = 32 }: { value: number, onChange: (v: number) => void, size?: number }) => (
        <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => onChange(star)}
                    activeOpacity={0.7}
                >
                    <Star
                        size={size}
                        fill={star <= value ? colors.secondary : 'transparent'}
                        color={star <= value ? colors.secondary : colors.gray}
                        strokeWidth={2}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader
                title="Write a Review"
                subtitle={restaurantName}
                onBack={() => navigation.goBack()}
                accentIcon={<Star color="#C5A059" size={16} fill="#C5A059" />}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.restaurantName, { color: colors.text }]}>
                        {restaurantName}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        How was your experience?
                    </Text>

                    <View style={[styles.ratingContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
                        {RATING_CATEGORIES.map((cat) => (
                            <View key={cat.id} style={styles.ratingRowItem}>
                                <Text style={[styles.ratingLabel, { color: colors.text }]}>{cat.label}</Text>
                                <StarInput
                                    value={ratings[cat.id]}
                                    onChange={(v) => handleRating(cat.id, v)}
                                    size={24}
                                />
                            </View>
                        ))}
                    </View>

                    <View style={styles.commentSection}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Your Comments</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? colors.background : '#F9FAFB',
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            placeholder="Share details of your own experience at this place..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                        />
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        <Text style={[styles.submitText, { color: isDark ? colors.secondary : 'white' }]}>
                            {submitting ? 'Submitting...' : 'Post Review'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24 },
    restaurantName: { ...TYPOGRAPHY.h2, textAlign: 'center', marginBottom: 8 },
    subtitle: { ...TYPOGRAPHY.bodyMedium, textAlign: 'center', marginBottom: 32 },
    ratingContainer: {
        padding: 20,
        borderRadius: 16,
        gap: 20,
        marginBottom: 32,
        ...SHADOWS.light
    },
    ratingRowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    ratingLabel: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600' },
    starRow: { flexDirection: 'row', gap: 8 },
    commentSection: { gap: 12 },
    sectionTitle: { ...TYPOGRAPHY.h3, fontSize: 16 },
    input: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 120,
        ...TYPOGRAPHY.bodyMedium,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    submitText: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
    }
});

export default ReviewScreen;
