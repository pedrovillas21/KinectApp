import AsyncStorage from '@react-native-async-storage/async-storage';

/** Prefixo das chaves de cache das telas (useFocusResource). */
export const RESOURCE_CACHE_PREFIX = '@kinetic_cache:v1:';

/** Apaga o cache de todas as telas (logout, exclusão de conta). */
export async function clearResourceCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(RESOURCE_CACHE_PREFIX)));
  } catch {
    // cache é só conveniência
  }
}
