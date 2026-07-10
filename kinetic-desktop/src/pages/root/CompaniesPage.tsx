import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Building2, Plus } from 'lucide-react';
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
import { createCompany, listCompanies } from '../../services/rootService';
import type { Company } from '../../types';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ companyName: '', ownerName: '', ownerEmail: '', ownerPassword: '' });

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

  const resetForm = () => setForm({ companyName: '', ownerName: '', ownerEmail: '', ownerPassword: '' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await createCompany(form);
      toast.success(`Empresa "${created.nome}" criada.`);
      setOpen(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        toast.error('Já existe um usuário com este e-mail.');
      } else if (status === 400) {
        toast.error('Dados inválidos. Revise os campos.');
      } else {
        toast.error('Não foi possível criar a empresa.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Empresas"
        subtitle="Provisionamento e gestão de academias/estúdios"
        icon={<Building2 className="w-5 h-5" />}
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
                    Cria a empresa e o usuário responsável (papel EMPRESA), que acessa o painel com a senha inicial.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="companyName">Nome da empresa</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ownerName">Responsável</Label>
                    <Input
                      id="ownerName"
                      value={form.ownerName}
                      onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ownerEmail">E-mail do responsável</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={form.ownerEmail}
                      onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ownerPassword">Senha inicial</Label>
                    <Input
                      id="ownerPassword"
                      type="password"
                      value={form.ownerPassword}
                      onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Criando…' : 'Criar empresa'}
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
        ) : companies.length === 0 ? (
          <EmptyCard>Nenhuma empresa provisionada ainda. Use "Nova Empresa" para começar.</EmptyCard>
        ) : (
          <div className="rounded-2xl border border-k-ghost overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold">{c.nome}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{c.ownerName ?? '—'}</span>
                        <span className="text-[11px] text-k-text-muted">{c.ownerEmail ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{c.ownerStatus ? <StatusBadge status={c.ownerStatus} /> : '—'}</TableCell>
                    <TableCell className="text-k-text-dim">{formatDate(c.createdAt)}</TableCell>
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
