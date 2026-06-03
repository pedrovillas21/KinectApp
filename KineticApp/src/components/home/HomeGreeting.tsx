import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KINETIC } from '../../theme/kinetic';

interface HomeGreetingProps {
  name: string;
  streakDays: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeGreeting({ name, streakDays }: HomeGreetingProps) {
  const [salutation, setSalutation] = useState(getGreeting);

  useEffect(() => {
    const interval = setInterval(() => setSalutation(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);
  const showStreak = streakDays >= 3;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.salute}>
        {salutation},{' '}
        <Text style={styles.saluteName}>{name}</Text>.
      </Text>

      <Text style={styles.headline}>
        {showStreak ? (
          <>
            {streakDays}º dia seguido.{'\n'}
            <Text style={styles.headlineAccent}>Mantenha o ritmo.</Text>
          </>
        ) : (
          <>
            Hoje é dia{'\n'}de<Text style={styles.headlineAccent}> evoluir.</Text>
          </>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
  },
  salute: {
    fontSize: 13,
    color: KINETIC.textDim,
    fontWeight: '500',
  },
  saluteName: {
    color: KINETIC.text,
    fontWeight: '700',
  },
  headline: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '800',
    color: KINETIC.text,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  headlineAccent: {
    color: KINETIC.primary,
  },
});
