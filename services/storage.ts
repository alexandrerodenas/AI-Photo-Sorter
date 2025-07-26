import type { UserProfile } from './types.ts';

const PROFILE_KEY = 'pixoUserProfile';

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
};