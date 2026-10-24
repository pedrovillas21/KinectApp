# Referência de motion — "Moolah" (app de finanças, 9:16)

Fonte: vídeo Klickpin `pin-id-933230354041471590` · 720×1280 · 30 fps · 15,8 s · sem nenhum corte "suave": tudo é corte seco ou movimento contínuo.

## Linha do tempo (beats)

| Tempo | O que acontece | Técnica |
|---|---|---|
| 0,00–0,45 | "Introducing" em fundo preto `#111` | Texto encolhe (scale ~1.6→1) e sobe; a cor varre letra a letra **rosa → branco**, 1 letra/frame |
| 0,50–1,20 | Logo "Moolah" + porquinho em fundo branco | Porquinho entra por baixo e "salta" por cima do wordmark (overshoot), wordmark com leve rotação |
| 1,25–2,13 | Lock screen rosa com notificação | Celular 3D em ângulo, câmera orbitando devagar; notificação desliza para fora do card |
| 2,166 | **Corte seco** para "Hey, Will" | Card de saldo *sai da tela* (maior que o celular, inclinado −15° → −5° com mola) |
| 2,17–2,55 | Saldo £0,00 → £5.267 | **Contador** rolando a cada frame enquanto o card assenta |
| 2,75–3,0 | Mesmo celular, fundo preto, menor | Corte seco de fundo + zoom-out = "respiro" |
| 3,25–3,5 | Ilustração isolada (sacolas) | Elemento da UI tirado do contexto, centralizado, pequeno |
| 3,75–4,73 | Tela "Budgeting" bem perto | Celular gigante, câmera dando dolly lento |
| 4,766 | **Corte** para fundo azul + "Your new money app" | Palavra a palavra: entra por baixo com máscara, nasce **rosa** e vira **branca** quando a próxima chega |
| 5,0–6,3 | Fundo troca azul → rosa → vermelho → verde | **A cada ~8 frames** troca fundo *e* tela do celular; texto e celular continuam o movimento como se nada tivesse cortado |
| 6,333 | Corte para branco: cards de portfólio | Cards caem em cascata 3D (1 a cada ~3 frames), cada um com sombra deslocada |
| 7,0–7,75 | Cards viram tela "Starter packs" | Os cards *são* a UI: câmera se afasta e o celular aparece em volta; um card ("Thrill Seeker") salta para fora da tela |
| 8,0–8,25 | Tela "Invest" com o card selecionado | **Match cut**: o card destacado continua no mesmo lugar, agora dentro de outra tela |
| 8,5–9,43 | "Invest effortlessly" — azul/rosa/amarelo | Mesmo padrão da 4,766 (palavras + troca de fundo a cada beat) |
| 9,466–9,8 | Pills de interesse caindo (fundo branco) | Física: pills caem girando, quicam e se empilham com overshoot |
| 10,0–10,75 | Pills viram a tela "What are your interests?" | Mesmo truque dos cards: elementos soltos → zoom-out → estão dentro do celular |
| 11,0–12,6 | "Tailored to you" — azul/vermelho/amarelo/azul/rosa | Padrão de palavras + fundo, telas diferentes por beat |
| 12,466–12,6 | Tela branca com logo dentro do celular | Logo aparece *na tela* antes do end card |
| 12,633 | **Corte** para fundo vermelho `#E63A0E` | Porquinho sozinho → wordmark desliza da direita (rosa → branco) → tagline aparece 3 frames depois |
| 12,9–15,8 | End card parado | ~3 s de hold com micro-drift |

## As técnicas que fazem o vídeo funcionar

