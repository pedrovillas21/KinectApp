import api from './api';
import type {
  AccessLogResult,
  AuditAction,
  AuditAi,
  AuditCategory,
  AuditEvent,
  AuditLgpd,
  BillingGatewayInfo,
  DataRequest,
  DataRequestKind,
  DataRequestStatus,
  Page,
} from '../types';

/** Auditoria do ROOT (/api/root/audit/...). Só leitura, fora os pedidos de titulares. */

/** Período em "AAAA-MM-DD" (dias do calendário do Brasil); vazio = sem limite. */
export interface PeriodParams {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface EventParams extends PeriodParams {
  category?: AuditCategory;
  action?: AuditAction;
  actorId?: string;
  targetId?: string;
  companyId?: string;
}

/** Tira os vazios: o backend recusa data em branco. */
const clean = <T extends object>(params: T) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));

export const listAuditEvents = async (params: EventParams): Promise<Page<AuditEvent>> => {
  const res = await api.get<Page<AuditEvent>>('/root/audit/events', { params: clean(params) });
  return res.data;
};

/** E-mail no corpo, nunca na URL. O motivo é obrigatório e a consulta vira evento. */
export const searchAccessLogs = async (body: {
  email: string;
  from: string;
  to: string;
  reason: string;
}): Promise<AccessLogResult> => {
  const res = await api.post<AccessLogResult>('/root/audit/access-logs/search', body);
  return res.data;
};

export const getAuditLgpd = async (params: PeriodParams): Promise<AuditLgpd> => {
  const res = await api.get<AuditLgpd>('/root/audit/lgpd', { params: clean(params) });
  return res.data;
};

export const listDataRequests = async (
  params: { status?: DataRequestStatus; page?: number; size?: number } = {},
): Promise<Page<DataRequest>> => {
  const res = await api.get<Page<DataRequest>>('/root/audit/requests', { params: clean(params) });
  return res.data;
};

export const openDataRequest = async (body: {
  kind: DataRequestKind;
  email: string;
  receivedAt?: string;
  note?: string;
}): Promise<DataRequest> => {
  const res = await api.post<DataRequest>('/root/audit/requests', clean(body));
  return res.data;
};

export const completeDataRequest = async (id: string, note?: string): Promise<DataRequest> => {
  const res = await api.patch<DataRequest>(`/root/audit/requests/${id}`, clean({ note }));
  return res.data;
};

export const getAuditAi = async (params: PeriodParams): Promise<AuditAi> => {
  const res = await api.get<AuditAi>('/root/audit/ai', { params: clean(params) });
  return res.data;
};

export const getBillingGateway = async (): Promise<BillingGatewayInfo> => {
  const res = await api.get<BillingGatewayInfo>('/root/audit/billing-gateway');
  return res.data;
};
