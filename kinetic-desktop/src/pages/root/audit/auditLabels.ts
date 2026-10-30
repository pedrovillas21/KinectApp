import type { AuditAction, AuditCategory, AuditEvent, AuditParty, DataRequestKind } from '../../../types';

/**
 * Textos da Auditoria em pt-BR, num lugar só (páginas e card da Visão Geral). Os Records
 * fazem o TypeScript cobrar um rótulo para cada ação nova do backend.
 */

export const ACTION_LABEL: Record<AuditAction, string> = {
  COMPANY_CREATED: 'Criou a rede',
  PERSONAL_CREATED: 'Cadastrou o personal',
  USER_STATUS_CHANGED: 'Mudou o status da conta',
  USER_SOFT_DELETED: 'Bloqueou a conta (exclusão leve)',
  USER_DELETED_BY_ADMIN: 'Excluiu a conta definitivamente',
  PASSWORD_REGENERATED: 'Gerou nova senha',
  SECOND_FACTOR_RESET: 'Redefiniu o 2FA',
  UNIT_CREATED: 'Criou a filial',
  UNIT_UPDATED: 'Editou a filial',
  UNIT_STATUS_CHANGED: 'Ativou ou suspendeu a filial',
  TRAINER_INVITED_TO_COMPANY: 'Convidou o personal para a empresa',
  TRAINER_REMOVED_FROM_COMPANY: 'Tirou o personal da empresa',
  COMPANY_INVITE_ACCEPTED: 'Aceitou o convite da empresa',
  COMPANY_INVITE_DECLINED: 'Recusou o convite da empresa',
  TRAINER_LEFT_COMPANY: 'Saiu da empresa',
  STUDENT_LINKED_BY_COMPANY: 'Atribuiu o aluno a um personal',
  COMPANY_LINK_ENDED: 'Encerrou o vínculo do aluno',
  ACCESS_LOGS_VIEWED: 'Consultou registros de acesso',
  LOGIN_FAILED: 'Login recusado',
  LOGIN_RATE_LIMITED: 'Login barrado por excesso de tentativas',
  TOTP_ENABLED: 'Ativou o app autenticador',
  TOTP_FAILED: 'Código do 2FA recusado',
  RECOVERY_CODE_USED: 'Entrou com código de recuperação',
  PASSWORD_CHANGED: 'Trocou a senha',
  PASSWORD_RESET_COMPLETED: 'Recuperou a senha',
  PASSWORD_RESET_FAILED: 'Recuperação de senha recusada',
  EMAIL_CONFIRMED: 'Confirmou o e-mail',
  HEALTH_DATA_VIEWED: 'Leu dado de saúde',
  ASSESSMENT_CREATED: 'Registrou avaliação física',
  ASSESSMENT_UPDATED: 'Alterou avaliação física',
  ASSESSMENT_DELETED: 'Excluiu avaliação física',
  PROTOCOL_UPDATED: 'Alterou protocolo ou anamnese',
  SUBSCRIPTION_STATUS_CHANGED: 'Assinatura mudou',
  AI_PACK_CREDITED: 'Pacote de IA creditado',
  RETENTION_PURGED: 'Limpeza dos prazos de guarda',
  DATA_REQUEST_OPENED: 'Registrou pedido do titular',
  DATA_REQUEST_COMPLETED: 'Concluiu pedido do titular',
};

