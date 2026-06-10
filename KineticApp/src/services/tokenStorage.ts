import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'kinetic_access_token';
const REFRESH_KEY = 'kinetic_refresh_token';

const LEGACY_ACCESS_KEY = '@kinetic_token';
const LEGACY_REFRESH_KEY = '@kinetic_refresh_token';

export const getAccessToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(ACCESS_KEY);

export const setAccessToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(ACCESS_KEY, token);

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(REFRESH_KEY);

export const setRefreshToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(REFRESH_KEY, token);

export const setTokens = async (access: string, refresh: string): Promise<void> => {
  await Promise.all([setAccessToken(access), setRefreshToken(refresh)]);
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
};

// Run once on bootstrap — moves tokens from AsyncStorage to SecureStore.
export const migrateLegacyTokens = async (): Promise<void> => {
  const [existing, legacyAccess, legacyRefresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    AsyncStorage.getItem(LEGACY_ACCESS_KEY),
    AsyncStorage.getItem(LEGACY_REFRESH_KEY),
  ]);

  if (existing) return;

  if (legacyAccess || legacyRefresh) {
    const writes: Promise<void>[] = [];
    if (legacyAccess) writes.push(setAccessToken(legacyAccess));
    if (legacyRefresh) writes.push(setRefreshToken(legacyRefresh));
    await Promise.all(writes);
    await AsyncStorage.multiRemove([LEGACY_ACCESS_KEY, LEGACY_REFRESH_KEY]);
  }
};
