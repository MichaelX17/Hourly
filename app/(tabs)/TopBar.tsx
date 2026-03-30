import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from './ThemeContext';

type TopBarProps = {
  title: string;
  onAvatarPress?: () => void;
  onToggleTheme: () => void;
  mode: 'light' | 'dark';
};

export function TopBar({ title, onAvatarPress, onToggleTheme, mode }: TopBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const topBarBackground = mode === 'dark' ? 'rgba(20, 26, 40, 0.95)' : 'rgba(248, 250, 252, 0.85)';

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 12,
      paddingTop: insets.top || 16,
      backgroundColor: topBarBackground,
    }}>
      <View style={{ width: 40 }}>
        <TouchableOpacity onPress={onToggleTheme} style={{ padding: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' }}>
          <MaterialIcons name={mode === 'dark' ? 'light-mode' : 'dark-mode'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>{title}</Text>
        <Text style={{ fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: colors.onSurfaceVariant, marginTop: 2 }}>{formattedDate}</Text>
      </View>
      <TouchableOpacity onPress={onAvatarPress}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBud6YSLnRmcdlGYa9eMKEtESa2K4DfE7hTW9J-WudDcF9C6uSXSGnMfCRDAmHBSKl-qoY32wxth2v65993p7CpSpVeBjllNzocXshWN8qG-gEjhnW7vk9jgH6LzOlOzQiCcoezwTRgRrqlnMElT1PduKiKZfhdG1qha5K7pzmrau5c98qAixhzuBliK408FP65_GSKrYjpAUX6nlmXdpWx8WZ5yuX4S5_pEjnlL68KDSCDKPC1o_1BV9yDygd3JYCpiiZn3uB7nl4',
          }}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHighest, borderWidth: 2, borderColor: `${colors.primary}20` }}
        />
      </TouchableOpacity>
    </View>
  );
}

export default TopBar;
