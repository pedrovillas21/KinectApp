import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KINETIC } from '../theme/kinetic';
import Icon from './Icon';
import type { LoadType } from '../types';
import { MAX_REPS } from '../utils/setLimits';

// Tokens locais que estendem a paleta KINETIC com os tons de "sucesso" (série
// confirmada) usados no mock desta tela.
const SUCCESS_DIM = 'rgba(74,222,128,0.12)';
const SUCCESS_SOFT = 'rgba(74,222,128,0.28)';

export type SerieStatus = 'confirmada' | 'atual' | 'locked';

interface Props {
  setNumber: number;
  /** Rótulo da meta de repetições, ex.: "12 reps". */
  targetReps: string;
  /** Rótulo de carga alvo, ex.: "Sem carga" | "40 kg". */
  cargaLabel: string;
  /** Rótulo de descanso, ex.: "30s descanso". */
  restLabel: string;
  /** EXTERNAL: peso da série; BODYWEIGHT: carga extra (opcional); NONE: sem campo de peso. */
  loadType: LoadType;
  /** Carga externa prescrita: o peso é obrigatório. */
  weightRequired: boolean;
  status: SerieStatus;
  weightValue: string;
  repsValue: string;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onConfirm: () => void;
  onEdit: () => void;
}

export default function SerieCard({
  setNumber,
  targetReps,
  cargaLabel,
  restLabel,
  loadType,
  weightRequired,
  status,
  weightValue,
  repsValue,
  onWeightChange,
  onRepsChange,
  onConfirm,
  onEdit,
}: Props) {
  const confirmada = status === 'confirmada';
  const atual = status === 'atual';
  const locked = status === 'locked';

  // "8-10 reps" → "8-10"; tirar só os não-dígitos colava a faixa em "810".
  const repsHint = targetReps.match(/\d+(\s*(?:-|–|a)\s*\d+)?/)?.[0].replace(/\s*(?:-|–|a)\s*/, '-') ?? '0';
  const extraKg = Number(weightValue.replace(',', '.')) || 0;
  const weightSummary =
    loadType === 'NONE'
      ? 'Sem carga'
      : loadType === 'BODYWEIGHT'
      ? extraKg > 0 ? `Corporal + ${weightValue} kg` : 'Corporal'
      : weightValue.trim() ? `${weightValue} kg` : '—';

  const podeConfirmar =
    atual &&
    repsValue.trim() !== '' &&
    (!weightRequired || weightValue.trim() !== '');

  const borderColor = confirmada
    ? SUCCESS_SOFT
    : atual
    ? KINETIC.primarySoft
    : 'transparent';

  return (
    <View
      style={[
        styles.card,
        { borderColor },
        atual && styles.cardActive,
        locked && styles.cardLocked,
      ]}
    >
      {/* Cabeçalho: número + status + editar */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Série {setNumber.toString().padStart(2, '0')}</Text>

          {confirmada && (
            <View style={[styles.statusChip, { backgroundColor: SUCCESS_DIM }]}>
              <Icon name="check" size={10} color={KINETIC.success} strokeWidth={3} />
              <Text style={[styles.statusChipText, { color: KINETIC.success }]}>Confirmada</Text>
            </View>
          )}
          {atual && (
            <View style={[styles.statusChip, { backgroundColor: KINETIC.primaryDim }]}>
              <Text style={[styles.statusChipText, { color: KINETIC.primary }]}>Em andamento</Text>
            </View>
          )}
          {locked && (
            <View style={styles.lockedChip}>
              <Icon name="lock" size={11} color={KINETIC.textMuted} strokeWidth={2} />
              <Text style={styles.lockedChipText}>Bloqueada</Text>
            </View>
          )}
        </View>

        {confirmada && (
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tags da meta */}
      <View style={styles.tagsRow}>
        <View style={styles.tag}><Text style={styles.tagText}>{targetReps}</Text></View>
        <View style={styles.tag}><Text style={styles.tagText}>{cargaLabel}</Text></View>
        <View style={styles.tag}><Text style={styles.tagText}>{restLabel}</Text></View>
      </View>

      {confirmada ? (
        /* Estado confirmado: resumo somente-leitura */
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>PESO REALIZADO</Text>
            <Text style={styles.summaryValue}>{weightSummary}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>REPS REALIZADAS</Text>
            <Text style={styles.summaryValue}>{repsValue}</Text>
          </View>
        </View>
      ) : (
        /* Estado ativo/bloqueado: inputs + confirmar */
        <View style={styles.inputsBlock}>
          <View style={styles.inputsRow}>
            {loadType !== 'NONE' && (
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>
                  {loadType === 'BODYWEIGHT' ? 'CARGA EXTRA (KG)' : 'PESO REALIZADO (KG)'}
                </Text>
                <TextInput
                  style={[styles.inputBox, atual ? styles.inputBoxActive : styles.inputBoxLocked]}
                  value={weightValue}
                  onChangeText={onWeightChange}
                  editable={atual}
                  keyboardType="decimal-pad"
                  maxLength={6}
                  placeholder={loadType === 'BODYWEIGHT' ? '0 (só o corpo)' : '0'}
                  placeholderTextColor={KINETIC.textMuted}
                />
              </View>
            )}

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>REPS REALIZADAS</Text>
              <TextInput
                style={[styles.inputBox, atual ? styles.inputBoxActive : styles.inputBoxLocked]}
                value={repsValue}
                onChangeText={onRepsChange}
                editable={atual}
                keyboardType="number-pad"
                maxLength={String(MAX_REPS).length}
                placeholder={repsHint}
                placeholderTextColor={KINETIC.textMuted}
              />
            </View>
          </View>

          {atual && podeConfirmar ? (
            <TouchableOpacity activeOpacity={0.85} onPress={onConfirm}>
              <LinearGradient
                colors={[KINETIC.primary, '#00bcd4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmBtn}
              >
                <Icon name="check" size={13} color="#001f24" strokeWidth={3} />
                <Text style={[styles.confirmBtnText, { color: '#001f24' }]}>Confirmar série</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={[styles.confirmBtn, styles.confirmBtnDisabled]}>
              <Icon name="check" size={13} color={KINETIC.textMuted} strokeWidth={3} />
              <Text style={[styles.confirmBtnText, { color: KINETIC.textMuted }]}>
                {locked ? 'Confirme a série anterior' : 'Confirmar série'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: KINETIC.surface1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  cardActive: {
    shadowColor: KINETIC.primary,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardLocked: { opacity: 0.55 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  title: { color: KINETIC.text, fontSize: 15.5, fontWeight: '800' },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusChipText: { fontSize: 10.5, fontWeight: '700' },
  lockedChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedChipText: { color: KINETIC.textMuted, fontSize: 10.5, fontWeight: '600' },
  editText: {
    color: KINETIC.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    backgroundColor: KINETIC.ghost,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { color: KINETIC.textDim, fontSize: 10.5, fontWeight: '600' },

  summaryRow: { flexDirection: 'row', gap: 28, marginTop: 12 },
  summaryLabel: {
    color: KINETIC.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  summaryValue: { color: KINETIC.text, fontSize: 15, fontWeight: '700' },

  inputsBlock: { marginTop: 12 },
  inputsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  inputCol: { flex: 1 },
  inputLabel: {
    color: KINETIC.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  inputBox: {
    borderRadius: 11,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: KINETIC.bg,
    color: KINETIC.text,
    fontSize: 14,
    fontWeight: '700',
  },
  inputBoxActive: { borderColor: KINETIC.primarySoft },
  inputBoxLocked: { borderColor: KINETIC.ghostHi },

  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 11,
  },
  confirmBtnDisabled: { backgroundColor: KINETIC.ghost },
  confirmBtnText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },
});
