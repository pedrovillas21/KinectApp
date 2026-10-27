import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { isValidCellPhone, maskCellPhone } from '../utils/whatsapp';
import KineticLogo from '../components/KineticLogo';
import AuthBrandPanel, { authInputClass, type BrandHighlight } from '../components/AuthBrandPanel';
import { riseItem, staggerContainer } from '../components/motion/primitives';

// Cadastro público só de personal. Empresas (redes e filiais) não se cadastram aqui:
// o acesso do dono é criado pela equipe Kinetic e as filiais, pelo dono.
const BRAND: { eyebrow: string; title: ReactNode; highlights: BrandHighlight[] } = {
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

const formatCPF = (value: string) => {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [name, setName] = useState('');

  // Conditional Fields
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');

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

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Validations
    if (!acceptedTerms) {
      setError('Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$/;
    if (!passwordRegex.test(password)) {
      setError('A senha deve ter entre 8 e 20 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula e um caractere especial (!@#$%^&*_=+-).');
      return;
    }

    if (!isValidCPF(cpf)) {
      setError('CPF inválido.');
      return;
    }
    if (!isValidCellPhone(phone)) {
      setError('Celular inválido. Informe DDD + número, ex.: (11) 98765-4321.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await register({ name, email, password, cpf, phone });

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
      <div className="min-h-dvh flex items-center justify-center bg-k-bg text-k-text px-6">
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
              Sua conta de personal trainer foi criada.{' '}
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
    <div className="h-dvh flex lg:flex-row bg-k-bg text-k-text overflow-hidden">
      <aside className="hidden lg:block w-1/2 h-full border-k-ghost border-r">
        <AuthBrandPanel contentKey="personal" {...BRAND} />
      </aside>

      <main className="w-full lg:w-1/2 h-full overflow-y-auto">
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
              <h1 className="font-display font-bold text-[28px] leading-tight tracking-tight">Crie sua conta</h1>
              <p className="mt-1.5 text-sm text-k-text-dim">Comece a prescrever e acompanhar seus alunos.</p>
            </motion.div>

            <motion.div
              variants={riseItem}
              className="mt-6 flex items-start gap-3 rounded-lg border border-k-ghost bg-k-surface1 px-3.5 py-3 text-xs leading-relaxed text-k-text-dim"
            >
              <Building2 className="mt-px h-4 w-4 shrink-0 text-k-primary" />
              <span>
                Academia ou rede de academias? O acesso da empresa é criado pela equipe Kinetic, e cada filial recebe
                o próprio usuário. Fale com a gente para contratar.
              </span>
            </motion.div>

            <motion.div variants={riseItem} className="mt-6 flex flex-col">
              <Field id="name" label="Nome completo">
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

            <motion.div variants={riseItem}>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-k-text-soft">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#00E5FF]"
                />
                <span>
                  Li e aceito os{' '}
                  <a href="/termos" target="_blank" rel="noopener noreferrer" className="font-semibold text-k-primary hover:underline">
                    Termos de Uso
                  </a>{' '}
                  e a{' '}
                  <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-semibold text-k-primary hover:underline">
                    Política de Privacidade
                  </a>
                  .
                </span>
              </label>
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
                    Criar conta
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
      </main>
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
