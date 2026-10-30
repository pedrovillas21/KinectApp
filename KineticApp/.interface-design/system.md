# Kinetic — sistema de interface (app mobile)

Fonte de verdade dos tokens: `src/theme/kinetic.ts`. Componentes base: `src/components/ui/*`.
Este arquivo registra as decisões; os valores vivem no código. Antes de criar UI, use o que já existe aqui.

## Direção

- **Quem:** aluno de academia, celular na mão entre séries ou logo após o treino; também gente mais velha
  com vista cansada (por isso a escala de texto).
- **Sensação:** escuro e focado, como a academia com luz baixa e o display de uma esteira. Pouca cor;
  o ciano é o "LED" que marca o que importa (ação, seleção, progresso).
- **Assinatura:** números de treino (volume, tempo, carga) em Geist Mono — o "placar" do treino.
- App é **dark fixo** (não há tema claro nas telas novas).

## Cor (KINETIC)

- Superfícies (mesmo matiz, só luminosidade): `bg #131313` → `surface1 #1c1b1b` → `surfaceRaised #2c2b2b`
  / `surface2 #2a2a2a` → `surface3`. Cartões e grupos de lista em `surface1` sobre `bg`.
- Sheet/modal de baixo usa `bg` como fundo, para os grupos `surface1` dentro dele aparecerem.
- Texto em 4 níveis: `text` (principal) · `textDim` 62% · `textSecondary` 55% (metadados, mínimo para
  texto legível) · `textMuted` 36% (só desabilitado/ícone de apoio, nunca texto que precisa ser lido) ·
  `placeholder` 50% (placeholder de campo, passa 4.5:1).
- Acento único: `primary #00E5FF`, texto sobre ele em `onPrimary #00262b`. Fundos de destaque: `primaryDim` 10%,
  `primarySoft` 20%.
- Semânticas: `success`, `warn`, `danger` (+ `dangerDim`), `record` (recordes/conquistas, dourado).
- Linhas: `hairline` 7% (divisórias), `ghost` 8% / `ghostHi` 15% (bordas de controle), `scrim` 70% (atrás de modal).
- Proibido hex solto em tela nova; tudo sai de KINETIC.

## Profundidade

Mudança de superfície + bordas rgba finas. Sombra só em elemento flutuante (FAB, Dialog). Não misturar.

## Tipografia (TYPE)

Geist (regular/medium/semibold/bold, cada peso é uma família — no Android `fontWeight` não troca arquivo)
e Geist Mono para números. Hierarquia por peso + cor antes de tamanho.

| variante | uso | px |
|---|---|---|
| display / title | título de tela | 24 / 22 semibold, tracking negativo |
| headline | título de sheet, dialog, seção | 17 semibold |
| body / bodyMedium / bodyStrong | texto corrido, títulos de linha | 14 |
| label / input | rótulo de botão, campo | 15 |
| caption / captionStrong | metadados, rótulo de grupo, chips | 12 |
| micro | selos ("Marcado", "Em breve") | 11 |
| stat / statSmall / mono | números de treino | 20 / 15 / 12 mono |

Usar sempre `<Text variant>` de `components/ui`. Texto cru: importar `Text`/`TextInput` de
`components/ui/scaled`, **nunca** de `react-native` (perde a escala de acessibilidade).

## Escala de texto (acessibilidade)

`contexts/TextScaleContext`: Pequeno 1.0 (layout base) · Médio 1.15 · Grande 1.3. Multiplica fontSize/lineHeight
de todo `Text`/`TextInput` escalado e o `size` de `Icon`. Escolha no 1º passo do onboarding e em
Configurações › Acessibilidade.

Regras para não quebrar em Grande:
- Contêiner com texto usa `minHeight`, não `height` fixo (exceção: controle cujo texto cabe com folga a 1.3×).
- Linha de lista: título com `numberOfLines`, e o acessório à direita não pode empurrar o título para fora.
- Valores de amostra que precisam ficar fixos (ex.: o "Aa" do seletor) usam `Text` do react-native de propósito.

## Espaçamento e raio

- Base 4. Margem lateral de tela **16** (cabeçalhos de seção 20). Gap entre blocos de uma tela 16; dentro de
  cartão 12; texto+subtexto 2.
- RADIUS: xs 6 (selos) · sm 8 (botão sm, caixa de ícone) · md 10 (campo) · lg 12 (botão) · xl 16 (cartão,
  grupo de lista, foto) · dialog 20 · pill (chips, FAB). Sheet de baixo: 24 no topo.

## Componentes (medidas)

- **Button** — lg 48 · md 44 · sm 32 (+hitSlop 6) de altura; padding 16 (sm 12); raio lg (sm: sm);
  label semibold 15/14/13; variantes primary, secondary (branco 5%), ghost (borda), danger, whatsapp;
  desabilitado opacidade .45, pressionado .85.
