## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Mapeamento (rotas, fluxos, quem chama quem, auditorias de segurança): comece pelo grafo para achar os arquivos e as ligações, e depois confirme lendo o código. O grafo pode estar desatualizado ou ter arestas INFERRED erradas; o código é a fonte da verdade. Nenhuma conclusão (rota, achado de segurança, dependência) se apoia só no grafo.
- O inverso também vale: quando a busca no código achar algo, use o grafo para ver o que mais depende daquilo antes de mudar.
