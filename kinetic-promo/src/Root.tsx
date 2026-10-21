import { Composition } from "remotion";
import { DURATION, Promo } from "./Promo";

export const RemotionRoot: React.FC = () => (
  <Composition id="KineticPromo" component={Promo} durationInFrames={DURATION} fps={30} width={1080} height={1920} />
);
