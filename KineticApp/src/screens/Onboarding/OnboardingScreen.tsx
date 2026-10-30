import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';
import { AuthContext } from '../../contexts/AuthContext';

import { Button, TextField } from '../../components/ui';
import Icon from '../../components/Icon';
import TextSizePicker from '../../components/TextSizePicker';
import ThemePicker from '../../components/ThemePicker';
import { generateWorkout } from '../../services/workoutService';
import {
  DAYS_LABELS,
  GOALS,
  GOAL_API_MAP,
  LEVELS,
  LEVEL_API_MAP,
  type GoalType,
  type LevelType,
} from '../../constants/protocol';
import { showAlert } from '../../components/ui/AlertHost';
import { createStyles, useColors } from '../../theme/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingForm {
  goal: GoalType;
  birthDate: string; // Formato ISO: 'YYYY-MM-DD'
  weight: number;
  height: number;
  level: LevelType;
  days: number[];
  medicalConditions: string;
}

interface ProgressDotsProps {
  current: number;
  total: number;
}

interface StepGoalProps {
  value: GoalType;
  onChange: (v: GoalType) => void;
}

interface StepMetricsProps {
  data: OnboardingForm;
  onChange: (data: OnboardingForm) => void;
}

interface StepLevelProps {
  value: LevelType;
  onChange: (v: LevelType) => void;
}

interface StepFreqProps {
  days: number[];
  onChange: (days: number[]) => void;
}

interface StepAnamnesisProps {
  value: string;
  onChange: (v: string) => void;
}

