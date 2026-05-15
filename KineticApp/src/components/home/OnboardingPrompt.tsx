import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { KINETIC } from '../../theme/kinetic';

interface OnboardingPromptProps {
  /** Primeiro nome do usuário (saudação). */
  name: string;
  /** Disparado ao tocar no CTA "Gerar meu treino com IA". */
  onGenerateWorkout: () => void;
}

interface StepRowProps {
  step: '1' | '2' | '3';
  label: string;
  active: boolean;
}

function StepRow({ step, label, active }: StepRowProps) {
  return (
    <View style={styles.stepRow}>
      <View
        style={[
          styles.stepBadge,
          active ? styles.stepBadgeActive : styles.stepBadgeIdle,
        ]}
      >
        <Text
          style={[
            styles.stepBadgeText,
            active ? styles.stepBadgeTextActive : styles.stepBadgeTextIdle,
          ]}
        >
          {step}
        </Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

export default function OnboardingPrompt({
  name,
  onGenerateWorkout,
}: OnboardingPromptProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.greeting}>
        <Text style={styles.salute}>
          Bem-vindo, <Text style={styles.saluteName}>{name}</Text>.
        </Text>
        <Text style={styles.headline}>
          Vamos montar sua{'\n'}
          <Text style={styles.headlineAccent}>primeira semana.</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <LinearGradient
          colors={[KINETIC.primary, KINETIC.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topAccent}
        />

        <View style={styles.cardBody}>
          <Text style={styles.copy}>
            Seu protocolo está calibrado. Responda a anamnese e a IA monta um
            treino <Text style={styles.copyStrong}>100% personalizado</Text> em
            menos de 30 segundos.
          </Text>

          <View style={styles.stepList}>
            <StepRow step="1" label="Conclua o onboarding" active />
            <StepRow step="2" label="Anamnese com a IA" active={false} />
            <StepRow step="3" label="Seu treino gerado" active={false} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gerar meu treino com IA"
            onPress={onGenerateWorkout}
            style={({ pressed }) => [
              styles.ctaWrap,
              pressed && styles.ctaPressed,
            ]}
          >
            <LinearGradient
              colors={[KINETIC.primary, KINETIC.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Gerar meu treino com IA</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path
                  d="M5 3l14 9-14 9V3z"
                  fill="#001a1f"
                  stroke="#001a1f"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <View style={styles.teaserWrap}>
        <View style={styles.teaserBlurred} pointerEvents="none">
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={[styles.teaserRow, i > 1 && styles.teaserRowDivider]}
            >
              <View style={styles.teaserPos} />
              <View style={styles.teaserAvatar} />
              <View style={styles.teaserInfo}>
                <View style={styles.teaserLineWide} />
                <View style={styles.teaserLineNarrow} />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.teaserOverlay} pointerEvents="none">
          <View style={styles.teaserChip}>
            <Text style={styles.teaserChipText}>
              Complete seu perfil para entrar no ranking
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  greeting: {
    marginBottom: 24,
    paddingHorizontal: 4,
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
  card: {
    backgroundColor: KINETIC.surface1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: KINETIC.primary,
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  topAccent: {
    height: 3,
    width: '100%',
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  copy: {
    fontSize: 14,
    color: KINETIC.textDim,
    lineHeight: 20,
    marginBottom: 18,
  },
  copyStrong: {
    color: KINETIC.text,
    fontWeight: '600',
  },
  stepList: {
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: KINETIC.primary,
  },
  stepBadgeIdle: {
    backgroundColor: KINETIC.surface2,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepBadgeTextActive: {
    color: '#001a1f',
  },
  stepBadgeTextIdle: {
    color: KINETIC.textMuted,
  },
  stepLabel: {
    fontSize: 13,
    color: KINETIC.text,
    fontWeight: '500',
  },
  ctaWrap: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: KINETIC.primary,
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  ctaText: {
    color: '#001a1f',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  teaserWrap: {
    marginTop: 12,
    position: 'relative',
  },
  teaserBlurred: {
    backgroundColor: KINETIC.surface1,
    borderRadius: 18,
    overflow: 'hidden',
    opacity: 0.45,
  },
  teaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  teaserRowDivider: {
    borderTopWidth: 1,
    borderTopColor: KINETIC.ghost,
  },
  teaserPos: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: KINETIC.surface2,
  },
  teaserAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: KINETIC.surface2,
  },
  teaserInfo: {
    flex: 1,
    gap: 5,
  },
  teaserLineWide: {
    height: 12,
    width: '50%',
    borderRadius: 6,
    backgroundColor: KINETIC.surface2,
  },
  teaserLineNarrow: {
    height: 9,
    width: '30%',
    borderRadius: 6,
    backgroundColor: KINETIC.surface3,
  },
  teaserOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(19,19,19,0.85)',
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
  },
  teaserChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: KINETIC.textDim,
  },
});
