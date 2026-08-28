import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SessionSelectScreen from '../screens/SessionSelectScreen';
import ScannerScreen from '../screens/ScannerScreen';
import LiveCountScreen from '../screens/LiveCountScreen';

export type RootStackParamList = {
  Login: undefined;
  SessionSelect: undefined;
  Scanner: { sessionId: string; sessionName: string; speaker: string };
  LiveCount: { sessionId: string; sessionName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const ACCENT = '#d97706';
const BG = '#0a0a0a';

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <ActivityIndicator color={ACCENT} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: BG },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          cardStyle: { backgroundColor: BG },
        }}
      >
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="SessionSelect"
              component={SessionSelectScreen}
              options={{ title: 'Select Session', headerLeft: () => null }}
            />
            <Stack.Screen
              name="Scanner"
              component={ScannerScreen}
              options={({ route }) => ({ title: route.params.sessionName })}
            />
            <Stack.Screen
              name="LiveCount"
              component={LiveCountScreen}
              options={({ route }) => ({ title: route.params.sessionName })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
