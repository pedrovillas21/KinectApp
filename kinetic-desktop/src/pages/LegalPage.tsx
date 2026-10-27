import { Link } from 'react-router-dom';
import KineticLogo from '../components/KineticLogo';
import { LEGAL_UPDATED_AT, type LegalDocument } from '../legal/documents';

/** Termos de Uso e Política de Privacidade: públicos, abertos também pelo app e pelas lojas. */
export default function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    // O body não rola (theme.css, app-shell): a página rola dentro do próprio contêiner.
    <div className="h-dvh overflow-y-auto bg-k-bg px-4 py-10 text-k-text">
      <article className="mx-auto flex w-full max-w-[760px] flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-white/[0.07] pb-8">
          <KineticLogo size={18} />
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{doc.title}</h1>
            <p className="text-[15px] leading-relaxed text-k-text-soft">{doc.summary}</p>
            <p className="font-mono text-xs text-k-text-muted">Versão vigente: {LEGAL_UPDATED_AT}</p>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/termos" className="text-k-primary hover:underline">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="text-k-primary hover:underline">
              Política de Privacidade
            </Link>
          </nav>
        </header>

        {doc.sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="text-[15px] leading-relaxed text-k-text-soft">
                {p}
              </p>
            ))}
            {section.items && (
              <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed text-k-text-soft">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.table && (
              <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead className="border-b border-white/[0.07]">
                    <tr>
                      {section.table.head.map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 text-xs font-medium text-k-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {section.table.rows.map((row) => (
                      <tr key={row.join('|')}>
                        {row.map((cell, i) => (
                          <td key={i} className={`px-4 py-3 align-top ${i === 0 ? 'text-k-text' : 'text-k-text-soft'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