1. **Corte seco no beat, movimento contínuo por cima.** O fundo e a tela trocam a cada 8–10 frames, mas a câmera (rotação/posição do celular) e o texto seguem a mesma curva. O olho lê como um único plano "piscando" cores. → Calcule o movimento a partir do frame *global* da sequência, e só o conteúdo a partir do beat.
2. **Highlight de cor que "esfria".** Toda palavra nova nasce na cor de destaque (rosa) e vira branca/preta quando a seguinte entra — o destaque marca sempre o que é novo.
3. **Elemento quebra a moldura.** Card de saldo, card "Thrill Seeker": a UI sai do celular, fica maior que a tela, inclinada, com sombra. Vende "profundidade" sem 3D de verdade (é `rotate` + `scale` + `box-shadow`).
4. **Solto → contextualizado.** Mostra os componentes da UI soltos e grandes (cards, pills), depois afasta a câmera e revela que eram a tela do app. Reaproveita o mesmo asset nos dois estados.
5. **Match cut por elemento.** O card selecionado permanece na mesma posição entre duas telas diferentes; o corte some.
6. **Contador rolando** enquanto o elemento assenta (2,17–2,55 s): número vivo = sensação de "dinheiro crescendo".
7. **Escala como ritmo.** Alterna celular gigante (detalhe) ↔ pequeno no centro (respiro) ↔ elemento isolado. Nunca dois planos seguidos na mesma escala.
8. **Paleta de 4 cores sólidas + preto/branco.** Azul `#0047D9`, rosa `#FF9AC8`, vermelho `#E63A0E`, amarelo `#FFD62E`, verde `#00A43C`. Fundo sempre chapado — o celular é o único objeto com volume.
9. **Tipografia pesada, alinhamento escalonado.** Duas linhas: 1ª à esquerda, 2ª recuada à direita ("Your new / money app"), sangrando pelas bordas.

## Como reproduzir em Remotion

```tsx
// Troca de fundo/tela no beat, mas a câmera usa o frame global
const BEAT = 8;
const PALETTE = ['#0047D9', '#FF9AC8', '#E63A0E', '#00A43C'];
const SCREENS = [SignUp, Goal, Breakdown, Awards];

const frame = useCurrentFrame();
const i = Math.min(Math.floor(frame / BEAT), SCREENS.length - 1);
const Screen = SCREENS[i];
const camY = interpolate(frame, [0, 60], [40, -20]);        // drift contínuo
const camRot = interpolate(frame, [0, 60], [-6, 2]);

<AbsoluteFill style={{background: PALETTE[i]}}>
  <Headline words={['Your', 'new', 'money', 'app']} />
  <Phone style={{transform: `translateY(${camY}px) rotate(${camRot}deg)`}}>
    <Screen />
  </Phone>
</AbsoluteFill>
```

```tsx
// Palavra nasce rosa (por baixo, com máscara) e vira branca quando a próxima entra
const STAGGER = 4;
words.map((w, k) => {
  const local = frame - k * STAGGER;
  const y = interpolate(spring({frame: local, fps, config: {damping: 14}}), [0, 1], [100, 0]);
  const color = frame >= (k + 1) * STAGGER ? '#fff' : '#FF9AC8';
  return (
    <span style={{display: 'inline-block', overflow: 'hidden'}}>
      <span style={{display: 'inline-block', transform: `translateY(${y}%)`, color}}>{w}</span>
    </span>
  );
});
```

```tsx
// Varredura de cor letra a letra ("Introducing")
[...text].map((c, k) => <span style={{color: frame > k ? '#fff' : '#FF9AC8'}}>{c}</span>);
```

```tsx
// Card que sai da tela + contador
const s = spring({frame, fps, config: {damping: 10, stiffness: 120}});
const rot = interpolate(s, [0, 1], [-15, -5]);
const value = interpolate(frame, [0, 12], [0, 5267.55], {extrapolateRight: 'clamp'});
<div style={{transform: `rotate(${rot}deg) scale(1.15)`, boxShadow: '0 30px 40px rgba(0,0,0,.25)'}}>
  £{value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
</div>
```

```tsx
// Cascata de cards / pills: delay por índice + spring com overshoot
items.map((it, k) => {
  const s = spring({frame: frame - k * 3, fps, config: {damping: 9, mass: 0.6}});
  return <Card style={{
    transform: `translateY(${interpolate(s, [0, 1], [-400, 0])}px) rotate(${interpolate(s, [0, 1], [-40, -18])}deg)`,
    opacity: s > 0 ? 1 : 0,
  }} />;
});
```

Celular "3D": um único componente de moldura com `perspective` + `rotateY/rotateX` pequenos (≤ 20°) e sombra; o original é render 3D, mas em Remotion isso basta.

## Como foi extraído

```bash
ffmpeg -i video.mp4 -vf "fps=4,scale=270:-1,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{pts\:hms}':x=5:y=5:fontsize=18:fontcolor=red:box=1,tile=6x2" sheet_%02d.png
```

Depois, 30 fps nos trechos de transição (`-ss <t> -t 0.6`, `tile=9x2`) para medir stagger e duração em frames.
