/** Marca do Kinetic: as mesmas três barras ciano + "KINETIC" em itálico do app. */
export default function KineticLogo({ size = 20 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 text-k-text">
      <svg width={size * 1.3} height={size} viewBox="0 0 26 20" aria-hidden="true">
        <path d="M6 0h6L6 20H0z" fill="#00E5FF" />
        <path d="M15 0h6l-6 20H9z" fill="#00E5FF" opacity="0.55" />
        <path d="M24 0h2l-6 20h-2z" fill="#00E5FF" opacity="0.25" />
      </svg>
      <span className="font-sans font-extrabold italic leading-none tracking-[0.06em]" style={{ fontSize: size }}>
        KINETIC
      </span>
    </span>
  );
}
