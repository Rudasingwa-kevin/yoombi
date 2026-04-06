import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Banner {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isActive: boolean;
}

interface SiteContextType {
    isMaintenanceMode: boolean;
    setMaintenanceMode: (val: boolean) => void;
    activeBanner: Banner | null;
    updateBanner: (banner: Partial<Banner>) => void;
    hideBanner: () => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [activeBanner, setActiveBanner] = useState<Banner | null>({
        id: '1',
        message: 'Yoombi is now available in Musanze! 🏔️',
        type: 'info',
        isActive: false
    });

    useEffect(() => {
        const loadSiteState = async () => {
            try {
                const maintenance = await AsyncStorage.getItem('@site_maintenance');
                const banner = await AsyncStorage.getItem('@site_banner');
                
                if (maintenance !== null) setIsMaintenanceMode(JSON.parse(maintenance));
                if (banner !== null) setActiveBanner(JSON.parse(banner));
            } catch (e) {
                console.error('Failed to load site state', e);
            }
        };
        loadSiteState();
    }, []);

    const setMaintenanceMode = async (val: boolean) => {
        setIsMaintenanceMode(val);
        await AsyncStorage.setItem('@site_maintenance', JSON.stringify(val));
    };

    const updateBanner = async (banner: Partial<Banner>) => {
        const newBanner = activeBanner ? { ...activeBanner, ...banner } : { id: Date.now().toString(), message: '', type: 'info', isActive: true, ...banner };
        setActiveBanner(newBanner as Banner);
        await AsyncStorage.setItem('@site_banner', JSON.stringify(newBanner));
    };

    const hideBanner = async () => {
        if (activeBanner) {
            const updated = { ...activeBanner, isActive: false };
            setActiveBanner(updated);
            await AsyncStorage.setItem('@site_banner', JSON.stringify(updated));
        }
    };

    return (
        <SiteContext.Provider value={{
            isMaintenanceMode,
            setMaintenanceMode,
            activeBanner,
            updateBanner,
            hideBanner
        }}>
            {children}
        </SiteContext.Provider>
    );
};

export const useSite = () => {
    const context = useContext(SiteContext);
    if (!context) throw new Error('useSite must be used within a SiteProvider');
    return context;
};
