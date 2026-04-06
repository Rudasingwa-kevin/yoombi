import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, AuthUser } from './AuthContext';
import { restaurantService, menuService, authService, loyaltyService } from '../services/api';
import type { RestaurantDTO, MenuItemDTO } from '../types/dto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: string;       // formatted string for display, e.g. "15,000 RWF"
    priceRaw: number;    // raw integer in RWF for API
    category: string;
    image?: string;
    available: boolean;
}

interface RestaurantContextType {
    currentRestaurant: RestaurantDTO | null;
    isRestaurantLoading: boolean;
    menuItems: MenuItem[];
    addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
    updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
    deleteMenuItem: (id: string) => void;
    addRestaurantImage: (imageUri: string) => Promise<void>;
    removeRestaurantImage: (imageUri: string) => void;
    updateRestaurantInfo: (info: Partial<RestaurantDTO>) => Promise<void>;
    refreshRestaurant: () => Promise<void>;
    followRestaurant: (id: string) => void;
    unfollowRestaurant: (id: string) => void;
    isFollowing: (id: string) => boolean;
    loyaltyPoints: number;
    getUserTier: () => 'Emerald' | 'Gold' | 'Sapphire' | 'Black Diamond';
    addPoints: (amount: number) => void;
    checkIn: (restaurantId: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
    const { user, role, onSignIn, onSignOut } = useAuth();

    const [currentRestaurant, setCurrentRestaurant] = useState<RestaurantDTO | null>(null);
    const [isRestaurantLoading, setIsRestaurantLoading] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    const [followedRestaurants, setFollowedRestaurants] = useState<string[]>([]);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);

    // ── Fetch user profile data (points, following) ───────────────────────────
    const fetchUserProfile = async () => {
        try {
            const data = await authService.getMe();
            setLoyaltyPoints(data.loyaltyPoints || 0);
            setFollowedRestaurants(data.following || []);
        } catch (e) {
            console.warn('[RestaurantContext] Could not fetch user profile:', e);
            // Default points for guest/dev
            if (role === 'GUEST') setLoyaltyPoints(0);
        }
    };