- **TextField** — rótulo captionStrong/secondary acima; campo minHeight 44, raio md, fundo `bg`,
  borda 1.5 branco 10%, foco = borda primary, erro = danger + mensagem caption em `danger`.
- **ListGroup / ListRow** — padrão "Ajustes": cartão `surface1` raio xl, divisória hairline; linha minHeight 52,
  padding 14×10, caixa de ícone 30 raio sm (branco 5%), título bodyMedium, subtítulo caption/secondary,
  valor à direita body/secondary, chevron 16 muted. `comingSoon` = selo "Em breve".
- **Escolha entre poucas opções dentro de um grupo** (ex.: `IntensityPicker`) — título da linha em cima e
  opções embaixo dividindo a largura (`flex: 1`), minHeight 44, gap 8, pill, borda ghostHi; ativa = fundo
  primary, texto onPrimary captionStrong. role radio + `accessibilityState.checked`. Não colocar chips como
  acessório à direita do título: não cabe com texto Grande. Sem `hitSlop` horizontal entre opções vizinhas
  (áreas de toque não podem se sobrepor).
- **Lista de seleção** — `ListRow selected` + check primary 18 como acessório.
- **Dialog** — balão central, raio 20, `surface1`, borda ghost, botão fechar 32 circular; sobe para acima do
  teclado sozinho.
- **BottomSheet** (`components/ui/BottomSheet`) — usar sempre para painel que sobe de baixo (post, story,
  comentários). Fundo `bg` sobre scrim, topo raio 24, alça 36×4, cabeçalho headline + fechar circular 36
  `surface1`, `onBack` para subtela (seta + voltar do Android). Já sobe com o teclado e respeita a barra de
  navegação. `scroll={false}` = ocupa a tela e o filho rola sozinho (lista + campo fixo embaixo).
  Conteúdo: padding 16, gap 16, ação primária Button lg no fim.
- **Câmera em tela cheia** (story, post pelo "+", foto do treino) — `components/CameraCapture` (story e post;
  a do treino tem moldura própria) dentro de Modal com `statusBarTranslucent`. Fundo preto, imagem sem moldura; controles soltos de
  `components/CameraButtons`: fechar 44 no topo esquerdo, flash no topo direito, embaixo galeria (quadrado 44
  raio md, borda branca) · disparador 80 · virar câmera. Prévia: foto em tela cheia, legenda em pill translúcida
  (preto 45%, borda branca 25%) e envio pill primary por cima. Sem permissão: tela com "Permitir câmera" e
  "Escolher da galeria".
- **Foto de perfil** — sem foto = iniciais coloridas (`Avatar`), nunca imagem genérica. Tocar na foto do
  cabeçalho do perfil abre `AvatarViewer`: fundo preto 94%, foto em círculo até 300px, nome em `title`
  abaixo, fechar no topo esquerdo. No próprio perfil, pincel primary 52 com borda preta 4 sobre a borda do
  círculo (45°, canto inferior direito) → `CameraCapture` com galeria 1:1; "Remover foto" (ghost) embaixo.
- **Compositor de mensagem** (comentários) — avatar 32, campo pill `surface1` minHeight 44 (cresce até 120),
  botão enviar circular 44: `surface1` desativado, primary quando há texto.
- **FAB** — círculo 56, primary, ícone `plus` 24 onPrimary, sombra leve; só ícone.
- **StackHeader** — botões laterais 40×40; **UnderlineTabs** — 44 de altura, ativo semibold.
- **Estado vazio** — ícone em círculo 44 `primaryDim`, título bodyStrong, explicação caption/secondary centralizada.

## Teclado

Todo campo de texto fica visível com o teclado aberto (Android edge-to-edge não encolhe a janela).
- Telas: `Screen` já trata. Tela fora de `Screen`: envolver o conteúdo em `<KeyboardAvoider>`.
- Modais/sheets: `useKeyboardOverlap(visible)` no contêiner de tela cheia → `paddingBottom: overlap`.
- Não usar `KeyboardAvoidingView`.

## Interação e acessibilidade

- Alvo de toque ≥ 44 (controles menores compensam com `hitSlop`).
- Todo `Pressable` tem `accessibilityRole` e `accessibilityLabel` quando só tem ícone; seleção usa
  `accessibilityState`.
- Feedback de toque: opacidade .85 (ou fundo branco 3% em linha de lista).
- Fundo de modal que fecha ao toque fica fora do leitor de tela (`importantForAccessibility="no"`); o botão
  Fechar do cabeçalho é o caminho acessível. Título de sheet/dialog com `accessibilityRole="header"`.
- Ação primária desabilitada enquanto não há o que enviar (ex.: post sem foto, legenda e treino).
- Barra de abas: rótulo com `adjustsFontSizeToFit` (minimumFontScale .75) para nomes longos na escala Grande.
- Listas com dados: estados de carregando, vazio e erro com "Tentar novamente".
