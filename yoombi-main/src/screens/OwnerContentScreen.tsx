import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, Modal, ActivityIndicator } from 'react-native';
import { ChevronLeft, Plus, Trash2, Utensils, Tag, Camera, Send, FileText, X, ShieldCheck, Eye } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRestaurant } from '../context/RestaurantContext';
import * as ImagePicker from 'expo-image-picker';
import { articleService, storyService, restaurantService, uploadImage } from '../services/api';

const OwnerContentScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { currentRestaurant: contextRestaurant } = useRestaurant();
    
    // Support Admin management by checking for a passed restaurantId
    const targetId = navigation.getState().routes.find((r: any) => r.name === 'OwnerContent')?.params?.restaurantId;
    const [remoteRestaurant, setRemoteRestaurant] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const targetRestaurant = targetId ? remoteRestaurant : contextRestaurant;

    const [activeTab, setActiveTab] = useState<'menu' | 'offers' | 'stories' | 'articles'>('menu');
    const [offers, setOffers] = useState([
        { id: '1', title: 'Happy Hour', desc: '50% off all cocktails from 5PM to 7PM', expiry: 'Ongoing' },
    ]);
    const [activeStories, setActiveStories] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (targetId) {
            restaurantService.getById(targetId).then(res => setRemoteRestaurant(res));
        }
    }, [targetId]);

    const fetchContent = async () => {
        if (!targetRestaurant?.id) return;
        setIsLoading(true);
        try {
            // Fetch articles for this restaurant (requires filtering on backend or client)
            const artRes = await articleService.getAll();
            const restaurantArticles = (artRes as any).filter((a: any) => a.restaurantId === targetRestaurant.id);
            setArticles(restaurantArticles);

            // Fetch stories
            const storyRes = await storyService.getAllStories();
            const restaurantStory = storyRes.find((s: any) => s.restaurantId === targetRestaurant.id);
            setActiveStories(restaurantStory?.stories || []);
        } catch (e) {
            console.warn('[OwnerContent] Failed to fetch content:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [targetRestaurant?.id]);


    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'offer' | 'story' | 'article' | null>(null);

    // Form States
    const [offerTitle, setOfferTitle] = useState('');
    const [offerDesc, setOfferDesc] = useState('');
    const [offerExpiry, setOfferExpiry] = useState('');

    const [storyCaption, setStoryCaption] = useState('');
    const [storyImage, setStoryImage] = useState<string | null>(null);

    const [articleTitle, setArticleTitle] = useState('');
    const [articleCategory, setArticleCategory] = useState('');
    const [articleContent, setArticleContent] = useState('');

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 1,
        });

        if (!result.canceled) {
            setStoryImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!targetRestaurant?.id) return;
        setIsSaving(true);
        try {
            if (modalType === 'offer') {
                // ... logic for offers
            } else if (modalType === 'story') {
                if (!storyImage) {
                    Alert.alert('Error', 'Please select an image or video');
                    setIsSaving(false);
                    return;
                }
                const uploadedUrl = await uploadImage(storyImage);
                await storyService.addStoryItem(targetRestaurant.id, {
                    type: 'image',
                    url: uploadedUrl,
                    text: storyCaption
                });
                Alert.alert('Success', 'Story posted successfully');
            } else if (modalType === 'article') {
                if (!articleTitle || !articleContent || !articleCategory) {
                    Alert.alert('Error', 'Please fill in all fields');
                    setIsSaving(false);
                    return;
                }
                await articleService.create({
                    title: articleTitle,
                    content: articleContent,
                    category: articleCategory,
                    status: 'Published',
                    restaurantId: targetRestaurant.id,
                    imageUrl: null
                });
                Alert.alert('Success', 'Article published successfully');
            }
            await fetchContent();
            setModalVisible(false);
            resetForms();
        } catch (error) {
            Alert.alert('Error', 'Failed to save content.');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForms = () => {
        setOfferTitle(''); setOfferDesc(''); setOfferExpiry('');
        setStoryCaption(''); setStoryImage(null);
        setArticleTitle(''); setArticleCategory(''); setArticleContent('');
    };



    const openModal = (type: 'offer' | 'story' | 'article') => {
        setModalType(type);
        setModalVisible(true);
    };

    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const handlePreview = (article: any) => {
        setPreviewData(article);
        setPreviewVisible(true);
    };

    const renderPreviewModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={previewVisible}
            onRequestClose={() => setPreviewVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.white, paddingBottom: 40 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.primary }]}>User View Preview</Text>
                        <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    {previewData && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={[styles.previewBadge, { backgroundColor: colors.secondary + '20' }]}>
                                <Text style={[styles.previewBadgeText, { color: colors.secondary }]}>Published Article</Text>
                            </View>
                            <Text style={[TYPOGRAPHY.h1, { color: colors.primary, marginBottom: 12 }]}>{previewData.title}</Text>
                            <Text style={[TYPOGRAPHY.bodySmall, { color: colors.textSecondary, marginBottom: 20 }]}>
                                Posted on {previewData.date} • by {targetRestaurant?.name || 'Your Restaurant'}
                            </Text>
                            <View style={[styles.previewPlaceholder, { backgroundColor: colors.background }]}>
                                <FileText size={40} color={colors.textSecondary + '40'} />
                                <Text style={{ color: colors.textSecondary + '60', marginTop: 12 }}>Article Content Preview</Text>
                            </View>
                            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text, lineHeight: 24, marginTop: 20 }]}>
                                This is a simulation of how your customers will see the article in their Discover feed.
                                High-quality content with clear images and engaging titles consistently performs better
                                on Yoombi.
                            </Text>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );

    // Component logic continues...

    const renderManagementTab = () => (
        <View style={styles.tabContent}>
            <View style={[styles.addItemBox, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <Text style={[styles.boxTitle, { color: colors.primary }]}>Business Management</Text>
                <Text style={[styles.uploadSub, { color: colors.textSecondary, textAlign: 'left', marginBottom: 20 }]}>
                    Use dedicated tools to manage your restaurant's core operations.
                </Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary, marginBottom: 12 }]}
                    onPress={() => navigation.navigate('MenuManagement')}
                >
                    <Utensils color={isDark ? colors.secondary : colors.white} size={20} />
                    <Text style={[styles.addButtonText, { color: isDark ? colors.secondary : colors.white }]}>Full Menu Editor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.background, paddingVertical: 14 }]}
                    onPress={() => navigation.navigate('ManageRestaurant')}
                >
                    <FileText color={colors.primary} size={20} />
                    <Text style={[styles.addButtonText, { color: colors.primary }]}>Restaurant Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOffersTab = () => (
        <View style={styles.tabContent}>
            <TouchableOpacity
                style={[styles.outlineButton, { borderColor: colors.secondary }]}
                onPress={() => openModal('offer')}
            >
                <Plus color={colors.secondary} size={20} />
                <Text style={[styles.outlineButtonText, { color: colors.secondary }]}>Create New Offer</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Active Promotions</Text>
            {offers.map(offer => (
                <View key={offer.id} style={[styles.offerCard, { backgroundColor: colors.white, shadowColor: colors.shadow, borderLeftColor: colors.secondary }]}>
                    <View style={styles.offerHeader}>
                        <Tag color={colors.secondary} size={18} />
                        <Text style={[styles.offerTitle, { color: colors.text }]}>{offer.title}</Text>
                    </View>
                    <Text style={[styles.offerDesc, { color: colors.textSecondary }]}>{offer.desc}</Text>
                    <Text style={[styles.offerExpiry, { color: colors.secondary }]}>Expires: {offer.expiry}</Text>
                </View>
            ))}
        </View>
    );

    const renderStoriesTab = () => (
        <View style={styles.tabContent}>
            <View style={[styles.storyUploadBox, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                <View style={[styles.cameraCircle, { backgroundColor: colors.background }]}>
                    <Camera color={colors.primary} size={32} />
                </View>
                <Text style={[styles.uploadTitle, { color: colors.text }]}>Post a New Story</Text>
                <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>Share what's happening now at your restaurant to be featured in 'Trending'</Text>
                <TouchableOpacity
                    style={[styles.postButton, { backgroundColor: colors.secondary }]}
                    onPress={() => openModal('story')}
                >
                    <Send color={isDark ? colors.primary : colors.white} size={18} />
                    <Text style={[styles.postButtonText, { color: isDark ? colors.primary : colors.white }]}>Select Image & Post</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>Active Stories</Text>
            <View style={styles.storiesGrid}>
                {activeStories.map((story: any) => (
                    <View key={story.id} style={styles.storyItem}>
                        <Image source={{ uri: story.imageUrl }} style={styles.storyThumb} />
                        <TouchableOpacity
                            style={styles.deleteStory}
                            onPress={() => {
                                Alert.alert('Delete Story', 'Are you sure?', [
                                    { text: 'Cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: async () => {
                                        await storyService.deleteStoryItem(targetRestaurant?.id || '', story.id);
                                        fetchContent();
                                    }}
                                ]);
                            }}
                        >
                            <X size={14} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.storyStats}>
                            <Text style={styles.storyViews}>Live</Text>
                            <Text style={styles.storyTime}>{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderArticlesTab = () => (
        <View style={styles.tabContent}>
            <TouchableOpacity
                style={[styles.outlineButton, { borderColor: colors.secondary }]}
                onPress={() => openModal('article')}
            >
                <Plus color={colors.secondary} size={20} />
                <Text style={[styles.outlineButtonText, { color: colors.secondary }]}>Write New Article</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Published Articles</Text>
            {articles.map((article: any) => (
                <View key={article.id} style={[styles.articleCard, { backgroundColor: colors.white, shadowColor: colors.shadow }]}>
                    <View style={styles.articleInfo}>
                        <FileText color={colors.secondary} size={20} />
                        <View>
                            <Text style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
                            <Text style={[styles.articleDate, { color: colors.textSecondary }]}>{new Date(article.date).toLocaleDateString()} • {article.status}</Text>
                        </View>
                    </View>
                    <View style={styles.articleActions}>
                        <TouchableOpacity onPress={() => handlePreview(article)} style={{ marginRight: 12 }}>
                            <Eye color={colors.primary} size={18} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            Alert.alert('Delete Article', 'Are you sure?', [
                                { text: 'Cancel' },
                                { text: 'Delete', style: 'destructive', onPress: async () => {
                                    await articleService.delete(article.id);
                                    fetchContent();
                                }}
                            ]);
                        }}>
                            <Trash2 color="#EF4444" size={18} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.primary }]}>
                            {modalType === 'offer' ? 'Create Offer' :
                                modalType === 'story' ? 'Post Story' : 'Write Article'}
                        </Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {modalType === 'offer' && (
                            <>
                                <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                    value={offerTitle} onChangeText={setOfferTitle} placeholder="e.g. Happy Hour" placeholderTextColor={colors.textSecondary + '70'}
                                />
                                <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                    value={offerDesc} onChangeText={setOfferDesc} placeholder="Details..." placeholderTextColor={colors.textSecondary + '70'}
                                />
                                <Text style={[styles.label, { color: colors.text }]}>Expiry</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                    value={offerExpiry} onChangeText={setOfferExpiry} placeholder="e.g. Next Friday" placeholderTextColor={colors.textSecondary + '70'}
                                />
                            </>
                        )}

                        {modalType === 'story' && (
                            <>
                                <TouchableOpacity onPress={pickImage}>
                                    {storyImage ? (
                                        <Image source={{ uri: storyImage }} style={styles.imagePlaceholder} />
                                    ) : (
                                        <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
                                            <Camera color={colors.textSecondary} size={40} />
                                            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Tap to Select Image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={[styles.label, { color: colors.text }]}>Caption</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                    value={storyCaption} onChangeText={setStoryCaption} placeholder="Add a caption..." placeholderTextColor={colors.textSecondary + '70'}
                                />
                            </>
                        )}

                        {modalType === 'article' && (
                            <>
                                <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                    value={articleTitle} onChangeText={setArticleTitle} placeholder="Article Title" placeholderTextColor={colors.textSecondary + '70'}
                                />
                                <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                    value={articleCategory} onChangeText={setArticleCategory} placeholder="e.g. Events, Menu" placeholderTextColor={colors.textSecondary + '70'}
                                />
                                <Text style={[styles.label, { color: colors.text }]}>Content</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, height: 100, textAlignVertical: 'top' }]}
                                    value={articleContent} onChangeText={setArticleContent} placeholder="Write your article..." multiline placeholderTextColor={colors.textSecondary + '70'}
                                />
                            </>
                        )}

                        <TouchableOpacity 
                            style={[styles.createButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]} 
                            onPress={handleCreate}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.createButtonText}>{modalType === 'story' ? 'Post' : 'Create'}</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.primary} size={28} />
                </TouchableOpacity>
                <Text style={[TYPOGRAPHY.h2, { color: colors.primary }]}>Manage Content</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={[styles.tabBar, { backgroundColor: colors.white, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'menu' && { borderBottomWidth: 2, borderBottomColor: colors.secondary }]}
                    onPress={() => setActiveTab('menu')}
                >
                    <ShieldCheck color={activeTab === 'menu' ? colors.secondary : colors.textSecondary} size={20} />
                    <Text style={[styles.tabText, { color: activeTab === 'menu' ? colors.secondary : colors.textSecondary }]}>Manage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'offers' && { borderBottomWidth: 2, borderBottomColor: colors.secondary }]}
                    onPress={() => setActiveTab('offers')}
                >
                    <Tag color={activeTab === 'offers' ? colors.secondary : colors.textSecondary} size={20} />
                    <Text style={[styles.tabText, { color: activeTab === 'offers' ? colors.secondary : colors.textSecondary }]}>Offers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'stories' && { borderBottomWidth: 2, borderBottomColor: colors.secondary }]}
                    onPress={() => setActiveTab('stories')}
                >
                    <Camera color={activeTab === 'stories' ? colors.secondary : colors.textSecondary} size={20} />
                    <Text style={[styles.tabText, { color: activeTab === 'stories' ? colors.secondary : colors.textSecondary }]}>Stories</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'articles' && { borderBottomWidth: 2, borderBottomColor: colors.secondary }]}
                    onPress={() => setActiveTab('articles')}
                >
                    <FileText color={activeTab === 'articles' ? colors.secondary : colors.textSecondary} size={20} />
                    <Text style={[styles.tabText, { color: activeTab === 'articles' ? colors.secondary : colors.textSecondary }]}>Articles</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTab === 'menu' && renderManagementTab()}
                {activeTab === 'offers' && renderOffersTab()}
                {activeTab === 'stories' && renderStoriesTab()}
                {activeTab === 'articles' && renderArticlesTab()}
            </ScrollView>

            {renderModal()}
            {renderPreviewModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 8,
    },
    tabText: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
    },
    tabContent: {
        flex: 1,
    },
    addItemBox: {
        padding: 20,
        borderRadius: 20,
        ...SHADOWS.light,
        marginBottom: 24,
    },
    boxTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        marginBottom: 16,
    },
    input: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        ...TYPOGRAPHY.bodyMedium,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 8,
    },
    addButtonText: {
        fontWeight: '700',
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        marginBottom: 16,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        ...SHADOWS.light,
    },
    itemName: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '700',
    },
    itemPrice: {
        ...TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    outlineButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 24,
    },
    outlineButtonText: {
        fontWeight: '700',
    },
    offerCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        ...SHADOWS.light,
        borderLeftWidth: 4,
    },
    offerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    offerTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 15,
    },
    offerDesc: {
        ...TYPOGRAPHY.bodySmall,
        marginBottom: 8,
    },
    offerExpiry: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    storyUploadBox: {
        alignItems: 'center',
        padding: 40,
        borderRadius: 24,
        ...SHADOWS.medium,
        marginTop: 20,
    },
    cameraCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    uploadTitle: {
        ...TYPOGRAPHY.h2,
        fontSize: 18,
        marginBottom: 10,
    },
    uploadSub: {
        ...TYPOGRAPHY.bodySmall,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 18,
    },
    postButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 10,
    },
    postButtonText: {
        fontWeight: '700',
    },
    storiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    storyItem: {
        width: 100,
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    storyThumb: {
        width: '100%',
        height: '100%',
        backgroundColor: '#DDD',
    },
    deleteStory: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        borderRadius: 10,
    },
    storyStats: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    storyViews: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    storyTime: {
        color: '#CCC',
        fontSize: 9,
    },
    articleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        ...SHADOWS.light,
    },
    articleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    articleActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 16,
    },
    previewBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    previewPlaceholder: {
        height: 200,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    articleTitle: {
        ...TYPOGRAPHY.bodyMedium,
        fontWeight: '700',
    },
    articleDate: {
        ...TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        ...TYPOGRAPHY.h3,
    },
    modalBody: {
        marginBottom: 20,
    },
    label: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    imagePlaceholder: {
        height: 200,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#DDD',
        borderStyle: 'dashed',
    },
    createButton: {
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    createButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default OwnerContentScreen;
