import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { UserCog, Plus } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createPersonal, listCompanies, listPersonais } from '../../services/rootService';
import type { Company, UserAdmin } from '../../types';

const NO_COMPANY = 'none';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function PersonaisPage() {
  const [personais, setPersonais] = useState<UserAdmin[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', companyId: NO_COMPANY });

  const companyName = useMemo(() => {
    const map = new Map(companies.map((c) => [c.id, c.nome]));
    return (id: string | null) => (id ? (map.get(id) ?? '—') : '—');
  }, [companies]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, page] = await Promise.all([listPersonais(), listCompanies()]);
      setPersonais(list);
      setCompanies(page.content);
    } catch {
      setError('Não foi possível carregar os personais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => setForm({ nome: '', email: '', senha: '', companyId: NO_COMPANY });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await createPersonal({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        companyId: form.companyId === NO_COMPANY ? null : form.companyId,
      });
      toast.success(`Personal "${created.nome}" provisionado.`);
      setOpen(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) toast.error('Já existe um usuário com este e-mail.');
      else if (status === 404) toast.error('Empresa não encontrada.');
      else if (status === 400) toast.error('Dados inválidos. Revise os campos.');
      else toast.error('Não foi possível provisionar o personal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Personais"
        subtitle="Lista global e provisionamento de personal trainers"
        icon={<UserCog className="w-5 h-5" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" /> Novo Personal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Novo Personal</DialogTitle>
                  <DialogDescription>
                    Provisiona um personal com senha inicial, opcionalmente já vinculado a uma empresa.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="senha">Senha inicial</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={form.senha}
                      onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="companyId">Empresa (opcional)</Label>
                    <Select
                      value={form.companyId}
                      onValueChange={(v) => setForm((f) => ({ ...f, companyId: v }))}
                    >
                      <SelectTrigger id="companyId">
                        <SelectValue placeholder="Sem empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_COMPANY}>Sem empresa (particular)</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Provisionando…' : 'Provisionar'}
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : personais.length === 0 ? (
          <EmptyCard>Nenhum personal provisionado ainda.</EmptyCard>
        ) : (
          <div className="rounded-2xl border border-k-ghost overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personais.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{p.nome}</TableCell>
                    <TableCell className="text-k-text-dim">{p.email}</TableCell>
                    <TableCell className="text-k-text-dim">{companyName(p.companyId)}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-k-text-dim">{formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
