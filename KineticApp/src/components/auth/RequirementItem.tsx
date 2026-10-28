import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/scaled';
import { KINETIC } from '../../theme/kinetic';
import { CheckIcon } from './AuthIcons';

/** Item da checklist de requisitos de senha (cadastro e redefinição). */
export default function RequirementItem({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, met && styles.dotMet]}>
        {met && <CheckIcon />}
      </View>
      <Text style={[styles.label, met && styles.labelMet]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '50%',
    marginBottom: 10,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: KINETIC.ghostHi,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotMet: {
    backgroundColor: KINETIC.success,
    borderColor: KINETIC.success,
  },
  label: {
    fontSize: 12,
    color: KINETIC.textMuted,
  },
  labelMet: {
    color: KINETIC.success,
  },
});
