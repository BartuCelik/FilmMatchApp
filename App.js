import React from 'react';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppPreferencesProvider } from './src/context/AppPreferencesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/services/navigationService';

export default function App() {
  const [loaded, error] = useFonts({ DMSerifDisplay_400Regular });
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}
