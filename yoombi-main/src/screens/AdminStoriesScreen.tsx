import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, TextInput, Image, Modal } from 'react-native';
import { ChevronLeft, Plus, Trash2, Layout, Save, X, Eye } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { storyService } from '../services/api';
import { RestaurantStoriesDTO } from '../types/dto';

const AdminStoriesScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { isAdmin } = useAuth();

    const [storyGroups, setStoryGroups] = useState<RestaurantStoriesDTO[]>([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newStory, setNewStory] = useState({ restaurantName: '', imageUrl: '', caption: '' });

    useEffect(() => {
        if (!isAdmin) return;
        storyService.getAllStories()
            .then(data => setStoryGroups(data || []))
            .catch(e => console.warn('[AdminStoriesScreen] Failed to fetch stories:', e));
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text }}>Access Denied</Text>
            </View>
        );
    }

    const handleDeleteStory = (restaurantId: string, storyId: string) => {
        Alert.alert('Delete Story', 'Are you sure you want to remove this segment?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await storyService.deleteStoryItem(restaurantId, storyId);
                        setStoryGroups(prev => prev.map(group => {
                            if (group.restaurantId === restaurantId) {
                                return { ...group, stories: group.stories.filter(s => s.id !== storyId) };
                            }
                            return group;
                        }).filter(group => group.stories.length > 0));
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete story.');
                    }
                }
            }
        ]);
    };

    const handleAddStory = async () => {
        if (!newStory.restaurantName || !newStory.imageUrl) {
            Alert.alert('Error', 'Please fill in the required fields.');
            return;
        }
        const existingGroup = storyGroups.find(g => g.restaurantName === newStory.restaurantName);
        if (!existingGroup) {
            Alert.alert('Error', 'Restaurant not found. Please use an existing restaurant name.');
            return;
        }
        try {
            const added = await storyService.addStoryItem(existingGroup.restaurantId, {
                type: 'image',
                url: newStory.imageUrl,
                text: newStory.caption,
            });
            setStoryGroups(prev => prev.map(g => {
                if (g.restaurantId === existingGroup.restaurantId) {
                    return { ...g, stories: [added, ...g.stories] };
                }
                return g;
            }));
            setIsAddModalVisible(false);
            setNewStory({ restaurantName: '', imageUrl: '', caption: '' });
            Alert.alert('Success', 'Story published to the platform.');
        } catch (e) {
            Alert.alert('Error', 'Failed to publish story.');
        }
    };

    const renderStorySegment = (restaurantId: string, story: RestaurantStoriesDTO['stories'][0]) => (
        <View key={story.id} style={[styles.segmentCard, { backgroundColor: colors.white }]}>
            <Image source={{ uri: story.imageUrl }} style={styles.segmentImage} />
            <View style={styles.segmentInfo}>
                <Text style={[styles.segmentCaption, { color: colors.text }]} numberOfLines={1}>{story.text || 'No caption'}</Text>
                <Text style={[styles.segmentTime, { color: colors.textSecondary }]}>{new Date(story.createdAt).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteStory(restaurantId, story.id)}>
                <Trash2 color="#EF4444" size={18} />
            </TouchableOpacity>
        </View>
    );

    const renderGroupItem = ({ item }: { item: RestaurantStoriesDTO }) => (
        <View style={[styles.groupCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
            <View style={styles.groupHeader}>
                <Image source={{ uri: item.avatar }} style={styles.groupAvatar} />
                <View style={styles.groupMeta}>
                    <Text style={[styles.groupName, { color: colors.text }]}>{item.restaurantName}</Text>
                    <Text style={[styles.groupSub, { color: colors.textSecondary }]}>{item.stories.length} segments active</Text>
                </View>
                <TouchableOpacity
                    style={[styles.previewBtn, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('StoryViewer', {
                        storyGroup: {
                            id: item.restaurantId,
                            name: item.restaurantName,
                            avatar: item.avatar,
                            stories: item.stories,
                        }
                    })}
                >
                    <Eye color={isDark ? colors.secondary : 'white'} size={14} />
                </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.gray + '20' }]} />

            <View style={styles.segmentsList}>
                {item.stories.map((s) => renderStorySegment(item.restaurantId, s))}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Stories Manager</Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(true)}>
                    <Plus color={colors.primary} size={28} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={storyGroups}
                keyExtractor={(item) => item.restaurantId}
                renderItem={renderGroupItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.statsRow}>
                            <Layout size={18} color={colors.secondary} />
                            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                                {storyGroups.length} Active Highlight Bubbles
                            </Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 60 }}>
                        <Text style={{ color: colors.textSecondary }}>No stories available</Text>
                    </View>
                }
            />

            {/* Add Story Modal */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Post Story</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>RESTAURANT NAME *</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.gray + '40' }]}
                                value={newStory.restaurantName}
                                onChangeText={(t) => setNewStory(prev => ({ ...prev, restaurantName: t }))}
                                placeholder="e.g. The Heaven"
                            />

                            <Text style={[styles.label, { color: colors.textSecondary }]}>IMAGE URL *</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.gray + '40' }]}
                                value={newStory.imageUrl}
                                onChangeText={(t) => setNewStory(prev => ({ ...prev, imageUrl: t }))}
                                placeholder="Paste image link here"
                            />

                            <Text style={[styles.label, { color: colors.textSecondary }]}>CAPTION (OPTIONAL)</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.gray + '40' }]}
                                value={newStory.caption}
                                onChangeText={(t) => setNewStory(prev => ({ ...prev, caption: t }))}
                                placeholder="Write something catchy..."
                                multiline
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAddStory}
                            >
                                <Save color={isDark ? colors.secondary : 'white'} size={20} />
                                <Text style={[styles.submitBtnText, { color: isDark ? colors.secondary : 'white' }]}>Publish Story</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    listHeader: { marginBottom: 20 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statsText: { ...TYPOGRAPHY.bodySmall, fontStyle: 'italic' },
    groupCard: { borderRadius: 24, padding: 20, marginBottom: 20, ...SHADOWS.medium },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    groupAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#5E5CE6' },
    groupMeta: { flex: 1 },
    groupName: { ...TYPOGRAPHY.h3, fontSize: 16 },
    groupSub: { fontSize: 12 },
    previewBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, marginVertical: 16 },
    segmentsList: { gap: 12 },
    segmentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    segmentImage: { width: 50, height: 50, borderRadius: 8 },
    segmentInfo: { flex: 1 },
    segmentCaption: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    segmentTime: { fontSize: 11 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    label: { fontSize: 11, fontWeight: '800', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 32 },
    submitBtnText: { fontSize: 16, fontWeight: '800' },
});

export default AdminStoriesScreen;
