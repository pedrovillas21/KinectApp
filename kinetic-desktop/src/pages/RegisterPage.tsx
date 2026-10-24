import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { isValidCellPhone, maskCellPhone } from '../utils/whatsapp';
import KineticLogo from '../components/KineticLogo';
import AuthBrandPanel, { authInputClass, type BrandHighlight } from '../components/AuthBrandPanel';
import { EASE_OUT, SPRING_PILL, riseItem, staggerContainer } from '../components/motion/primitives';

type AccountType = 'personal' | 'company';

const TABS: { id: AccountType; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'Profissional', icon: User },
  { id: 'company', label: 'Empresa', icon: Building2 },
];

const BRAND: Record<AccountType, { eyebrow: string; title: ReactNode; highlights: BrandHighlight[] }> = {
  personal: {
    eyebrow: 'Para personal trainers',
    title: (
      <>
        Seu método.
        <br />
        <span className="text-k-text-muted">Em escala.</span>
      </>
    ),
    highlights: [
      { icon: Sparkles, title: 'Prescrição com IA', text: 'Monte planos de treino em minutos.' },
      { icon: Users, title: 'Alunos em tempo real', text: 'Cargas, frequência e evolução num só lugar.' },
      { icon: Wallet, title: 'Cobrança integrada', text: 'Mensalidades e financeiro sem planilha.' },
    ],
  },
  company: {
    eyebrow: 'Para academias e estúdios',
    title: (
      <>
        Sua equipe.
        <br />
        <span className="text-k-text-muted">Em sintonia.</span>
      </>
    ),
    highlights: [
      { icon: Users, title: 'Gestão da equipe', text: 'Personais e clientes organizados em um painel.' },
      { icon: BarChart3, title: 'Indicadores da operação', text: 'Engajamento e retenção acompanhados de perto.' },
      { icon: MessageSquare, title: 'Feedbacks dos clientes', text: 'Saiba o que seus alunos pensam do serviço.' },
    ],
  },
};

const REQUIREMENTS = [
  { key: 'length', label: '8 a 20 caracteres' },
  { key: 'uppercase', label: 'Letra maiúscula' },
  { key: 'lowercase', label: 'Letra minúscula' },
  { key: 'special', label: 'Caractere especial' },
] as const;

// Indexado pela quantidade de requisitos atendidos (0–4).
const STRENGTH = [
  { label: 'Fraca', text: 'text-k-alert', bar: 'bg-k-error' },
  { label: 'Fraca', text: 'text-k-alert', bar: 'bg-k-error' },
  { label: 'Média', text: 'text-k-warn', bar: 'bg-k-warn' },
  { label: 'Boa', text: 'text-k-primary', bar: 'bg-k-primary' },
  { label: 'Forte', text: 'text-k-success', bar: 'bg-k-success' },
];

// Troca de lado dos painéis: mesma curva "expo out" do resto do painel.
const SIDE_SWAP = { duration: 0.8, ease: EASE_OUT };

const primaryButtonClass =
  'group w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-k-primary text-k-on-primary font-semibold text-sm transition-[background-color,box-shadow,transform] hover:bg-k-primary-deep hover:shadow-[0_8px_24px_-8px_rgba(0,229,255,0.55)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-k-primary/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer';

// Math validation for CPF
function isValidCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let r = sum % 11;
  let d1 = r < 2 ? 0 : 11 - r;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  r = sum % 11;
  let d2 = r < 2 ? 0 : 11 - r;

  return parseInt(cleanCpf.charAt(9)) === d1 && parseInt(cleanCpf.charAt(10)) === d2;
}

// Math validation for CNPJ
function isValidCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

  const weight1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weight2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weight1[i];
  }
  let r = sum % 11;
  let d1 = r < 2 ? 0 : 11 - r;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weight2[i];
  }
  r = sum % 11;
  let d2 = r < 2 ? 0 : 11 - r;

  return parseInt(cleanCnpj.charAt(12)) === d1 && parseInt(cleanCnpj.charAt(13)) === d2;
}

const formatCPF = (value: string) => {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
};

