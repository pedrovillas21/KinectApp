import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/scaled';

import { CheckIcon } from './AuthIcons';
import { createStyles, useColors } from '../../theme/ThemeContext';

/** Item da checklist de requisitos de senha (cadastro e redefinição). */
export default function RequirementItem({ label, met }: { label: string; met: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={[styles.dot, met && styles.dotMet]}>
        {met && <CheckIcon />}
      </View>
      <Text style={[styles.label, met && styles.labelMet]}>{label}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
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
    borderColor: c.ghostHi,
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotMet: {
    backgroundColor: c.success,
    borderColor: c.success,
  },
  label: {
    fontSize: 12,
    color: c.textMuted,
  },
  labelMet: {
    color: c.success,
  },
}));
