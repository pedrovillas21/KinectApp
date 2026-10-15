import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateMyPhone } from '../services/userService';
import { isValidCellPhone, maskCellPhone } from '../utils/whatsapp';

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Celular atual (DDD + número) ou null se ainda não cadastrado. */
  phone: string | null;
  onSaved: (phone: string) => void;
}

/** Cadastro/troca do celular do próprio usuário (atalho de WhatsApp com os alunos). */
export default function PhoneDialog({ open, onOpenChange, phone, onSaved }: PhoneDialogProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setValue(phone ? maskCellPhone(phone) : '');
  }, [open, phone]);

  const valid = isValidCellPhone(value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !valid) return;
    setSubmitting(true);
    try {
      const saved = await updateMyPhone(value);
      onSaved(saved);
      toast.success('Celular salvo.');
      onOpenChange(false);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } }).response?.data;
      toast.error(typeof data === 'string' && data ? data : 'Não foi possível salvar o celular.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Meu WhatsApp</DialogTitle>
            <DialogDescription>
              Seus alunos com vínculo ativo usam este número para falar com você pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 py-4">
            <Label htmlFor="my-phone">Celular com DDD</Label>
            <Input
              id="my-phone"
              type="tel"
              inputMode="numeric"
              placeholder="(11) 98765-4321"
              value={value}
              onChange={(e) => setValue(maskCellPhone(e.target.value))}
              required
              autoFocus
            />
            {value.length > 0 && !valid && (
              <span className="text-xs text-k-error">Informe DDD + número, ex.: (11) 98765-4321.</span>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting || !valid}>
              {submitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
