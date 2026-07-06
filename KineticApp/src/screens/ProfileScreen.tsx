import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KINETIC } from '../theme/kinetic';
import Icon from '../components/Icon';
import Svg, { Circle, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { GenerateWorkoutRequest, UserProfileResponse } from '../types';
import { formatMemberSince, formatProfileName } from '../utils/formatters';
import {
  ageFromBirthDate,
  goalLabel,
  GOAL_OPTIONS,
  hasMedicalInfo,
  levelLabel,
  LEVEL_OPTIONS,
  FREQUENCY_OPTIONS,
  ProtocolOption,
} from '../constants/protocol';

// Sem um conceito de assinatura no backend ainda, todo usuário é "free".
const DEFAULT_PLAN: 'free' | 'pro' = 'free';

// ─── Extra tokens ─────────────────────────────────────────────
const C = {
  ...KINETIC,
  danger: '#ff6b7a',
  dangerDim: 'rgba(255,107,122,0.12)',
  gold: '#F5C518',
  primaryGrad: KINETIC.primary,
};

// ─── Icons (SVG inline) ───────────────────────────────────────
const stroke = { stroke: C.primary, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const stroke2 = { ...stroke, stroke: C.textDim };
const strokeDanger = { ...stroke, stroke: C.danger };

const Icons = {
  settings: (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="3" {...stroke2} />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...stroke2} />
    </Svg>
  ),
  pencil: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M12 20h9" {...stroke} />
      <Path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" {...stroke} />
    </Svg>
  ),
  target: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" {...stroke} />
      <Circle cx="12" cy="12" r="6" {...stroke} />
      <Circle cx="12" cy="12" r="2" {...stroke} />
    </Svg>
  ),
  scale: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M3 6h18M5 6l2 13a2 2 0 002 2h6a2 2 0 002-2l2-13M10 11v6M14 11v6" {...stroke2} />
    </Svg>
  ),
  level: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M3 20h4V10H3zM10 20h4V4h-4zM17 20h4v-7h-4z" {...stroke2} />
    </Svg>
  ),
  calendar: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Rect x="3" y="4" width="18" height="18" rx="2" {...stroke2} />
      <Path d="M16 2v4M8 2v4M3 10h18" {...stroke2} />
    </Svg>
  ),
  med: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" {...stroke2} />
    </Svg>
  ),
  sparkle: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" {...stroke} />
    </Svg>
  ),
  mail: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Rect x="2" y="4" width="20" height="16" rx="2" {...stroke2} />
      <Path d="M2 7l10 7 10-7" {...stroke2} />
    </Svg>
  ),
  lock: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Rect x="3" y="11" width="18" height="11" rx="2" {...stroke2} />
      <Path d="M7 11V7a5 5 0 0110 0v4" {...stroke2} />
    </Svg>
  ),
  crown: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z" {...stroke2} />
    </Svg>
  ),
  bell: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...stroke2} />
      <Path d="M13.73 21a2 2 0 01-3.46 0" {...stroke2} />
    </Svg>
  ),
  globe: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" {...stroke2} />
      <Path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" {...stroke2} />
    </Svg>
  ),
  eye: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...stroke2} />
      <Circle cx="12" cy="12" r="3" {...stroke2} />
    </Svg>
  ),
  users: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...stroke2} />
      <Circle cx="9" cy="7" r="4" {...stroke2} />
      <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" {...stroke2} />
    </Svg>
  ),
  download: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" {...stroke2} />
    </Svg>
  ),
  shield: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...stroke2} />
    </Svg>
  ),
  help: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" {...stroke2} />
      <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" {...stroke2} />
    </Svg>
  ),
  star: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" {...stroke2} />
    </Svg>
  ),
  info: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" {...stroke2} />
      <Path d="M12 16v-4M12 8h.01" {...stroke2} />
    </Svg>
  ),
  logout: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" {...strokeDanger} />
    </Svg>
  ),
  logoutSheet: (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" {...strokeDanger} strokeWidth={2} />
    </Svg>
  ),
  chevron: (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Polyline points="9 18 15 12 9 6" stroke={C.textMuted} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  scaleLevel: (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M3 6h18M5 6l2 13a2 2 0 002 2h6a2 2 0 002-2l2-13M10 11v6M14 11v6" {...stroke} />
    </Svg>
  ),
};

