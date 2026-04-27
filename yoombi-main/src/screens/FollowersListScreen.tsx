import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Search, User, Users } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';
import { restaurantService } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';

interface Follower {
    id: string;
    name: string;
    avatar: string;
    since: string;
}

const FollowersListScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { currentRestaurant } = useRestaurant();
    const [followers, setFollowers] = React.useState<Follower[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchFollowers = async () => {
            if (!currentRestaurant) {
                setLoading(false);
                return;
            }
            try {
                // restaurantService.getFollowers returns ApiResponse<any[]> which api.js unwraps to just any[]
                const data = await restaurantService.getFollowers(currentRestaurant.id);
                setFollowers(data.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    avatar: f.avatar,
                    since: f.since
                })));
            } catch (error) {
                console.warn('[FollowersListScreen] Failed to fetch followers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFollowers();
    }, [currentRestaurant]);

    const renderFollower = ({ item }: { item: Follower }) => (
        <View style={[styles.followerCard, { backgroundColor: isDark ? colors.background : colors.white, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                ) : (
                    <Text style={[styles.avatarText, { color: isDark ? colors.secondary : 'white' }]}>{(item.name || 'U')[0]}</Text>
                )}
            </View>
            <View style={styles.followerInfo}>
                <Text style={[styles.followerName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.followerSince, { color: colors.textSecondary }]}>Following since {item.since}</Text>
            </View>
            <TouchableOpacity style={[styles.messageButton, { backgroundColor: colors.secondary + '20' }]}>
                <Text style={[styles.messageText, { color: colors.secondary }]}>Message</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader
                title="Followers"
                subtitle="Your community"
                onBack={() => navigation.goBack()}
                accentIcon={<Users color="#C5A059" size={16} />}
            />

            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? colors.background : '#F3F4F6', borderWidth: 1, borderColor: colors.border }]}>
                    <Search color={colors.textSecondary} size={20} />
                    <TextInput
                        placeholder="Search followers..."
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={followers}
                    renderItem={renderFollower}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <User size={48} color={colors.gray} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No followers yet.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: { padding: 20, paddingBottom: 10 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    searchInput: { flex: 1, fontSize: 16 },
    listContent: { padding: 20 },
    followerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        ...SHADOWS.light,
    },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 24 },
    avatarText: { fontWeight: 'bold', fontSize: 18 },
    followerInfo: { flex: 1, marginLeft: 12 },
    followerName: { ...TYPOGRAPHY.bodyMedium, fontWeight: '600' },
    followerSince: { fontSize: 12, marginTop: 4 },
    messageButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    messageText: { fontSize: 12, fontWeight: '600' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
    emptyText: { ...TYPOGRAPHY.bodyMedium },
});

export default FollowersListScreen;
