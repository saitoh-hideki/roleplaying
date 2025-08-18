import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// 画面コンポーネント
import HomeScreen from './src/screens/HomeScreen';
import ScenesScreen from './src/screens/ScenesScreen';
import RecordScreen from './src/screens/RecordScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ResultsScreen from './src/screens/ResultsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#0f172a" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Scenes') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Record') {
              iconName = focused ? 'mic' : 'mic-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Results') {
              iconName = focused ? 'analytics' : 'analytics-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#7C4DFF',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#1e293b',
            borderTopColor: '#334155',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#0f172a',
          },
          headerTintColor: '#f8fafc',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'ホーム' }}
        />
        <Tab.Screen 
          name="Scenes" 
          component={ScenesScreen} 
          options={{ title: 'シーン選択' }}
        />
        <Tab.Screen 
          name="Record" 
          component={RecordScreen} 
          options={{ title: '録音' }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{ title: '履歴' }}
        />
        <Tab.Screen 
          name="Results" 
          component={ResultsScreen} 
          options={{ title: '結果' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
