import "./index.css";
import { Composition } from "remotion";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";
import { CalculatorShowcase } from "./CalculatorShowcase";
import { TccMarketing } from "./TccMarketing";
import { OabPovReels } from "./OabPovReels";
import { JuscoreIntro } from "./JuscoreIntro";
import { JuscoriPromo20s } from "./JuscoriPromo20s";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="JuscoriPromo20s"
        component={JuscoriPromo20s}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="JuscoreIntro"
        component={JuscoreIntro}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="OabPovReels"
        component={OabPovReels}
        durationInFrames={1395}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="TccMarketing"
        component={TccMarketing}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="CalculatorShowcase"
        component={CalculatorShowcase}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        schema={myCompSchema}
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema2}
        defaultProps={{
          logoColor1: "#91dAE2" as const,
          logoColor2: "#86A8E7" as const,
        }}
      />
    </>
  );
};
