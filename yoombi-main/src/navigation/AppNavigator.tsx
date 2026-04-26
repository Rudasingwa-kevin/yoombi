import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Map, TrendingUp, Heart, User, LayoutDashboard, Settings, ChevronLeft } from 'lucide-react-native';
import { Image, View, TouchableOpacity } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../constants/theme';

// Screens
import DiscoverScreen from '../screens/DiscoverScreen';
import ExploreScreen from '../screens/ExploreScreen';
import TrendingScreen from '../screens/TrendingScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyActivityScreen from '../screens/MyActivityScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import OwnerDashboard from '../screens/OwnerDashboard';
import AdminPanel from '../screens/AdminPanel';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';
import OwnerContentScreen from '../screens/OwnerContentScreen';
import AdminDatabaseScreen from '../screens/AdminDatabaseScreen';
import MenuManagementScreen from '../screens/MenuManagementScreen';
import ImageGalleryScreen from '../screens/ImageGalleryScreen';
import ManageRestaurantScreen from '../screens/ManageRestaurantScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import StoryViewerScreen from '../screens/StoryViewerScreen';
import PersonalInformationScreen from '../screens/PersonalInformationScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ReviewScreen from '../screens/ReviewScreen';
import FollowersListScreen from '../screens/FollowersListScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import SecurityPrivacyScreen from '../screens/SecurityPrivacyScreen';
import OwnerReviewsScreen from '../screens/OwnerReviewsScreen';
import AdminUserManagementScreen from '../screens/AdminUserManagementScreen';
import AdminRestaurantModerationScreen from '../screens/AdminRestaurantModerationScreen';
import AdminReviewModerationScreen from '../screens/AdminReviewModerationScreen';
import AdminCMSScreen from '../screens/AdminCMSScreen';
import AdminSupportScreen from '../screens/AdminSupportScreen';
import AdminStoriesScreen from '../screens/AdminStoriesScreen';
import OwnerStoriesScreen from '../screens/OwnerStoriesScreen';
import AdminAnalyticsScreen from '../screens/AdminAnalyticsScreen';
import AdminEmergencyScreen from '../screens/AdminEmergencyScreen';
import AdminBroadcastScreen from '../screens/AdminBroadcastScreen';
import AdminAuditLogsScreen from '../screens/AdminAuditLogsScreen';
import AdminSystemHealthScreen from '../screens/AdminSystemHealthScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { useSite } from '../context/SiteContext';
import { Home } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import CustomTabBar from '../components/CustomTabBar';

const BrandHeaderTitle = () => (
    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Image 
            source={require('../../assets/Symbol.png')} 
            style={{ width: 32, height: 32 }} 
            resizeMode="contain" 
        />
    </View>
);

const BackButton = ({ navigation, color }: any) => (
    <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={{ marginLeft: 8, padding: 8 }}
    >
        <ChevronLeft color={color} size={24} />
    </TouchableOpacity>
);

const UserTabs = () => {
    const { role } = useAuth();
    const { colors } = useTheme();
    const isGuest = role === 'GUEST';

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                tabBarActiveTintColor: colors.secondary,
                tabBarInactiveTintColor: colors.textSecondary,
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Discover"
                component={DiscoverScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Explore"
                component={ExploreScreen}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (isGuest) {
                            e.preventDefault();
                            navigation.navigate('Login');
                        }
                    },
                })}
                options={{
                    tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Trending"
                component={TrendingScreen}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (isGuest) {
                            e.preventDefault();
                            navigation.navigate('Login');
                        }
                    },
                })}
                options={{
                    tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Favorites"
                component={FavoritesScreen}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (isGuest) {
                            e.preventDefault();
                            navigation.navigate('Login');
                        }
                    },
                })}
                options={{
                    tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (isGuest) {
                            e.preventDefault();
                            navigation.navigate('Login');
                        }
                    },
                })}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

