import { Composition } from "remotion";
import { KineticPromo, KineticPromoVertical, KineticStory, VERTICAL_FRAMES } from "./Composition";

// 9 cenas (82 s) − 8 transições de 15 frames (4 s) = 78 s.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="KineticPromo" component={KineticPromo} durationInFrames={2340} fps={30} width={1920} height={1080} />
      <Composition id="KineticPromoVertical" component={KineticPromoVertical} durationInFrames={VERTICAL_FRAMES} fps={30} width={1080} height={1920} />
      {/* 6 cenas (31,5 s) − 5 transições (2,5 s) = 29 s. */}
      <Composition id="KineticStory" component={KineticStory} durationInFrames={870} fps={30} width={1080} height={1920} />
    </>
  );
};
