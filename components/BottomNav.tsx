import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type BottomTab = 'today' | 'weekly' | 'stats' | 'settings' | 'monthly' | 'week-details';

type BottomNavHref = '/today' | '/current-week' | '/monthly-insights' | '/week-details';

type BottomTabItem = {
  key: BottomTab;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  href: BottomNavHref;
};

const navItems: BottomTabItem[] = [
  { key: 'today', label: 'Today', icon: 'today', href: '/today' },
  { key: 'weekly', label: 'Weekly', icon: 'calendar-view-week', href: '/current-week' },
  { key: 'monthly', label: 'Monthly', icon: 'bar-chart', href: '/monthly-insights' },
  { key: 'week-details', label: 'Details', icon: 'schedule', href: '/week-details' },
];

/**
 * Normaliza valores que podrían venir de `activeTab` del screen interno.
 * Por ejemplo, `stats` o `settings` se mapean a `today` en la barra inferior.
 */
const normalizeBottomNavTab = (tab: BottomTab): BottomTab => {
  if (tab === 'stats' || tab === 'settings') return 'today';
  return tab;
};

/**
 * Determina qué tab debe estar activo según la ruta actual.
 * Maneja rutas exactas y prefijos (para rutas anidadas).
 */
const resolveTabByPath = (pathname?: string): BottomTab => {
  const normalized = (pathname || '/').split('?')[0].split('#')[0];

  // Caso especial: ruta raíz (index) debe activar 'today'
  if (normalized === '/' || normalized === '/today') {
    return 'today';
  }

  // Buscar coincidencia por prefijo (para rutas como /current-week/...)
  const match = navItems.find((item) => normalized.startsWith(item.href));
  if (match) {
    return match.key;
  }

  // Fallback seguro
  return 'today';
};

type BottomNavProps = {
  activeTab?: BottomTab;
  onTabPress?: (tab: BottomTab) => void;
};

export const BottomNav = ({ activeTab, onTabPress }: BottomNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const routeTab = resolveTabByPath(pathname);
  const normalizedTab = routeTab || activeTab || 'today';
  const effectiveTab = normalizeBottomNavTab(normalizedTab);

  const handlePress = (item: BottomTabItem) => {
    if (onTabPress) {
      onTabPress(item.key);
    } else {
      router.push(item.href);
    }
  };

  return (
    <View
      style={[
        styles.bottomNav,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {navItems.map((item) => {
        const isActive = effectiveTab === item.key;
        const iconColor = isActive ? styles.navLabelActive.color : styles.navLabel.color;

        return (
          <Pressable
            key={item.key}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => handlePress(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${item.label} tab`}
            testID={`bottom-nav-${item.key}`}
          >
            <MaterialIcons name={item.icon} size={24} color={iconColor ?? '#737785'} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: '#e4f5fb',
  },
  navLabel: {
    fontSize: 10,
    color: '#737785',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  navLabelActive: {
    color: '#004f59',
    fontWeight: 'bold',
  },
});