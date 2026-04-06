import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RestaurantProvider } from './src/context/RestaurantContext';
import { SiteProvider } from './src/context/SiteContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <RestaurantProvider>
              <SiteProvider>
                <NotificationProvider>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </NotificationProvider>
              </SiteProvider>
            </RestaurantProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
