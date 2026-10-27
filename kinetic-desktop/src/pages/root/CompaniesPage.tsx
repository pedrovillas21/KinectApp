import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Building2, KeyRound, Plus, ShieldOff } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
import { ListIcon, MobileList, MobileListItem } from '../../components/MobileList';
import StatusBadge from '../../components/StatusBadge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createCompany, listCompanies, regeneratePassword, resetSecondFactor } from '../../services/rootService';
import { formatCnpj, slugify } from '../../utils/company';
import type { Company } from '../../types';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const EMPTY_FORM = { companyName: '', companyCnpj: '', slug: '', ownerName: '', ownerEmail: '' };

const errorText = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  return typeof data === 'string' && data ? data : fallback;
};

/** Redes de empresas: o ROOT cria a rede e o acesso do dono; as filiais são do dono. */
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listCompanies();
      setCompanies(page.content);
    } catch {
      setError('Não foi possível carregar as empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await createCompany({ ...form, slug: form.slug.replace(/-+$/, '') });
      toast.success(`Rede "${created.nome}" criada. O acesso foi enviado para ${created.ownerEmail}.`);
      setOpen(false);
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      await load();
    } catch (err: unknown) {
      toast.error(errorText(err, 'Não foi possível criar a empresa.'));
    } finally {
      setSubmitting(false);
    }
  };

  const ownerAction = async (c: Company, action: 'senha' | '2fa') => {
    if (!c.ownerId) return;
    setBusyId(c.ownerId);
    try {
      if (action === 'senha') {
        await regeneratePassword(c.ownerId);
        toast.success(`Nova senha enviada para ${c.ownerEmail}.`);
      } else {
        await resetSecondFactor(c.ownerId);
        toast.success('App autenticador redefinido. No próximo login o dono cadastra o app de novo.');
      }
    } catch (err: unknown) {
      toast.error(errorText(err, 'Não foi possível concluir.'));
    } finally {
      setBusyId(null);
    }
  };

  const set = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      // O apelido acompanha o nome até ser editado à mão.
      if (key === 'companyName' && !slugTouched) next.slug = slugify(value);
      return next;
    });

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Empresas"
        subtitle="Redes de academias/estúdios e o acesso de cada dono"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" /> Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Nova Empresa</DialogTitle>
                  <DialogDescription>
                    Cria a rede e o acesso do dono. A senha é gerada pelo sistema e enviada ao e-mail do dono; no
                    primeiro login ele cadastra o app autenticador e depois cadastra as filiais.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="companyName">Nome da empresa</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => set('companyName', e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="companyCnpj">CNPJ</Label>
                    <Input
                      id="companyCnpj"
                      inputMode="numeric"
                      placeholder="00.000.000/0000-00"
                      value={form.companyCnpj}
                      onChange={(e) => set('companyCnpj', formatCnpj(e.target.value))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="slug">Apelido da rede</Label>
                    <Input
                      id="slug"
                      placeholder="academiax"
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        set('slug', slugify(e.target.value));
                      }}
                      required
                    />
                    <p className="text-xs text-k-text-muted">
                      As filiais entram com <span className="font-mono">{form.slug || 'apelido'}.filial</span>. Não
                      muda depois.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ownerName">Nome do dono</Label>
                    <Input
                      id="ownerName"
                      value={form.ownerName}
                      onChange={(e) => set('ownerName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ownerEmail">E-mail do dono</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={form.ownerEmail}
                      onChange={(e) => set('ownerEmail', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Criando…' : 'Criar e enviar acesso'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-12 md:pb-16">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : companies.length === 0 ? (
          <EmptyCard>Nenhuma empresa provisionada ainda. Use "Nova Empresa" para começar.</EmptyCard>
        ) : (
          <>
            <MobileList>
              {companies.map((c) => (
                <MobileListItem
                  key={c.id}
                  leading={<ListIcon icon={Building2} />}
                  title={c.nome}
                  subtitle={c.ownerName ? `Dono: ${c.ownerName}` : 'Sem dono cadastrado'}
                  meta={
                    <>
                      {c.ownerStatus && <StatusBadge status={c.ownerStatus} />}
                      <span>
                        {c.units} {c.units === 1 ? 'filial' : 'filiais'}
                      </span>
                      <span>desde {formatDate(c.createdAt)}</span>
                    </>
                  }
                  actionsLabel={`Acesso do dono de ${c.nome}`}
                  actions={
                    c.ownerId
                      ? [
                          {
                            label: 'Nova senha do dono',
                            icon: KeyRound,
                            disabled: busyId === c.ownerId,
                            onClick: () => void ownerAction(c, 'senha'),
                          },
                          {
                            label: 'Redefinir 2FA do dono',
                            icon: ShieldOff,
                            disabled: busyId === c.ownerId,
                            onClick: () => void ownerAction(c, '2fa'),
                          },
                        ]
                      : undefined
                  }
                />
              ))}
            </MobileList>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto max-md:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Dono</TableHead>
                    <TableHead>Filiais</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="text-right">Acesso do dono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{c.nome}</span>
                          <span className="text-[11px] text-k-text-muted">
                            {c.cnpj ? formatCnpj(c.cnpj) : '—'} · {c.slug ?? '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{c.ownerName ?? '—'}</span>
                          <span className="text-[11px] text-k-text-muted">{c.ownerEmail ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-k-text-dim">{c.units}</TableCell>
                      <TableCell>{c.ownerStatus ? <StatusBadge status={c.ownerStatus} /> : '—'}</TableCell>
                      <TableCell className="text-k-text-dim">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {c.ownerId && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === c.ownerId}
                              onClick={() => void ownerAction(c, 'senha')}
                            >
                              <KeyRound className="w-4 h-4" /> Nova senha
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === c.ownerId}
                              onClick={() => void ownerAction(c, '2fa')}
                            >
                              <ShieldOff className="w-4 h-4" /> Redefinir 2FA
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
