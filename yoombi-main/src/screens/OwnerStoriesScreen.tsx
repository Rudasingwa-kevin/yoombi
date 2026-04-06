import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, TextInput, Image, Modal } from 'react-native';
import { ChevronLeft, Plus, Trash2, Calendar, Layout, Save, X, Eye, Smartphone } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';
import { storyService } from '../services/api';
import { RestaurantStoriesDTO, StoryItemDTO } from '../types/dto';
import { useToast } from '../context/ToastContext';

const OwnerStoriesScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { currentRestaurant } = useRestaurant();
    const toast = useToast();
    const restaurantName = currentRestaurant?.name || 'Heaven Restaurant';
    
    const [storyGroups, setStoryGroups] = useState<RestaurantStoriesDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    
    const [newStory, setNewStory] = useState<{ type: 'image' | 'text', url: string, text: string }>({
        type: 'image',
        url: '',
        text: ''
    });

    const fetchStories = async () => {
        setIsLoading(true);
        try {
            const res = await storyService.getAllStories();
            setStoryGroups(res || []);
        } catch (error) {
            console.error('[OwnerStories] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchStories();
    }, []);

    // Filter stories to only show this owner's restaurant
    const myStories = useMemo(() => {
        return storyGroups.find(g => g.restaurantId === currentRestaurant?.id);
    }, [storyGroups, currentRestaurant]);

    const handleDeleteStory = (storyId: string) => {
        Alert.alert('Remove Story', 'Are you sure you want to delete this highlight?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    if (!currentRestaurant?.id) return;
                    try {
                        await storyService.deleteStoryItem(currentRestaurant.id, storyId);
                        toast.success('Deleted', 'Story has been removed.');
                        fetchStories();
                    } catch (error) {
                        toast.error('Error', 'Could not delete story.');
                    }
                }
            }
        ]);
    };

    const handleAddStory = async () => {
        if (!currentRestaurant?.id) return;
        
        if (newStory.type === 'image' && !newStory.url) {
            toast.warning('Image Required', 'Please provide an image URL.');
            return;
        }
        if (newStory.type === 'text' && !newStory.text) {
            toast.warning('Text Required', 'Please enter some text for your story.');
            return;
        }

        try {
            await storyService.addStoryItem(currentRestaurant.id, {
                type: newStory.type,
                url: newStory.type === 'image' ? newStory.url : undefined,
                text: newStory.text,
            });

            toast.success('Story is Live! 📸', 'Your highlight has been published.');
            setIsAddModalVisible(false);
            setNewStory({ type: 'image', url: '', text: '' });
            fetchStories();
        } catch (error) {
            toast.error('Post Failed', 'Could not publish your story. Try again later.');
        }
    };

    const renderStorySegment = (story: StoryItemDTO) => (
        <View key={story.id} style={[styles.segmentCard, { backgroundColor: colors.white }]}>
            {story.type === 'text' ? (
                <View style={[styles.segmentTextPlaceholder, { backgroundColor: colors.primary + '10' }]}>
                     <Layout size={20} color={colors.primary} />
                </View>
            ) : (
                <Image source={{ uri: story.imageUrl || (story as any).image }} style={styles.segmentImage} />
            )}
            <View style={styles.segmentInfo}>
                <Text style={[styles.segmentCaption, { color: colors.text }]} numberOfLines={1}>
                    {story.type === 'text' ? story.text : (story.text || 'No caption')}
                </Text>
                <Text style={[styles.segmentTime, { color: colors.textSecondary }]}>
                    {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteStory(story.id)}>
                <Trash2 color="#EF4444" size={18} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>{restaurantName} Stories</Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(true)}>
                    <Plus color={colors.primary} size={28} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.infoCard, { backgroundColor: colors.secondary + '10' }]}>
                    <Smartphone color={colors.secondary} size={24} />
                    <View style={styles.infoMeta}>
                        <Text style={[styles.infoTitle, { color: colors.secondary }]}>Engagement Tip</Text>
                        <Text style={[styles.infoSub, { color: colors.text }]}>Stories appear on the Trending screen and expire in 24 hours.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIVE SEGMENTS ({myStories?.stories.length || 0})</Text>
                    {myStories ? (
                         <View style={styles.segmentsList}>
                            {myStories.stories.map((s: any) => renderStorySegment(s))}
                         </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You haven't posted any stories yet.</Text>
                            <TouchableOpacity style={[styles.emptyBtn, { borderColor: colors.primary }]} onPress={() => setIsAddModalVisible(true)}>
                                <Text style={{ color: colors.primary, fontWeight: '700' }}>Post First Story</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Post Highlight</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                <X color={colors.text} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.typeSelector}>
                                {(['image', 'text'] as const).map(t => (
                                    <TouchableOpacity 
                                        key={t}
                                        onPress={() => setNewStory(prev => ({ ...prev, type: t }))}
                                        style={[
                                            styles.typeOption, 
                                            { 
                                                backgroundColor: newStory.type === t ? colors.primary : colors.white,
                                                borderColor: colors.primary 
                                            }
                                        ]}
                                    >
                                        <Text style={{ color: newStory.type === t ? 'white' : colors.primary, fontWeight: '700', textTransform: 'uppercase' }}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {newStory.type === 'image' ? (
                                <>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>IMAGE URL</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.gray + '40' }]}
                                        value={newStory.url}
                                        onChangeText={(t) => setNewStory(prev => ({ ...prev, url: t }))}
                                        placeholder="Paste photo link here"
                                    />
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>CAPTION (OPTIONAL)</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.gray + '40' }]}
                                        value={newStory.text}
                                        onChangeText={(t) => setNewStory(prev => ({ ...prev, text: t }))}
                                        placeholder="Add a caption..."
                                    />
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>STORY TEXT</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.gray + '40', height: 120 }]}
                                        value={newStory.text}
                                        onChangeText={(t) => setNewStory(prev => ({ ...prev, text: t }))}
                                        placeholder="Write something exciting..."
                                        multiline
                                    />
                                </>
                            )}

                            <TouchableOpacity 
                                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAddStory}
                            >
                                <Save color={isDark ? colors.secondary : 'white'} size={20} />
                                <Text style={[styles.submitBtnText, { color: isDark ? colors.secondary : 'white' }]}>Post Now</Text>
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
    content: { padding: 20, paddingBottom: 100 },
    infoCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, marginBottom: 32 },
    infoMeta: { flex: 1 },
    infoTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
    infoSub: { fontSize: 13 },
    section: {},
    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
    segmentsList: { gap: 16 },
    segmentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', ...SHADOWS.small },
    segmentImage: { width: 60, height: 60, borderRadius: 12 },
    segmentInfo: { flex: 1 },
    segmentCaption: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    segmentTime: { fontSize: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 16 },
    emptyText: { fontSize: 15, textAlign: 'center' },
    emptyBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    label: { fontSize: 11, fontWeight: '800', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 32 },
    submitBtnText: { fontSize: 16, fontWeight: '800' },
    segmentTextPlaceholder: { width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    typeOption: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 }
});

export default OwnerStoriesScreen;