export const ACTION_CATEGORY: Record<AuditAction, AuditCategory> = {
  COMPANY_CREATED: 'ADMIN',
  PERSONAL_CREATED: 'ADMIN',
  USER_STATUS_CHANGED: 'ADMIN',
  USER_SOFT_DELETED: 'ADMIN',
  USER_DELETED_BY_ADMIN: 'ADMIN',
  PASSWORD_REGENERATED: 'ADMIN',
  SECOND_FACTOR_RESET: 'ADMIN',
  UNIT_CREATED: 'ADMIN',
  UNIT_UPDATED: 'ADMIN',
  UNIT_STATUS_CHANGED: 'ADMIN',
  TRAINER_INVITED_TO_COMPANY: 'ADMIN',
  TRAINER_REMOVED_FROM_COMPANY: 'ADMIN',
  COMPANY_INVITE_ACCEPTED: 'ADMIN',
  COMPANY_INVITE_DECLINED: 'ADMIN',
  TRAINER_LEFT_COMPANY: 'ADMIN',
  STUDENT_LINKED_BY_COMPANY: 'ADMIN',
  COMPANY_LINK_ENDED: 'ADMIN',
  ACCESS_LOGS_VIEWED: 'ADMIN',
  LOGIN_FAILED: 'SECURITY',
  LOGIN_RATE_LIMITED: 'SECURITY',
  TOTP_ENABLED: 'SECURITY',
  TOTP_FAILED: 'SECURITY',
  RECOVERY_CODE_USED: 'SECURITY',
  PASSWORD_CHANGED: 'SECURITY',
  PASSWORD_RESET_COMPLETED: 'SECURITY',
  PASSWORD_RESET_FAILED: 'SECURITY',
  EMAIL_CONFIRMED: 'SECURITY',
  HEALTH_DATA_VIEWED: 'HEALTH',
  ASSESSMENT_CREATED: 'HEALTH',
  ASSESSMENT_UPDATED: 'HEALTH',
  ASSESSMENT_DELETED: 'HEALTH',
  PROTOCOL_UPDATED: 'HEALTH',
  SUBSCRIPTION_STATUS_CHANGED: 'BILLING',
  AI_PACK_CREDITED: 'BILLING',
  RETENTION_PURGED: 'LGPD',
  DATA_REQUEST_OPENED: 'LGPD',
  DATA_REQUEST_COMPLETED: 'LGPD',
};

/** Ações de uma categoria, na ordem acima (filtro de ação das páginas). */
export const actionsOf = (category: AuditCategory): AuditAction[] =>
  (Object.keys(ACTION_CATEGORY) as AuditAction[]).filter((a) => ACTION_CATEGORY[a] === category);

export const ROLE_LABEL: Record<string, string> = {
  ALUNO: 'Aluno',
  PERSONAL: 'Personal',
  EMPRESA: 'Filial',
  DONO: 'Dono',
  ROOT: 'Root',
};

export const REQUEST_KIND_LABEL: Record<DataRequestKind, string> = {
  ACESSO: 'Acesso aos dados',
  CORRECAO: 'Correção de dados',
  ELIMINACAO: 'Eliminação dos dados',
  REVOGACAO: 'Revogação do consentimento',
  INFORMACAO: 'Informação sobre o tratamento',
};

const USER_STATUS: Record<string, string> = { ATIVO: 'ativo', SUSPENSO: 'suspenso', BLOQUEADO: 'bloqueado' };
const SUBSCRIPTION_STATUS: Record<string, string> = {
  TRIAL: 'teste grátis',
  PENDENTE: 'pendente',
  ATIVA: 'ativa',
  ATRASADA: 'atrasada',
  CANCELADA: 'cancelada',
};
const PLAN: Record<string, string> = { FREE: 'Grátis', BASE: 'Base', PRO: 'Pro', BUSINESS: 'Business' };
const HEALTH_KIND: Record<string, string> = {
  ASSESSMENTS: 'Avaliações físicas',
  PROTOCOL: 'Protocolo e anamnese',
  AI_CONTEXT: 'Anamnese (contexto da IA)',
};
const CAUSE: Record<string, string> = {
  BadCredentialsException: 'senha errada',
  DisabledException: 'conta suspensa ou bloqueada',
  LockedException: 'conta bloqueada',
  CODE: 'código errado',
  RECOVERY_CODE: 'código de recuperação errado',
  TOO_MANY_ATTEMPTS: 'tentativas demais',
  UNKNOWN_ACCOUNT: 'e-mail sem conta',
};
const SOURCE: Record<string, string> = { TRAINER: 'pelo personal', WEBHOOK: 'pelo gateway', DEMO: 'modo demonstração' };

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/** Nome de quem fez. Sem autor: gateway, sistema ou tentativa sem login. */
export function actorLabel(e: AuditEvent): string {
  if (e.actor) return partyLabel(e.actor);
  if (e.details?.source === 'WEBHOOK') return 'Gateway de pagamento';
  if (e.category === 'SECURITY') return 'Sem login';
  return 'Sistema';
}

