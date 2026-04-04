import { Locale, useI18n } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from './ThemeContext';

type TopBarProps = {
  title: string;
  onAvatarPress?: () => void;
  onToggleTheme: () => void;
  mode: 'light' | 'dark';
};

export function TopBar({ title, onToggleTheme, mode }: TopBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { locale, setLocale, t } = useI18n();
  const [showUserModal, setShowUserModal] = useState(false);

  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US';
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', year: 'numeric' });

  const topBarBackground = mode === 'dark' ? 'rgba(20, 26, 40, 0.95)' : 'rgba(248, 250, 252, 0.85)';

  const languageOptions: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: t.userModal.english, flag: '🇺🇸' },
    { code: 'es', label: t.userModal.spanish, flag: '🇪🇸' },
  ];

  return (
    <>
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
        <TouchableOpacity onPress={() => setShowUserModal(true)}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBud6YSLnRmcdlGYa9eMKEtESa2K4DfE7hTW9J-WudDcF9C6uSXSGnMfCRDAmHBSKl-qoY32wxth2v65993p7CpSpVeBjllNzocXshWN8qG-gEjhnW7vk9jgH6LzOlOzQiCcoezwTRgRrqlnMElT1PduKiKZfhdG1qha5K7pzmrau5c98qAixhzuBliK408FP65_GSKrYjpAUX6nlmXdpWx8WZ5yuX4S5_pEjnlL68KDSCDKPC1o_1BV9yDygd3JYCpiiZn3uB7nl4',
            }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHighest, borderWidth: 2, borderColor: `${colors.primary}20` }}
          />
        </TouchableOpacity>
      </View>

      {/* User Profile Modal */}
      <Modal visible={showUserModal} transparent animationType="fade" onRequestClose={() => setShowUserModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowUserModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: (insets.bottom || 16) + 24,
            }}
            onPress={() => {}}
          >
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 24 }} />

            {/* Avatar */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBud6YSLnRmcdlGYa9eMKEtESa2K4DfE7hTW9J-WudDcF9C6uSXSGnMfCRDAmHBSKl-qoY32wxth2v65993p7CpSpVeBjllNzocXshWN8qG-gEjhnW7vk9jgH6LzOlOzQiCcoezwTRgRrqlnMElT1PduKiKZfhdG1qha5K7pzmrau5c98qAixhzuBliK408FP65_GSKrYjpAUX6nlmXdpWx8WZ5yuX4S5_pEjnlL68KDSCDKPC1o_1BV9yDygd3JYCpiiZn3uB7nl4',
                }}
                style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceContainerHighest, borderWidth: 3, borderColor: `${colors.primary}30` }}
              />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.onSurface, marginTop: 12 }}>
                {t.userModal.profile}
              </Text>
            </View>

            {/* Language section */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="language" size={22} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onSurface }}>
                  {t.userModal.changeLanguage}
                </Text>
              </View>

              {languageOptions.map((option) => {
                const isSelected = locale === option.code;
                return (
                  <TouchableOpacity
                    key={option.code}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      padding: 14,
                      borderRadius: 16,
                      marginBottom: 8,
                      backgroundColor: isSelected ? `${colors.primary}12` : colors.surfaceContainerHigh,
                      borderWidth: isSelected ? 1.5 : 0,
                      borderColor: colors.primary,
                    }}
                    onPress={() => setLocale(option.code)}
                  >
                    <Text style={{ fontSize: 24 }}>{option.flag}</Text>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.onSurface }}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.surfaceContainerHigh,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 8,
              }}
              onPress={() => setShowUserModal(false)}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.onSurface }}>{t.userModal.close}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default TopBar;
