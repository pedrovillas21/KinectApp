import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, KeyRound, Pencil, Plus, Power, ShieldCheck, ShieldOff } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createUnit,
  getNetwork,
  listUnits,
  regenerateUnitPassword,
  resetUnitSecondFactor,
  setUnitActive,
  updateUnit,
} from '../../services/donoService';
import { formatCnpj, slugify } from '../../utils/company';
import type { Network, Unit, UnitInput } from '../../types';

const EMPTY: UnitInput = { nome: '', cnpj: '', address: '', phone: '', responsibleName: '', responsibleEmail: '', usuario: '' };

const errorText = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  return typeof data === 'string' && data ? data : fallback;
};

/**
 * Filiais da rede: o dono cadastra cada uma (CNPJ e responsável) e o sistema gera o acesso
 * dela (usuário rede.filial + senha enviada ao e-mail do responsável).
 */
export default function UnitsPage() {
  const navigate = useNavigate();
  const [network, setNetwork] = useState<Network | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Unit | 'new' | null>(null);
  const [form, setForm] = useState<UnitInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [n, u] = await Promise.all([getNetwork(), listUnits()]);
      setNetwork(n);
      setUnits(u);
    } catch {
      setError('Não foi possível carregar as filiais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };

  const openEdit = (u: Unit) => {
    setForm({
      nome: u.nome,
      cnpj: formatCnpj(u.cnpj),
      address: u.address ?? '',
      phone: u.phone ?? '',
      responsibleName: u.responsibleName,
      responsibleEmail: u.responsibleEmail,
    });
    setEditing(u);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !editing) return;
    setSubmitting(true);
    try {
      if (editing === 'new') {
        const created = await createUnit({ ...form, usuario: (form.usuario ?? '').replace(/-+$/, '') });
        toast.success(`Filial criada. Usuário ${created.username}; a senha foi enviada para ${created.responsibleEmail}.`);
      } else {
        await updateUnit(editing.id, form);
        toast.success('Filial atualizada.');
      }
      setEditing(null);
      await load();
    } catch (err: unknown) {
      toast.error(errorText(err, 'Não foi possível salvar a filial.'));
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (u: Unit, action: () => Promise<unknown>, success: string) => {
    setBusyId(u.id);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (err: unknown) {
      toast.error(errorText(err, 'Não foi possível concluir.'));
    } finally {
      setBusyId(null);
    }
  };

  const set = (key: keyof UnitInput, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Filiais"
        subtitle={network ? `Unidades da rede ${network.nome}` : 'Unidades da rede'}
        icon={<Building2 className="w-5 h-5" />}
        actions={
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Nova filial
          </Button>
        }
      />

      <div className="max-w-6xl w-full mx-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : units.length === 0 ? (
          <EmptyCard>Nenhuma filial cadastrada ainda. Use "Nova filial" para começar.</EmptyCard>
        ) : (
          <div className="rounded-2xl border border-k-ghost overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filial</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((u) => (
                  <TableRow key={u.id} className="cursor-pointer" onClick={() => navigate(`/dono/filiais/${u.id}`)}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{u.nome}</span>
                        <span className="text-[11px] text-k-text-muted">{formatCnpj(u.cnpj)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{u.responsibleName}</span>
                        <span className="text-[11px] text-k-text-muted">{u.responsibleEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.username ?? '—'}</TableCell>
                    <TableCell className="text-xs text-k-text-dim">
                      {u.personais} personais · {u.alunosAtivos} alunos
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={u.active ? 'text-k-success' : 'text-k-alert'}>
                          {u.active ? 'Ativa' : 'Suspensa'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-k-text-muted">
                          {u.secondFactorEnabled ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                          {u.secondFactorEnabled ? 'App autenticador ativo' : 'Sem app autenticador'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Editar dados" aria-label="Editar filial">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Gerar nova senha (vai ao e-mail do responsável)"
                          aria-label="Gerar nova senha"
                          disabled={busyId === u.id}
                          onClick={() =>
                            void act(u, () => regenerateUnitPassword(u.id), `Nova senha enviada para ${u.responsibleEmail}.`)
                          }
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Redefinir o app autenticador (celular perdido)"
                          aria-label="Redefinir app autenticador"
                          disabled={busyId === u.id || !u.secondFactorEnabled}
                          onClick={() =>
                            void act(
                              u,
                              () => resetUnitSecondFactor(u.id),
                              'App autenticador redefinido. No próximo login a filial cadastra o app de novo.',
                            )
                          }
                        >
                          <ShieldOff className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={u.active ? 'Suspender a filial (encerra o acesso)' : 'Reativar a filial'}
                          aria-label={u.active ? 'Suspender filial' : 'Reativar filial'}
                          disabled={busyId === u.id}
                          onClick={() =>
                            void act(
                              u,
                              () => setUnitActive(u.id, !u.active),
                              u.active ? 'Filial suspensa: o acesso dela foi encerrado.' : 'Filial reativada.',
                            )
                          }
                          className={u.active ? 'hover:text-k-error' : ''}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing === 'new' ? 'Nova filial' : 'Editar filial'}</DialogTitle>
              <DialogDescription>
                {editing === 'new'
                  ? 'O sistema gera uma senha forte e envia o acesso ao e-mail do responsável. No primeiro login a filial cadastra o app autenticador.'
                  : 'O usuário da filial não muda.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Field id="nome" label="Nome da filial">
                <Input id="nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} required autoFocus />
              </Field>
              <Field id="cnpj" label="CNPJ">
                <Input
                  id="cnpj"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) => set('cnpj', formatCnpj(e.target.value))}
                  required
                />
              </Field>
              <Field id="address" label="Endereço">
                <Input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} />
              </Field>
              <Field id="phone" label="Telefone">
                <Input id="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field id="responsibleName" label="Responsável pela filial">
                <Input
                  id="responsibleName"
                  value={form.responsibleName}
                  onChange={(e) => set('responsibleName', e.target.value)}
                  required
                />
              </Field>
              <Field id="responsibleEmail" label="E-mail que recebe o acesso">
                <Input
                  id="responsibleEmail"
                  type="email"
                  value={form.responsibleEmail}
                  onChange={(e) => set('responsibleEmail', e.target.value)}
                  required
                />
              </Field>
              {editing === 'new' && (
                <Field id="usuario" label="Usuário da filial">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 whitespace-nowrap font-mono text-sm text-k-text-muted">
                      {network?.slug ?? 'rede'}.
                    </span>
                    <Input
                      id="usuario"
                      placeholder="centro"
                      value={form.usuario}
                      onChange={(e) => set('usuario', slugify(e.target.value))}
                      required
                    />
                  </div>
                </Field>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando…' : editing === 'new' ? 'Criar e enviar acesso' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
