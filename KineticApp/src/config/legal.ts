import { Linking } from 'react-native';

/**
 * Termos de Uso e Política de Privacidade ficam publicados no painel web
 * (kinetic-desktop, rotas /termos e /privacidade): o mesmo endereço vai para as lojas.
 */
const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://kineticfitness.com.br').replace(/\/$/, '');

export const TERMS_URL = `${SITE_URL}/termos`;
export const PRIVACY_URL = `${SITE_URL}/privacidade`;

export const openLegal = (url: string): void => {
  void Linking.openURL(url);
};
