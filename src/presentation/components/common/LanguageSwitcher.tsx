/**
 * Language Switcher Component
 * Single Responsibility: Language selection UI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LanguageCode, changeLanguage, isRTL as checkRTL } from '@/i18n';
import { useSettingsStore } from '@/store';
import { isRTL, getFlexDirection, getTextAlign } from '@/utils/rtl';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { t, i18n } = useTranslation();
  const { setLocale } = useSettingsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const rtl = isRTL();

  const currentLang = i18n.language as LanguageCode;
  const currentLangInfo = LANGUAGES[currentLang] || LANGUAGES.en;

  const handleLanguageChange = async (lang: LanguageCode) => {
    try {
      await setLocale(lang);
      setModalVisible(false);

      const wasRTL = checkRTL(currentLang);
      const willBeRTL = checkRTL(lang);

      if (wasRTL !== willBeRTL) {
        Alert.alert(
          t('settings.language'),
          'Please restart the app for the layout direction change to take effect.',
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.serverError'));
    }
  };

  const renderCompact = () => (
    <TouchableOpacity
      style={styles.compactButton}
      onPress={() => setModalVisible(true)}
      accessibilityRole="button"
      accessibilityLabel={`${t('settings.language')}: ${currentLangInfo.nativeName}`}
    >
      <Text style={styles.compactButtonText}>{currentLang.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  const renderFull = () => (
    <TouchableOpacity
      style={[styles.fullButton, { flexDirection: getFlexDirection() }]}
      onPress={() => setModalVisible(true)}
      accessibilityRole="button"
      accessibilityLabel={`${t('settings.language')}: ${currentLangInfo.nativeName}`}
    >
      <Text style={[styles.fullButtonLabel, { textAlign: getTextAlign() }]}>
        {t('settings.language')}
      </Text>
      <View style={[styles.fullButtonValue, { flexDirection: getFlexDirection() }]}>
        <Text style={styles.fullButtonValueText}>{currentLangInfo.nativeName}</Text>
        <Text style={styles.chevron}>{rtl ? '‹' : '›'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {compact ? renderCompact() : renderFull()}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>

            {(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]][]).map(
              ([code, info]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    currentLang === code && styles.languageOptionSelected,
                    { flexDirection: getFlexDirection() },
                  ]}
                  onPress={() => handleLanguageChange(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: currentLang === code }}
                >
                  <View style={styles.languageInfo}>
                    <Text
                      style={[
                        styles.languageNative,
                        currentLang === code && styles.languageTextSelected,
                      ]}
                    >
                      {info.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.languageName,
                        currentLang === code && styles.languageTextSelectedSub,
                      ]}
                    >
                      {info.name}
                    </Text>
                  </View>
                  {info.isRTL && (
                    <View style={styles.rtlBadge}>
                      <Text style={styles.rtlBadgeText}>RTL</Text>
                    </View>
                  )}
                  {currentLang === code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  compactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  fullButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullButtonLabel: {
    fontSize: 16,
    color: '#212121',
  },
  fullButtonValue: {
    alignItems: 'center',
    gap: 8,
  },
  fullButtonValueText: {
    fontSize: 16,
    color: '#757575',
  },
  chevron: {
    fontSize: 20,
    color: '#757575',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 24,
  },
  languageOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  languageOptionSelected: {
    backgroundColor: '#FCE4EC',
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  languageInfo: {
    flex: 1,
  },
  languageNative: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  languageName: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  languageTextSelected: {
    color: '#E91E63',
  },
  languageTextSelectedSub: {
    color: '#E91E63',
  },
  rtlBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  rtlBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#757575',
  },
  checkmark: {
    fontSize: 20,
    color: '#E91E63',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
});

export default LanguageSwitcher;