/** Alvo do evento; vínculo não tem nome, e-mail sem conta só tem o pseudônimo. */
export function targetLabel(e: AuditEvent): string {
  if (e.targetType === 'LINK') return 'Vínculo aluno–personal';
  if (e.target) return partyLabel(e.target);
  if (e.details?.emailHash) return 'E-mail sem conta';
  return '';
}

export function partyLabel(p: AuditParty | null, deletedLabel = '[conta excluída]'): string {
  if (!p) return '';
  return p.deleted ? deletedLabel : (p.name ?? '');
}

/** Resumo curto dos detalhes (de → para, tipo de dado, causa, contagens); vazio quando não há. */
export function eventDetail(e: AuditEvent): string {
  const d = e.details ?? {};
  switch (e.action) {
    case 'USER_STATUS_CHANGED':
    case 'USER_SOFT_DELETED':
      return `${USER_STATUS[str(d.from)] ?? str(d.from)} → ${USER_STATUS[str(d.to)] ?? str(d.to)}`;
    case 'UNIT_STATUS_CHANGED':
      return d.to ? 'Reativada' : 'Suspensa';
    case 'USER_DELETED_BY_ADMIN':
      return `${ROLE_LABEL[str(d.role)] ?? str(d.role)}${d.blocked ? ' · estava bloqueada' : ''}`;
    case 'TRAINER_REMOVED_FROM_COMPANY':
      return d.pendingInvite ? 'Convite cancelado' : '';
    case 'HEALTH_DATA_VIEWED':
      return HEALTH_KIND[str(d.kind)] ?? str(d.kind);
    case 'PROTOCOL_UPDATED':
      return d.protocol && d.anamnesis ? 'Protocolo e anamnese' : d.protocol ? 'Protocolo' : d.anamnesis ? 'Anamnese' : '';
    case 'LOGIN_FAILED':
    case 'TOTP_FAILED':
    case 'PASSWORD_RESET_FAILED':
      return CAUSE[str(d.cause)] ?? str(d.cause);
    case 'SUBSCRIPTION_STATUS_CHANGED': {
      const status =
        d.from === d.to
          ? `plano ${PLAN[str(d.fromPlan)] ?? '—'} → ${PLAN[str(d.plan)] ?? '—'}`
          : `${SUBSCRIPTION_STATUS[str(d.from)] ?? str(d.from)} → ${SUBSCRIPTION_STATUS[str(d.to)] ?? str(d.to)}`;
      const plan = d.from !== d.to && d.plan ? ` · ${PLAN[str(d.plan)] ?? str(d.plan)}` : '';
      return `${status}${plan} · ${SOURCE[str(d.source)] ?? str(d.source)}`;
    }
    case 'AI_PACK_CREDITED':
      return `+${str(d.credits)} gerações · ${SOURCE[str(d.source)] ?? str(d.source)}`;
    case 'ACCESS_LOGS_VIEWED':
      return `${str(d.rows)} registro(s)${d.deletedAccount ? ' · conta excluída' : ''}`;
    case 'RETENTION_PURGED': {
      const total = Object.values(d).reduce<number>((sum, n) => sum + (Number(n) || 0), 0);
      return `${total} registro(s) expurgado(s)`;
    }
    case 'DATA_REQUEST_OPENED':
    case 'DATA_REQUEST_COMPLETED':
      return REQUEST_KIND_LABEL[d.kind as DataRequestKind] ?? str(d.kind);
    default:
      return '';
  }
}
