import { Select as SelectPrimitive } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export interface KineticSelectOption {
  value: string;
  label: string;
  /** Cor (CSS) de um marcador antes do rótulo, ex.: a cor da seção do exercício. */
  dot?: string;
  /** Opção "vazia" (sem grupo, nível do aluno…): rótulo apagado no campo e na lista. */
  muted?: boolean;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: KineticSelectOption[];
  className?: string;
}

// O Radix não aceita item com value "": a opção vazia circula com este marcador.
const EMPTY = '__vazio__';
const toRadix = (v: string) => (v === '' ? EMPTY : v);

/**
 * Dropdown no visual do painel. O <select> nativo abre uma lista desenhada pelo sistema
 * operacional, que o CSS não alcança; o Radix mantém teclado, busca por digitação e
 * leitor de tela, e a lista inteira fica estilizável.
 */
export default function KineticSelect({ id, value, onChange, options, className }: Props) {
  const current = options.find((o) => o.value === value);

  return (
    <SelectPrimitive.Root value={toRadix(value)} onValueChange={(v) => onChange(v === EMPTY ? '' : v)}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'group flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-k-bg px-3 text-left text-sm outline-none transition-[border-color,box-shadow] hover:border-white/20 focus-visible:border-k-primary focus-visible:shadow-[0_0_0_3px_rgba(0,229,255,0.12)] data-[state=open]:border-k-primary data-[state=open]:shadow-[0_0_0_3px_rgba(0,229,255,0.12)]',
          current?.muted && 'text-k-text-muted',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {current?.dot && <Dot color={current.dot} />}
          <span className="truncate">
            <SelectPrimitive.Value />
          </span>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-k-text-muted transition-[rotate,color] duration-300 group-hover:text-k-text-dim group-data-[state=open]:rotate-180 group-data-[state=open]:text-k-primary" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] overflow-y-auto rounded-[14px] border border-white/10 bg-k-surface2 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.85)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={toRadix(o.value)}
                value={toRadix(o.value)}
                className={cn(
                  'relative flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[9px] pl-2.5 pr-9 text-[13.5px] text-k-text-soft outline-none transition-colors data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-k-text data-[state=checked]:font-semibold data-[state=checked]:text-k-primary',
                  o.muted && 'text-k-text-muted',
                )}
              >
                {o.dot && <Dot color={o.dot} />}
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 0 3px ${color}26` }}
    />
  );
}
