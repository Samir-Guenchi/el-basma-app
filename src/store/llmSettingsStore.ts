import { create } from 'zustand';
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.43.220:3001';
  }
  return 'http://localhost:3001';
};
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();

interface LLMSettings {
  // Chat AI settings
  global: boolean;
  facebook: boolean;
  instagram: boolean;
  whatsapp: boolean;
  tiktok: boolean;
  // Comment reply settings
  commentGlobal: boolean;
  commentFacebook: boolean;
  commentInstagram: boolean;
  commentSendDM: boolean;
  commentPublicReply: boolean;
}

interface LLMSettingsState extends LLMSettings {
  isLoading: boolean;
  isOnline: boolean;
}

interface LLMSettingsActions {
  fetchLLMSettings: () => Promise<void>;
  fetchCommentSettings: () => Promise<void>;
  toggleChatPlatform: (platform: 'global' | 'facebook' | 'instagram' | 'whatsapp' | 'tiktok') => Promise<void>;
  toggleCommentSetting: (setting: 'global' | 'facebook' | 'instagram' | 'sendDM' | 'publicReply') => Promise<void>;
}

type LLMSettingsStore = LLMSettingsState & LLMSettingsActions;

const defaultLLMSettings: LLMSettings = {
  global: true,
  facebook: true,
  instagram: true,
  whatsapp: true,
  tiktok: true,
  commentGlobal: true,
  commentFacebook: true,
  commentInstagram: true,
  commentSendDM: true,
  commentPublicReply: true,
};

export const useLLMSettingsStore = create<LLMSettingsStore>()((set, get) => ({
  ...defaultLLMSettings,
  isLoading: false,
  isOnline: true,

  fetchLLMSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/llm-settings`);
      if (res.ok) {
        const data = await res.json();
        set({
          global: data.global ?? true,
          facebook: data.facebook ?? true,
          instagram: data.instagram ?? true,
          whatsapp: data.whatsapp ?? true,
          tiktok: data.tiktok ?? true,
          isLoading: false,
          isOnline: true,
        });
        console.log('✅ LLM chat settings loaded from server');
      }
    } catch (error) {
      console.error('Error fetching LLM settings:', error);
      set({ isLoading: false, isOnline: false });
    }
  },

  fetchCommentSettings: async () => {
    try {
      const res = await fetch(`${API_URL}/api/llm-settings/comment-reply`);
      if (res.ok) {
        const data = await res.json();
        set({
          commentGlobal: data.global ?? true,
          commentFacebook: data.facebook ?? true,
          commentInstagram: data.instagram ?? true,
          commentSendDM: data.sendDM ?? true,
          commentPublicReply: data.publicReply ?? true,
          isOnline: true,
        });
        console.log('✅ Comment reply settings loaded from server');
      }
    } catch (error) {
      console.error('Error fetching comment settings:', error);
      set({ isOnline: false });
    }
  },

  toggleChatPlatform: async (platform) => {
    const currentValue = get()[platform];
    // Optimistic update
    set({ [platform]: !currentValue } as any);
    
    try {
      const res = await fetch(`${API_URL}/api/llm-settings/toggle/${platform}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        set({ [platform]: data.enabled, isOnline: true } as any);
        console.log(`✅ ${platform} chat AI toggled:`, data.enabled);
      } else {
        // Rollback on error
        set({ [platform]: currentValue } as any);
      }
    } catch (error) {
      console.error('Error toggling chat platform:', error);
      // Rollback on error
      set({ [platform]: currentValue, isOnline: false } as any);
    }
  },

  toggleCommentSetting: async (setting) => {
    const keyMap: Record<string, keyof LLMSettings> = {
      global: 'commentGlobal',
      facebook: 'commentFacebook',
      instagram: 'commentInstagram',
      sendDM: 'commentSendDM',
      publicReply: 'commentPublicReply',
    };
    
    const stateKey = keyMap[setting];
    const currentValue = get()[stateKey];
    // Optimistic update
    set({ [stateKey]: !currentValue } as any);
    
    try {
      const res = await fetch(`${API_URL}/api/llm-settings/comment-reply/toggle/${setting}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        set({ [stateKey]: data.enabled, isOnline: true } as any);
        console.log(`✅ Comment ${setting} toggled:`, data.enabled);
      } else {
        // Rollback on error
        set({ [stateKey]: currentValue } as any);
      }
    } catch (error) {
      console.error('Error toggling comment setting:', error);
      // Rollback on error
      set({ [stateKey]: currentValue, isOnline: false } as any);
    }
  },
}));

// Selectors
export const selectChatAIEnabled = (state: LLMSettingsStore) => state.global;
export const selectCommentAIEnabled = (state: LLMSettingsStore) => state.commentGlobal;
