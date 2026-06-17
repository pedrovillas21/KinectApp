import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';
import Icon from '../../components/Icon';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

// Type assertion para AuthContext (arquivo JS sem declaração de tipos)
interface AuthContextValue {
  completeOnboarding: (data: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
}

export type GoalType = 'loss' | 'mass' | 'perf' | '';
export type LevelType = 'beg' | 'int' | 'pro' | '';

export interface OnboardingForm {
  goal: GoalType;
  birthDate: string; // Formato ISO: 'YYYY-MM-DD'
  weight: number;
  height: number;
  level: LevelType;
  days: number[];
  medicalConditions: string;
}

interface GoalDef {
  id: Exclude<GoalType, ''>;
  title: string;
  sub: string;
}

interface LevelDef {
  id: Exclude<LevelType, ''>;
  title: string;
  sub: string;
}

interface ProgressDotsProps {
  current: number;
  total: number;
}

interface StepGoalProps {
  value: GoalType;
  onChange: (v: GoalType) => void;
  isDark: boolean;
}

interface StepMetricsProps {
  data: OnboardingForm;
  onChange: (data: OnboardingForm) => void;
  isDark: boolean;
}

interface StepLevelProps {
  value: LevelType;
  onChange: (v: LevelType) => void;
  isDark: boolean;
}

interface StepFreqProps {
  days: number[];
  onChange: (days: number[]) => void;
  isDark: boolean;
}

interface StepAnamnesisProps {
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}

interface StepGeneratingProps {
  goalLabel: string;
  daysCount: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const GOALS: GoalDef[] = [
  { id: 'mass', title: 'Ganho de Massa',   sub: 'Hipertrofia + sobrecarga progressiva' },
  { id: 'loss', title: 'Perda de Gordura', sub: 'Déficit calórico + condicionamento metabólico' },
  { id: 'perf', title: 'Performance',      sub: 'Força máxima, explosão e resistência' },
];

const LEVELS: LevelDef[] = [
  { id: 'beg', title: 'Iniciante',     sub: 'Estou começando minha jornada agora.' },
  { id: 'int', title: 'Intermediário', sub: 'Já treino há alguns meses com consistência.' },
  { id: 'pro', title: 'Avançado',      sub: 'Anos de experiência e técnica refinada.' },
];

const DAYS_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const GEN_STEPS = [
  'Analisando perfil antropométrico',
  'Cruzando histórico com objetivo selecionado',
  'Calibrando cargas e tempos de descanso',
  'Distribuindo volumes por grupo muscular',
  'Selecionando exercícios compatíveis',
  'Montando ciclo de progressão',
];

// Mapeamento de IDs internos para valores esperados pelo backend
const GOAL_API_MAP: Record<Exclude<GoalType, ''>, string> = {
  mass: 'Ganho de Massa',
  loss: 'Perda de Gordura',
  perf: 'Performance',
};

const LEVEL_API_MAP: Record<Exclude<LevelType, ''>, string> = {
  beg: 'INICIANTE',
  int: 'INTERMEDIÁRIO',
  pro: 'PRO',
};

// ─── ProgressDots ─────────────────────────────────────────────────────────────
function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === current;
        const done   = i < current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              { width: active ? 22 : done ? 12 : 8 },
              (active || done) && { backgroundColor: COLORS.neonBlue },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── StepGoal ─────────────────────────────────────────────────────────────────
function StepGoal({ value, onChange, isDark }: StepGoalProps) {
  const textPrimary   = isDark ? COLORS.textPrimaryDark   : COLORS.textPrimaryLight;
  const textSecondary = isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight;
  const cardBg        = isDark ? COLORS.darkCard          : COLORS.lightCard;

  return (
    <>
      <Text style={styles.stepTag}>Etapa 1 de 5</Text>
      <Text style={[styles.stepTitle, { color: textPrimary }]}>Qual seu objetivo?</Text>
      <Text style={[styles.stepSub, { color: textSecondary }]}>
        Escolha um foco principal. Seu protocolo será calibrado para esse resultado.
      </Text>
      {GOALS.map(g => (
        <TouchableOpacity
          key={g.id}
          style={[styles.card, { backgroundColor: cardBg }, value === g.id && styles.cardSelected]}
          onPress={() => onChange(g.id)}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>{g.title}</Text>
            <Text style={[styles.cardSub, { color: textSecondary }]}>{g.sub}</Text>
          </View>
          <View style={[styles.radioCircle, value === g.id && styles.radioCircleSelected]}>
            {value === g.id && <Icon name="check" size={13} color={COLORS.darkBackground} strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─── StepMetrics ──────────────────────────────────────────────────────────────
function StepMetrics({ data, onChange, isDark }: StepMetricsProps) {
  const textPrimary   = isDark ? COLORS.textPrimaryDark   : COLORS.textPrimaryLight;
  const textSecondary = isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight;

  // Estado local para exibição em DD/MM/AAAA; form armazena ISO YYYY-MM-DD
  const [birthDisplay, setBirthDisplay] = useState<string>(
    data.birthDate
      ? `${data.birthDate.slice(8, 10)}/${data.birthDate.slice(5, 7)}/${data.birthDate.slice(0, 4)}`
      : ''
  );
  const [birthError, setBirthError] = useState<string>('');

  const handleBirthChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    setBirthDisplay(formatted);

    if (cleaned.length === 8) {
      const d = cleaned.slice(0, 2);
      const m = cleaned.slice(2, 4);
      const y = cleaned.slice(4, 8);
      const iso = `${y}-${m}-${d}`;
      // Constrói a data em horário local para evitar o problema de UTC midnight
      // que desloca o dia em fusos negativos (ex: Brasil UTC-3)
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      const now = new Date();

      // Rejeita datas que o JS silenciosamente ajusta (ex: 31/02 → 02/03)
      const rollover =
        date.getFullYear() !== parseInt(y, 10) ||
        date.getMonth() + 1 !== parseInt(m, 10) ||
        date.getDate() !== parseInt(d, 10);

      if (isNaN(date.getTime()) || rollover || date >= now) {
        setBirthError('Data inválida ou no futuro.');
        onChange({ ...data, birthDate: '' });
        return;
      }

      const ageYears = (now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageYears < 13 || ageYears > 120) {
        setBirthError('Idade deve estar entre 13 e 120 anos.');
        onChange({ ...data, birthDate: '' });
        return;
      }

      setBirthError('');
      onChange({ ...data, birthDate: iso });
    } else {
      setBirthError('');
      onChange({ ...data, birthDate: '' });
    }
  };

  return (
    <>
      <Text style={styles.stepTag}>Etapa 2 de 5</Text>
      <Text style={[styles.stepTitle, { color: textPrimary }]}>Sobre você</Text>
      <Text style={[styles.stepSub, { color: textSecondary }]}>
        Usamos esses dados para calibrar cargas iniciais e estimar gasto calórico.
      </Text>
      <CustomInput
        label="DATA DE NASCIMENTO"
        placeholder="DD/MM/AAAA"
        value={birthDisplay}
        onChangeText={handleBirthChange}
        secureTextEntry={false}
        isPassword={false}
        icon={null}
      />
      {!!birthError && (
        <Text style={styles.fieldError}>{birthError}</Text>
      )}
      <CustomInput
        label="PESO (KG)"
        placeholder="78"
        value={data.weight > 0 ? String(data.weight) : ''}
        onChangeText={(v: string) => onChange({ ...data, weight: parseFloat(v) || 0 })}
        secureTextEntry={false}
        isPassword={false}
        icon={null}
      />
      <CustomInput
        label="ALTURA (CM)"
        placeholder="175"
        value={data.height > 0 ? String(data.height) : ''}
        onChangeText={(v: string) => onChange({ ...data, height: parseFloat(v) || 0 })}
        secureTextEntry={false}
        isPassword={false}
        icon={null}
      />
    </>
  );
}

// ─── StepLevel ────────────────────────────────────────────────────────────────
function StepLevel({ value, onChange, isDark }: StepLevelProps) {
  const textPrimary   = isDark ? COLORS.textPrimaryDark   : COLORS.textPrimaryLight;
  const textSecondary = isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight;
  const cardBg        = isDark ? COLORS.darkCard          : COLORS.lightCard;

  return (
    <>
      <Text style={styles.stepTag}>Etapa 3 de 5</Text>
      <Text style={[styles.stepTitle, { color: textPrimary }]}>Seu nível</Text>
      <Text style={[styles.stepSub, { color: textSecondary }]}>
        Calibra a complexidade dos exercícios e a progressão de carga.
      </Text>
      {LEVELS.map(l => (
        <TouchableOpacity
          key={l.id}
          style={[styles.card, { backgroundColor: cardBg }, value === l.id && styles.cardSelected]}
          onPress={() => onChange(l.id)}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>{l.title}</Text>
            <Text style={[styles.cardSub, { color: textSecondary }]}>{l.sub}</Text>
          </View>
          <View style={[styles.radioCircle, value === l.id && styles.radioCircleSelected]}>
            {value === l.id && <Icon name="check" size={13} color={COLORS.darkBackground} strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─── StepFreq ─────────────────────────────────────────────────────────────────
function StepFreq({ days, onChange, isDark }: StepFreqProps) {
  const textPrimary   = isDark ? COLORS.textPrimaryDark   : COLORS.textPrimaryLight;
  const textSecondary = isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight;
  const cardBg        = isDark ? COLORS.darkCard          : COLORS.lightCard;

  const toggle = (i: number) => {
    const next = days.includes(i)
      ? days.filter(d => d !== i)
      : [...days, i].sort((a, b) => a - b);
    onChange(next);
  };

  const hint = (() => {
    if (days.length === 0) return 'Selecione pelo menos 2 dias.';
    if (days.length === 1) return 'Recomendamos no mínimo 2 dias.';
    if (days.length === 2) return 'Bom para manutenção.';
    if (days.length === 3) return 'Ideal para iniciantes.';
    if (days.length === 4) return 'Equilíbrio ótimo entre estímulo e recuperação.';
    if (days.length === 5) return 'Volume alto, divisão por grupo muscular.';
    if (days.length === 6) return 'Avançado. Atenção à recuperação.';
    return 'Inclui dias de mobilidade ativa.';
  })();

  return (
    <>
      <Text style={styles.stepTag}>Etapa 4 de 5</Text>
      <Text style={[styles.stepTitle, { color: textPrimary }]}>Quando você treina?</Text>
      <Text style={[styles.stepSub, { color: textSecondary }]}>
        Toque nos dias que você consegue treinar com consistência.
      </Text>

      <View style={[styles.countCard, { backgroundColor: cardBg }]}>
        <Text style={styles.countNumber}>{days.length}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.countLabel, { color: textSecondary }]}>dias por semana</Text>
          <Text style={styles.countHint}>{hint}</Text>
        </View>
      </View>

      <View style={styles.daysRow}>
        {DAYS_LABELS.map((d, i) => {
          const selected = days.includes(i);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => toggle(i)}
              style={[
                styles.dayChip,
                { backgroundColor: selected ? COLORS.neonBlue : cardBg },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.dayChipText, { color: selected ? COLORS.darkBackground : textSecondary }]}>
                {d.slice(0, 1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ─── StepAnamnesis ────────────────────────────────────────────────────────────
const MEDICAL_CHIPS = ['Ombro', 'Joelho', 'Lombar', 'Quadril'];
const NONE_CHIP = 'Nenhuma';

function buildMedicalValue(chips: string[], text: string): string {
  if (chips.includes(NONE_CHIP)) return NONE_CHIP;
  const parts = [...chips, text.trim()].filter(Boolean);
  return parts.join(', ');
}

function StepAnamnesis({ value, onChange, isDark }: StepAnamnesisProps) {
  const textPrimary   = isDark ? COLORS.textPrimaryDark   : COLORS.textPrimaryLight;
  const textSecondary = isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight;
  const cardBg        = isDark ? COLORS.darkCard          : COLORS.lightCard;

  const [selectedChips, setSelectedChips] = useState<string[]>(() =>
    value === NONE_CHIP ? [NONE_CHIP] : []
  );
  const [freeText, setFreeText] = useState<string>(
    value === NONE_CHIP || value === '' ? '' : value
  );
  const [focused, setFocused] = useState(false);

  const isNoneSelected = selectedChips.includes(NONE_CHIP);

  const toggleChip = (chip: string) => {
    let next: string[];
    if (chip === NONE_CHIP) {
      next = isNoneSelected ? [] : [NONE_CHIP];
      setSelectedChips(next);
      setFreeText('');
      onChange(next.includes(NONE_CHIP) ? NONE_CHIP : '');
    } else {
      const withoutNone = selectedChips.filter(c => c !== NONE_CHIP);
      next = withoutNone.includes(chip)
        ? withoutNone.filter(c => c !== chip)
        : [...withoutNone, chip];
      setSelectedChips(next);
      onChange(buildMedicalValue(next, freeText));
    }
  };

  const handleFreeTextChange = (text: string) => {
    setFreeText(text);
    onChange(buildMedicalValue(selectedChips, text));
  };

  return (
    <>
      <Text style={styles.stepTag}>Etapa 5 de 5</Text>
      <Text style={[styles.stepTitle, { color: textPrimary }]}>Segurança em primeiro lugar.</Text>
      <Text style={[styles.stepSub, { color: textSecondary }]}>
        Você possui alguma lesão, dor articular ou restrição médica que devemos saber para adaptar o seu treino?
      </Text>

      <View style={styles.chipsRow}>
        {MEDICAL_CHIPS.map(chip => {
          const active = selectedChips.includes(chip);
          return (
            <TouchableOpacity
              key={chip}
              onPress={() => toggleChip(chip)}
              activeOpacity={0.75}
              style={[
                styles.chip,
                { backgroundColor: active ? COLORS.neonBlue : cardBg },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? COLORS.darkBackground : textSecondary }]}>
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => toggleChip(NONE_CHIP)}
          activeOpacity={0.75}
          style={[
            styles.chip,
            { backgroundColor: isNoneSelected ? COLORS.neonBlue : cardBg },
          ]}
        >
          <Text style={[styles.chipText, { color: isNoneSelected ? COLORS.darkBackground : textSecondary }]}>
            {NONE_CHIP}
          </Text>
        </TouchableOpacity>
      </View>

      {!isNoneSelected && (
        <>
          <TextInput
            multiline
            numberOfLines={5}
            value={freeText}
            onChangeText={handleFreeTextChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ex: hérnia de disco L4-L5, dor no ombro direito, asma..."
            placeholderTextColor={COLORS.textSecondaryDark}
            textAlignVertical="top"
            style={[
              styles.anamnesisInput,
              { backgroundColor: cardBg, color: textPrimary },
              focused && styles.anamnesisInputFocused,
            ]}
          />
          <Text style={styles.anamnesisHint}>Campo opcional. Pode deixar em branco se não houver restrições.</Text>
        </>
      )}
    </>
  );
}

// ─── StepGenerating ───────────────────────────────────────────────────────────
function StepGenerating({ goalLabel, daysCount }: StepGeneratingProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setTick(t => Math.min(t + 1, GEN_STEPS.length - 1)),
      900
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Text style={styles.stepTag}>Construindo seu protocolo</Text>
      <Text style={[styles.stepTitle, { color: COLORS.textPrimaryDark }]}>Calibrando para você</Text>
      <Text style={styles.stepSub}>
        Foco: {goalLabel} · {daysCount} dias/semana
      </Text>
      <ActivityIndicator size="large" color={COLORS.neonBlue} style={{ marginVertical: 28 }} />
      <View style={{ gap: 8 }}>
        {GEN_STEPS.map((s, i) => {
          const done   = i < tick;
          const active = i === tick;
          return (
            <View
              key={s}
              style={[
                styles.genStep,
                active && { backgroundColor: 'rgba(0,229,255,0.10)', borderRadius: 10 },
              ]}
            >
              <View style={[styles.genDot, done && styles.genDotDone, active && styles.genDotActive]} />
              <Text
                style={[
                  styles.genText,
                  done   && { color: COLORS.textSecondaryDark, opacity: 0.5 },
                  active && { color: COLORS.textPrimaryDark,   fontWeight: '600' },
                ]}
              >
                {s}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

// ─── OnboardingScreen ─────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { isDarkMode }                       = useContext(ThemeContext);
  const { completeOnboarding, signOut }      = useContext(AuthContext) as AuthContextValue;
  const isDark = isDarkMode;

  const [step, setStep] = useState<number>(0);
  const [form, setForm] = useState<OnboardingForm>({
    goal:              '',
    birthDate:         '',
    weight:            0,
    height:            0,
    level:             '',
    days:              [],
    medicalConditions: '',
  });

  // Ref para capturar form no momento exato do avanço para geração
  const formRef = useRef<OnboardingForm>(form);
  useEffect(() => { formRef.current = form; });

  const TOTAL_STEPS = 6;

  const canAdvance: boolean = (() => {
    if (step === 0) return !!form.goal;
    if (step === 1) return !!form.birthDate && form.weight > 0 && form.height > 0;
    if (step === 2) return !!form.level;
    if (step === 3) return form.days.length >= 2;
    return true; // step 4 (anamnese) é opcional
  })();

  const ctaLabel = step === 4 ? 'GERAR TREINO COM IA  ⟩' : 'Continuar';

  const generateWorkout = async (snapshot: OnboardingForm) => {
    if (!snapshot.goal || !snapshot.level) return;

    const goalApi  = GOAL_API_MAP[snapshot.goal];
    const levelApi = LEVEL_API_MAP[snapshot.level];

    try {
      const response = await api.post('/workouts/generate', {
        birthDate:         snapshot.birthDate,
        weight:            snapshot.weight,
        height:            snapshot.height,
        goal:              goalApi,
        frequency:         snapshot.days.length,
        level:             levelApi,
        medicalConditions: snapshot.medicalConditions?.trim() || 'Nenhuma',
      }, {
        // O backend tenta até N modelos com 120s de read timeout cada.
        // 3 modelos × 120s + 60s de buffer = 420s. Mantemos 480s para folga.
        timeout: 480000,
      });

      await completeOnboarding({
        level:        levelApi,
        birthDate:    snapshot.birthDate,
        weight:       snapshot.weight,
        height:       snapshot.height,
        goal:         goalApi,
        frequency:    snapshot.days.length,
        workoutPlans: response.data,
      });
    } catch (e) {
      const err = e as { response?: { data?: unknown } };
      const raw = err.response?.data;
      const message = typeof raw === 'string' ? raw : 'Erro ao gerar treino. Tente novamente.';
      Alert.alert('Erro', message);
      setStep(4);
    }
  };

  const handleAdvance = () => {
    if (step < 4) {
      setStep(s => s + 1);
    } else {
      // step 4 → 5: avança para tela de geração e inicia chamada à API
      const snapshot = formRef.current;
      setStep(5);
      void generateWorkout(snapshot);
    }
  };

  const goalLabel = GOALS.find(g => g.id === form.goal)?.title ?? '—';

  const bg = isDark ? COLORS.darkBackground : COLORS.lightBackground;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* TopBar: visível nos passos 0–4 */}
      {step < 5 && (
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (step === 0) {
                Alert.alert(
                  'Sair do cadastro?',
                  'Você perderá o progresso e voltará para a tela de login.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
                  ],
                );
              } else {
                setStep(s => s - 1);
              }
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          <ProgressDots current={step} total={TOTAL_STEPS} />

          {step === 4 ? (
            <TouchableOpacity onPress={handleAdvance} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Pular</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipBtn} />
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <StepGoal value={form.goal} onChange={v => setForm({ ...form, goal: v })} isDark={isDark} />
        )}
        {step === 1 && (
          <StepMetrics data={form} onChange={setForm} isDark={isDark} />
        )}
        {step === 2 && (
          <StepLevel value={form.level} onChange={v => setForm({ ...form, level: v })} isDark={isDark} />
        )}
        {step === 3 && (
          <StepFreq days={form.days} onChange={v => setForm({ ...form, days: v })} isDark={isDark} />
        )}
        {step === 4 && (
          <StepAnamnesis value={form.medicalConditions} onChange={v => setForm({ ...form, medicalConditions: v })} isDark={isDark} />
        )}
        {step === 5 && (
          <StepGenerating goalLabel={goalLabel} daysCount={form.days.length} />
        )}
      </ScrollView>

      {/* Footer CTA: visível nos passos 0–4 */}
      {step < 5 && (
        <View style={styles.footer}>
          <PrimaryButton title={ctaLabel} onPress={handleAdvance} disabled={!canAdvance} isLoading={false} icon={null} />
          {step === 0 && (
            <TouchableOpacity
              onPress={() => completeOnboarding({ level: 'INT' })}
              style={styles.footerSkip}
            >
              <Text style={styles.footerSkipText}>NÃO, JÁ POSSUO TREINO</Text>
              <Icon name="close" size={13} color={COLORS.textSecondaryDark} strokeWidth={2.4} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // TopBar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDisabled: {
    opacity: 0.35,
  },
  backBtnText: {
    fontSize: 24,
    color: COLORS.textSecondaryDark,
    lineHeight: 28,
  },
  skipBtn: {
    padding: 8,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondaryDark,
  },

  // ProgressDots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.borderDark,
  },

  // Step header
  stepTag: {
    color: COLORS.neonBlue,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    color: COLORS.textSecondaryDark,
  },

  // Cards (Goal / Level)
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.neonBlue,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  radioCircleSelected: {
    backgroundColor: COLORS.neonBlue,
    borderColor: COLORS.neonBlue,
  },

  // StepFreq
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    marginBottom: 12,
    gap: 16,
  },
  countNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.neonBlue,
    letterSpacing: -2,
    minWidth: 56,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: 13,
  },
  countHint: {
    fontSize: 12,
    color: COLORS.textSecondaryDark,
    marginTop: 4,
    lineHeight: 17,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // StepAnamnesis
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  anamnesisInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    lineHeight: 22,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    minHeight: 160,
  },
  anamnesisInputFocused: {
    borderColor: COLORS.neonBlue,
  },
  anamnesisHint: {
    fontSize: 12,
    color: COLORS.textSecondaryDark,
    marginTop: 8,
  },
  fieldError: {
    fontSize: 12,
    color: '#FF5252',
    marginTop: 4,
    marginBottom: 4,
  },

  // StepGenerating
  genStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  genDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.darkCard,
    flexShrink: 0,
  },
  genDotDone: {
    backgroundColor: COLORS.neonBlue,
  },
  genDotActive: {
    borderWidth: 1.5,
    borderColor: COLORS.neonBlue,
    backgroundColor: 'transparent',
  },
  genText: {
    fontSize: 13,
    color: COLORS.textSecondaryDark,
    fontWeight: '500',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  footerSkip: {
    marginTop: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerSkipText: {
    color: COLORS.textSecondaryDark,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
