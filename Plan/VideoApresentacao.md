# Vídeo de apresentação Kinetic — direção de arte (rascunho para aprovação)

## Formato
- 1920×1080 (16:9), 30 fps, **58 s**. Versão vertical 9:16 pode vir depois, reaproveitando as cenas.
- Sem narração: a mensagem vem em textos curtos na tela. Trilha sonora opcional (você fornece um MP3 livre de direitos, ou sai sem áudio).
- Projeto Remotion separado em `kinetic-video/` dentro do repositório.

## Identidade visual (a mesma do app e do painel)
- Fundo `#131313`, superfícies `#1c1b1b` / `#2a2a2a`, ciano `#00E5FF` como única cor de destaque; verde `#4ade80` / âmbar `#f5b945` / vermelho `#ff6b6b` só nos status.
- Tipografia: **Archivo** (títulos e números, largura expandida) + **Geist** (textos de apoio).
- Motivo gráfico: as **3 barras diagonais do logo** viram as transições entre cenas (wipes inclinados em ciano).
- Telas **recriadas em React** com os tokens reais, não prints. Ficam nítidas em qualquer zoom e podem ser animadas por dentro (lista preenchendo, gráfico subindo). Os dados são fictícios (alunos "Ana", "Bruno"…).
- Mockups: iPhone escuro de bordas finas para o app; janela de navegador minimalista (barra com `app.kinetic.com.br`) para o painel.
- Movimento: springs suaves (sem bounce exagerado), câmera com push-in lento e leve inclinação 3D nos mockups, glow ciano discreto e grão sutil no fundo.

## Roteiro (58 s)

| Tempo | Cena | O que aparece | Texto na tela |
|---|---|---|---|
| 0–4 s | **Abertura** | As 3 barras do logo entram em sequência e formam "KINETIC" | "Treino, acompanhamento e cobrança. Num lugar só." |
| 4–9 s | **O problema** | Cards caóticos (planilha, PDF de treino, conversa de WhatsApp, Pix manual) flutuam e são "puxados" para um ponto ciano | "Seu trabalho espalhado em 5 apps?" |
| 9–21 s | **Painel do personal** (navegador) | Lista de alunos com status *Em dia / Precisa de atenção / Risco de abandono* → cursor abre um aluno → aba Treinos → IA monta a ficha linha a linha → "Publicar" | "Monte a ficha com IA em segundos" · "Saiba quem está sumindo antes de perder o aluno" |
| 21–25 s | **A ponte** (cena-chave do ecossistema) | A ficha publicada sai do navegador e voa para dentro do celular, que vibra com a notificação | "Publicou. Chegou." |
| 25–37 s | **App do aluno** (celular) | Home → treino ativo (série marcada, descanso contando) → evolução (gráfico subindo, selo de recorde) → feed social | "Treino no bolso" · "Evolução que dá pra ver" · "Comunidade que motiva" |
| 37–45 s | **Para o personal** | 3 cards em sequência: convite por link, avaliação física + relatório de evolução, financeiro com cobrança do aluno | "Convide com um link" · "Relatórios prontos" · "Cobrança sem planilha" |
| 45–53 s | **Planos (valores)** | 4 cards em cascata: Start R$ 19,90 (5 alunos) · Pro R$ 44,90 (15) · Plus R$ 79,90 (30) · Max R$ 129,90 (60); contador do custo por aluno caindo de R$ 3,98 até **R$ 2,17** | "Quanto mais alunos, menos por aluno" · "App do aluno: grátis" |
| 53–58 s | **Fechamento** | Celular e navegador lado a lado, ligados por uma linha ciano; logo no centro | "Um ecossistema para todos os seus alunos." · "14 dias grátis" |

## Pontos para você decidir
1. **"Valores" = planos de preço?** Usei os preços do `BillingPlan` (anotados como provisórios). Se você quis dizer valores da marca (missão etc.), troco essa cena.
2. **Mostrar os preços** ou só "a partir de R$ 19,90" + teste grátis? Preço exato envelhece rápido se ainda vai mudar.
3. **Formato**: 16:9 (site/YouTube/apresentação) ou 9:16 (Reels/TikTok)?
4. **Trilha**: você tem uma música? Se não tiver, sai sem áudio.
5. **CTA final**: tem domínio/@ do Instagram para colocar no fim?