const OwnerTabs = () => {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                tabBarActiveTintColor: colors.secondary,
                tabBarInactiveTintColor: colors.textSecondary,
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={OwnerDashboard}
                options={{
                    tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

const AdminTabs = () => {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                tabBarActiveTintColor: colors.secondary,
                tabBarInactiveTintColor: colors.textSecondary,
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Admin"
                component={AdminPanel}
                options={{
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {

    const { user, role, isAdmin } = useAuth();
    const { colors, isDark } = useTheme();
    const { isMaintenanceMode } = useSite();

    const MyTheme = {
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
            primary: colors.primary,
            background: colors.background,
            card: colors.primary, // Deep Obsidian for headers
            text: colors.white,
            border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            notification: colors.secondary,
        },
    };

    if (isMaintenanceMode && !isAdmin) {
        return <MaintenanceScreen />;
    }

    return (
        <NavigationContainer theme={MyTheme}>
            <AnnouncementBanner />
            <Stack.Navigator 
                screenOptions={({ navigation }) => ({ 
                    headerShown: false,
                    headerStyle: { 
                        backgroundColor: colors.primary,
                    },
                    headerTitle: () => <BrandHeaderTitle />,
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerLeft: () => navigation.canGoBack() ? <BackButton navigation={navigation} color={colors.secondary} /> : null,
                })}
            >
                {!user || role === 'GUEST' ? (
                    // Guest/User default discovery stack
                    <>
                        <Stack.Screen name="MainUser" component={UserTabs} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
                        <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
                        <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
                        <Stack.Screen
                            name="StoryViewer"
                            component={StoryViewerScreen}
                            options={{
                                presentation: 'transparentModal',
                                animation: 'fade',
                                headerShown: false
                            }}
                        />
                    </>
                ) : (
                    // Authenticated flows
                    <>
                        {role === 'OWNER' && !user?.isApproved ? (
                            <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
                        ) : (
                            <>
                                {isAdmin && (
                                    <>
                                        <Stack.Screen name="MainAdmin" component={AdminTabs} />
                                        <Stack.Screen name="AdminDatabase" component={AdminDatabaseScreen} />
                                        <Stack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
                                        <Stack.Screen name="AdminRestaurantModeration" component={AdminRestaurantModerationScreen} />
                                        <Stack.Screen name="AdminReviewModeration" component={AdminReviewModerationScreen} />
                                        <Stack.Screen name="AdminCMS" component={AdminCMSScreen} />
                                        <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
                                        <Stack.Screen name="AdminSupport" component={AdminSupportScreen} />
                                        <Stack.Screen name="AdminStories" component={AdminStoriesScreen} />
                                        <Stack.Screen name="AdminEmergency" component={AdminEmergencyScreen} />
                                        <Stack.Screen name="AdminBroadcast" component={AdminBroadcastScreen} />
                                        <Stack.Screen name="AdminAuditLogs" component={AdminAuditLogsScreen} />
                                        <Stack.Screen name="AdminSystemHealth" component={AdminSystemHealthScreen} />
                                    </>
                                )}
                                {role === 'OWNER' && <Stack.Screen name="MainOwner" component={OwnerTabs} />}
                                {role === 'USER' && <Stack.Screen name="MainUserAuth" component={UserTabs} />}

                                <Stack.Screen name="OwnerContent" component={OwnerContentScreen} />
                                <Stack.Screen name="MenuManagement" component={MenuManagementScreen} />
                                <Stack.Screen name="ImageGallery" component={ImageGalleryScreen} />
                                <Stack.Screen name="ManageRestaurant" component={ManageRestaurantScreen} />
                                <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
                                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                                <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                                <Stack.Screen name="SecurityPrivacy" component={SecurityPrivacyScreen} />
                                <Stack.Screen name="Analytics" component={AnalyticsScreen} />
                                <Stack.Screen name="MyActivity" component={MyActivityScreen} />
                                <Stack.Screen name="OwnerStories" component={OwnerStoriesScreen} />
                                <Stack.Screen name="OwnerReviews" component={OwnerReviewsScreen} />
                            </>
                        )}
                        <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
                        <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
                        <Stack.Screen name="Review" component={ReviewScreen} />
                        <Stack.Screen name="FollowersList" component={FollowersListScreen} />
                        <Stack.Screen
                            name="StoryViewer"
                            component={StoryViewerScreen}
                            options={{
                                presentation: 'transparentModal',
                                animation: 'fade',
                                headerShown: false
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
