import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Activity, Building2, User, ArrowLeft, CheckCircle2, FileText, CreditCard, Check, X } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal');

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Conditional Fields
  const [cpf, setCpf] = useState('');
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
      <div className="relative h-screen flex items-center justify-center bg-k-bg text-k-text overflow-hidden">
        {/* Dynamic Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/5 blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-[440px] mx-4 z-10">
          <div className="w-full flex flex-col items-center text-center gap-6 bg-k-surface1/85 backdrop-blur-xl border border-k-ghost rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-k-success/10 text-k-success border border-k-success/20 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
              <CheckCircle2 className="w-10 h-10 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                Cadastro Realizado!
              </h2>
              <p className="text-sm text-k-text-dim mt-2 leading-relaxed">
                {activeTab === 'personal'
                  ? 'Sua conta de Personal Trainer foi criada com sucesso.'
                  : 'Sua empresa e conta de administrador foram criadas com sucesso.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-extrabold text-sm tracking-wide shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-200 cursor-pointer"
            >
              Ir para o Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-y-auto bg-k-bg text-k-text py-12 px-4">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-[460px] mx-auto min-h-full flex items-center justify-center z-10">
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-6 bg-k-surface1/85 backdrop-blur-xl border border-k-ghost rounded-2xl p-8 shadow-2xl hover:border-k-ghost-hi transition-colors duration-300"
        >
          {/* Header/Brand Section */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-k-primary to-k-primary-deep text-k-on-primary shadow-[0_0_20px_rgba(0,229,255,0.35)]">
              <Activity className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-k-text-dim bg-clip-text text-transparent">
                Criar Conta Kinetic
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-k-primary mt-1">
                Escolha seu tipo de acesso
              </p>
            </div>
          </div>

          {/* Tabs Selector */}
          <div className="grid grid-cols-2 p-1 bg-k-surface2/60 border border-k-ghost rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('personal');
                setError(null);
              }}
              className={`py-2 text-xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-k-primary text-k-on-primary shadow-md font-extrabold'
                  : 'text-k-text-dim hover:text-white font-medium'
              }`}
            >
              Profissional
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('company');
                setError(null);
              }}
              className={`py-2 text-xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                activeTab === 'company'
                  ? 'bg-k-primary text-k-on-primary shadow-md font-extrabold'
                  : 'text-k-text-dim hover:text-white font-medium'
              }`}
            >
              Empresa
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            {/* Conditional Company Name and CNPJ Fields */}
            {activeTab === 'company' && (
              <>
                <div className="flex flex-col gap-1.5 transition-all">
                  <label htmlFor="companyName" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                    Nome da Empresa
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-k-text-muted">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <input
                      id="companyName"
                      type="text"
                      placeholder="Ex: Academia Corpore"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 transition-all">
                  <label htmlFor="companyCnpj" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                    CNPJ da Empresa
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-k-text-muted">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input
                      id="companyCnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={companyCnpj}
                      onChange={handleCnpjChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Name Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                {activeTab === 'company' ? 'Nome do Responsável' : 'Seu Nome'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                />
              </div>
            </div>

            {/* Conditional CPF Field for Professionals */}
            {activeTab === 'personal' && (
              <div className="flex flex-col gap-1.5 transition-all">
                <label htmlFor="cpf" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                  CPF
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-k-text-muted">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                Senha
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres com Maiúscula, Minúscula e Especial"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-4 text-k-text-muted hover:text-k-primary focus-visible:text-k-primary transition-colors outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Validator Box */}
              {(isPasswordFocused || password.length > 0) && (
                <div className="mt-1.5 p-3.5 bg-k-surface1/95 border border-k-ghost rounded-xl animate-fade-in flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-k-text-dim">
                      Força da Senha
                    </span>
                    <span className={`text-[11px] font-extrabold uppercase tracking-wide transition-colors duration-200 ${
                      password.length === 0 ? 'text-k-text-muted' :
                      metCount <= 1 ? 'text-k-error' :
                      metCount === 2 ? 'text-k-warn' :
                      metCount === 3 ? 'text-k-primary' :
                      'text-k-success'
                    }`}>
                      {password.length === 0 ? 'Vazia' :
                       metCount <= 1 ? 'Fraca' :
                       metCount === 2 ? 'Média' :
                       metCount === 3 ? 'Boa' :
                       'Forte'}
                    </span>
                  </div>

                  {/* Segmented Progress Bar */}
                  <div className="flex gap-1 h-1">
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      password.length > 0 && metCount >= 1 ? 
                        (metCount <= 1 ? 'bg-k-error' : metCount === 2 ? 'bg-k-warn' : metCount === 3 ? 'bg-k-primary' : 'bg-k-success') : 
                        'bg-k-ghost-hi'
                    }`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      password.length > 0 && metCount >= 2 ? 
                        (metCount === 2 ? 'bg-k-warn' : metCount === 3 ? 'bg-k-primary' : 'bg-k-success') : 
                        'bg-k-ghost-hi'
                    }`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      password.length > 0 && metCount >= 3 ? 
                        (metCount === 3 ? 'bg-k-primary' : 'bg-k-success') : 
                        'bg-k-ghost-hi'
                    }`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      password.length > 0 && metCount >= 4 ? 
                        'bg-k-success' : 
                        'bg-k-ghost-hi'
                    }`} />
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      {checks.length ? (
                        <Check className="w-3.5 h-3.5 text-k-success shrink-0 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-k-text-muted/30 shrink-0" />
                      )}
                      <span className={`text-[11px] transition-colors duration-200 ${
                        checks.length ? 'text-k-success font-semibold' : 'text-k-text-dim'
                      }`}>
                        8 a 20 caracteres
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {checks.uppercase ? (
                        <Check className="w-3.5 h-3.5 text-k-success shrink-0 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-k-text-muted/30 shrink-0" />
                      )}
                      <span className={`text-[11px] transition-colors duration-200 ${
                        checks.uppercase ? 'text-k-success font-semibold' : 'text-k-text-dim'
                      }`}>
                        Letra maiúscula
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {checks.lowercase ? (
                        <Check className="w-3.5 h-3.5 text-k-success shrink-0 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-k-text-muted/30 shrink-0" />
                      )}
                      <span className={`text-[11px] transition-colors duration-200 ${
                        checks.lowercase ? 'text-k-success font-semibold' : 'text-k-text-dim'
                      }`}>
                        Letra minúscula
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {checks.special ? (
                        <Check className="w-3.5 h-3.5 text-k-success shrink-0 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-k-text-muted/30 shrink-0" />
                      )}
                      <span className={`text-[11px] transition-colors duration-200 ${
                        checks.special ? 'text-k-success font-semibold' : 'text-k-text-dim'
                      }`}>
                        Caractere especial
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                Confirmar Senha
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-4 text-k-text-muted hover:text-k-primary focus-visible:text-k-primary transition-colors outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password Feedback */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] animate-fade-in">
                  {password === confirmPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-k-success shrink-0" />
                      <span className="text-k-success font-semibold">As senhas coincidem</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5 text-k-error shrink-0" />
                      <span className="text-k-error font-semibold">As senhas não coincidem</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-k-error/10 border border-k-error/30 text-k-error text-xs leading-relaxed"
              role="alert"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-error shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 rounded-xl bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-extrabold text-sm tracking-wide shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? 'Cadastrando…' : 'Finalizar Cadastro'}
          </button>

          {/* Link back to login */}
          <div className="flex justify-center mt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-k-primary hover:text-white transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar para o Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
