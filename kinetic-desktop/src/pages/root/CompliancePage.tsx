import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, Ban, Lock, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { EmptyCard } from '../../components/stat-primitives';
import { MobileList, MobileListItem, type RowAction } from '../../components/MobileList';
import StatusBadge, { TagChip } from '../../components/StatusBadge';
import Avatar from '../../components/Avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import ConfirmDialog from '../../components/personal/ConfirmDialog';

const ROLE_FILTER = 'all';
type RoleFilter = typeof ROLE_FILTER | UserAdmin['role'];

const ROLE_LABEL: Record<UserAdmin['role'], string> = {
  ALUNO: 'Aluno',
  PERSONAL: 'Personal',
  EMPRESA: 'Empresa',
  DONO: 'Dono',
  ROOT: 'Root',
};

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

  /** Ações de compliance de um usuário (o menu da tabela e o dos cartões do celular). */
  const actionsFor = (u: UserAdmin): RowAction[] => [
    ...(u.status !== 'ATIVO'
      ? [{ label: 'Reativar', icon: PlayCircle, onClick: () => void changeStatus(u, 'ATIVO') }]
      : []),
    ...(u.status !== 'SUSPENSO'
      ? [{ label: 'Suspender', icon: PauseCircle, onClick: () => void changeStatus(u, 'SUSPENSO') }]
      : []),
    ...(u.status !== 'BLOQUEADO'
      ? [{ label: 'Bloquear', icon: Ban, onClick: () => void changeStatus(u, 'BLOQUEADO') }]
      : []),
    { label: 'Excluir', icon: Trash2, destructive: true, onClick: () => setToDelete(u) },
  ];

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
        wideActions
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

      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-12 md:pb-16">
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
          <>
            <MobileList>
              {users.map((u) => (
                <MobileListItem
                  key={u.id}
                  leading={<Avatar name={u.nome} size={40} />}
                  title={u.nome}
                  subtitle={u.email}
                  meta={
                    <>
                      <StatusBadge status={u.status} />
                      <TagChip>{ROLE_LABEL[u.role]}</TagChip>
                    </>
                  }
                  trailing={
                    u.role === 'ROOT' ? (
                      <TagChip>
                        <Lock className="h-3 w-3" /> Protegido
                      </TagChip>
                    ) : undefined
                  }
                  actionsLabel={`Ações de ${u.nome}`}
                  actions={u.role === 'ROOT' || busyId === u.id ? undefined : actionsFor(u)}
                />
              ))}
            </MobileList>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto max-md:hidden">
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
                        <TagChip>{ROLE_LABEL[u.role]}</TagChip>
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
                              {actionsFor(u).map(({ label, icon: Icon, onClick, destructive }) => (
                                <DropdownMenuItem
                                  key={label}
                                  variant={destructive ? 'destructive' : 'default'}
                                  onClick={onClick}
                                >
                                  {Icon && <Icon className="w-4 h-4" />} {label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir conta definitivamente"
        description={
          <>
            Use só a pedido do titular (LGPD). A conta de <strong>{toDelete?.nome}</strong> e os dados
            dela são apagados agora, sem volta; fica apenas o que a lei exige guardar. Se a conta estiver
            bloqueada, o mesmo e-mail e CPF não podem criar conta nova. Para só tirar o acesso, use Bloquear.
          </>
        }
        confirmLabel="Excluir definitivamente"
        destructive
        busy={busyId === toDelete?.id}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
