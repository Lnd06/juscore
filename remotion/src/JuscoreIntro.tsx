import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
  Sequence,
  Img,
  Audio,
  Solid,
} from "remotion";
import {
  Sparkles,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Brain,
  Search,
  Clock,
  ArrowUpRight,
} from "lucide-react";

// ─── CINEMATIC BACKGROUND WITH FILM GRAIN & GLOWS ───
const CinematicBackground: React.FC<{ accentColor?: string }> = ({
  accentColor,
}) => {
  const frame = useCurrentFrame();

  // Ambient pulsing glow scales
  const pulseGold = 0.95 + Math.sin(frame * 0.03) * 0.05;
  const pulseBlue = 0.9 + Math.cos(frame * 0.035) * 0.07;

  return (
    <AbsoluteFill className="bg-[#030509] overflow-hidden select-none">
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Warm Ambient — subtle, off-center */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700,
          height: 700,
          right: -180,
          top: -200,
          transform: `scale(${pulseGold})`,
          background:
            "radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 65%)",
          filter: "blur(140px)",
        }}
      />
      {/* Cool Ambient — subtle, grounded */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          left: -150,
          bottom: -180,
          transform: `scale(${pulseBlue})`,
          background:
            "radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)",
          filter: "blur(130px)",
        }}
      />
      {/* Dynamic/Conditional Accent Light */}
      {accentColor && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 600,
            height: 600,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
            filter: "blur(90px)",
          }}
        />
      )}{" "}
      {/* Film grain — barely perceptible texture */}
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
            baseFrequency="0.65"
            numOctaves="1"
            seed={Math.floor(frame * 0.3)}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {/* Heavy Cinematic Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 30%, rgba(1, 2, 4, 0.8) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── CAMERA DRIFT (ZOOM-IN EFFECT) ───
const CameraDrift: React.FC<{
  children: React.ReactNode;
  duration: number;
  startScale?: number;
  endScale?: number;
}> = ({ children, duration, startScale = 1.0, endScale = 1.07 }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [startScale, endScale], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

// ─── STAGGERED WORD REVEAL (BLUR & TRANSLATE MASK) ───
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
  speed = 4,
  accentIndices = [],
  accentClassName = "text-[#D4AF37] font-black",
  baseClassName = "text-white font-light",
  center = true,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <div
      className={`flex flex-wrap gap-x-4 gap-y-4 ${center ? "justify-center text-center" : "justify-start text-left"} w-full`}
    >
      {words.map((word, i) => {
        const delay = startFrame + i * speed;
        const revealSpring = spring({
          frame: frame - delay,
          fps: 30,
          config: { damping: 14, stiffness: 120 },
        });

        // Translate up, fade in and blur reveal
        const translateY = interpolate(revealSpring, [0, 1], [50, 0]);
        const opacity = interpolate(revealSpring, [0, 1], [0, 1]);
        const blur = interpolate(revealSpring, [0, 1], [10, 0]);
        const isAccent = accentIndices.includes(i);

        return (
          <div key={i} className="overflow-hidden py-1 inline-block">
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${translateY}px)`,
                opacity,
                filter: `blur(${blur}px)`,
                fontFamily: "Sora, sans-serif",
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

// ─── TECHNICAL HUD OVERLAY ───
const TechnicalOverlay: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="pointer-events-none select-none z-40 font-['Courier_Prime',_monospace]">
      {/* Corner marks — thin, precise */}
      <div className="absolute top-12 left-12 w-6 h-6 border-l border-t border-white/10" />
      <div className="absolute top-12 right-12 w-6 h-6 border-r border-t border-white/10" />
      <div className="absolute bottom-12 left-12 w-6 h-6 border-l border-b border-white/10" />
      <div className="absolute bottom-12 right-12 w-6 h-6 border-r border-b border-white/10" />

      {/* Metadata — understated */}
      <div className="absolute top-12 left-20 text-[11px] text-white/15 tracking-[0.3em] uppercase">
        JusCore
      </div>
      <div className="absolute top-12 right-20 text-[11px] text-white/15 tracking-[0.3em] uppercase">
        {sceneId} // {String(frame).padStart(4, "0")}
      </div>

      <div className="absolute bottom-12 left-20 text-[10px] text-white/10 tracking-[0.15em]">
        © juscore.net
      </div>
    </AbsoluteFill>
  );
};

// ─── SUBTLE LIGHT SWEEP FOR BUTTONS ───
const ShimmerBeam: React.FC = () => {
  const frame = useCurrentFrame();
  const left = interpolate(frame % 120, [0, 120], [-100, 200]);
  return (
    <div
      className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent skew-x-12 pointer-events-none"
      style={{ left: `${left}%` }}
    />
  );
};

// ─── ANIMATED COUNTER ───
const AnimCounter: React.FC<{
  from: number;
  to: number;
  startFrame: number;
  decimals?: number;
  color?: string;
  size?: string;
}> = ({
  from,
  to,
  startFrame,
  decimals = 0,
  color = "text-[#D4AF37]",
  size = "text-[120px]",
}) => {
  const frame = useCurrentFrame();
  const val = interpolate(frame - startFrame, [0, 45], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <span
      className={`${size} font-black font-['Sora',_sans-serif] tracking-tighter tabular-nums leading-none ${color}`}
    >
      {val.toFixed(decimals)}
    </span>
  );
};

