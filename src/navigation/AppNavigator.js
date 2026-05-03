import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ModeSelectionScreen from '../screens/ModeSelectionScreen';
import MatchScreen from '../screens/MatchScreen';
import AiCurationQuestionsScreen from '../screens/AiCurationQuestionsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    // Header is hidden because screens already include custom top sections.
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} />
      <Stack.Screen name="AiCurationQuestions" component={AiCurationQuestionsScreen} />
      <Stack.Screen name="Match" component={MatchScreen} />
    </Stack.Navigator>
  );
}
