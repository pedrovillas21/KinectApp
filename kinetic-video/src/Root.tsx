import { Composition } from "remotion";
import { KineticPromo } from "./Composition";

// 9 cenas (82 s) − 8 transições de 15 frames (4 s) = 78 s.
export const RemotionRoot: React.FC = () => {
  return <Composition id="KineticPromo" component={KineticPromo} durationInFrames={2340} fps={30} width={1920} height={1080} />;
};
