import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from './ThemeContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}>

        <Tabs.Screen
          name="today"
          options={{
            title: 'Today',
            tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="clock" color={color} />,
          }}
        />
        <Tabs.Screen
          name="current-week"
          options={{
            title: 'Current Week',
            tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="calendar" color={color} />,
          }}
        />

        <Tabs.Screen
          name="monthly-insights"
          options={{
            title: 'Monthly Insights',
            tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="chart.bar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="week-analysis"
          options={{
            title: 'Week Analysis',
            tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="chart.bar" color={color} />,
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
