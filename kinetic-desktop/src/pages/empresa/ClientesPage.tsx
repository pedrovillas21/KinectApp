import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, Link2Off } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
import { MobileList, MobileListItem } from '../../components/MobileList';
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
import { desvincularAluno, listClientes, vincularAluno } from '../../services/empresaService';
import type { EmpresaStudentLink } from '../../types';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function ClientesPage() {
  const [clientes, setClientes] = useState<EmpresaStudentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ studentEmail: '', trainerEmail: '' });
  const [toRemove, setToRemove] = useState<EmpresaStudentLink | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setClientes(await listClientes());
    } catch {
      setError('Não foi possível carregar os clientes.');
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
      await vincularAluno(form.studentEmail.trim(), form.trainerEmail.trim());
      toast.success('Convite enviado. O aluno aparece aqui quando aceitar no app.');
      setOpen(false);
      setForm({ studentEmail: '', trainerEmail: '' });
      await load();
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: unknown } }).response;
      const status = res?.status;
      // 400/409: a mensagem do servidor orienta (aluno indisponível tem resposta única).
      if ((status === 400 || status === 409) && typeof res?.data === 'string' && res.data) toast.error(res.data);
      else if (status === 404) toast.error('Personal não encontrado entre os funcionários da filial.');
      else toast.error('Não foi possível vincular o aluno.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    const link = toRemove;
    setBusyId(link.linkId);
    try {
      await desvincularAluno(link.linkId);
      toast.success(`${link.student.nome} desvinculado.`);
      setToRemove(null);
      await load();
    } catch {
      toast.error('Não foi possível desvincular o aluno.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Clientes"
        subtitle="Alunos com vínculo corporativo ativo"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" /> Vincular Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleVincular}>
                <DialogHeader>
                  <DialogTitle>Vincular Aluno</DialogTitle>
                  <DialogDescription>
                    Cria um vínculo corporativo entre um aluno e um personal da sua empresa.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="studentEmail">E-mail do aluno</Label>
                    <Input
                      id="studentEmail"
                      type="email"
                      value={form.studentEmail}
                      onChange={(e) => setForm((f) => ({ ...f, studentEmail: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="trainerEmail">E-mail do personal (funcionário)</Label>
                    <Input
                      id="trainerEmail"
                      type="email"
                      value={form.trainerEmail}
                      onChange={(e) => setForm((f) => ({ ...f, trainerEmail: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={submitting || !form.studentEmail.trim() || !form.trainerEmail.trim()}
                  >
                    {submitting ? 'Vinculando…' : 'Vincular'}
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
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : clientes.length === 0 ? (
          <EmptyCard>Nenhum aluno vinculado ainda. Use "Vincular Aluno" para começar.</EmptyCard>
        ) : (
          <>
            <MobileList>
              {clientes.map((link) => (
                <MobileListItem
                  key={link.linkId}
                  leading={<Avatar name={link.student.nome} avatarUrl={link.student.avatarUrl} size={40} />}
                  title={link.student.nome}
                  subtitle={`Personal: ${link.trainer.nome}`}
                  meta={<span>Vinculado em {formatDate(link.createdAt)}</span>}
                  actionsLabel={`Ações de ${link.student.nome}`}
                  actions={[
                    {
                      label: 'Desvincular',
                      icon: Link2Off,
                      destructive: true,
                      disabled: busyId === link.linkId,
                      onClick: () => setToRemove(link),
                    },
                  ]}
                />
              ))}
            </MobileList>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto max-md:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Personal</TableHead>
                    <TableHead>Vinculado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((link) => (
                    <TableRow key={link.linkId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={link.student.nome} avatarUrl={link.student.avatarUrl} size={36} />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{link.student.nome}</span>
                            <span className="text-[11px] text-k-text-muted">{link.student.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-k-text-dim">{link.trainer.nome}</TableCell>
                      <TableCell className="text-k-text-dim">{formatDate(link.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === link.linkId}
                          onClick={() => setToRemove(link)}
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
          </>
        )}
      </div>

      <Dialog open={toRemove !== null} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular aluno</DialogTitle>
            <DialogDescription>
              O vínculo corporativo de <strong>{toRemove?.student.nome}</strong> será encerrado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToRemove(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busyId === toRemove?.linkId}
              onClick={() => void confirmRemove()}
            >
              {busyId === toRemove?.linkId ? 'Desvinculando…' : 'Desvincular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
