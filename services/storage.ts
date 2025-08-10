import type { UserProfile } from './types.ts';

const PROFILE_KEY = 'pixoUserProfile';
const WELCOME_DISMISSED_KEY = 'pixoWelcomeDismissed';

export const storageService = {
  saveUserProfile: (profile: UserProfile): void => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile to localStorage', error);
    }
  },
  loadUserProfile: (): UserProfile | null => {
    try {
      const profileJson = localStorage.getItem(PROFILE_KEY);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error('Failed to load user profile from localStorage', error);
      localStorage.removeItem(PROFILE_KEY);
      return null;
    }
  },
  saveWelcomeDismissed: (dismissed: boolean): void => {
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, JSON.stringify(dismissed));
    } catch (error) {
      console.error('Failed to save welcome dismissed state to localStorage', error);
    }
  },
  loadWelcomeDismissed: (): boolean => {
    try {
      const dismissedJson = localStorage.getItem(WELCOME_DISMISSED_KEY);
      return dismissedJson ? JSON.parse(dismissedJson) : false;
    } catch (error) {
      console.error('Failed to load welcome dismissed state from localStorage', error);
      return false;
    }
  },
};