// ─── Atoms ────────────────────────────────────────────────────
function SectionTitle({ children, sub }: { children: string; sub?: string }) {
  return (
    <View style={s.sectionTitleWrap}>
      <Text style={s.sectionTitleText}>{children}</Text>
      {sub ? <Text style={s.sectionSubText}>{sub}</Text> : null}
    </View>
  );
}

function RowGroup({ children }: { children: React.ReactNode }) {
  const arr = React.Children.toArray(children);
  return (
    <View style={s.rowGroup}>
      {arr.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={s.rowDivider} />}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

interface Badge { text: string; color: string; bg: string }
interface RowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  sub?: string;
  onPress?: () => void;
  accent?: boolean;
  danger?: boolean;
  badge?: Badge;
}

function Row({ icon, label, value, sub, onPress, accent, danger, badge }: RowProps) {
  const iconBg = danger ? C.dangerDim : accent ? C.primaryDim : C.surface2;
  const labelColor = danger ? C.danger : C.text;

  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={s.rowContent}>
        <Text style={[s.rowLabel, { color: labelColor }]}>{label}</Text>
        {sub ? <Text style={s.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <View style={s.rowRight}>
        {badge && (
          <View style={[s.badge, { backgroundColor: badge.bg }]}>
            <Text style={[s.badgeText, { color: badge.color }]}>{badge.text.toUpperCase()}</Text>
          </View>
        )}
        {value && <Text style={s.rowValue}>{value}</Text>}
        {onPress && !danger && Icons.chevron}
      </View>
    </Pressable>
  );
}

// ─── Identity Hero ────────────────────────────────────────────
interface HeroUserData {
  name: string;
  email: string;
  memberSince: string;
  initial: string;
  streak: number;
  totalWorkouts: number;
  goalLabel: string;
}

function IdentityHero({ user }: { user: HeroUserData }) {
  const goalWord = user.goalLabel.split(' ')[0];
  const goalRest = user.goalLabel.split(' ').slice(1).join(' ');

  return (
    <View style={s.hero}>
      {/* Avatar + info */}
      <View style={s.heroTop}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.initial}</Text>
        </View>
        <View style={s.heroInfo}>
          <Text style={s.heroName} numberOfLines={1}>{user.name}</Text>
          <Text style={s.heroEmail} numberOfLines={1}>{user.email}</Text>
          {user.memberSince ? (
            <View style={s.memberChip}>
              <Text style={s.memberChipText}>{user.memberSince}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={s.editBtn} activeOpacity={0.7}>
          {Icons.pencil}
        </TouchableOpacity>
      </View>

      {/* Quick stats */}
      <View style={s.quickStats}>
        {[
          { v: String(user.streak), u: 'dias seguidos', color: C.gold },
          { v: String(user.totalWorkouts), u: 'treinos no total', color: C.text },
          { v: goalWord, u: goalRest, color: C.primary },
        ].map((stat, i) => (
          <View key={i} style={[s.statCell, i > 0 && s.statCellBorder]}>
            <Text style={[s.statValue, { color: stat.color }]}>{stat.v}</Text>
            <Text style={s.statLabel}>{stat.u}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Protocolo de Treino ──────────────────────────────────────
interface ProtocolForm {
  goal: string;
  weight: number;
  height: number;
  birthDate: string; // ISO YYYY-MM-DD
  level: string;
  frequency: number;
  medicalConditions: string;
}

interface ProtocolSectionProps {
  form: ProtocolForm;
  onEditGoal: () => void;
  onEditMetrics: () => void;
  onEditLevel: () => void;
  onEditFrequency: () => void;
  onEditAnamnesis: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

function ProtocolSection({
  form,
  onEditGoal,
  onEditMetrics,
  onEditLevel,
  onEditFrequency,
  onEditAnamnesis,
  onRegenerate,
  isRegenerating,
}: ProtocolSectionProps) {
  const age = ageFromBirthDate(form.birthDate);
  const metricsValue = [
    form.weight ? `${form.weight}kg` : null,
    form.height ? `${form.height}cm` : null,
    age != null ? `${age}a` : null,
  ]
    .filter(Boolean)
    .join(' · ') || 'Adicionar';

  const anamComplete = hasMedicalInfo(form.medicalConditions);

  return (
    <View>
      <SectionTitle sub="O que alimenta sua IA">Protocolo de Treino</SectionTitle>
      <RowGroup>
        <Row icon={Icons.target} label="Objetivo" value={goalLabel(form.goal)} onPress={onEditGoal} accent />
        <Row icon={Icons.scaleLevel} label="Métricas" value={metricsValue} onPress={onEditMetrics} />
        <Row icon={Icons.level} label="Nível de experiência" value={levelLabel(form.level)} onPress={onEditLevel} />
        <Row icon={Icons.calendar} label="Frequência semanal" value={form.frequency ? `${form.frequency} dias` : 'Definir'} onPress={onEditFrequency} />
        <Row
          icon={Icons.med}
          label="Anamnese"
          sub={anamComplete ? 'Lesões, restrições e condições informadas' : 'Toque para informar lesões ou restrições'}
          onPress={onEditAnamnesis}
          badge={
            anamComplete
              ? { text: 'completa', color: KINETIC.success, bg: 'rgba(74,222,128,0.14)' }
              : { text: 'pendente', color: KINETIC.warn, bg: 'rgba(245,185,69,0.14)' }
          }
        />
      </RowGroup>

      <TouchableOpacity
        style={[s.regenBtn, isRegenerating && s.regenBtnDisabled]}
        activeOpacity={0.8}
        onPress={onRegenerate}
        disabled={isRegenerating}
      >
        {isRegenerating ? <ActivityIndicator size="small" color={KINETIC.primary} /> : Icons.sparkle}
        <Text style={s.regenBtnText}>{isRegenerating ? 'Regenerando…' : 'Regenerar treino com IA'}</Text>
      </TouchableOpacity>
      <Text style={s.regenHint}>Recria seu plano baseado nos dados acima</Text>
    </View>
  );
}

// ─── Modais de edição do protocolo ────────────────────────────
interface OptionPickerModalProps {
  visible: boolean;
  title: string;
  options: ProtocolOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function OptionPickerModal({ visible, title, options, selected, onSelect, onClose }: OptionPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.sheetOverlay} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>{title}</Text>
        <View style={s.optionList}>
          {options.map((opt) => {
            const active = opt.value === selected;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.optionCard, active && s.optionCardActive]}
                activeOpacity={0.8}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.optionTitle}>{opt.title}</Text>
                  <Text style={s.optionSub}>{opt.sub}</Text>
                </View>
                <View style={[s.optionRadio, active && s.optionRadioActive]}>
                  {active && <Icon name="check" size={13} color="#001a1f" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

interface MetricsModalProps {
  visible: boolean;
  form: ProtocolForm;
  onSave: (patch: Pick<ProtocolForm, 'weight' | 'height' | 'birthDate'>) => void;
  onClose: () => void;
}

// Converte ISO YYYY-MM-DD ↔ exibição DD/MM/AAAA
function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return '';
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function MetricsModal({ visible, form, onSave, onClose }: MetricsModalProps) {
  const [weight, setWeight] = useState<string>(form.weight ? String(form.weight) : '');
  const [height, setHeight] = useState<string>(form.height ? String(form.height) : '');
  const [birthDisplay, setBirthDisplay] = useState<string>(isoToDisplay(form.birthDate));
  const [error, setError] = useState<string>('');

  // Re-sincroniza ao reabrir o modal com dados atualizados.
  useEffect(() => {
    if (visible) {
      setWeight(form.weight ? String(form.weight) : '');
      setHeight(form.height ? String(form.height) : '');
      setBirthDisplay(isoToDisplay(form.birthDate));
      setError('');
    }
  }, [visible, form.weight, form.height, form.birthDate]);

  const handleBirthChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    setBirthDisplay(formatted);
  };

  const handleSave = () => {
    const w = parseFloat(weight.replace(',', '.'));
    const h = parseFloat(height.replace(',', '.'));
    if (!w || w <= 0 || w > 500) return setError('Peso inválido.');
    if (!h || h <= 0 || h > 300) return setError('Altura inválida (cm).');

    const cleaned = birthDisplay.replace(/\D/g, '');
    if (cleaned.length !== 8) return setError('Data de nascimento incompleta.');
    const d = cleaned.slice(0, 2);
    const m = cleaned.slice(2, 4);
    const y = cleaned.slice(4, 8);
    const iso = `${y}-${m}-${d}`;
    // Constrói a data em horário local para evitar o problema de UTC midnight
    // que desloca o dia em fusos negativos (ex: Brasil UTC-3)
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const rollover =
      date.getFullYear() !== parseInt(y, 10) ||
      date.getMonth() + 1 !== parseInt(m, 10) ||
      date.getDate() !== parseInt(d, 10);
    if (Number.isNaN(date.getTime()) || rollover || date >= new Date()) {
      return setError('Data inválida ou no futuro.');
    }
    const ageYears = ageFromBirthDate(iso);
    if (ageYears == null || ageYears < 13 || ageYears > 120) {
      return setError('Idade deve estar entre 13 e 120 anos.');
    }

    onSave({ weight: w, height: h, birthDate: iso });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheetKAV}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={s.sheetPanel}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Suas métricas</Text>

          <Text style={s.inputLabel}>DATA DE NASCIMENTO</Text>
          <TextInput
            style={s.input}
            value={birthDisplay}
            onChangeText={handleBirthChange}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={KINETIC.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            autoCorrect={false}
            autoComplete="off"
          />
          <Text style={s.inputLabel}>PESO (KG)</Text>
          <TextInput
            style={s.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="78"
            placeholderTextColor={KINETIC.textMuted}
            keyboardType="decimal-pad"
          />
          <Text style={s.inputLabel}>ALTURA (CM)</Text>
          <TextInput
            style={s.input}
            value={height}
            onChangeText={setHeight}
            placeholder="175"
            placeholderTextColor={KINETIC.textMuted}
            keyboardType="number-pad"
          />
          {!!error && <Text style={s.inputError}>{error}</Text>}

          <View style={s.sheetButtons}>
            <TouchableOpacity style={s.sheetCancel} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetSave} onPress={handleSave} activeOpacity={0.8}>
              <Text style={s.sheetSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface AnamnesisModalProps {
  visible: boolean;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

function AnamnesisModal({ visible, value, onSave, onClose }: AnamnesisModalProps) {
  const initial = hasMedicalInfo(value) ? value : '';
  const [text, setText] = useState<string>(initial);

  useEffect(() => {
    if (visible) setText(hasMedicalInfo(value) ? value : '');
  }, [visible, value]);

  const handleSave = () => {
    const trimmed = text.trim();
    onSave(trimmed.length > 0 ? trimmed : 'Nenhuma');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheetKAV}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={s.sheetPanel}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Anamnese</Text>
          <Text style={s.sheetBody}>
            Possui alguma lesão, dor articular ou restrição médica que a IA deva considerar?
          </Text>
          <TextInput
            style={s.anamnesisInput}
            value={text}
            onChangeText={setText}
            placeholder="Ex: hérnia de disco L4-L5, dor no ombro direito, asma…"
            placeholderTextColor={KINETIC.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={s.inputHint}>Deixe em branco se não houver restrições.</Text>

          <View style={s.sheetButtons}>
            <TouchableOpacity style={s.sheetCancel} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetSave} onPress={handleSave} activeOpacity={0.8}>
              <Text style={s.sheetSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Conta ────────────────────────────────────────────────────
interface AccountSectionProps {
  email: string;
  plan: 'free' | 'pro';
  onChangePassword: () => void;
}

function AccountSection({ email, plan, onChangePassword }: AccountSectionProps) {
  const isPro = plan === 'pro';
  return (
    <View>
      <SectionTitle>Conta</SectionTitle>
      <RowGroup>
        <Row icon={Icons.mail} label="Email" value={email} />
        <Row icon={Icons.lock} label="Alterar senha" onPress={onChangePassword} />
        <Row
          icon={Icons.crown}
          label={isPro ? 'Plano Premium' : 'Plano Gratuito'}
          sub={isPro ? 'Renovação em 12 mai 2026' : 'Treinos com IA limitados a 3/mês'}
          onPress={() => {}}
          badge={
            isPro
              ? { text: 'PRO', color: C.gold, bg: 'rgba(245,197,24,0.14)' }
              : { text: 'upgrade', color: C.primary, bg: C.primaryDim }
          }
        />
      </RowGroup>
    </View>
  );
}

// ─── Preferências ─────────────────────────────────────────────
function PreferencesSection() {
  return (
    <View>
      <SectionTitle>Preferências</SectionTitle>
      <RowGroup>
        <Row icon={Icons.bell} label="Notificações" sub="Treino, ranking, descanso" onPress={() => {}} />
        <Row icon={Icons.scaleLevel} label="Unidades" value="kg · cm" onPress={() => {}} />
        <Row icon={Icons.globe} label="Idioma" value="Português (BR)" onPress={() => {}} />
      </RowGroup>
    </View>
  );
}

// ─── Comunidade ───────────────────────────────────────────────
function CommunitySection() {
  return (
    <View>
      <SectionTitle>Comunidade</SectionTitle>
      <RowGroup>
        <Row icon={Icons.eye} label="Visibilidade no ranking" value="Público" onPress={() => {}} />
        <Row icon={Icons.users} label="Amigos" value="14" onPress={() => {}} />
      </RowGroup>
    </View>
  );
}

// ─── Dados & Privacidade ──────────────────────────────────────
function DataSection() {
  return (
    <View>
      <SectionTitle>Dados & Privacidade</SectionTitle>
      <RowGroup>
        <Row icon={Icons.download} label="Exportar meus dados" sub="Treinos, métricas, histórico" onPress={() => {}} />
        <Row icon={Icons.shield} label="Política de privacidade" onPress={() => {}} />
      </RowGroup>
    </View>
  );
}

// ─── Suporte ──────────────────────────────────────────────────
function SupportSection() {
  return (
    <View>
      <SectionTitle>Suporte</SectionTitle>
      <RowGroup>
        <Row icon={Icons.help} label="Central de ajuda" onPress={() => {}} />
        <Row icon={Icons.star} label="Avaliar o Kinetic" onPress={() => {}} />
        <Row icon={Icons.info} label="Sobre" sub="Versão 1.4.2 · Build 248" onPress={() => {}} />
      </RowGroup>
    </View>
  );
}

// ─── Sair ─────────────────────────────────────────────────────
function LogoutSection({ onLogout }: { onLogout: () => void }) {
  return (
    <View>
      <RowGroup>
        <Row icon={Icons.logout} label="Sair da conta" onPress={onLogout} danger />
      </RowGroup>
      <TouchableOpacity style={s.deleteBtn} activeOpacity={0.7}>
        <Text style={s.deleteBtnText}>Excluir minha conta</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Logout Sheet ─────────────────────────────────────────────
function LogoutSheet({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.sheetOverlay} onPress={onCancel} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <View style={s.sheetIcon}>{Icons.logoutSheet}</View>
        <Text style={s.sheetTitle}>Sair da conta?</Text>
        <Text style={s.sheetBody}>
          Você precisará fazer login novamente para acessar seus treinos e ranking.
        </Text>
        <View style={s.sheetButtons}>
          <TouchableOpacity style={s.sheetCancel} onPress={onCancel} activeOpacity={0.8}>
            <Text style={s.sheetCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.sheetConfirm} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={s.sheetConfirmText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Alterar senha ────────────────────────────────────────────
// Mesmo padrão do backend (ChangePasswordDTO): 8–20 caracteres, com ao menos
// uma minúscula, uma maiúscula e um caractere especial.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$/;

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
}

function ChangePasswordModal({ visible, onClose, onSubmit, onSuccess }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setShow(false);
      setError('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!current || !next || !confirm) return setError('Preencha todos os campos.');
    if (!PASSWORD_REGEX.test(next)) {
      return setError('A nova senha precisa de 8 a 20 caracteres, com maiúscula, minúscula e um caractere especial.');
    }
    if (next !== confirm) return setError('A confirmação não corresponde à nova senha.');
    if (next === current) return setError('A nova senha deve ser diferente da atual.');

    setError('');
    setSubmitting(true);
    const result = await onSubmit(current, next);
    setSubmitting(false);

    if (result.success) {
      onClose();
      onSuccess();
    } else {
      setError(result.error || 'Não foi possível alterar a senha.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheetKAV}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={s.sheetPanel}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Alterar senha</Text>

          <Text style={s.inputLabel}>SENHA ATUAL</Text>
          <TextInput
            style={s.input}
            value={current}
            onChangeText={setCurrent}
            placeholder="••••••••"
            placeholderTextColor={KINETIC.textMuted}
            secureTextEntry={!show}
            autoCapitalize="none"
          />
          <Text style={s.inputLabel}>NOVA SENHA</Text>
          <TextInput
            style={s.input}
            value={next}
            onChangeText={setNext}
            placeholder="••••••••"
            placeholderTextColor={KINETIC.textMuted}
            secureTextEntry={!show}
            autoCapitalize="none"
          />
          <Text style={s.inputLabel}>CONFIRMAR NOVA SENHA</Text>
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            placeholderTextColor={KINETIC.textMuted}
            secureTextEntry={!show}
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={() => setShow((v) => !v)} activeOpacity={0.7} style={s.showPasswordToggle}>
            <Text style={s.showPasswordText}>{show ? 'Ocultar senhas' : 'Mostrar senhas'}</Text>
          </TouchableOpacity>

          {!!error && <Text style={s.inputError}>{error}</Text>}

          <View style={s.sheetButtons}>
            <TouchableOpacity style={s.sheetCancel} onPress={onClose} activeOpacity={0.8} disabled={submitting}>
              <Text style={s.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.sheetSave, submitting && s.regenBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#001a1f" />
              ) : (
                <Text style={s.sheetSaveText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────
interface ProfileNavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}

interface ProfileScreenProps {
  navigation: ProfileNavigationProp;
}

type ProtocolModal = 'goal' | 'metrics' | 'level' | 'frequency' | 'anamnesis' | null;

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { signOut, currentUser, changePassword } = useContext(AuthContext);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [protocolForm, setProtocolForm] = useState<ProtocolForm | null>(null);
  const [activeModal, setActiveModal] = useState<ProtocolModal>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Email real do usuário logado: prioriza o perfil do servidor e cai para o
  // usuário em sessão (disponível antes do fetch concluir).
  const accountEmail = profileData?.email ?? currentUser?.email ?? '';

  const handleConfirmSignOut = async () => {
    setLogoutOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  // Após trocar a senha o backend revoga as sessões; desloga aqui para que o
  // usuário entre novamente com a nova senha (fluxo mais imersivo).
  const handlePasswordChanged = () => {
    Alert.alert(
      'Senha alterada',
      'Sua senha foi atualizada. Faça login novamente com a nova senha.',
      [{ text: 'OK', onPress: () => { void signOut(); } }],
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<UserProfileResponse>('/users/profile');
        setProfileData(response.data);
        const p = response.data;
        setProtocolForm({
          goal: p.targetGoal ?? '',
          weight: p.weight ?? 0,
          height: p.height ?? 0,
          birthDate: p.birthDate ?? '',
          level: p.level ?? '',
          frequency: p.frequency ?? 0,
          medicalConditions: p.medicalConditions ?? '',
        });
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const patchForm = (patch: Partial<ProtocolForm>) =>
    setProtocolForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleRegenerate = async () => {
    if (!protocolForm) return;
    const { goal, weight, height, birthDate, level, frequency, medicalConditions } = protocolForm;

    if (!goal || !level || !birthDate || !weight || !height || !frequency) {
      Alert.alert(
        'Dados incompletos',
        'Preencha objetivo, métricas, nível e frequência antes de regenerar o treino.',
      );
      return;
    }

    try {
      setIsRegenerating(true);
      const payload: GenerateWorkoutRequest = {
        birthDate,
        weight,
        height,
        goal,
        frequency,
        level,
        medicalConditions: medicalConditions?.trim() || 'Nenhuma',
      };
      // O backend tenta até N modelos com 120s de read timeout cada.
      // 3 modelos × 120s + 60s de buffer = 420s. Mantemos 480s para folga.
      await api.post('/workouts/generate', payload, { timeout: 480000 });
      Alert.alert('Pronto!', 'Seu treino foi regenerado com sucesso com base nos novos dados.');
      navigation.navigate('Home');
    } catch (e) {
      const err = e as { response?: { data?: unknown } };
      const raw = err.response?.data;
      const message =
        typeof raw === 'string' && raw
          ? raw
          : 'Não foi possível regenerar o treino agora. Tente novamente.';
      Alert.alert('Erro', message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const heroData: HeroUserData = profileData
    ? {
        name: formatProfileName(profileData.fullName),
        email: profileData.email,
        memberSince: formatMemberSince(profileData.memberSince),
        initial: profileData.fullName.trim().charAt(0).toUpperCase(),
        streak: profileData.consecutiveDaysLogged,
        totalWorkouts: profileData.totalWorkoutsDone,
        goalLabel: profileData.targetGoal,
      }
    : {
        // Fallback enquanto o perfil do servidor não chega (ou falhou): usa os
        // dados do usuário em sessão. Métricas agregadas (streak/treinos/membro
        // desde) só existem no profileData, então ficam zeradas aqui.
        name: formatProfileName(currentUser?.nome ?? ''),
        email: currentUser?.email ?? '',
        memberSince: '',
        initial: (currentUser?.nome ?? '').trim().charAt(0).toUpperCase(),
        streak: 0,
        totalWorkouts: 0,
        goalLabel: currentUser?.goal ?? '',
      };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.topTitle}>Perfil</Text>
        <TouchableOpacity style={s.topSettingsBtn} activeOpacity={0.7}>
          {Icons.settings}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={s.heroLoadingPlaceholder}>
            <ActivityIndicator size="small" color={KINETIC.primary} />
          </View>
        ) : (
          <IdentityHero user={heroData} />
        )}

        {protocolForm && (
          <View style={s.section}>
            <ProtocolSection
              form={protocolForm}
              onEditGoal={() => setActiveModal('goal')}
              onEditMetrics={() => setActiveModal('metrics')}
              onEditLevel={() => setActiveModal('level')}
              onEditFrequency={() => setActiveModal('frequency')}
              onEditAnamnesis={() => setActiveModal('anamnesis')}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
            />
          </View>
        )}
        <View style={s.section}>
          <AccountSection
            email={accountEmail}
            plan={DEFAULT_PLAN}
            onChangePassword={() => setPasswordOpen(true)}
          />
        </View>
        <View style={s.section}><PreferencesSection /></View>
        <View style={s.section}><CommunitySection /></View>
        <View style={s.section}><DataSection /></View>
        <View style={s.section}><SupportSection /></View>
        <View style={s.section}><LogoutSection onLogout={() => setLogoutOpen(true)} /></View>
      </ScrollView>

      {protocolForm && (
        <>
          <OptionPickerModal
            visible={activeModal === 'goal'}
            title="Objetivo principal"
            options={GOAL_OPTIONS}
            selected={protocolForm.goal}
            onSelect={(value) => patchForm({ goal: value })}
            onClose={() => setActiveModal(null)}
          />
          <OptionPickerModal
            visible={activeModal === 'level'}
            title="Nível de experiência"
            options={LEVEL_OPTIONS}
            selected={protocolForm.level}
            onSelect={(value) => patchForm({ level: value })}
            onClose={() => setActiveModal(null)}
          />
          <OptionPickerModal
            visible={activeModal === 'frequency'}
            title="Frequência semanal"
            options={FREQUENCY_OPTIONS}
            selected={String(protocolForm.frequency)}
            onSelect={(value) => patchForm({ frequency: parseInt(value, 10) })}
            onClose={() => setActiveModal(null)}
          />
          <MetricsModal
            visible={activeModal === 'metrics'}
            form={protocolForm}
            onSave={(patch) => patchForm(patch)}
            onClose={() => setActiveModal(null)}
          />
          <AnamnesisModal
            visible={activeModal === 'anamnesis'}
            value={protocolForm.medicalConditions}
            onSave={(value) => patchForm({ medicalConditions: value })}
            onClose={() => setActiveModal(null)}
          />
        </>
      )}

      <ChangePasswordModal
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSubmit={changePassword}
        onSuccess={handlePasswordChanged}
      />

      <LogoutSheet
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: KINETIC.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: KINETIC.bg,
  },
  topTitle: { fontSize: 22, fontWeight: '800', color: KINETIC.text, letterSpacing: -0.5 },
  topSettingsBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32, gap: 22 },

  section: { paddingHorizontal: 20 },

  heroLoadingPlaceholder: {
    marginHorizontal: 16,
    height: 160,
    borderRadius: 22,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    marginHorizontal: 16,
    backgroundColor: KINETIC.surface1,
    borderRadius: 22,
    padding: 20,
    gap: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: KINETIC.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#001a1f' },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { fontSize: 18, fontWeight: '800', color: KINETIC.text, letterSpacing: -0.3 },
  heroEmail: { fontSize: 12, color: KINETIC.textDim, marginTop: 2 },
  memberChip: {
    alignSelf: 'flex-start', marginTop: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, backgroundColor: KINETIC.ghost,
  },
  memberChipText: { fontSize: 10, color: KINETIC.textMuted, fontWeight: '600', letterSpacing: 0.3 },
  editBtn: {
    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
    backgroundColor: KINETIC.primaryDim,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: KINETIC.primarySoft,
  },

  quickStats: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  statCellBorder: { borderLeftWidth: 1, borderLeftColor: KINETIC.ghost },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, lineHeight: 26 },
  statLabel: { fontSize: 10, color: KINETIC.textMuted, marginTop: 4, letterSpacing: 0.3, textAlign: 'center' },

  // Section title
  sectionTitleWrap: { paddingHorizontal: 4, paddingBottom: 8 },
  sectionTitleText: {
    fontSize: 11, fontWeight: '700', color: KINETIC.textMuted,
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  sectionSubText: { fontSize: 11, color: KINETIC.textMuted, marginTop: 2 },

  // Row group
  rowGroup: { backgroundColor: KINETIC.surface1, borderRadius: 18, overflow: 'hidden' },
  rowDivider: { height: 1, backgroundColor: KINETIC.ghost, marginHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowContent: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
  rowSub: { fontSize: 11, color: KINETIC.textDim, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  rowValue: { fontSize: 13, color: KINETIC.textDim, fontWeight: '500' },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Regen button
  regenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 10, padding: 13, borderRadius: 14,
    backgroundColor: KINETIC.primaryDim,
    borderWidth: 1, borderColor: KINETIC.primarySoft,
  },
  regenBtnText: { color: KINETIC.primary, fontSize: 13, fontWeight: '700' },
  regenBtnDisabled: { opacity: 0.6 },
  regenHint: { fontSize: 10, color: KINETIC.textMuted, marginTop: 6, textAlign: 'center' },

  // Option picker modal
  optionList: { gap: 10, marginTop: 8 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: KINETIC.surface2,
    borderWidth: 1, borderColor: 'transparent',
  },
  optionCardActive: { borderColor: KINETIC.primary, backgroundColor: KINETIC.primaryDim },
  optionTitle: { fontSize: 15, fontWeight: '700', color: KINETIC.text },
  optionSub: { fontSize: 12, color: KINETIC.textDim, marginTop: 2 },
  optionRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: KINETIC.ghostHi,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  optionRadioActive: { borderColor: KINETIC.primary, backgroundColor: KINETIC.primary },
  optionRadioCheck: { color: '#001a1f', fontSize: 13, fontWeight: '800' },

  // Inputs (metrics / anamnesis modals)
  inputLabel: {
    fontSize: 10, fontWeight: '700', color: KINETIC.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 6,
  },
  input: {
    backgroundColor: KINETIC.surface2, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: KINETIC.text,
    borderWidth: 1, borderColor: KINETIC.ghost,
  },
  inputError: { fontSize: 12, color: '#ff6b7a', marginTop: 10 },
  inputHint: { fontSize: 11, color: KINETIC.textMuted, marginTop: 8 },
  showPasswordToggle: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 2 },
  showPasswordText: { fontSize: 12, color: KINETIC.primary, fontWeight: '600' },
  anamnesisInput: {
    backgroundColor: KINETIC.surface2, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginTop: 14,
    fontSize: 15, color: KINETIC.text, minHeight: 110,
    borderWidth: 1, borderColor: KINETIC.ghost,
  },
  sheetSave: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: KINETIC.primary, alignItems: 'center',
  },
  sheetSaveText: { fontSize: 14, fontWeight: '800', color: '#001a1f' },

  // Delete button
  deleteBtn: { marginTop: 14, paddingVertical: 10, alignItems: 'center' },
  deleteBtnText: {
    fontSize: 12, color: KINETIC.textMuted, fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // KAV bottom-sheet (modais com inputs)
  sheetKAV: { flex: 1, justifyContent: 'flex-end' },
  sheetPanel: {
    backgroundColor: KINETIC.surface1,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36,
  },

  // Logout sheet
  sheetOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: KINETIC.surface1,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36,
  },
  sheetHandle: {
    width: 38, height: 4, borderRadius: 99,
    backgroundColor: KINETIC.ghostHi, alignSelf: 'center', marginBottom: 18,
  },
  sheetIcon: {
    width: 44, height: 44, borderRadius: 14, alignSelf: 'center',
    backgroundColor: C.dangerDim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: KINETIC.text, textAlign: 'center', letterSpacing: -0.3 },
  sheetBody: { fontSize: 13, color: KINETIC.textDim, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  sheetCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: KINETIC.surface2, alignItems: 'center',
  },
  sheetCancelText: { fontSize: 14, fontWeight: '700', color: KINETIC.text },
  sheetConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.danger, alignItems: 'center',
  },
  sheetConfirmText: { fontSize: 14, fontWeight: '800', color: '#1a0407' },
});
