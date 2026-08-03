import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  staticFile,
  Sequence,
  Img,
  Easing,
} from "remotion";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadCourier } from "@remotion/google-fonts/CourierPrime";
import {
  Sparkles,
  AlertTriangle,
  Shield,
  Zap,
  Scale,
  GraduationCap,
} from "lucide-react";

// ─── LOAD GOOGLE FONTS (TYPE-SAFE, RENDER-BLOCKING) ───
const { fontFamily: soraFont } = loadSora("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: outfitFont } = loadOutfit("normal", {
  weights: ["300", "400", "600", "700"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: courierFont } = loadCourier("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "latin-ext"],
});

// ─── FLOATING PARTICLES ───
const FloatingParticles: React.FC<{
  count?: number;
  color?: string;
}> = ({ count = 18, color = "rgba(212,175,55,0.12)" }) => {
  const frame = useCurrentFrame();
  const particles = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: ((i * 137.508) % 100),
        y: ((i * 97.3) % 100),
        size: 2 + (i % 4) * 1.5,
        speed: 0.3 + (i % 5) * 0.15,
        phase: (i * 2.39) % (Math.PI * 2),
      });
    }
    return arr;
  }, [count]);

  return (
    <AbsoluteFill className="pointer-events-none overflow-hidden">
      {particles.map((p, i) => {
        const floatY = Math.sin(frame * 0.02 * p.speed + p.phase) * 25;
        const floatX = Math.cos(frame * 0.015 * p.speed + p.phase) * 12;
        const opacity = interpolate(
          Math.sin(frame * 0.03 + p.phase),
          [-1, 1],
          [0.15, 0.6]
        );
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              translate: `${floatX}px ${floatY}px`,
              opacity,
              background: color,
              filter: `blur(${p.size > 4 ? 1 : 0}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── ANIMATED SCAN LINE ───
const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const cycle = frame % 120;
  const y = interpolate(cycle, [0, 120], [-5, 105]);
  const opacity = interpolate(cycle, [0, 20, 100, 120], [0, 0.06, 0.06, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        top: `${y}%`,
        height: 2,
        background:
          "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 30%, rgba(37,99,235,0.15) 70%, transparent 100%)",
        opacity,
        filter: "blur(0.5px)",
      }}
    />
  );
};

// ─── CINEMATIC BACKGROUND WITH FILM GRAIN & ANIMATED GRID ───
const CinematicBackground: React.FC<{ accentColor?: string }> = ({
  accentColor,
}) => {
  const frame = useCurrentFrame();

  const pulseGold = 1.0 + Math.sin(frame * 0.04) * 0.06;
  const pulseBlue = 0.95 + Math.cos(frame * 0.03) * 0.05;
  const gridOffset = interpolate(frame, [0, 600], [0, 40]);

  return (
    <AbsoluteFill className="bg-[#020408] overflow-hidden select-none">
      {/* Animated grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          backgroundPosition: `0px ${gridOffset}px`,
        }}
      />
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Top Right Gold Ambient Glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 800,
          height: 800,
          right: -200,
          top: -200,
          scale: pulseGold,
          background:
            "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />
      {/* Bottom Left Blue Ambient Glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700,
          height: 700,
          left: -150,
          bottom: -150,
          scale: pulseBlue,
          background:
            "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
          filter: "blur(110px)",
        }}
      />
      {/* Optional custom accent light */}
      {accentColor && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 600,
            height: 600,
            left: "50%",
            top: "50%",
            translate: "-50% -50%",
            background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
      )}
      {/* Film Grain Effect */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.025,
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="2"
            seed={Math.floor(frame * 0.5)}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 15%, rgba(1, 2, 4, 0.80) 100%)",
        }}
      />
      {/* Scan Line */}
      <ScanLine />
    </AbsoluteFill>
  );
};

// ─── CAMERA DRIFT (SUBTLE CONTINUOUS ZOOM + PAN) ───
const CameraDrift: React.FC<{
  children: React.ReactNode;
  duration: number;
  startScale?: number;
  endScale?: number;
}> = ({ children, duration, startScale = 1.0, endScale = 1.06 }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [startScale, endScale], {
    extrapolateRight: "clamp",
  });
  const panX = Math.sin(frame * 0.008) * 3;
  const panY = Math.cos(frame * 0.006) * 2;
  return (
    <AbsoluteFill style={{ scale, translate: `${panX}px ${panY}px` }}>
      {children}
    </AbsoluteFill>
  );
};

// ─── SHAKE EFFECT ───
const Shake: React.FC<{
  children: React.ReactNode;
  intensity?: number;
  active?: boolean;
}> = ({ children, intensity = 5, active = true }) => {
  const frame = useCurrentFrame();
  if (!active) return <>{children}</>;
  const x = Math.sin(frame * 1.5) * intensity;
  const y = Math.cos(frame * 2.0) * (intensity * 0.6);
  const rot = Math.sin(frame * 1.8) * (intensity * 0.15);
  return (
    <div style={{ translate: `${x}px ${y}px`, rotate: `${rot}deg` }}>
      {children}
    </div>
  );
};

// ─── STAGGERED WORD REVEAL (BLUR & SLIDE) ───
const WordReveal: React.FC<{
  text: string;
  startFrame: number;
  speed?: number;
  accentIndices?: number[];
  accentClassName?: string;
  baseClassName?: string;
  center?: boolean;
}> = ({
  text,
  startFrame,
  speed = 3,
  accentIndices = [],
  accentClassName = "text-[#D4AF37] font-black",
  baseClassName = "text-white font-light",
  center = true,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <div
      className={`flex flex-wrap gap-x-3 gap-y-3 ${center ? "justify-center text-center" : "justify-start text-left"} w-full`}
    >
      {words.map((word, i) => {
        const delay = startFrame + i * speed;
        const progress = interpolate(frame - delay, [0, 18], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const translateY = interpolate(progress, [0, 1], [30, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const blur = interpolate(progress, [0, 1], [8, 0]);
        const isAccent = accentIndices.includes(i);

        return (
          <div key={i} className="overflow-hidden py-1 inline-block">
            <span
              style={{
                display: "inline-block",
                translate: `0px ${translateY}px`,
                opacity,
                filter: `blur(${blur}px)`,
                fontFamily: soraFont,
              }}
              className={isAccent ? accentClassName : baseClassName}
            >
              {word}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── TYPING TEXT EFFECT ───
const TypingText: React.FC<{
  text: string;
  startFrame: number;
  speed?: number;
}> = ({ text, startFrame, speed = 1.3 }) => {
  const frame = useCurrentFrame();
  const progress = Math.max(0, frame - startFrame);
  const charCount = Math.min(Math.floor(progress / speed), text.length);
  const showCursor = frame % 16 < 10;
  return (
    <span style={{ fontFamily: outfitFont }}>
      {text.slice(0, charCount)}
      {charCount < text.length && showCursor && (
        <span
          className="text-[#D4AF37] ml-0.5"
          style={{
            opacity: interpolate(Math.sin(frame * 0.25), [-1, 1], [0.2, 1]),
          }}
        >
          ▌
        </span>
      )}
    </span>
  );
};

// ─── TECH OVERLAY (HUD) ───
const TechnicalOverlay: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      className="pointer-events-none select-none z-40 text-white/20 text-[11px] p-12"
      style={{ fontFamily: courierFont }}
    >
      {/* Corner brackets */}
      <div className="absolute top-12 left-12 w-5 h-5 border-l border-t border-white/10" />
      <div className="absolute top-12 right-12 w-5 h-5 border-r border-t border-white/10" />
      <div className="absolute bottom-12 left-12 w-5 h-5 border-l border-b border-white/10" />
      <div className="absolute bottom-12 right-12 w-5 h-5 border-r border-b border-white/10" />

      {/* Meta Text */}
      <div className="absolute top-12 left-20 tracking-[0.2em] uppercase font-semibold">
        JUSCORE // ENGINE
      </div>
      <div className="absolute top-12 right-20 tracking-[0.2em] uppercase text-right">
        {sceneId} · {String(frame).padStart(3, "0")}F
      </div>
      <div className="absolute bottom-12 left-20 tracking-[0.1em]">
        SYSTEM: CALIBRATED
      </div>
      {/* Horizontal line sweep */}
      <div
        className="absolute left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
        style={{
          top: 44,
          transform: `scaleX(${interpolate(frame, [0, 30], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── SUBTITLES COMPONENT (20s SYNCHRONIZED VERSION) ───
const SUBTITLES_20S = [
  {
    text: "Enquanto outras ferramentas apenas respondem perguntas...",
    start: 0,
    end: 90,
  },
  {
    text: "...a JusCore foi criada para transformar a forma como você estuda e trabalha no Direito.",
    start: 90,
    end: 210,
  },
  {
    text: "Uma inteligência artificial treinada no Direito Brasileiro, com simulador de OAB, assistente de TCC e muito mais.",
    start: 210,
    end: 360,
  },
  {
    text: "Recursos tão avançados que até o seu Vade Mecum vai ficar com ciúmes.",
    start: 360,
    end: 510,
  },
  {
    text: "JusCore. A inteligência artificial jurídica que tem tudo o que você precisa.",
    start: 510,
    end: 600,
  },
];

const SubtitlesOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const currentSub = SUBTITLES_20S.find(
    (s) => frame >= s.start && frame < s.end
  );
  if (!currentSub) return null;

  const words = currentSub.text.split(" ");
  const duration = currentSub.end - currentSub.start;
  const progress = (frame - currentSub.start) / duration;
  const activeWordIndex = Math.min(
    Math.floor(progress * words.length),
    words.length - 1
  );

  // Entrance animation for the subtitle container
  const entryProgress = interpolate(
    frame - currentSub.start,
    [0, 12],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <div className="absolute bottom-36 left-0 right-0 z-50 px-10 flex justify-center">
      <div
        className="bg-black/75 backdrop-blur-xl rounded-2xl px-7 py-4 border border-white/[0.06] shadow-2xl"
        style={{
          opacity: entryProgress,
          translate: interpolate(entryProgress, [0, 1], ["0px 12px", "0px 0px"]),
        }}
      >
        <p
          className="text-[26px] font-extrabold leading-snug text-center tracking-tight"
          style={{ fontFamily: soraFont }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                color:
                  i <= activeWordIndex
                    ? "#D4AF37"
                    : "rgba(255,255,255,0.25)",
              }}
            >
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

// ─── SHIMMER EFFECT FOR BUTTONS/CARDS ───
const ShimmerBeam: React.FC = () => {
  const frame = useCurrentFrame();
  const left = interpolate(frame % 90, [0, 90], [-100, 200]);
  return (
    <div
      className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none"
      style={{ left: `${left}%`, rotate: "12deg" }}
    />
  );
};

// ─── ANIMATED STAT NUMBER ───
const AnimatedStat: React.FC<{
  value: string;
  label: string;
  delay: number;
  color?: string;
}> = ({ value, label, delay, color = "#D4AF37" }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, 25], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{
        opacity: progress,
        scale: progress,
      }}
    >
      <span
        className="text-[36px] font-black"
        style={{ fontFamily: soraFont, color }}
      >
        {value}
      </span>
      <span
        className="text-[12px] font-semibold text-white/40 uppercase tracking-[0.15em]"
        style={{ fontFamily: courierFont }}
      >
        {label}
      </span>
    </div>
  );
};

// ─── MAIN COMPOSITION ───
export const JuscoriPromo20s: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="bg-[#020408] text-white">
      {/* Sincronização de legenda geral */}
      <SubtitlesOverlay frame={frame} />

      {/* ═══════════════════════════════════════════ */}
      {/* CENA 1 (0s – 3s / 0 – 90f): GANCHO (HOOK) */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={0} durationInFrames={90}>
        <CameraDrift duration={90}>
          <CinematicBackground accentColor="#3b82f6" />
          <TechnicalOverlay sceneId="SCENE_01_HOOK" />
          <FloatingParticles color="rgba(59,130,246,0.08)" count={12} />

          <AbsoluteFill className="flex flex-col items-center justify-center px-12">
            {/* Tech grid/glow elements */}
            <div
              className="absolute w-[400px] h-[400px] rounded-full blur-[80px] -z-10"
              style={{
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
                scale: interpolate(frame, [0, 90], [0.7, 1.3], {
                  easing: Easing.bezier(0.25, 1, 0.5, 1),
                }),
              }}
            />

            <div className="space-y-8 w-full text-center">
              <WordReveal
                text="Enquanto outras ferramentas"
                startFrame={10}
                speed={4}
                baseClassName="text-white/60 text-[38px] font-light tracking-tight leading-tight"
                accentClassName="text-white/60 text-[38px] font-light tracking-tight leading-tight"
              />

              <WordReveal
                text="apenas respondem perguntas..."
                startFrame={30}
                speed={5}
                accentIndices={[1, 2]}
                baseClassName="text-white text-[52px] font-extrabold uppercase tracking-tight leading-none"
                accentClassName="text-gradient bg-gradient-to-r from-red-400 via-orange-400 to-amber-500 bg-clip-text text-transparent text-[52px] font-black uppercase tracking-tight leading-none"
              />
            </div>

            {/* Animated divider line */}
            <div
              className="w-20 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent mt-14"
              style={{
                transform: `scaleX(${interpolate(frame, [0, 45], [0, 1], {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })})`,
              }}
            />
          </AbsoluteFill>
        </CameraDrift>
      </Sequence>

      {/* ═══════════════════════════════════════════ */}
      {/* CENA 2 (3s – 7s / 90 – 210f): BRAND REVEAL */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={90} durationInFrames={120}>
        <CameraDrift duration={120}>
          <CinematicBackground accentColor="#D4AF37" />
          <TechnicalOverlay sceneId="SCENE_02_BRAND" />
          <FloatingParticles color="rgba(212,175,55,0.1)" />

          <AbsoluteFill className="flex flex-col items-center justify-center px-12">
            {/* Elastic scale brand logo */}
            {(() => {
              const localFrame = frame - 90;
              const logoScale = interpolate(localFrame, [0, 30], [0, 1], {
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const logoOpacity = interpolate(localFrame, [0, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const logoFloat = Math.sin(localFrame * 0.06) * 6;

              return (
                <div
                  style={{
                    scale: logoScale,
                    opacity: logoOpacity,
                    translate: `0px ${logoFloat}px`,
                    filter: "drop-shadow(0 0 60px rgba(212,175,55,0.4))",
                  }}
                  className="mb-10 relative"
                >
                  {/* Concentric ring pulse */}
                  <div
                    className="absolute -inset-12 rounded-full border border-[#D4AF37]/10"
                    style={{
                      scale: interpolate(
                        Math.sin(localFrame * 0.05),
                        [-1, 1],
                        [0.85, 1.15]
                      ),
                      opacity: interpolate(
                        Math.sin(localFrame * 0.05),
                        [-1, 1],
                        [0.1, 0.3]
                      ),
                    }}
                  />
                  <div
                    className="absolute -inset-8 bg-[#D4AF37]/8 rounded-full blur-[50px]"
                    style={{
                      opacity: interpolate(
                        Math.sin(localFrame * 0.08),
                        [-1, 1],
                        [0.3, 0.7]
                      ),
                    }}
                  />
                  <Img
                    src={staticFile("/juscore.svg")}
                    className="w-44 h-44 object-contain relative z-10"
                    alt="JusCore"
                  />
                </div>
              );
            })()}

            {/* Brand title */}
            <div
              className="text-center"
              style={{
                opacity: interpolate(frame - 105, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame - 105,
                  [0, 20],
                  ["0px 25px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                ),
              }}
            >
              <h1
                className="text-[76px] font-black tracking-tighter uppercase mb-3 leading-none"
                style={{ fontFamily: soraFont }}
              >
                JUS<span className="text-[#D4AF37]">CORE</span>
                <span
                  className="text-[32px] text-[#2563EB] ml-1 lowercase"
                  style={{ fontFamily: courierFont }}
                >
                  .net
                </span>
              </h1>

              {/* Tag editorial */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 text-[#D4AF37] font-semibold text-[14px] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span style={{ fontFamily: soraFont }}>
                  Inteligência Jurídica
                </span>
              </div>
            </div>

            {/* Description typing */}
            <div className="mt-8 text-center max-w-md h-14">
              <p className="text-[20px] text-white/65 font-light leading-relaxed">
                {frame >= 120 && (
                  <TypingText
                    text="Criada para transformar a forma como você estuda e trabalha."
                    startFrame={120}
                    speed={1.0}
                  />
                )}
              </p>
            </div>

            {/* Stats row */}
            {frame >= 160 && (
              <div className="flex gap-10 mt-6">
                <AnimatedStat value="100%" label="Brasileira" delay={160} />
                <AnimatedStat
                  value="24/7"
                  label="Disponível"
                  delay={170}
                  color="#2563EB"
                />
                <AnimatedStat value="∞" label="Consultas" delay={180} />
              </div>
            )}
          </AbsoluteFill>
        </CameraDrift>
      </Sequence>

      {/* ═══════════════════════════════════════════ */}
      {/* CENA 3 (7s – 12s / 210 – 360f): FEATURES */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={210} durationInFrames={150}>
        <CinematicBackground accentColor="#2563eb" />
        <TechnicalOverlay sceneId="SCENE_03_FEATURES" />
        <FloatingParticles color="rgba(37,99,235,0.07)" count={10} />

        <AbsoluteFill className="flex flex-col items-center justify-center px-12 py-20">
          <div className="w-full space-y-7">
            {/* Section heading */}
            <div
              className="text-center mb-2"
              style={{
                opacity: interpolate(frame - 210, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <span
                className="text-[13px] font-bold text-[#2563EB]/60 uppercase tracking-[0.35em]"
                style={{ fontFamily: courierFont }}
              >
                Diferenciais
              </span>
              <h2
                className="text-[40px] font-extrabold text-white uppercase tracking-tight mt-1"
                style={{ fontFamily: soraFont }}
              >
                Por que a JusCore?
              </h2>
            </div>

            {/* FEATURE 1: IA Jurídica */}
            {frame >= 220 && (
              <div
                className="bg-[#0b101d]/90 border border-white/[0.06] rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden"
                style={{
                  opacity: interpolate(frame - 220, [0, 18], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  translate: interpolate(
                    frame - 220,
                    [0, 18],
                    ["-60px 0px", "0px 0px"],
                    {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                  ),
                }}
              >
                <ShimmerBeam />
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <h3
                    className="text-[20px] font-bold text-white uppercase tracking-tight"
                    style={{ fontFamily: soraFont }}
                  >
                    IA Jurídica Avançada
                  </h3>
                  <p
                    className="text-[15px] text-white/55 mt-0.5"
                    style={{ fontFamily: outfitFont }}
                  >
                    Treinada em legislação e jurisprudência brasileira.
                  </p>
                </div>
              </div>
            )}

            {/* FEATURE 2: Simulador OAB */}
            {frame >= 255 && (
              <div
                className="bg-[#0b101d]/90 border border-[#D4AF37]/15 rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden"
                style={{
                  opacity: interpolate(frame - 255, [0, 18], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  translate: interpolate(
                    frame - 255,
                    [0, 18],
                    ["60px 0px", "0px 0px"],
                    {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                  ),
                }}
              >
                <ShimmerBeam />
                <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                  <Scale className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <div>
                  <h3
                    className="text-[20px] font-bold text-[#D4AF37] uppercase tracking-tight"
                    style={{ fontFamily: soraFont }}
                  >
                    Simulador OAB Integrado
                  </h3>
                  <p
                    className="text-[15px] text-white/55 mt-0.5"
                    style={{ fontFamily: outfitFont }}
                  >
                    Feedbacks e notas em padrão de banca real.
                  </p>
                </div>
              </div>
            )}

            {/* FEATURE 3: Assistente de TCC */}
            {frame >= 290 && (
              <div
                className="bg-[#0b101d]/90 border border-purple-500/15 rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden"
                style={{
                  opacity: interpolate(frame - 290, [0, 18], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  translate: interpolate(
                    frame - 290,
                    [0, 18],
                    ["-60px 0px", "0px 0px"],
                    {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                  ),
                }}
              >
                <ShimmerBeam />
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <h3
                    className="text-[20px] font-bold text-white uppercase tracking-tight"
                    style={{ fontFamily: soraFont }}
                  >
                    Assistente de TCC & Peças
                  </h3>
                  <p
                    className="text-[15px] text-white/55 mt-0.5"
                    style={{ fontFamily: outfitFont }}
                  >
                    Estruturação e formatação ABNT inteligente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ═══════════════════════════════════════════ */}
      {/* CENA 4 (12s – 17s / 360 – 510f): VADE MECUM */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={360} durationInFrames={150}>
        <CinematicBackground accentColor="#ef4444" />
        <TechnicalOverlay sceneId="SCENE_04_JEALOUSY" />
        <FloatingParticles color="rgba(239,68,68,0.06)" count={8} />

        <AbsoluteFill className="flex flex-col items-center justify-center px-12 py-16">
          {/* Main text message */}
          <div className="text-center mb-12 w-full">
            <WordReveal
              text="Recursos tão avançados que até o seu"
              startFrame={370}
              speed={4}
              baseClassName="text-white text-[32px] font-light tracking-tight leading-tight"
              accentClassName="text-white text-[32px] font-light tracking-tight leading-tight"
            />
            <div className="mt-3">
              <WordReveal
                text="Vade Mecum vai ficar com ciúmes"
                startFrame={390}
                speed={5}
                accentIndices={[0, 1, 5]}
                baseClassName="text-white text-[48px] font-extrabold uppercase tracking-tight leading-none"
                accentClassName="text-gradient bg-gradient-to-r from-red-500 via-orange-400 to-amber-500 bg-clip-text text-transparent text-[48px] font-black uppercase tracking-tight leading-none"
              />
            </div>
          </div>

          {/* Vade Mecum Jealous Alert Card */}
          <div className="w-full max-w-md">
            <Shake intensity={4} active={frame >= 415}>
              {(() => {
                const cardProgress = interpolate(
                  frame - 385,
                  [0, 28],
                  [0, 1],
                  {
                    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                );
                return (
                  <div
                    style={{
                      scale: cardProgress,
                      opacity: cardProgress,
                    }}
                    className="bg-[#12080a]/90 border border-red-500/20 rounded-3xl p-7 relative overflow-hidden"
                  >
                    {/* Red glow */}
                    <div
                      className="absolute -inset-10 bg-red-500/5 rounded-full blur-3xl"
                      style={{
                        opacity: interpolate(
                          Math.sin(frame * 0.08),
                          [-1, 1],
                          [0.3, 0.8]
                        ),
                      }}
                    />

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                        <AlertTriangle
                          className="w-7 h-7 text-red-500"
                          style={{
                            opacity: interpolate(
                              Math.sin(frame * 0.12),
                              [-1, 1],
                              [0.4, 1.0]
                            ),
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[12px] font-semibold text-red-400 uppercase tracking-widest"
                            style={{ fontFamily: courierFont }}
                          >
                            AVISO DO LIVRO
                          </span>
                          <span
                            className="text-[11px] text-white/25"
                            style={{ fontFamily: courierFont }}
                          >
                            WARN_VADE_01
                          </span>
                        </div>
                        <h4
                          className="text-[22px] font-black text-white mt-1 leading-tight"
                          style={{ fontFamily: soraFont }}
                        >
                          CIÚMES DETECTADO!
                        </h4>
                        <p
                          className="text-[15px] text-white/50 mt-2 font-medium"
                          style={{ fontFamily: outfitFont }}
                        >
                          O livro físico está obsoleto perante a velocidade de
                          resposta JusCore.
                        </p>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="mt-6 border-t border-white/[0.05] pt-5 space-y-4">
                      <div>
                        <div
                          className="flex justify-between text-[13px] text-white/50 font-bold mb-2 uppercase"
                          style={{ fontFamily: courierFont }}
                        >
                          <span>Velocidade de Busca</span>
                          <span className="text-[#D4AF37]">9.9s vs 35m</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full"
                            style={{
                              width: `${interpolate(frame - 400, [0, 60], [5, 95], {
                                easing: Easing.bezier(0.22, 1, 0.36, 1),
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                              })}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Shake>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ═══════════════════════════════════════════ */}
      {/* CENA 5 (17s – 20s / 510 – 600f): OUTRO (CTA) */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={510} durationInFrames={90}>
        <CameraDrift duration={90} startScale={1.0} endScale={1.04}>
          <CinematicBackground accentColor="#D4AF37" />
          <TechnicalOverlay sceneId="SCENE_05_OUTRO" />
          <FloatingParticles count={22} color="rgba(212,175,55,0.12)" />

          <AbsoluteFill className="flex flex-col items-center justify-center px-12 text-center">
            {/* Concentric rings */}
            {[1, 2, 3].map((ring) => {
              const ringFrame = frame - 510 - ring * 8;
              const ringScale = interpolate(ringFrame, [0, 60], [0.5, 2.5], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const ringOpacity = interpolate(
                ringFrame,
                [0, 20, 50, 60],
                [0, 0.12, 0.06, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }
              );
              return (
                <div
                  key={ring}
                  className="absolute rounded-full border border-[#D4AF37]/30"
                  style={{
                    width: 400,
                    height: 400,
                    left: "50%",
                    top: "45%",
                    translate: "-50% -50%",
                    scale: ringScale,
                    opacity: ringOpacity,
                  }}
                />
              );
            })}

            {/* Logo in center */}
            {(() => {
              const localFrame = frame - 510;
              const logoScale = interpolate(localFrame, [0, 28], [0, 1], {
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const logoFloat = Math.sin(localFrame * 0.05) * 6;

              return (
                <div
                  style={{
                    scale: logoScale,
                    translate: `0px ${logoFloat}px`,
                    filter: "drop-shadow(0 0 60px rgba(212,175,55,0.45))",
                  }}
                  className="mb-8 relative"
                >
                  <div
                    className="absolute -inset-10 bg-[#D4AF37]/10 rounded-full blur-[50px]"
                    style={{
                      opacity: interpolate(
                        Math.sin(localFrame * 0.08),
                        [-1, 1],
                        [0.3, 0.8]
                      ),
                    }}
                  />
                  <Img
                    src={staticFile("/juscore.svg")}
                    className="w-40 h-40 object-contain relative z-10"
                    alt="JusCore"
                  />
                </div>
              );
            })()}

            {/* Brand details */}
            <div
              style={{
                opacity: interpolate(frame - 520, [0, 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame - 520,
                  [0, 18],
                  ["0px 30px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                ),
              }}
            >
              <h1
                className="text-[84px] font-black tracking-tighter uppercase leading-none text-white"
                style={{ fontFamily: soraFont }}
              >
                JUS<span className="text-[#D4AF37]">CORE</span>
              </h1>
              <p
                className="text-[15px] font-bold text-white/40 uppercase tracking-[0.4em] mt-3"
                style={{ fontFamily: courierFont }}
              >
                A Revolução no Direito
              </p>
            </div>

            {/* Tagline */}
            <div
              className="mt-8"
              style={{
                opacity: interpolate(frame - 535, [0, 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame - 535,
                  [0, 18],
                  ["0px 25px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                ),
              }}
            >
              <span
                className="text-[26px] text-[#D4AF37] font-black uppercase tracking-wide"
                style={{ fontFamily: soraFont }}
              >
                "O futuro do Direito começa agora."
              </span>
              <div className="mt-1 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
            </div>

            {/* CTA Button */}
            {frame >= 548 && (
              <div
                className="mt-12 w-full max-w-sm"
                style={{
                  opacity: interpolate(frame - 548, [0, 18], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  scale: interpolate(frame - 548, [0, 22], [0, 1], {
                    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                <div className="relative">
                  {/* Ambient glow */}
                  <div
                    className="absolute -inset-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 rounded-2xl blur-lg"
                    style={{
                      opacity: interpolate(
                        Math.sin(frame * 0.06),
                        [-1, 1],
                        [0.35, 0.65]
                      ),
                    }}
                  />
                  {/* Button */}
                  <div
                    className="relative bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black text-[28px] uppercase py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl overflow-hidden"
                    style={{
                      fontFamily: soraFont,
                      fontWeight: 900,
                    }}
                  >
                    <span>juscore.net</span>
                    <Zap className="w-6 h-6 stroke-[3] text-black" />
                    <ShimmerBeam />
                  </div>
                </div>
              </div>
            )}
          </AbsoluteFill>
        </CameraDrift>
      </Sequence>
    </AbsoluteFill>
  );
};
