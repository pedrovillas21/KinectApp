import React from "react";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { AiScene, AppScene, Bridge, Intro, ManageScene, Outro, OverviewScene, PricingScene, Problem } from "./scenes";
import { K } from "./theme";
import { IN_OUT } from "./ui";

/** Transição com a diagonal das barras do logo: a cena nova entra por trás de uma faixa ciano. */
const SlashWipeComponent: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const e = 125 - presentationProgress * 150;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `polygon(${e}% 0, 130% 0, 130% 100%, ${e - 18}% 100%)` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: K.primary, clipPath: `polygon(${e - 2.2}% 0, ${e}% 0, ${e - 18}% 100%, ${e - 20.2}% 100%)` }} />
      <AbsoluteFill style={{ background: K.primary, opacity: 0.35, clipPath: `polygon(${e - 4.6}% 0, ${e - 3.4}% 0, ${e - 21.4}% 100%, ${e - 22.6}% 100%)` }} />
    </AbsoluteFill>
  );
};

const slashWipe = (): TransitionPresentation<Record<string, never>> => ({ component: SlashWipeComponent, props: {} });

const T = 15;
/** Duração da trilha "Warm Fiano" (58 s); o vídeo é mais longo, então ela emenda nela mesma. */
const TRACK = 58;
const LOOP_AT = 55.5;
const LOOP_SKIP = 6;

export const KineticPromo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const timing = linearTiming({ durationInFrames: T, easing: IN_OUT });
  const second = durationInFrames - LOOP_AT * fps;
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Abertura" durationInFrames={4.5 * fps}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="O problema" durationInFrames={5.5 * fps}>
          <Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="Visão geral" durationInFrames={9.5 * fps}>
          <OverviewScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="Ficha com IA" durationInFrames={15 * fps}>
          <AiScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="A ponte" durationInFrames={4.5 * fps}>
          <Bridge />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="App do aluno" durationInFrames={14.5 * fps}>
          <AppScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="Gestão" durationInFrames={13.5 * fps}>
          <ManageScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="Planos" durationInFrames={10 * fps}>
          <PricingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slashWipe()} timing={timing} />
        <TransitionSeries.Sequence name="Fechamento" durationInFrames={5 * fps}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        name="Warm Fiano"
        src={staticFile("music.mp3")}
        volume={(f) => interpolate(f, [0, 0.5 * fps, LOOP_AT * fps, TRACK * fps], [0, 0.9, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      <Sequence name="Warm Fiano (emenda)" from={LOOP_AT * fps} durationInFrames={second}>
        <Audio
          name="Warm Fiano (emenda)"
          src={staticFile("music.mp3")}
          trimBefore={LOOP_SKIP * fps}
          volume={(f) => interpolate(f, [0, 2.5 * fps, second - 2.5 * fps, second], [0, 0.9, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
