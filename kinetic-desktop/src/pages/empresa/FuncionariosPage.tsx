import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, Link2Off } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
import { MobileList, MobileListItem } from '../../components/MobileList';
import StatusBadge, { TagChip } from '../../components/StatusBadge';
import Avatar from '../../components/Avatar';
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
import {
  desvincularFuncionario,
  listFuncionarios,
  vincularFuncionario,
} from '../../services/empresaService';
import type { UserAdmin } from '../../types';

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toRemove, setToRemove] = useState<UserAdmin | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setFuncionarios(await listFuncionarios());
    } catch {
      setError('Não foi possível carregar os funcionários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleVincular = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const linked = await vincularFuncionario(email.trim());
      toast.success(
        linked.companyId
          ? `${linked.nome} já é funcionário da empresa.`
          : `Convite enviado. ${linked.nome} entra na empresa quando aceitar em "Meu perfil".`,
      );
      setOpen(false);
      setEmail('');
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) toast.error('Nenhum personal cadastrado com este e-mail.');
      else if (status === 409) toast.error('Este personal já é de outra empresa ou tem convite pendente de outra.');
      else toast.error('Não foi possível vincular o personal.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    const f = toRemove;
    setBusyId(f.id);
    try {
      await desvincularFuncionario(f.id);
      toast.success(`${f.nome} desvinculado.`);
      setToRemove(null);
      await load();
    } catch {
      toast.error('Não foi possível desvincular.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Funcionários"
        subtitle="Personais vinculados à sua empresa"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" /> Vincular Personal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleVincular}>
                <DialogHeader>
                  <DialogTitle>Vincular Personal</DialogTitle>
                  <DialogDescription>
                    Informe o e-mail de um personal já cadastrado. Ele recebe o convite no painel e só vira
                    funcionário da empresa depois de aceitar.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1.5 py-4">
                  <Label htmlFor="email">E-mail do personal</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting || !email.trim()}>
                    {submitting ? 'Enviando…' : 'Enviar convite'}
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
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : funcionarios.length === 0 ? (
          <EmptyCard>Nenhum personal vinculado ainda. Use "Vincular Personal" para começar.</EmptyCard>
        ) : (
          <>
            <MobileList>
              {funcionarios.map((f) => (
                <MobileListItem
                  key={f.id}
                  leading={<Avatar name={f.nome} size={40} />}
                  title={f.nome}
                  subtitle={f.email}
                  meta={
                    f.companyId ? (
                      <StatusBadge status={f.status} />
                    ) : (
                      <TagChip>Convite pendente</TagChip>
                    )
                  }
                  actionsLabel={`Ações de ${f.nome}`}
                  actions={[
                    {
                      label: f.companyId ? 'Desvincular' : 'Cancelar convite',
                      icon: Link2Off,
                      destructive: true,
                      disabled: busyId === f.id,
                      onClick: () => setToRemove(f),
                    },
                  ]}
                />
              ))}
            </MobileList>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto max-md:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-bold">
                        {f.nome}
                      </TableCell>
                      <TableCell className="text-k-text-dim">{f.email}</TableCell>
                      <TableCell>
                        {f.companyId ? (
                          <StatusBadge status={f.status} />
                        ) : (
                          <span className="text-[12.5px] font-semibold text-k-text-muted">Convite pendente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === f.id}
                          onClick={() => setToRemove(f)}
                          className="text-k-text-dim hover:text-k-error"
                        >
                          <Link2Off className="w-4 h-4" /> {f.companyId ? 'Desvincular' : 'Cancelar convite'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={toRemove !== null} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular funcionário</DialogTitle>
            <DialogDescription>
              {toRemove?.companyId ? (
                <>
                  <strong>{toRemove?.nome}</strong> deixará de ser funcionário da empresa, e os alunos que a empresa
                  atribuiu a ele serão desvinculados.
                </>
              ) : (
                <>
                  O convite para <strong>{toRemove?.nome}</strong> será cancelado.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToRemove(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={busyId === toRemove?.id} onClick={() => void confirmRemove()}>
              {busyId === toRemove?.id ? 'Desvinculando…' : 'Desvincular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
