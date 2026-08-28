import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useStudent } from '../context/StudentContext';
import EnrollScreen from '../screens/EnrollScreen';
import MyQRScreen from '../screens/MyQRScreen';
import MyAttendanceScreen from '../screens/MyAttendanceScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ACCENT = '#d97706';
const BG = '#1a0a00';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            'My QR': focused ? 'qr-code' : 'qr-code-outline',
            'Attendance': focused ? 'checkmark-circle' : 'checkmark-circle-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'help'} size={size} color={color} />;
        },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: BG, borderTopColor: '#333' },
        headerStyle: { backgroundColor: BG },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="My QR" component={MyQRScreen} options={{ title: 'My QR Code' }} />
      <Tab.Screen name="Attendance" component={MyAttendanceScreen} options={{ title: 'My Attendance' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { student, isLoading } = useStudent();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <ActivityIndicator color={ACCENT} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {student ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Enroll" component={EnrollScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