const formatCNPJ = (value: string) => {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

export default function RegisterPage() {
  const { register, registerCompany } = useAuth();
  const navigate = useNavigate();

  // Tab: 'personal' | 'company'
  const [activeTab, setActiveTab] = useState<AccountType>('personal');

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Conditional Fields
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const checks = {
    length: password.length >= 8 && password.length <= 20,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[!@#$%^&*_=+-]/.test(password),
  };

  const metCount = Object.values(checks).filter(Boolean).length;
  const isCompany = activeTab === 'company';

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyCnpj(formatCNPJ(e.target.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Validations
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$/;
    if (!passwordRegex.test(password)) {
      setError('A senha deve ter entre 8 e 20 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula e um caractere especial (!@#$%^&*_=+-).');
      return;
    }

    if (activeTab === 'personal') {
      if (!isValidCPF(cpf)) {
        setError('CPF inválido.');
        return;
      }
      if (!isValidCellPhone(phone)) {
        setError('Celular inválido. Informe DDD + número, ex.: (11) 98765-4321.');
        return;
      }
    } else {
      if (!isValidCNPJ(companyCnpj)) {
        setError('CNPJ inválido.');
        return;
      }
    }

    setSubmitting(true);

    try {
      let result;
      if (activeTab === 'personal') {
        result = await register({
          name,
          email,
          password,
          cpf,
          phone,
        });
      } else {
        result = await registerCompany({
          companyName,
          companyCnpj,
          ownerName: name,
          ownerEmail: email,
          ownerPassword: password,
        });
      }

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-k-bg text-k-text px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="w-full max-w-[400px] flex flex-col items-center text-center"
        >
          <motion.div variants={riseItem} className="mb-10">
            <KineticLogo size={20} />
          </motion.div>
          <motion.div
            variants={riseItem}
            className="w-14 h-14 rounded-full grid place-items-center bg-k-success/10 text-k-success border border-k-success/25"
          >
            <CheckCircle2 className="w-7 h-7" />
          </motion.div>
          <motion.div variants={riseItem} className="mt-6">
            <h1 className="font-display font-bold text-[28px] leading-tight tracking-tight">Conta criada</h1>
            <p className="mt-2 text-sm text-k-text-dim leading-relaxed">
              {isCompany
                ? 'Sua empresa e a conta de administrador foram criadas.'
                : 'Sua conta de personal trainer foi criada.'}{' '}
              Enviamos um código para <span className="font-semibold text-k-text">{email.trim()}</span> — confirme seu
              e-mail para entrar no painel.
            </p>
          </motion.div>
          <motion.button
            variants={riseItem}
            onClick={() => navigate('/confirm-email', { state: { email: email.trim() } })}
            className={`${primaryButtonClass} mt-8`}
          >
            Confirmar e-mail
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const strength = STRENGTH[metCount];

  return (
    <div
      className={`h-screen flex bg-k-bg text-k-text overflow-hidden ${isCompany ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
    >
      {/* Painel de marca: troca de lado quando o tipo de conta muda */}
      <motion.aside
        layout
        transition={SIDE_SWAP}
        className={`hidden lg:block w-1/2 h-full border-k-ghost ${isCompany ? 'border-l' : 'border-r'}`}
      >
        <AuthBrandPanel contentKey={activeTab} {...BRAND[activeTab]} />
      </motion.aside>

      <motion.main layout transition={SIDE_SWAP} className="w-full lg:w-1/2 h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-6 py-12">
          <motion.form
            onSubmit={handleSubmit}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full max-w-[400px] flex flex-col"
          >
            <motion.div variants={riseItem} className="lg:hidden mb-10">
              <KineticLogo size={20} />
            </motion.div>

            <motion.div variants={riseItem}>
              <h1 className="font-display font-bold text-[28px] leading-tight tracking-tight">
                {isCompany ? 'Cadastre sua empresa' : 'Crie sua conta'}
              </h1>
              <p className="mt-1.5 text-sm text-k-text-dim">
                {isCompany
                  ? 'Gerencie sua equipe de personais e seus clientes.'
                  : 'Comece a prescrever e acompanhar seus alunos.'}
              </p>
            </motion.div>

            {/* Tipo de conta */}
            <motion.div
              variants={riseItem}
              role="tablist"
              aria-label="Tipo de conta"
              className="mt-7 grid grid-cols-2 p-1 bg-k-surface1 border border-k-ghost rounded-lg"
            >
              {TABS.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError(null);
                    }}
                    className={`relative h-9 flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      selected ? 'text-k-text' : 'text-k-text-muted hover:text-k-text'
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="register-tab-pill"
                        transition={SPRING_PILL}
                        className="absolute inset-0 rounded-md bg-k-surface3 shadow-[inset_0_0_0_1px_var(--k-ghost-hi)]"
                      />
                    )}
                    <tab.icon className={`relative w-4 h-4 ${selected ? 'text-k-primary' : ''}`} />
                    <span className="relative">{tab.label}</span>
                  </button>
                );
              })}
            </motion.div>

            <motion.div variants={riseItem} className="mt-6 flex flex-col">
              <AnimatePresence initial={false}>
                {isCompany && (
                  <Collapse key="company">
                    <Field id="companyName" label="Nome da empresa">
                      <input
                        id="companyName"
                        type="text"
                        autoComplete="organization"
                        placeholder="Ex.: Academia Corpore"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className={authInputClass}
                      />
                    </Field>
                    <Field id="companyCnpj" label="CNPJ">
                      <input
                        id="companyCnpj"
                        type="text"
                        inputMode="numeric"
                        placeholder="00.000.000/0000-00"
                        value={companyCnpj}
                        onChange={handleCnpjChange}
                        required
                        className={authInputClass}
                      />
                    </Field>
                  </Collapse>
                )}
              </AnimatePresence>

              <Field id="name" label={isCompany ? 'Nome do responsável' : 'Nome completo'}>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ex.: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={authInputClass}
                />
              </Field>

              <AnimatePresence initial={false}>
                {!isCompany && (
                  <Collapse key="personal">
                    <Field id="cpf" label="CPF">
                      <input
                        id="cpf"
                        type="text"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCpfChange}
                        required
                        className={authInputClass}
                      />
                    </Field>
                    <Field
                      id="phone"
                      label="Celular (WhatsApp)"
                      hint="Seus alunos usam este número para falar com você pelo WhatsApp."
                    >
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="(11) 98765-4321"
                        value={phone}
                        onChange={(e) => setPhone(maskCellPhone(e.target.value))}
                        required
                        className={authInputClass}
                      />
                    </Field>
                  </Collapse>
                )}
              </AnimatePresence>

              <Field id="email" label="E-mail">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={authInputClass}
                />
              </Field>

              <Field id="password" label="Senha">
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="8 a 20 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                    className={`${authInputClass} pr-11`}
                  />
                  <EyeToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>

                {(isPasswordFocused || password.length > 0) && (
                  <div className="mt-1 p-3.5 bg-k-surface1 border border-k-ghost rounded-lg animate-fade-in flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-k-text-dim">Força da senha</span>
                      <span
                        className={`font-semibold transition-colors duration-200 ${
                          password.length === 0 ? 'text-k-text-muted' : strength.text
                        }`}
                      >
                        {password.length === 0 ? 'Vazia' : strength.label}
                      </span>
                    </div>

                    <div className="flex gap-1 h-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                            i < metCount ? strength.bar : 'bg-k-ghost-hi'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      {REQUIREMENTS.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          {checks[key] ? (
                            <Check className="w-3.5 h-3.5 text-k-success shrink-0 stroke-[3]" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-k-text-muted/30 shrink-0" />
                          )}
                          <span
                            className={`text-xs transition-colors duration-200 ${
                              checks[key] ? 'text-k-success' : 'text-k-text-dim'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Field>

              <Field id="confirmPassword" label="Confirmar senha">
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`${authInputClass} pr-11`}
                  />
                  <EyeToggle
                    shown={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </div>

                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs animate-fade-in">
                    {password === confirmPassword ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-k-success shrink-0" />
                        <span className="text-k-success">As senhas coincidem</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 text-k-alert shrink-0" />
                        <span className="text-k-alert">As senhas não coincidem</span>
                      </>
                    )}
                  </div>
                )}
              </Field>
            </motion.div>

            {error && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-k-error/10 border border-k-error/30 text-k-alert text-sm"
                role="alert"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-k-error shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <motion.div variants={riseItem} className="mt-6">
              <button type="submit" disabled={submitting} className={primaryButtonClass}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cadastrando…
                  </>
                ) : (
                  <>
                    {isCompany ? 'Cadastrar empresa' : 'Criar conta'}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <p className="mt-6 text-center text-sm text-k-text-dim">
                Já tem conta?{' '}
                <Link to="/login" className="font-semibold text-k-primary hover:underline underline-offset-4">
                  Entrar
                </Link>
              </p>
            </motion.div>
          </motion.form>
        </div>
      </motion.main>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 pb-5">
      <label htmlFor={id} className="text-sm font-medium text-k-text-soft">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-k-text-muted">{hint}</p>}
    </div>
  );
}

/** Abre/fecha um grupo de campos que só existe em um dos tipos de conta. */
function Collapse({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={shown ? 'Ocultar senha' : 'Exibir senha'}
      className="absolute inset-y-0 right-0 w-11 grid place-items-center text-k-text-muted hover:text-k-text transition-colors cursor-pointer"
    >
      {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}
