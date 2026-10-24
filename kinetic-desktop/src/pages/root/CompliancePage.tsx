import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, MoreHorizontal, Ban, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
import StatusBadge from '../../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { deleteUser, listUsers, setUserStatus } from '../../services/rootService';
import type { UserAdmin, UserStatus } from '../../types';

const ROLE_FILTER = 'all';
type RoleFilter = typeof ROLE_FILTER | UserAdmin['role'];

export default function CompliancePage() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<RoleFilter>(ROLE_FILTER);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<UserAdmin | null>(null);

  const load = async (roleFilter: RoleFilter) => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers(roleFilter === ROLE_FILTER ? undefined : roleFilter));
    } catch {
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const changeStatus = async (user: UserAdmin, status: UserStatus) => {
    setBusyId(user.id);
    try {
      const updated = await setUserStatus(user.id, status);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(`Status de ${user.nome} atualizado.`);
    } catch {
      toast.error('Não foi possível atualizar o status.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const user = toDelete;
    setBusyId(user.id);
    try {
      await deleteUser(user.id);
      toast.success(`Conta de ${user.nome} excluída.`);
      setToDelete(null);
      await load(role);
    } catch {
      toast.error('Não foi possível excluir a conta.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Usuários & Compliance"
        subtitle="Bloquear, suspender, reativar ou excluir contas"
        icon={<ShieldCheck className="w-5 h-5" />}
        actions={
          <Select value={role} onValueChange={(v) => setRole(v as RoleFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLE_FILTER}>Todos os papéis</SelectItem>
              <SelectItem value="ALUNO">Alunos</SelectItem>
              <SelectItem value="PERSONAL">Personais</SelectItem>
              <SelectItem value="EMPRESA">Empresas</SelectItem>
              <SelectItem value="ROOT">Root</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="max-w-6xl w-full mx-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : users.length === 0 ? (
          <EmptyCard>Nenhum usuário para este filtro.</EmptyCard>
        ) : (
          <div className="rounded-2xl border border-k-ghost overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{u.nome}</span>
                        <span className="text-[11px] text-k-text-muted">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-k-text-dim border-k-ghost">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role === 'ROOT' ? (
                        <span className="text-[11px] text-k-text-muted">protegido</span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={busyId === u.id}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {u.status !== 'ATIVO' && (
                              <DropdownMenuItem onClick={() => void changeStatus(u, 'ATIVO')}>
                                <PlayCircle className="w-4 h-4" /> Reativar
                              </DropdownMenuItem>
                            )}
                            {u.status !== 'SUSPENSO' && (
                              <DropdownMenuItem onClick={() => void changeStatus(u, 'SUSPENSO')}>
                                <PauseCircle className="w-4 h-4" /> Suspender
                              </DropdownMenuItem>
                            )}
                            {u.status !== 'BLOQUEADO' && (
                              <DropdownMenuItem onClick={() => void changeStatus(u, 'BLOQUEADO')}>
                                <Ban className="w-4 h-4" /> Bloquear
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem variant="destructive" onClick={() => setToDelete(u)}>
                              <Trash2 className="w-4 h-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta</DialogTitle>
            <DialogDescription>
              A conta de <strong>{toDelete?.nome}</strong> será excluída (soft-delete) e as sessões
              revogadas. Esta ação bloqueia o acesso ao sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busyId === toDelete?.id}
              onClick={() => void confirmDelete()}
            >
              {busyId === toDelete?.id ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
