import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
import { MobileList, MobileListItem } from '../../components/MobileList';
import StatusBadge from '../../components/StatusBadge';
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
import { isValidCellPhone, maskCellPhone } from '../../utils/whatsapp';
import { errorMessage } from '../../utils/errors';
import { dateLabel } from '../../utils/dates';

const NO_COMPANY = 'none';

export default function PersonaisPage() {
  const [personais, setPersonais] = useState<UserAdmin[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', phone: '', companyId: NO_COMPANY });

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

  const resetForm = () => setForm({ nome: '', email: '', senha: '', phone: '', companyId: NO_COMPANY });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!isValidCellPhone(form.phone)) {
      toast.error('Celular inválido. Informe DDD + número, ex.: (11) 98765-4321.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createPersonal({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        phone: form.phone,
        companyId: form.companyId === NO_COMPANY ? null : form.companyId,
      });
      toast.success(`Personal "${created.nome}" provisionado.`);
      setOpen(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        // E-mail ou celular já usados: o backend diz qual.
        toast.error(errorMessage(err, 'Já existe um usuário com estes dados.'));
      }
      else if (status === 404) toast.error('Empresa não encontrada.');
      else if (status === 400) {
        toast.error(errorMessage(err, 'Dados inválidos. Revise os campos.'));
      }
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
                    <Label htmlFor="phone">Celular (WhatsApp)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="(11) 98765-4321"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: maskCellPhone(e.target.value) }))}
                      required
                    />
                    {form.phone.length > 0 && !isValidCellPhone(form.phone) && (
                      <span className="text-xs text-k-error">Informe DDD + número, ex.: (11) 98765-4321.</span>
                    )}
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

      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-12 md:pb-16">
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
          <>
            <MobileList>
              {personais.map((p) => (
                <MobileListItem
                  key={p.id}
                  leading={<Avatar name={p.nome} size={40} />}
                  title={p.nome}
                  subtitle={p.email}
                  meta={
                    <>
                      <StatusBadge status={p.status} />
                      <span className="truncate">{p.companyId ? companyName(p.companyId) : 'Autônomo'}</span>
                    </>
                  }
                />
              ))}
            </MobileList>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto max-md:hidden">
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
                      <TableCell className="font-bold">
                        {p.nome}
                      </TableCell>
                      <TableCell className="text-k-text-dim">{p.email}</TableCell>
                      <TableCell className="text-k-text-dim">{companyName(p.companyId)}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-k-text-dim">{dateLabel(p.createdAt)}</TableCell>
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