// ─── TYPING TEXT ───
const TypeText: React.FC<{
  text: string;
  startFrame: number;
  speed?: number;
}> = ({ text, startFrame, speed = 1.2 }) => {
  const frame = useCurrentFrame();
  const p = Math.max(0, frame - startFrame);
  const count = Math.min(Math.floor(p / speed), text.length);
  const cursor = frame % 16 < 10;
  return (
    <span className="font-['Outfit',_sans-serif] font-normal leading-relaxed">
      {text.slice(0, count)}
      {count < text.length && cursor && (
        <span className="text-[#D4AF37] ml-1">▌</span>
      )}
    </span>
  );
};

// ─── EDITORIAL TAG ───
const Badge: React.FC<{
  children: React.ReactNode;
  color?: string;
  borderColor?: string;
  delay?: number;
}> = ({
  children,
  color = "bg-white/[0.03]",
  borderColor = "border-white/[0.08]",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const s = spring({
    frame: frame - delay,
    fps: 30,
    config: { damping: 14, stiffness: 110 },
  });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [8, 0])}px)`,
      }}
      className={`${color} ${borderColor} border rounded-lg px-5 py-2.5 inline-flex items-center gap-2.5 font-['Sora',_sans-serif] uppercase tracking-[0.08em] text-[13px] font-semibold`}
    >
      {children}
    </div>
  );
};

// ─── SCENE CONTAINER (ADAPTED FOR MOBILE - REDUCED SIDE PADDING) ───
const Scene: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill className="flex flex-col items-center justify-center px-10 py-28">
    {children}
  </AbsoluteFill>
);

// ─── SCENE TRANSITION (CROSS-FADE) ───
const FadeTransition: React.FC<{
  duration: number;
  fadeFrames?: number;
  children: React.ReactNode;
}> = ({ children, duration, fadeFrames = 15 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, fadeFrames, duration - fadeFrames, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ═══════════════════════════════════════════════════════
// MAIN COMPOSITION — 30s @ 30fps = 900 frames
// ═══════════════════════════════════════════════════════
export const JuscoreIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const float = Math.sin(frame * 0.035) * 6;

  return (
    <AbsoluteFill className="bg-[#030509]">
      {/* ─── NARRATION AUDIO ─── */}
      <Audio src={staticFile("/juscore-intro-narration.mp3")} volume={1.0} />
      {/* ═══════════════════════════════════════════ */}
      {/* CENA 1 (0–3.5s / 0–105f): HOOK             */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence durationInFrames={105}>
        <FadeTransition duration={105}>
          <CameraDrift duration={105}>
            <CinematicBackground accentColor="#D4AF37" />
            <TechnicalOverlay sceneId="SCENE_01_HOOK" />
            <Scene>
              {/* Logo com spring scale e glow pulsante */}
              <div
                style={{
                  transform: `scale(${spring({ frame, fps, config: { damping: 14, stiffness: 90 } })})`,
                  filter: "drop-shadow(0 0 40px rgba(212,175,55,0.3))",
                }}
                className="mb-16 relative"
              >
                <div className="absolute -inset-10 bg-[#D4AF37]/8 rounded-full blur-[50px]" />
                <Img
                  src={staticFile("/juscore.svg")}
                  className="w-48 h-48 object-contain relative z-10"
                  alt="JusCore"
                />
              </div>

              {/* Titulo Motion Design Sora com pesos contrastantes e revelação staggered */}
              <div className="mb-8 w-full">
                <WordReveal
                  text="A inteligência artificial que o seu"
                  startFrame={10}
                  speed={4}
                  baseClassName="text-white text-[60px] font-extralight tracking-tight leading-tight"
                  accentClassName="text-white text-[60px] font-extralight tracking-tight leading-tight"
                />
              </div>

              <div className="mb-14 w-full">
                <WordReveal
                  text="Vade Mecum tem medo."
                  startFrame={30}
                  speed={5}
                  accentIndices={[0, 1]}
                  baseClassName="text-white text-[88px] font-black uppercase tracking-tighter leading-none"
                  accentClassName="text-gradient bg-gradient-to-r from-[#D4AF37] to-amber-500 bg-clip-text text-transparent text-[88px] font-black uppercase tracking-tighter leading-none"
                />
              </div>

              {/* Sub-badge técnica de calibragem com atraso */}
              {frame >= 60 && (
                <div className="mt-6">
                  <Badge delay={60}>
                    <Shield className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-[#D4AF37]">
                      Treinada na Legislação Brasileira
                    </span>
                  </Badge>
                </div>
              )}
            </Scene>
          </CameraDrift>
        </FadeTransition>
      </Sequence>
      {/* ═══════════════════════════════════════════ */}
      {/* CENA 2 (3.0–7.5s / 90–225f): DIFERENCIAL    */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={90} durationInFrames={135}>
        <FadeTransition duration={135}>
          <CameraDrift duration={135}>
            <CinematicBackground accentColor="#2563EB" />
            <TechnicalOverlay sceneId="SCENE_02_INTELLIGENCE" />
            <Scene>
              {/* Header minimalista alinhado à esquerda */}
              <div
                className="w-full max-w-[920px] flex items-center gap-6 mb-12 self-center"
                style={{
                  opacity: spring({
                    frame: frame - 95,
                    fps,
                    config: { damping: 15 },
                  }),
                  transform: `translateY(${interpolate(frame, [95, 110], [25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center shrink-0">
                  <Brain className="w-8 h-8 text-[#2563EB]" />
                </div>
                <div>
                  <h2 className="text-[48px] font-extrabold font-['Sora',_sans-serif] text-white tracking-tight uppercase leading-none mt-0">
                    IA TREINADA NO DIREITO BRASILEIRO
                  </h2>
                </div>
              </div>

              {/* Chat Console — clean, editorial com scale spring e float */}
              {(() => {
                const scaleSpring = spring({
                  frame: frame - 105,
                  fps,
                  config: { damping: 16, stiffness: 100 },
                });
                const consoleScale = interpolate(
                  scaleSpring,
                  [0, 1],
                  [0.95, 1],
                );
                const consoleY =
                  float + interpolate(scaleSpring, [0, 1], [20, 0]);

                return (
                  <div
                    className="w-full max-w-[920px] bg-[#080c14]/90 rounded-2xl border border-white/[0.06] p-8 relative"
                    style={{
                      transform: `scale(${consoleScale}) translateY(${consoleY}px)`,
                      opacity: scaleSpring,
                    }}
                  >
                    {/* Top Bar — minimal status line */}
                    <div className="absolute top-5 left-8 right-8 flex items-center justify-between">
                      <span className="text-[11px] font-['Courier_Prime',_monospace] text-white/20 tracking-[0.15em] uppercase">
                        JusCore · Chat
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60" />
                        <span className="text-[11px] font-['Courier_Prime',_monospace] text-white/15">
                          conectado
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 space-y-6">
                      {/* Pergunta do Usuário */}
                      <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.04]">
                        <p className="text-[26px] text-white/90 font-normal font-['Outfit',_sans-serif] leading-relaxed">
                          <TypeText
                            text="Qual a jurisprudência do STJ sobre dano moral em atraso de voo?"
                            startFrame={15}
                            speed={1.0}
                          />
                        </p>
                      </div>

                      {/* Resposta do JusCore */}
                      {frame >= 170 && (
                        <div
                          className="bg-[#060a12]/80 rounded-xl p-7 border-l-2 border-[#D4AF37]/40 relative"
                          style={{
                            opacity: spring({
                              frame: frame - 170,
                              fps,
                              config: { damping: 15 },
                            }),
                            transform: `translateY(${interpolate(frame, [170, 185], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                          }}
                        >
                          <div className="flex items-center gap-3 mb-5">
                            <Sparkles className="w-5 h-5 text-[#D4AF37]/70" />
                            <span className="text-[12px] font-semibold font-['Sora',_sans-serif] text-[#D4AF37]/80 tracking-[0.15em] uppercase">
                              JusCore AI
                            </span>
                          </div>

                          <div className="space-y-4 relative z-10">
                            {[
                              "Súmula 37/STJ: Cumulação de danos morais",
                              "REsp 1.792.128: Dano presumido em atrasos longos",
                              "Art. 186 e 927 do CC: Fundamentação legal",
                              "Citações reais indexadas com fontes oficiais",
                            ].map((item, i) => {
                              const d = 185 + i * 12;
                              if (frame < d) return null;
                              const s = spring({
                                frame: frame - d,
                                fps,
                                config: { damping: 12 },
                              });
                              return (
                                <div
                                  key={i}
                                  style={{ opacity: s }}
                                  className="flex items-center gap-3.5"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 shrink-0 mt-0.5" />
                                  <span className="text-[23px] text-white/80 font-['Outfit',_sans-serif] font-normal leading-snug">
                                    {item}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Painéis Comparativos com staggered slide de direções opostas */}
              {frame >= 195 && (
                <div className="w-full max-w-[920px] flex flex-col gap-4 mt-8">
                  {(() => {
                    const p1Spring = spring({
                      frame: frame - 195,
                      fps,
                      config: { damping: 15, stiffness: 110 },
                    });
                    const p1X = interpolate(p1Spring, [0, 1], [-40, 0]);

                    return (
                      <div
                        style={{
                          transform: `translateX(${p1X}px)`,
                          opacity: p1Spring,
                        }}
                        className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 flex items-center gap-5"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-white/30" />
                        </div>
                        <div>
                          <h4 className="text-[12px] font-semibold font-['Sora',_sans-serif] text-white/35 uppercase tracking-[0.1em]">
                            AIs Genéricas (ChatGPT)
                          </h4>
                          <p className="text-[20px] font-normal font-['Outfit',_sans-serif] text-white/40 mt-0.5">
                            Inventam leis e artigos inexistentes.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const p2Spring = spring({
                      frame: frame - 202,
                      fps,
                      config: { damping: 15, stiffness: 110 },
                    });
                    const p2X = interpolate(p2Spring, [0, 1], [40, 0]);

                    return (
                      <div
                        style={{
                          transform: `translateX(${p2X}px)`,
                          opacity: p2Spring,
                        }}
                        className="bg-[#D4AF37]/[0.03] border border-[#D4AF37]/10 rounded-xl p-6 flex items-center gap-5 relative"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/[0.08] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-[#D4AF37]/80" />
                        </div>
                        <div className="relative">
                          <h4 className="text-[12px] font-semibold font-['Sora',_sans-serif] text-[#D4AF37]/70 uppercase tracking-[0.1em]">
                            Diferencial JusCore
                          </h4>
                          <p className="text-[20px] font-normal font-['Outfit',_sans-serif] text-white/80 mt-0.5">
                            Legislação e jurisprudência 100% verídicas.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Scene>
          </CameraDrift>
        </FadeTransition>
      </Sequence>
      {/* ═══════════════════════════════════════════ */}
      {/* CENA 3 (7.0–15.33s / 210–460f): CORRETOR OAB */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={210} durationInFrames={190}>
        <FadeTransition duration={190}>
          <CameraDrift duration={190}>
            <CinematicBackground accentColor="#D4AF37" />
            <TechnicalOverlay sceneId="SCENE_03_OAB_MOCKUP" />
            <Scene>
              {/* ─── HEADER SIMULADOR OAB ─── */}
              <div
                className="w-full max-w-[920px] bg-[#080c14]/90 border border-white/[0.06] rounded-2xl p-7 flex flex-col gap-3 mb-4 self-center"
                style={{
                  opacity: spring({
                    frame: frame - 215,
                    fps,
                    config: { damping: 15 },
                  }),
                  transform: `translateY(${interpolate(frame, [215, 230], [25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <div className="flex items-center gap-3">
                      <Img
                        src={staticFile("/Vector 5.svg")}
                        className="w-5 h-5 object-contain"
                        style={{
                          filter:
                            "brightness(0) saturate(100%) invert(76%) sepia(40%) saturate(500%) hue-rotate(10deg)",
                        }}
                      />
                      <h3 className="text-[26px] font-bold font-['Sora',_sans-serif] text-white tracking-tight uppercase">
                        Simulador OAB
                      </h3>
                    </div>
                    <p className="text-[13px] text-white/35 font-['Outfit',_sans-serif] mt-1 ml-8">
                      Corretor IA nos padrões exatos da prova da OAB.
                    </p>
                  </div>

                  {/* Timer Box */}
                  <div className="flex items-center gap-2 bg-white/[0.03] px-4 py-2 rounded-lg border border-white/[0.05] font-['Courier_Prime',_monospace] text-[15px] text-white/70">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]/60" />
                    <span>05:00:00</span>
                  </div>
                </div>

                <div className="flex items-center ml-8">
                  <span className="text-[11px] font-semibold px-3 py-1 rounded bg-[#D4AF37]/[0.06] text-[#D4AF37]/70 border border-[#D4AF37]/10 uppercase tracking-[0.12em] font-['Sora',_sans-serif]">
                    Estudante Pro
                  </span>
                </div>
              </div>

              {/* ─── TAB NAVIGATION ─── */}
              <div
                className="w-full max-w-[920px] flex border-b border-white/[0.06] mb-5"
                style={{
                  opacity: spring({
                    frame: frame - 220,
                    fps,
                    config: { damping: 15 },
                  }),
                }}
              >
                <div className="flex-1 text-center py-3.5 text-[12px] font-semibold text-white/20 uppercase tracking-[0.12em] font-['Sora',_sans-serif] border-b-2 border-transparent">
                  Caso
                </div>
                <div
                  className="flex-1 text-center py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] font-['Sora',_sans-serif] transition-all duration-300"
                  style={{
                    color: frame < 300 ? "#D4AF37" : "rgba(255,255,255,0.2)",
                    borderBottom:
                      frame < 300
                        ? "2px solid #D4AF37"
                        : "2px solid transparent",
                  }}
                >
                  Redação
                </div>
                <div
                  className="flex-1 text-center py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] font-['Sora',_sans-serif] transition-all duration-300"
                  style={{
                    color: frame >= 300 ? "#D4AF37" : "rgba(255,255,255,0.2)",
                    borderBottom:
                      frame >= 300
                        ? "2px solid #D4AF37"
                        : "2px solid transparent",
                  }}
                >
                  Resultado
                </div>
              </div>

              {/* ─── CONTENT VIEWPORTS ─── */}
              <div className="w-full max-w-[920px] relative">
                {/* VIEWPORT 1: EDITOR DE REDAÇÃO (frame < 300) */}
                {frame < 300 && (
                  <div className="w-full flex flex-col gap-5">
                    {(() => {
                      const editorSpring = spring({
                        frame: frame - 215,
                        fps,
                        config: { damping: 15, stiffness: 100 },
                      });
                      const editorScale = interpolate(
                        editorSpring,
                        [0, 1],
                        [0.96, 1],
                      );
                      const editorY =
                        float * 0.5 +
                        interpolate(editorSpring, [0, 1], [15, 0]);

                      return (
                        <div
                          className="w-full bg-[#080c14]/90 rounded-2xl border border-white/[0.06] p-8 flex flex-col h-[720px] relative overflow-hidden"
                          style={{
                            opacity: editorSpring,
                            transform: `scale(${editorScale}) translateY(${editorY}px)`,
                          }}
                        >
                          {/* Editor header */}
                          <div className="flex justify-between items-center pb-4 border-b border-white/[0.05] text-[12px] text-white/25 uppercase tracking-[0.12em] font-['Sora',_sans-serif]">
                            <span>Peça Processual</span>
                            <span className="font-['Courier_Prime',_monospace] text-[11px]">
                              {Math.min(
                                32,
                                Math.max(0, Math.floor((frame - 220) * 0.35)),
                              )}{" "}
                              palavras
                            </span>
                          </div>

                          {/* Editor Text Area */}
                          <div
                            className="flex-1 py-8 font-['Courier_Prime',_monospace] text-[22px] text-white/70 leading-[36px] overflow-hidden select-none"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(transparent, transparent 35px, rgba(255,255,255,0.02) 35px, rgba(255,255,255,0.02) 36px)",
                            }}
                          >
                            <TypeText
                              text={
                                "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA 2ª VARA CÍVEL DA COMARCA DE SÃO PAULO — SP\n\nCARLOS EDUARDO MENDES, brasileiro, casado, advogado, OAB/SP nº 198.745, CPF 321.654.987-00, residente na Rua Augusta, 1.200, Consolação, São Paulo/SP, vem, respeitosamente, perante V. Exa., com fundamento nos arts. 6º, VI, 14 e 18 da Lei 8.078/90 (CDC), c/c arts. 186 e 927 do CC, propor a presente AÇÃO INDENIZATÓRIA POR DANOS MORAIS E MATERIAIS em face de VIAÇÃO AÉREA BRASILEIRA S.A., CNPJ 12.345.678/0001-90, pelos fatos e fundamentos a seguir expostos."
                              }
                              startFrame={10}
                              speed={0.5}
                            />
                          </div>

                          {/* Editor Footer */}
                          <div className="flex justify-between items-center pt-4 border-t border-white/[0.05] text-[11px] text-white/20 font-['Courier_Prime',_monospace]">
                            <span>
                              {Math.min(
                                32,
                                Math.max(0, Math.floor((frame - 220) * 0.35)),
                              )}{" "}
                              palavras
                            </span>
                            <span>
                              {Math.min(
                                180,
                                Math.max(0, Math.floor((frame - 220) * 2.0)),
                              )}{" "}
                              caracteres
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Buttons bar */}
                    <div
                      className="w-full flex gap-4"
                      style={{
                        opacity: interpolate(frame, [215, 225], [0, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        }),
                      }}
                    >
                      <div className="px-5 py-3.5 rounded-xl border border-white/[0.06] text-white/30 text-[13px] font-semibold uppercase tracking-[0.08em] font-['Sora',_sans-serif] select-none">
                        ← Voltar
                      </div>

                      {/* Entregar e Corrigir Button */}
                      <div
                        className="flex-1 py-3.5 rounded-xl font-bold text-center text-[14px] uppercase tracking-[0.06em] font-['Sora',_sans-serif] relative overflow-hidden transition-all duration-150 select-none flex items-center justify-center"
                        style={{
                          backgroundColor: "#D4AF37",
                          color: "#030509",
                          transform: frame >= 290 ? "scale(0.97)" : "scale(1)",
                          opacity: frame >= 290 ? 0.85 : 1,
                        }}
                      >
                        Entregar e Corrigir
                        {/* Click indicator — subtle brightness flash */}
                        {frame >= 288 && frame <= 300 && (
                          <div
                            className="absolute inset-0 bg-white/20 pointer-events-none"
                            style={{
                              opacity: interpolate(
                                frame,
                                [288, 295, 300],
                                [0, 0.3, 0],
                                {
                                  extrapolateLeft: "clamp",
                                  extrapolateRight: "clamp",
                                },
                              ),
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEWPORT 2: ESPELHO & RESULTADO (frame >= 300) */}
                {frame >= 300 &&
                  (() => {
                    const resultSpring = spring({
                      frame: frame - 300,
                      fps: 30,
                      config: { damping: 12, stiffness: 85 },
                    });
                    const resultScale = interpolate(
                      resultSpring,
                      [0, 1],
                      [0.95, 1],
                    );
                    const resultY = interpolate(resultSpring, [0, 1], [30, 0]);

                    return (
                      <div
                        className="w-full bg-[#080c14]/90 rounded-2xl border border-white/[0.06] p-8 flex flex-col h-[880px] relative overflow-hidden"
                        style={{
                          opacity: resultSpring,
                          transform: `scale(${resultScale}) translateY(${resultY}px)`,
                        }}
                      >
                        {/* Result Header */}
                        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05] mb-6">
                          <BookOpen className="w-5 h-5 text-[#D4AF37]/70" />
                          <span className="font-bold text-white/90 text-[16px] uppercase tracking-[0.12em] font-['Sora',_sans-serif]">
                            Espelho & Resultado OAB
                          </span>
                        </div>

                        {/* Gold Left Border Card */}
                        <div className="flex-1 border-l-2 border-[#D4AF37]/30 pl-6 py-2 space-y-7 text-[17px] font-['Outfit',_sans-serif] leading-relaxed">
                          {/* Callout box - Staggered entrance */}
                          {frame >= 310 &&
                            (() => {
                              const calloutSpring = spring({
                                frame: frame - 310,
                                fps: 30,
                                config: { damping: 14 },
                              });
                              return (
                                <div
                                  style={{
                                    opacity: calloutSpring,
                                    transform: `translateY(${interpolate(calloutSpring, [0, 1], [15, 0])}px)`,
                                  }}
                                  className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-6 rounded-xl"
                                >
                                  <div className="space-y-2">
                                    <span className="text-[11px] font-semibold text-[#D4AF37]/70 uppercase tracking-[0.12em] block font-['Sora',_sans-serif]">
                                      Resultado de Correção
                                    </span>
                                    <span className="text-[19px] text-white/70 font-normal leading-snug">
                                      Parabéns! Sua peça atingiu nota de
                                      aprovação.
                                    </span>
                                  </div>

                                  {/* Big Score counter */}
                                  <div className="text-right pl-6">
                                    <span className="text-[11px] font-semibold text-white/25 uppercase block tracking-[0.1em] font-['Sora',_sans-serif]">
                                      Nota Final
                                    </span>
                                    <div className="leading-none mt-2">
                                      <AnimCounter
                                        from={9.25}
                                        to={9.25}
                                        startFrame={305}
                                        decimals={2}
                                        color="text-[#D4AF37]"
                                        size="text-[64px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                          {/* Nota details */}
                          <div className="space-y-1">
                            <h4 className="text-[13px] font-semibold text-white/35 uppercase tracking-[0.1em] font-['Sora',_sans-serif]">
                              Pontuação da Banca
                            </h4>
                            <p className="text-white/65 text-[19px] font-normal">
                              Nota obtida:{" "}
                              <strong className="text-white/90 font-semibold">
                                9.25 / 10.00
                              </strong>{" "}
                              (Aprovação na 2ª Fase)
                            </p>
                          </div>

                          {/* Pontos Fortes list - Staggered */}
                          {frame >= 325 &&
                            (() => {
                              const fortesSpring = spring({
                                frame: frame - 325,
                                fps: 30,
                                config: { damping: 14 },
                              });
                              return (
                                <div
                                  style={{
                                    opacity: fortesSpring,
                                    transform: `translateY(${interpolate(fortesSpring, [0, 1], [15, 0])}px)`,
                                  }}
                                  className="space-y-3 bg-white/[0.02] p-5 rounded-xl border border-white/[0.04]"
                                >
                                  <h4 className="text-[12px] font-semibold text-[#D4AF37]/70 uppercase tracking-[0.1em] flex items-center gap-2.5 font-['Sora',_sans-serif]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 inline-block"></span>
                                    Pontos Fortes
                                  </h4>
                                  <ul className="space-y-2.5 text-white/60 text-[15px] pl-4">
                                    <li className="flex items-start gap-3">
                                      <span className="text-[#D4AF37]/40 mt-1 text-[10px]">
                                        ▸
                                      </span>
                                      Identificação correta da peça processual.
                                    </li>
                                    <li className="flex items-start gap-3">
                                      <span className="text-[#D4AF37]/40 mt-1 text-[10px]">
                                        ▸
                                      </span>
                                      Estrutura formal impecável (endereçamento,
                                      qualificação).
                                    </li>
                                    <li className="flex items-start gap-3">
                                      <span className="text-[#D4AF37]/40 mt-1 text-[10px]">
                                        ▸
                                      </span>
                                      Linguagem jurídica técnica e precisa.
                                    </li>
                                  </ul>
                                </div>
                              );
                            })()}

                          {/* Pontos a Melhorar list - Staggered */}
                          {frame >= 345 &&
                            (() => {
                              const melhorarSpring = spring({
                                frame: frame - 345,
                                fps: 30,
                                config: { damping: 14 },
                              });
                              return (
                                <div
                                  style={{
                                    opacity: melhorarSpring,
                                    transform: `translateY(${interpolate(melhorarSpring, [0, 1], [15, 0])}px)`,
                                  }}
                                  className="space-y-3 bg-white/[0.015] p-5 rounded-xl border border-white/[0.04]"
                                >
                                  <h4 className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.1em] flex items-center gap-2.5 font-['Sora',_sans-serif]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 inline-block"></span>
                                    Pontos a Melhorar
                                  </h4>
                                  <ul className="space-y-2.5 text-white/50 text-[15px] pl-4">
                                    <li className="flex items-start gap-3">
                                      <span className="text-white/20 mt-1 text-[10px]">
                                        ▸
                                      </span>
                                      Falta fundamentação expressa no Art. 14 do
                                      CDC.
                                    </li>
                                    <li className="flex items-start gap-3">
                                      <span className="text-white/20 mt-1 text-[10px]">
                                        ▸
                                      </span>
                                      Faltou indicar a inversão do ônus da
                                      prova.
                                    </li>
                                  </ul>
                                </div>
                              );
                            })()}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </Scene>
          </CameraDrift>
        </FadeTransition>
      </Sequence>
      {/* ═══════════════════════════════════════════ */}
      {/* CENA 4 (12.83–21.17s / 385–635f): ASSISTENTE TCC */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={385} durationInFrames={250}>
        <FadeTransition duration={250}>
          <CameraDrift duration={250}>
            <CinematicBackground accentColor="#2563EB" />
            <TechnicalOverlay sceneId="SCENE_04_TCC_SYSTEM" />
            <Scene>
              {/* Header */}
              <div
                className="w-full max-w-[920px] flex items-center gap-6 mb-12 self-center"
                style={{
                  opacity: spring({
                    frame: frame - 390,
                    fps,
                    config: { damping: 15 },
                  }),
                  transform: `translateY(${interpolate(frame, [390, 405], [25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center shrink-0">
                  <Img
                    src={staticFile("/Vector 5.svg")}
                    className="w-8 h-8 object-contain"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(36%) sepia(93%) saturate(1000%) hue-rotate(210deg)",
                    }}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-bold font-['Courier_Prime',_monospace] text-[#2563EB] uppercase tracking-[0.3em]">
                    Funcionalidade 02
                  </p>
                  <h2 className="text-[48px] font-extrabold font-['Sora',_sans-serif] text-white tracking-tight uppercase leading-none mt-1">
                    Assistente de TCC
                  </h2>
                </div>
              </div>

              {/* Layout de Capítulos e Status Empilhados Verticalmente */}
              <div className="w-full max-w-[920px] flex flex-col gap-6">
                {/* Capítulos (Painel Superior) */}
                <div
                  className="w-full bg-[#080c14]/90 rounded-2xl border border-white/[0.06] p-8 relative"
                  style={{
                    opacity: spring({
                      frame: frame - 400,
                      fps,
                      config: { damping: 14 },
                    }),
                    transform: `translateY(${float * 0.5}px)`,
                  }}
                >
                  <div className="flex items-center gap-3.5 mb-8 pb-4 border-b border-white/5">
                    <BookOpen className="w-6 h-6 text-[#2563EB]" />
                    <span className="text-[13px] font-bold font-['Courier_Prime',_monospace] text-white/50 uppercase tracking-widest">
                      Capítulos Estruturados
                    </span>
                  </div>

                  <div className="relative pl-10 space-y-6">
                    {/* Timeline Connector Line */}
                    <div
                      className="absolute left-4 top-2.5 w-[3px] bg-gradient-to-b from-[#2563EB] via-indigo-500 to-transparent"
                      style={{
                        height: `${interpolate(frame, [400, 520], [0, 95], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                      }}
                    />

                    {/* Nodes das Etapas com bounce spring scale */}
                    {[
                      {
                        num: "1",
                        title: "Introdução e Recorte Temático",
                        delay: 415,
                      },
                      {
                        num: "2",
                        title: "Marco Teórico e Direitos Fundamentais",
                        delay: 440,
                      },
                      {
                        num: "3",
                        title: "Análise de Acórdãos e Precedentes STJ",
                        delay: 465,
                      },
                      {
                        num: "4",
                        title: "Geração Automática das Conclusões",
                        delay: 490,
                      },
                      {
                        num: "5",
                        title: "Referências Bibliográficas nas Normas ABNT",
                        delay: 515,
                      },
                    ].map((ch, i) => {
                      if (frame < ch.delay) return null;
                      const s = spring({
                        frame: frame - ch.delay,
                        fps,
                        config: { damping: 13, stiffness: 90 },
                      });
                      return (
                        <div
                          key={i}
                          style={{
                            opacity: s,
                            transform: `scale(${interpolate(s, [0, 1], [0.92, 1])}) translateX(${interpolate(s, [0, 1], [-25, 0])}px)`,
                          }}
                          className="flex items-center gap-4 py-2 relative z-10"
                        >
                          {/* Timeline Node LED */}
                          <div className="absolute -left-[32px] w-4 h-4 rounded-full bg-[#030509] border-2 border-[#2563EB]/60 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#2563EB]/80" />
                          </div>

                          <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center shrink-0">
                            <span className="text-[14px] font-bold font-['Courier_Prime',_monospace] text-[#2563EB]">
                              {ch.num}
                            </span>
                          </div>
                          <span className="text-[26px] font-bold font-['Outfit',_sans-serif] text-white/95 leading-tight">
                            {ch.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status de IA e Formatação ABNT (Painel Inferior) */}
                {frame >= 525 &&
                  (() => {
                    const progressPanelSpring = spring({
                      frame: frame - 525,
                      fps,
                      config: { damping: 14, stiffness: 95 },
                    });
                    const progressPanelScale = interpolate(
                      progressPanelSpring,
                      [0, 1],
                      [0.96, 1],
                    );
                    const progressPanelY = interpolate(
                      progressPanelSpring,
                      [0, 1],
                      [15, 0],
                    );

                    return (
                      <div
                        className="w-full bg-[#2563EB]/[0.03] border border-[#2563EB]/10 rounded-2xl p-7 relative overflow-hidden"
                        style={{
                          opacity: progressPanelSpring,
                          transform: `scale(${progressPanelScale}) translateY(${progressPanelY}px)`,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Clock
                            className="w-5 h-5 text-[#2563EB]/70 animate-spin"
                            style={{ animationDuration: "3s" }}
                          />
                          <span className="text-[12px] font-semibold font-['Sora',_sans-serif] text-[#2563EB]/70 tracking-[0.1em] uppercase">
                            Formatador ABNT ativo
                          </span>
                        </div>

                        <p className="text-[22px] font-bold font-['Outfit',_sans-serif] text-white">
                          Formatando citações e fontes...
                        </p>

                        {/* Progress Bar Espessa */}
                        <div className="mt-5 h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2563EB] to-indigo-500 rounded-full"
                            style={{
                              width: `${interpolate(frame, [530, 620], [10, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                            }}
                          />
                        </div>

                        <div className="mt-4 flex justify-between text-[13px] font-['Courier_Prime',_monospace] text-white/40">
                          <span>Nbr_14724_Standard.sh</span>
                          <span>
                            {Math.round(
                              interpolate(frame, [530, 620], [10, 100], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                              }),
                            )}
                            % concluído
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                {/* Badges de Destaques Rápidos */}
                {frame >= 530 && (
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {[
                      { icon: FileText, text: "ABNT Pronta", delay: 530 },
                      { icon: Search, text: "Verificação Plágio", delay: 550 },
                      { icon: Clock, text: "5x mais rápido", delay: 570 },
                    ].map((b, i) => {
                      if (frame < b.delay) return null;
                      const s = spring({
                        frame: frame - b.delay,
                        fps,
                        config: { damping: 12 },
                      });
                      return (
                        <div
                          key={i}
                          style={{ opacity: s, transform: `scale(${s})` }}
                          className="bg-white/5 border border-white/5 rounded-xl px-5 py-3 flex items-center gap-3"
                        >
                          <b.icon className="w-5 h-5 text-[#2563EB] shrink-0" />
                          <span className="text-[18px] font-semibold font-['Outfit',_sans-serif] text-white/80">
                            {b.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Scene>
          </CameraDrift>
        </FadeTransition>
      </Sequence>
      {/* ═══════════════════════════════════════════ */}
      {/* CENA 5 (20.67–28s / 620–840f): CTA + LOGO    */}
      {/* ═══════════════════════════════════════════ */}
      <Sequence from={620} durationInFrames={220}>
        <FadeTransition duration={220}>
          <CameraDrift duration={220}>
            <CinematicBackground accentColor="#D4AF37" />
            <TechnicalOverlay sceneId="SCENE_05_OUTRO_CTA" />
            <Scene>
              {/* Concentric Expand Wave Rings */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                {[1, 2, 3].map((idx) => {
                  const startWave = 625 + (idx - 1) * 25;
                  if (frame < startWave) return null;
                  const waveProg = (frame - startWave) * 0.03;
                  const opacity = interpolate(
                    waveProg,
                    [0, 0.8, 1],
                    [0, 0.15, 0],
                    { extrapolateRight: "clamp" },
                  );
                  const scale = interpolate(waveProg, [0, 1], [0.6, 2.7]);
                  return (
                    <div
                      key={idx}
                      className="absolute rounded-full border border-[#D4AF37]/45"
                      style={{
                        width: 550,
                        height: 550,
                        transform: `scale(${scale})`,
                        opacity: opacity,
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex flex-col items-center justify-center relative z-10 w-full">
                {/* Logo Ampliado com spring pop e float float */}
                {(() => {
                  const logoFloat = Math.sin((frame - 625) * 0.05) * 8;
                  const logoScale = spring({
                    frame: frame - 625,
                    fps,
                    config: { damping: 12, stiffness: 90 },
                  });

                  return (
                    <div
                      style={{
                        transform: `scale(${logoScale}) translateY(${logoFloat}px)`,
                      }}
                      className="mb-8"
                    >
                      <div className="relative">
                        <div className="absolute -inset-12 bg-[#D4AF37]/6 rounded-full blur-[60px]" />
                        <Img
                          src={staticFile("/juscore.svg")}
                          className="w-52 h-52 object-contain relative z-10 drop-shadow-[0_0_50px_rgba(212,175,55,0.4)]"
                          alt="JusCore"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Nome da Marca Sora Bold Gigante */}
                <h1 className="text-[90px] font-black font-['Sora',_sans-serif] tracking-tighter uppercase mt-4 text-white leading-none">
                  Jus<span className="text-[#D4AF37]">Core</span>
                  <span className="text-[40px] font-['Courier_Prime',_monospace] text-[#2563EB] ml-1 lowercase">
                    .net
                  </span>
                </h1>

                <p className="text-[16px] font-bold font-['Courier_Prime',_monospace] text-white/40 uppercase tracking-[0.45em] mt-4 text-center">
                  A Revolução no Aprendizado Jurídico
                </p>

                {/* Feature Pills Técnicas Maiores */}
                {frame >= 670 && (
                  <div
                    className="flex flex-wrap items-center justify-center gap-4 mt-8"
                    style={{
                      opacity: spring({
                        frame: frame - 670,
                        fps,
                        config: { damping: 13 },
                      }),
                      transform: `translateY(${interpolate(frame, [670, 685], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                    }}
                  >
                    <Badge delay={45}>
                      <Img
                        src={staticFile("/Vector 5.svg")}
                        className="w-4 h-4 object-contain"
                        style={{
                          filter:
                            "brightness(0) saturate(100%) invert(76%) sepia(40%) saturate(500%) hue-rotate(10deg)",
                          opacity: 0.7,
                        }}
                      />
                      <span className="text-[#D4AF37]/80">Corretor OAB</span>
                    </Badge>
                    <Badge
                      color="bg-white/[0.03]"
                      borderColor="border-white/[0.08]"
                      delay={55}
                    >
                      <Img
                        src={staticFile("/Vector 5.svg")}
                        className="w-4 h-4 object-contain"
                        style={{
                          filter:
                            "brightness(0) saturate(100%) invert(36%) sepia(93%) saturate(1000%) hue-rotate(210deg)",
                          opacity: 0.7,
                        }}
                      />
                      <span className="text-[#2563EB]/80">Assistente TCC</span>
                    </Badge>
                    <Badge
                      color="bg-white/[0.03]"
                      borderColor="border-white/[0.08]"
                      delay={65}
                    >
                      <Brain className="w-4 h-4 text-white/40" />
                      <span className="text-white/50">100% Brasileira</span>
                    </Badge>
                  </div>
                )}

                {/* CTA Button Premium com Shimmer Effect e breathing pulse */}
                {frame >= 700 &&
                  (() => {
                    const buttonPulse =
                      1 + Math.sin((frame - 700) * 0.08) * 0.015;

                    return (
                      <div
                        className="mt-14 w-full max-w-[840px] px-6"
                        style={{
                          opacity: spring({
                            frame: frame - 700,
                            fps,
                            config: { damping: 12 },
                          }),
                          transform: `scale(${buttonPulse}) translateY(${interpolate(frame, [700, 715], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                        }}
                      >
                        <div className="relative">
                          {/* Subtle ambient glow */}
                          <div className="absolute -inset-1 bg-[#D4AF37] rounded-2xl blur-2xl opacity-20" />

                          {/* Main Button — flat, confident */}
                          <div className="relative bg-[#D4AF37] text-[#030509] font-['Sora',_sans-serif] font-bold uppercase text-[28px] rounded-2xl py-6 tracking-[0.04em] flex items-center justify-center gap-3 overflow-hidden cursor-pointer">
                            Testar Grátis Agora
                            <ArrowUpRight className="w-7 h-7 stroke-[2.5] mt-0.5" />
                            <ShimmerBeam />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* Bio Link & Domain (Prominent End Screen Details) */}
                {frame >= 740 && (
                  <div
                    className="mt-10 flex flex-col items-center gap-2"
                    style={{
                      opacity: spring({
                        frame: frame - 740,
                        fps,
                        config: { damping: 12 },
                      }),
                      transform: `translateY(${interpolate(frame, [740, 760], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                    }}
                  >
                    <p className="text-[34px] font-black font-['Sora',_sans-serif] text-[#D4AF37] tracking-tight uppercase">
                      juscore.net
                    </p>
                    <p className="text-[20px] font-bold font-['Courier_Prime',_monospace] text-white/50 uppercase tracking-[0.4em] mt-1">
                      Link na bio
                    </p>
                  </div>
                )}
              </div>
            </Scene>
          </CameraDrift>
        </FadeTransition>
      </Sequence>
      <Solid
        width={1080}
        height={1920}
        style={{
          position: "absolute",
        }}
      />
    </AbsoluteFill>
  );
};
