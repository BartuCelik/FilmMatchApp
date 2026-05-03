import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppPreferencesProvider } from './src/context/AppPreferencesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/services/navigationService';

export default function App() {
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
