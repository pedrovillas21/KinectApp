import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KINETIC, RADIUS } from '../../theme/kinetic';
import type { TrainerPeer } from '../../types';
import { openWhatsApp } from '../../utils/whatsapp';
import Icon from '../Icon';
import { Avatar, Text } from '../ui';

interface TrainerRowProps {
  trainer: TrainerPeer;
  onOpenProfile: () => void;
}

/** Atalho para o personal do aluno: perfil profissional + WhatsApp. */
export default function TrainerRow({ trainer, onOpenProfile }: TrainerRowProps) {
  const handleWhatsApp = () => {
    if (!trainer.phone) return;
    const firstName = trainer.nome.trim().split(/\s+/)[0];
    openWhatsApp(trainer.phone, `Oi, ${firstName}!`);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${trainer.nome}, seu personal. Ver perfil profissional`}
        onPress={onOpenProfile}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Avatar name={trainer.nome} uri={trainer.avatarUrl} seed={trainer.id} size={40} />
        <View style={styles.texts}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {trainer.nome}
          </Text>
          <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1}>
            Seu personal · ver perfil profissional
          </Text>
        </View>
      </Pressable>
      {trainer.phone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Conversar no WhatsApp"
          onPress={handleWhatsApp}
          style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}
        >
          <Icon name="comment" size={18} color={KINETIC.success} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    borderRadius: RADIUS.xl,
    backgroundColor: KINETIC.surface1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  whatsapp: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
