import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { UserCog, Plus, Link2Off } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
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
      toast.success(`${linked.nome} vinculado à empresa.`);
      setOpen(false);
      setEmail('');
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) toast.error('Nenhum personal cadastrado com este e-mail.');
      else if (status === 400) toast.error('O e-mail informado não pertence a um personal.');
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
        icon={<UserCog className="w-5 h-5" />}
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
                    Informe o e-mail de um personal já cadastrado para vinculá-lo como funcionário da empresa.
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
                    {submitting ? 'Vinculando…' : 'Vincular'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
        ) : funcionarios.length === 0 ? (
          <EmptyCard>Nenhum personal vinculado ainda. Use "Vincular Personal" para começar.</EmptyCard>
        ) : (
          <div className="rounded-2xl border border-k-ghost overflow-hidden overflow-x-auto">
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
                    <TableCell className="font-bold">{f.nome}</TableCell>
                    <TableCell className="text-k-text-dim">{f.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={f.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === f.id}
                        onClick={() => setToRemove(f)}
                        className="text-k-text-dim hover:text-k-error"
                      >
                        <Link2Off className="w-4 h-4" /> Desvincular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={toRemove !== null} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular funcionário</DialogTitle>
            <DialogDescription>
              <strong>{toRemove?.nome}</strong> deixará de ser funcionário da empresa. Os vínculos com alunos
              existentes não são encerrados automaticamente.
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