interface StepGeneratingProps {
  goalLabel: string;
  daysCount: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const GEN_STEPS = [
  'Analisando perfil antropométrico',
  'Cruzando histórico com objetivo selecionado',
  'Calibrando cargas e tempos de descanso',
  'Distribuindo volumes por grupo muscular',
  'Selecionando exercícios compatíveis',
  'Montando ciclo de progressão',
];

// ─── ProgressDots ─────────────────────────────────────────────────────────────
function ProgressDots({ current, total }: ProgressDotsProps) {
  const styles = useStyles();
  const c = useColors();
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
              (active || done) && { backgroundColor: c.primaryFill },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── StepTheme ────────────────────────────────────────────────────────────────
// Primeira escolha: o resto do cadastro já aparece no tema escolhido.
function StepTheme() {
  const styles = useStyles();
  const c = useColors();

  return (
    <>
      <Text style={styles.stepTag}>Antes de começar</Text>
      <Text style={[styles.stepTitle, { color: c.text }]}>Aparência</Text>
      <Text style={[styles.stepSub, { color: c.textSecondary }]}>
        Escolha o tema do app. Em Sistema, ele acompanha o modo claro ou escuro do seu celular.
      </Text>
      <ThemePicker />
      <Text style={[styles.stepSub, { color: c.textSecondary, marginTop: 12 }]}>
        Você pode mudar isso depois em Configurações.
      </Text>
    </>
  );
}

// ─── StepTextSize ─────────────────────────────────────────────────────────────
// Antes de tudo: quem tem dificuldade de leitura ajusta o texto já para o resto do cadastro.
function StepTextSize() {
  const styles = useStyles();
  const c = useColors();

  return (
    <>
      <Text style={styles.stepTag}>Antes de começar</Text>
      <Text style={[styles.stepTitle, { color: c.text }]}>Tamanho do texto</Text>
      <Text style={[styles.stepSub, { color: c.textSecondary }]}>
        Escolha o tamanho mais confortável para ler. Textos e ícones de todo o app seguem essa escolha.
      </Text>
      <TextSizePicker />
      <Text style={[styles.stepSub, { color: c.textSecondary, marginTop: 12 }]}>
        Você pode mudar isso depois em Configurações.
      </Text>
    </>
  );
}

// ─── StepGoal ─────────────────────────────────────────────────────────────────
function StepGoal({ value, onChange }: StepGoalProps) {
  const styles = useStyles();
  const c = useColors();

  return (
    <>
      <Text style={styles.stepTag}>Etapa 1 de 5</Text>
      <Text style={[styles.stepTitle, { color: c.text }]}>Qual seu objetivo?</Text>
      <Text style={[styles.stepSub, { color: c.textSecondary }]}>
        Escolha um foco principal. Seu protocolo será calibrado para esse resultado.
      </Text>
      {GOALS.map(g => (
        <TouchableOpacity
          key={g.id}
          style={[styles.card, { backgroundColor: c.surface1 }, value === g.id && styles.cardSelected]}
          onPress={() => onChange(g.id)}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{g.title}</Text>
            <Text style={[styles.cardSub, { color: c.textSecondary }]}>{g.sub}</Text>
          </View>
          <View style={[styles.radioCircle, value === g.id && styles.radioCircleSelected]}>
            {value === g.id && <Icon name="check" size={13} color={c.bg} strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─── StepMetrics ──────────────────────────────────────────────────────────────
function StepMetrics({ data, onChange }: StepMetricsProps) {
  const styles = useStyles();
  const c = useColors();

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
      <Text style={[styles.stepTitle, { color: c.text }]}>Sobre você</Text>
      <Text style={[styles.stepSub, { color: c.textSecondary }]}>
        Usamos esses dados para calibrar cargas iniciais e estimar gasto calórico.
      </Text>
      <TextField
        label="Data de nascimento"
        placeholder="DD/MM/AAAA"
        value={birthDisplay}
        onChangeText={handleBirthChange}
        error={birthError || null}
        keyboardType="number-pad"
        maxLength={10}
        autoCorrect={false}
        autoComplete="off"
        style={styles.field}
      />
      <TextField
        label="Peso (kg)"
        placeholder="78"
        value={data.weight > 0 ? String(data.weight) : ''}
        onChangeText={(v: string) => onChange({ ...data, weight: parseFloat(v) || 0 })}
        keyboardType="numeric"
        maxLength={5}
        autoCorrect={false}
        autoComplete="off"
        style={styles.field}
      />
      <TextField
        label="Altura (cm)"
        placeholder="175"
        value={data.height > 0 ? String(data.height) : ''}
        onChangeText={(v: string) => onChange({ ...data, height: parseFloat(v) || 0 })}
        keyboardType="numeric"
        maxLength={3}
        autoCorrect={false}
        autoComplete="off"
        style={styles.field}
      />
    </>
  );
}

// ─── StepLevel ────────────────────────────────────────────────────────────────
function StepLevel({ value, onChange }: StepLevelProps) {
  const styles = useStyles();
  const c = useColors();

  return (
    <>
      <Text style={styles.stepTag}>Etapa 3 de 5</Text>
      <Text style={[styles.stepTitle, { color: c.text }]}>Seu nível</Text>
      <Text style={[styles.stepSub, { color: c.textSecondary }]}>
        Calibra a complexidade dos exercícios e a progressão de carga.
      </Text>
      {LEVELS.map(l => (
        <TouchableOpacity
          key={l.id}
          style={[styles.card, { backgroundColor: c.surface1 }, value === l.id && styles.cardSelected]}
          onPress={() => onChange(l.id)}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{l.title}</Text>
            <Text style={[styles.cardSub, { color: c.textSecondary }]}>{l.sub}</Text>
          </View>
          <View style={[styles.radioCircle, value === l.id && styles.radioCircleSelected]}>
            {value === l.id && <Icon name="check" size={13} color={c.bg} strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─── StepFreq ─────────────────────────────────────────────────────────────────
function StepFreq({ days, onChange }: StepFreqProps) {
  const styles = useStyles();
  const c = useColors();

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
      <Text style={[styles.stepTitle, { color: c.text }]}>Quando você treina?</Text>
      <Text style={[styles.stepSub, { color: c.textSecondary }]}>
        Toque nos dias que você consegue treinar com consistência.
      </Text>

      <View style={[styles.countCard, { backgroundColor: c.surface1 }]}>
        <Text style={styles.countNumber}>{days.length}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.countLabel, { color: c.textSecondary }]}>dias por semana</Text>
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
                { backgroundColor: selected ? c.primary : c.surface1 },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.dayChipText, { color: selected ? c.bg : c.textSecondary }]}>
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

function StepAnamnesis({ value, onChange }: StepAnamnesisProps) {
  const styles = useStyles();
  const c = useColors();

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
      const withoutNone = selectedChips.filter(x => x !== NONE_CHIP);
      next = withoutNone.includes(chip)
        ? withoutNone.filter(x => x !== chip)
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
      <Text style={[styles.stepTitle, { color: c.text }]}>Segurança em primeiro lugar.</Text>
      <Text style={[styles.stepSub, { color: c.textSecondary }]}>
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
                { backgroundColor: active ? c.primary : c.surface1 },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? c.bg : c.textSecondary }]}>
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
            { backgroundColor: isNoneSelected ? c.primary : c.surface1 },
          ]}
        >
          <Text style={[styles.chipText, { color: isNoneSelected ? c.bg : c.textSecondary }]}>
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
            maxLength={1900} // junto com os chips, cabe no limite de 2000 da anamnese no backend
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ex: hérnia de disco L4-L5, dor no ombro direito, asma..."
            placeholderTextColor={c.textSecondary}
            textAlignVertical="top"
            style={[
              styles.anamnesisInput,
              { backgroundColor: c.surface1, color: c.text },
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
  const styles = useStyles();
  const c = useColors();
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
      <Text style={[styles.stepTitle, { color: c.text }]}>Calibrando para você</Text>
      <Text style={styles.stepSub}>
        Foco: {goalLabel} · {daysCount} dias/semana
      </Text>
      <ActivityIndicator size="large" color={c.primary} style={{ marginVertical: 28 }} />
      <View style={{ gap: 8 }}>
        {GEN_STEPS.map((s, i) => {
          const done   = i < tick;
          const active = i === tick;
          return (
            <View
              key={s}
              style={[
                styles.genStep,
                active && { backgroundColor: c.primaryDim, borderRadius: 10 },
              ]}
            >
              <View style={[styles.genDot, done && styles.genDotDone, active && styles.genDotActive]} />
              <Text
                style={[
                  styles.genText,
                  done   && { color: c.textSecondary, opacity: 0.5 },
                  active && { color: c.text,   fontWeight: '600' },
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
  const styles = useStyles();
  const c = useColors();
  const { completeOnboarding, skipOnboarding, signOut } = useContext(AuthContext);

  // -2 = tema; -1 = tamanho do texto; 0–4 = perguntas; 5 = gerando.
  const [step, setStep] = useState<number>(-2);
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

  const TOTAL_STEPS = 8;

  const canAdvance: boolean = (() => {
    if (step === 0) return !!form.goal;
    if (step === 1) return !!form.birthDate && form.weight > 0 && form.height > 0;
    if (step === 2) return !!form.level;
    if (step === 3) return form.days.length >= 2;
    return true; // step 4 (anamnese) é opcional
  })();

  const ctaLabel = step === 4 ? 'GERAR TREINO COM IA  ⟩' : 'Continuar';

  const handleGenerate = async (snapshot: OnboardingForm) => {
    if (!snapshot.goal || !snapshot.level) return;

    const goalApi  = GOAL_API_MAP[snapshot.goal];
    const levelApi = LEVEL_API_MAP[snapshot.level];

    try {
      await generateWorkout({
        birthDate:         snapshot.birthDate,
        weight:            snapshot.weight,
        height:            snapshot.height,
        goal:              goalApi,
        frequency:         snapshot.days.length,
        level:             levelApi,
        medicalConditions: snapshot.medicalConditions?.trim() || 'Nenhuma',
      });

      await completeOnboarding({
        level:        levelApi,
        birthDate:    snapshot.birthDate,
        weight:       snapshot.weight,
        height:       snapshot.height,
        goal:         goalApi,
        frequency:    snapshot.days.length,
      });
    } catch (e) {
      const err = e as { response?: { data?: unknown } };
      const raw = err.response?.data;
      const message = typeof raw === 'string' ? raw : 'Erro ao gerar treino. Tente novamente.';
      showAlert('Erro', message);
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
      void handleGenerate(snapshot);
    }
  };

  const goalLabel = GOALS.find(g => g.id === form.goal)?.title ?? '—';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoider>
        {/* TopBar: visível nos passos 0–4 */}
        {step < 5 && (
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => {
                if (step === -2) {
                  showAlert(
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

            <ProgressDots current={step + 2} total={TOTAL_STEPS} />

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
          {step === -2 && <StepTheme />}
          {step === -1 && <StepTextSize />}
          {step === 0 && (
            <StepGoal value={form.goal} onChange={v => setForm({ ...form, goal: v })} />
          )}
          {step === 1 && (
            <StepMetrics data={form} onChange={setForm} />
          )}
          {step === 2 && (
            <StepLevel value={form.level} onChange={v => setForm({ ...form, level: v })} />
          )}
          {step === 3 && (
            <StepFreq days={form.days} onChange={v => setForm({ ...form, days: v })} />
          )}
          {step === 4 && (
            <StepAnamnesis value={form.medicalConditions} onChange={v => setForm({ ...form, medicalConditions: v })} />
          )}
          {step === 5 && (
            <StepGenerating goalLabel={goalLabel} daysCount={form.days.length} />
          )}
        </ScrollView>

        {/* Footer CTA: visível nos passos 0–4 */}
        {step < 5 && (
          <View style={styles.footer}>
            <Button label={ctaLabel} onPress={handleAdvance} disabled={!canAdvance} />
            {step === 0 && (
              <TouchableOpacity
                onPress={() => void skipOnboarding()}
                style={styles.footerSkip}
              >
                <Text style={styles.footerSkipText}>NÃO, JÁ POSSUO TREINO</Text>
                <Icon name="close" size={13} color={c.textSecondary} strokeWidth={2.4} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const useStyles = createStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.bg,
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
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: c.textSecondary,
    lineHeight: 28,
  },
  skipBtn: {
    padding: 8,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
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
    backgroundColor: c.ghost,
  },

  // Step header
  stepTag: {
    color: c.primary,
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
    color: c.textSecondary,
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
    borderColor: c.primary,
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
    borderColor: c.ghost,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  radioCircleSelected: {
    backgroundColor: c.primaryFill,
    borderColor: c.primary,
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
    color: c.primary,
    letterSpacing: -2,
    minWidth: 56,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: 13,
  },
  countHint: {
    fontSize: 12,
    color: c.textSecondary,
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
    borderColor: c.ghost,
    minHeight: 160,
  },
  anamnesisInputFocused: {
    borderColor: c.primary,
  },
  anamnesisHint: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 8,
  },
  field: {
    marginBottom: 20,
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
    backgroundColor: c.surface1,
    flexShrink: 0,
  },
  genDotDone: {
    backgroundColor: c.primaryFill,
  },
  genDotActive: {
    borderWidth: 1.5,
    borderColor: c.primary,
    backgroundColor: 'transparent',
  },
  genText: {
    fontSize: 13,
    color: c.textSecondary,
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
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
}));