    // ── Fetch owner restaurant after login ────────────────────────────────────
    const fetchOwnerRestaurant = async () => {
        if (role !== 'OWNER') {
            console.log('[RestaurantContext] Skipping owner fetch, role is:', role);
            return;
        }
        
        setIsRestaurantLoading(true);
        console.log('[RestaurantContext] Fetching restaurant for owner:', user?.id);
        
        try {
            const restaurant = await restaurantService.getOwnerRestaurant();
            console.log('[RestaurantContext] Success! Loaded restaurant:', restaurant.name);
            setCurrentRestaurant(restaurant);
            
            // Fetch real menu items
            try {
                const items = await menuService.getItems(restaurant.id);
                setMenuItems(items.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: `${(item.price ?? 0).toLocaleString()} RWF`,
                    priceRaw: item.price,
                    category: item.category,
                    image: item.image,
                    available: item.available,
                })));
            } catch (menuError) {
                console.warn('[RestaurantContext] Could not fetch menu items:', menuError);
            }
        } catch (e: any) {
            console.error('[RestaurantContext] Failed to fetch owner restaurant:', e.message);
            // Leave currentRestaurant as null — UI should handle the empty state
        } finally {
            setIsRestaurantLoading(false);
        }
    };

    // ── Subscribe to sign-in / sign-out events ────────────────────────────────
    useEffect(() => {
        const unsubscribeSignIn = onSignIn(async (signedInUser: AuthUser) => {
            if (signedInUser.role === 'OWNER') {
                await fetchOwnerRestaurant();
            }
            await fetchUserProfile();
        });

        const unsubscribeSignOut = onSignOut(() => {
            setCurrentRestaurant(null);
            setFollowedRestaurants([]);
            setLoyaltyPoints(0);
        });

        // Initial fetch if user already logged in
        if (user) {
            console.log('[RestaurantContext] Initial fetch for user:', user.email);
            fetchUserProfile();
            if (role === 'OWNER') fetchOwnerRestaurant();
        }

        return () => {
            unsubscribeSignIn();
            unsubscribeSignOut();
        };
    }, [onSignIn, onSignOut]);

    // Separate effect to handle role/user changes that might happen async
    useEffect(() => {
        if (user && role === 'OWNER' && !currentRestaurant) {
            fetchOwnerRestaurant();
        }
        if (user) {
            fetchUserProfile();
        }
    }, [user, role]);

    // ── Refresh restaurant data ────────────────────────────────────────────────
    const refreshRestaurant = async () => {
        if (currentRestaurant) {
            setIsRestaurantLoading(true);
            try {
                const updated = await restaurantService.getById(currentRestaurant.id);
                setCurrentRestaurant(updated);
            } catch (e) {
                console.warn('[RestaurantContext] Failed to refresh restaurant:', e);
            } finally {
                setIsRestaurantLoading(false);
            }
        }
    };

    // ── Loyalty / Tiers ───────────────────────────────────────────────────────
    const addPoints = (amount: number) => setLoyaltyPoints(prev => prev + amount);

    const checkIn = async (restaurantId: string) => {
        try {
            const data = await loyaltyService.checkIn(restaurantId);
            setLoyaltyPoints(data.totalPoints);
        } catch (error) {
            console.error('[RestaurantContext] Check-in failed:', error);
            throw error;
        }
    };

    const getUserTier = (): 'Emerald' | 'Gold' | 'Sapphire' | 'Black Diamond' => {
        if (loyaltyPoints >= 10000) return 'Black Diamond';
        if (loyaltyPoints >= 5000) return 'Sapphire';
        if (loyaltyPoints >= 2000) return 'Gold';
        return 'Emerald';
    };

    // ── Menu Management ───────────────────────────────────────────────────────
    const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
        if (!currentRestaurant) return;
        
        try {
            const newItemDTO = await menuService.addItem(currentRestaurant.id, {
                name: item.name,
                description: item.description,
                price: item.priceRaw,
                category: item.category,
                image: item.image,
                available: item.available
            });
            
            const newItem: MenuItem = {
                id: newItemDTO.id,
                name: newItemDTO.name,
                description: newItemDTO.description,
                price: `${(newItemDTO.price ?? 0).toLocaleString()} RWF`,
                priceRaw: newItemDTO.price,
                category: newItemDTO.category,
                image: newItemDTO.image,
                available: newItemDTO.available
            };
            
            setMenuItems(prev => [...prev, newItem]);
        } catch (error) {
            console.error('[RestaurantContext] Failed to add menu item:', error);
            throw error;
        }
    };

    const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
        if (!currentRestaurant) return;
        
        try {
            const apiUpdates: any = {};
            if (updates.name !== undefined) apiUpdates.name = updates.name;
            if (updates.description !== undefined) apiUpdates.description = updates.description;
            if (updates.priceRaw !== undefined) apiUpdates.price = updates.priceRaw;
            if (updates.category !== undefined) apiUpdates.category = updates.category;
            if (updates.image !== undefined) apiUpdates.image = updates.image;
            if (updates.available !== undefined) apiUpdates.available = updates.available;

            const updatedItemDTO = await menuService.updateItem(currentRestaurant.id, id, apiUpdates);
            
            setMenuItems(prev => prev.map(item => item.id === id ? {
                ...item,
                ...updates,
                price: updatedItemDTO.price !== undefined ? `${updatedItemDTO.price.toLocaleString()} RWF` : item.price,
                priceRaw: updatedItemDTO.price ?? item.priceRaw,
            } : item));
        } catch (error) {
            console.error('[RestaurantContext] Failed to update menu item:', error);
            throw error;
        }
    };

    const deleteMenuItem = async (id: string) => {
        if (!currentRestaurant) return;
        
        try {
            await menuService.deleteItem(currentRestaurant.id, id);
            setMenuItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('[RestaurantContext] Failed to delete menu item:', error);
            throw error;
        }
    };

    // ── Image Management ──────────────────────────────────────────────────────
    const addRestaurantImage = async (imageUri: string) => {
        if (currentRestaurant) {
            try {
                const response = await restaurantService.uploadImage(currentRestaurant.id, imageUri);
                setCurrentRestaurant({ ...currentRestaurant, images: [...currentRestaurant.images, response.imageUrl] });
            } catch (error) {
                console.error('[RestaurantContext] Failed to upload image:', error);
                throw error;
            }
        }
    };

    const removeRestaurantImage = async (imageUri: string) => {
        if (currentRestaurant) {
            try {
                await restaurantService.deleteImage(currentRestaurant.id, imageUri);
                setCurrentRestaurant({
                    ...currentRestaurant,
                    images: currentRestaurant.images.filter(img => img !== imageUri),
                });
            } catch (error) {
                console.error('[RestaurantContext] Failed to remove image:', error);
                throw error;
            }
        }
    };

    const updateRestaurantInfo = async (info: Partial<RestaurantDTO>) => {
        if (currentRestaurant) {
            try {
                const updated = await restaurantService.update(currentRestaurant.id, info);
                setCurrentRestaurant({ ...currentRestaurant, ...updated });
            } catch (error) {
                console.error('[RestaurantContext] Failed to update restaurant info:', error);
                throw error;
            }
        }
    };

    // ── Following ─────────────────────────────────────────────────────────────
    const followRestaurant = (id: string) => {
        setFollowedRestaurants(prev => {
            if (!prev.includes(id)) {
                addPoints(5);
                restaurantService.follow(id).catch(() => {});
                return [...prev, id];
            }
            return prev;
        });
    };

    const unfollowRestaurant = (id: string) => {
        setFollowedRestaurants(prev => prev.filter(rId => rId !== id));
        restaurantService.unfollow(id).catch(() => {});
    };

    const isFollowing = (id: string) => followedRestaurants.includes(id);

    return (
        <RestaurantContext.Provider
            value={{
                currentRestaurant,
                isRestaurantLoading,
                menuItems,
                addMenuItem,
                updateMenuItem,
                deleteMenuItem,
                addRestaurantImage,
                removeRestaurantImage,
                updateRestaurantInfo,
                refreshRestaurant,
                followRestaurant,
                unfollowRestaurant,
                isFollowing,
                loyaltyPoints,
                getUserTier,
                addPoints,
                checkIn,
            }}
        >
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (!context) {
        throw new Error('useRestaurant must be used within RestaurantProvider');
    }
    return context;
};
