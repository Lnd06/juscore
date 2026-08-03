import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
  Sequence,
  Audio,
} from 'remotion';
import { AlertTriangle, Zap, Clock, XCircle, CheckCircle2, ArrowUp, Sparkles, Send, FileText } from 'lucide-react';

// ─── SCENE WRAPPER ───
const Scene: React.FC<{
  children: React.ReactNode;
  bg?: string;
}> = ({ children, bg = 'bg-[#05070c]' }) => (
  <AbsoluteFill className={`${bg} flex flex-col items-center justify-center px-14 overflow-hidden`}>
    {children}
  </AbsoluteFill>
);

// ─── GLITCH / SHAKE EFFECT ───
const Shake: React.FC<{ children: React.ReactNode; intensity?: number; active?: boolean }> = ({
  children,
  intensity = 6,
  active = true,
}) => {
  const frame = useCurrentFrame();
  if (!active) return <>{children}</>;
  const x = Math.sin(frame * 1.8) * intensity;
  const y = Math.cos(frame * 2.3) * (intensity * 0.6);
  return <div style={{ transform: `translate(${x}px, ${y}px)` }}>{children}</div>;
};

// ─── COUNTER ANIMATION ───
const Counter: React.FC<{ from: number; to: number; startFrame: number; color?: string }> = ({
  from,
  to,
  startFrame,
  color = 'text-[#D4AF37]',
}) => {
  const frame = useCurrentFrame();
  const progress = frame - startFrame;
  const value = Math.round(
    interpolate(progress, [0, 45], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  return (
    <span className={`text-[160px] font-black tabular-nums leading-none ${color}`}>
      {value}
    </span>
  );
};

// ─── TYPING CURSOR ───
const TypingText: React.FC<{ text: string; startFrame: number; speed?: number }> = ({
  text,
  startFrame,
  speed = 1.5,
}) => {
  const frame = useCurrentFrame();
  const progress = Math.max(0, frame - startFrame);
  const charCount = Math.min(Math.floor(progress / speed), text.length);
  const showCursor = frame % 16 < 10;
  return (
    <span>
      {text.slice(0, charCount)}
      {charCount < text.length && showCursor && (
        <span className="text-[#D4AF37]">▌</span>
      )}
    </span>
  );
};

// ─── SUBTITLES (sincronizados exatamente com o áudio de 46.5s) ───
const SUBTITLES = [
  { text: "POV: Você treinando peça da OAB sozinho...", start: 9, end: 120 },
  { text: "versus usando Inteligência Artificial.", start: 120, end: 210 },
  { text: "Antes era assim:", start: 234, end: 270 },
  { text: "quatro horas para fazer uma única peça,", start: 270, end: 360 },
  { text: "zero feedback...", start: 360, end: 430 },
  { text: "e aquela insegurança total.", start: 430, end: 470 },
  { text: "Mas agora, é só colar o enunciado na JusCore...", start: 486, end: 590 },
  { text: "...e deixar a IA trabalhar.", start: 590, end: 747 },
  { text: "Ela monta o rascunho completo...", start: 762, end: 840 },
  { text: "e já te avisa na hora:", start: 840, end: 890 },
  { text: "falta fundamentação no artigo 395 do Código Civil.", start: 890, end: 996 },
  { text: "Você corrige, e pronto! Peça perfeita.", start: 1000, end: 1070 },
  { text: "Sua nota sobe de quatro para nove.", start: 1070, end: 1130 },
  { text: "E o tempo de treino cai para quarenta minutos.", start: 1130, end: 1170 },
  { text: "Não vá para a prova da segunda fase sem testar isso.", start: 1185, end: 1290 },
  { text: "Acesse JusCore.net. O link está na bio!", start: 1290, end: 1390 },
];

const SubtitlesOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const currentSub = SUBTITLES.find(s => frame >= s.start && frame < s.end);
  if (!currentSub) return null;

  const words = currentSub.text.split(' ');
  const duration = currentSub.end - currentSub.start;
  const progress = (frame - currentSub.start) / duration;
  const activeWordIndex = Math.min(
    Math.floor(progress * words.length),
    words.length - 1,
  );

  return (
    <div className="absolute bottom-36 left-0 right-0 z-50 px-10 flex justify-center">
      <div className="bg-black/75 backdrop-blur-md rounded-[24px] px-8 py-5 border border-white/5 shadow-2xl">
        <p className="text-[32px] font-black leading-snug text-center tracking-tight text-white">
          {words.map((word, i) => (
            <span
              key={i}
              className={i <= activeWordIndex ? 'text-[#D4AF37]' : 'text-white/40'}
              style={{ transition: 'color 0.1s ease' }}
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export const OabPovReels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const floatY = Math.sin(frame * 0.05) * 6;

  return (
    <AbsoluteFill className="bg-[#05070c]">
      {/* Trilha de Áudio Real */}
      <Audio src={staticFile('/oab-pov-narration.wav')} volume={1.0} />

      {/* Legendas em tempo real sempre visíveis */}
      <SubtitlesOverlay frame={frame} />

      {/* 🎬 CENA 1 (0s–7.3s / 0–220 frames): HOOK */}
      <Sequence from={0} durationInFrames={220}>
        <Scene>
          <div
            className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-[200px]"
            style={{
              opacity: interpolate(frame, [0, 30], [0.8, 0], { extrapolateRight: 'clamp' }),
              transform: `scale(${interpolate(frame, [0, 30], [2, 0.5], { extrapolateRight: 'clamp' })})`,
            }}
          />

          <div
            style={{
              transform: `scale(${spring({ frame, fps, config: { damping: 12, stiffness: 120 } })})`,
            }}
          >
            <p className="text-[42px] font-black text-white/40 uppercase tracking-[0.3em] text-center mb-6">
              POV
            </p>
            <h1 className="text-[72px] font-black text-white uppercase leading-[1.05] text-center tracking-tight">
              Treinando peça{' '}
              <span className="text-red-500 underline decoration-wavy decoration-red-500/50">
                sozinho
              </span>
            </h1>
            <p className="text-[48px] font-black text-center mt-6 uppercase tracking-tight text-white">
              vs. com{' '}
              <span className="text-[#D4AF37]">IA</span>{' '}
              <span className="text-[#2563EB]">⚡</span>
            </p>
          </div>
        </Scene>
      </Sequence>

      {/* 🔴 CENA 2 (7.3s–16s / 220–480 frames): ANTES */}
      <Sequence from={220} durationInFrames={260}>
        <Scene>
          <Shake intensity={3} active={frame >= 234 && frame <= 462}>
            <div
              className="w-full"
              style={{
                transform: `scale(${spring({
                  frame: frame - 220,
                  fps,
                  config: { damping: 14, stiffness: 100 },
                })})`,
              }}
            >
              {/* ANTES badge */}
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[3px] w-20 bg-red-500/50 rounded-full" />
                <span className="text-[56px] font-black text-red-500 uppercase tracking-widest">
                  Antes
                </span>
                <div className="h-[3px] w-20 bg-red-500/50 rounded-full" />
              </div>

              {/* Pain items stacking in synchrony with speech */}
              {/* "quatro horas" -> 234f | "zero feedback" -> 310f | "insegurança" -> 380f */}
              {[
                { icon: Clock, text: '4h por peça', delay: 234 },
                { icon: XCircle, text: 'Zero feedback', delay: 310 },
                { icon: AlertTriangle, text: 'Insegurança total', delay: 380 },
              ].map((item, idx) => {
                if (frame < item.delay) return null;
                const localFrame = frame - item.delay;
                const s = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 80 } });
                return (
                  <div
                    key={idx}
                    style={{
                      opacity: s,
                      transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
                    }}
                    className="flex items-center gap-6 py-5 border-b border-red-500/10 last:border-0"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                      <item.icon className="w-10 h-10 text-red-500" />
                    </div>
                    <span className="text-[52px] font-black text-white uppercase tracking-tight leading-tight">
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </Shake>
        </Scene>
      </Sequence>

      {/* 🟡 CENA 3 (16s–25s / 480–750 frames): AGORA (Cola e envia) */}
      <Sequence from={480} durationInFrames={270}>
        <Scene>
          {/* AGORA badge */}
          <div
            style={{
              opacity: spring({ frame: frame - 480, fps, config: { damping: 15 } }),
              transform: `scale(${spring({ frame: frame - 480, fps, config: { damping: 12, stiffness: 100 } })})`,
            }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <div className="h-[3px] w-20 bg-[#D4AF37]/50 rounded-full" />
            <span className="text-[56px] font-black text-[#D4AF37] uppercase tracking-widest">
              Agora
            </span>
            <div className="h-[3px] w-20 bg-[#D4AF37]/50 rounded-full" />
          </div>

          <div
            className="w-full bg-[#131B2E] rounded-[32px] border border-white/10 p-8 shadow-2xl"
            style={{
              transform: `translateY(${floatY}px)`,
              opacity: spring({ frame: frame - 490, fps, config: { damping: 15 } }),
            }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-5">
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#2563EB]" />
              </div>
              <div>
                <span className="text-[28px] font-black text-white uppercase tracking-wider block leading-tight">
                  Simulador OAB
                </span>
                <span className="text-[18px] text-[#2563EB] font-bold uppercase tracking-widest">
                  JusCore AI
                </span>
              </div>
            </div>

            {/* Enunciado digitalizado sincronizado com a voz (a partir do frame 500) */}
            <div className="bg-[#0B0F19] rounded-2xl border border-white/5 p-6 mb-6">
              <p className="text-[24px] text-gray-300 font-semibold leading-relaxed">
                {frame >= 500 && (
                  <TypingText
                    text="Maria celebrou contrato de compra e venda, mas o vendedor não entregou o bem no prazo. Elabore petição inicial..."
                    startFrame={500}
                    speed={1}
                  />
                )}
              </p>
            </div>

            {/* Botão enviar aparece e clica sincronizado com o fim da frase */}
            {frame >= 680 && (
              <div
                className="flex justify-end"
                style={{
                  opacity: spring({ frame: frame - 680, fps, config: { damping: 12 } }),
                  transform: `scale(${spring({ frame: frame - 680, fps, config: { damping: 10, stiffness: 120 } })})`,
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                  <Send className="w-7 h-7 text-black" />
                </div>
              </div>
            )}
          </div>
        </Scene>
      </Sequence>

      {/* 🤖 CENA 4 (25s–33.3s / 750–1000 frames): CORREÇÃO IA */}
      <Sequence from={750} durationInFrames={250}>
        <Scene>
          <div className="w-full space-y-8">
            {/* IA Analisando */}
            <div
              className="flex items-center justify-center gap-4"
              style={{
                opacity: interpolate(frame, [750, 770], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}
            >
              <Sparkles className="w-8 h-8 text-[#D4AF37] animate-spin" />
              <span className="text-[32px] font-black text-[#D4AF37] uppercase tracking-widest">
                IA Analisando...
              </span>
            </div>

            {/* Rascunho Gerado */}
            {frame >= 770 && (
              <div
                className="bg-[#131B2E] rounded-[28px] border border-white/10 p-8 shadow-2xl"
                style={{
                  opacity: spring({ frame: frame - 770, fps, config: { damping: 14 } }),
                  transform: `translateY(${interpolate(frame, [770, 785], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <FileText className="w-6 h-6 text-[#2563EB]" />
                  <span className="text-[22px] font-black text-white uppercase tracking-wider">
                    Rascunho Gerado
                  </span>
                </div>
                <div className="space-y-3">
                  {[100, 95, 85, 70, 90].map((w, i) => {
                    const lineDelay = 780 + i * 8;
                    if (frame < lineDelay) return null;
                    return (
                      <div
                        key={i}
                        style={{ width: `${w}%` }}
                        className="h-5 bg-white/8 rounded-full"
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Correção Identificada (Sincronizado quando fala "falta fundamentação no artigo 395 do Código Civil" em ~810f) */}
            {frame >= 810 && (
              <div
                style={{
                  transform: `scale(${spring({
                    frame: frame - 810,
                    fps,
                    config: { damping: 10, stiffness: 130 },
                  })})`,
                }}
              >
                <Shake intensity={frame < 840 ? 8 : 0}>
                  <div className="bg-red-500/10 border-2 border-red-500/40 rounded-[28px] p-8 relative overflow-hidden">
                    <div
                      className="absolute inset-0 bg-red-500/20"
                      style={{
                        opacity: interpolate(frame, [810, 825], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                      }}
                    />
                    <div className="flex items-start gap-5 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                      </div>
                      <div>
                        <span className="text-[20px] font-black text-red-400 uppercase tracking-wider block mb-2">
                          ⚠️ Correção Identificada
                        </span>
                        <p className="text-[32px] font-black text-white leading-tight">
                          Falta fundamentação no{' '}
                          <span className="text-red-400 underline decoration-red-400/50 decoration-wavy">
                            Art. 395 do CC
                          </span>
                        </p>
                        <p className="text-[20px] text-gray-400 mt-3 font-semibold">
                          Mora do devedor — constituição automática
                        </p>
                      </div>
                    </div>
                  </div>
                </Shake>
              </div>
            )}

            {/* Corrigido com sucesso (Sincronizado quando fala "Você corrige, e pronto! Peça perfeita." em ~930f) */}
            {frame >= 930 && (
              <div
                className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[28px] p-7 flex items-center gap-5"
                style={{
                  opacity: spring({ frame: frame - 930, fps, config: { damping: 12 } }),
                  transform: `translateY(${interpolate(frame, [930, 942], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[24px] font-black text-emerald-400 uppercase tracking-wider">
                    ✅ Corrigido com sucesso
                  </span>
                  <p className="text-[18px] text-gray-400 font-semibold mt-1">Art. 395 CC fundamentado na petição</p>
                </div>
              </div>
            )}
          </div>
        </Scene>
      </Sequence>

      {/* 📈 CENA 5 (33.3s–39.3s / 1000–1180 frames): NOTA SOBE */}
      <Sequence from={1000} durationInFrames={180}>
        <Scene>
          <div className="flex flex-col items-center justify-center text-center">
            {/* Glow backdrop */}
            <div
              className="absolute w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[150px]"
              style={{ opacity: interpolate(frame, [1000, 1050], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}
            />

            <p className="text-[36px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4 relative z-10">
              Sua nota
            </p>

            {/* Counter animado sincronizado com a voz de 1011f a 1056f */}
            <div className="relative z-10">
              <Counter from={4} to={9} startFrame={1011} color="text-[#D4AF37]" />
            </div>

            <div className="flex items-center gap-3 mt-6 relative z-10">
              <ArrowUp className="w-12 h-12 text-emerald-400 animate-bounce" />
              <span className="text-[48px] font-black text-emerald-400 uppercase tracking-wider">
                +125%
              </span>
            </div>

            {/* Comparativo de tempos aparece quando fala "tempo de treino cai..." em ~1080f */}
            {frame >= 1080 && (
              <div
                className="flex items-center gap-8 mt-14 relative z-10"
                style={{
                  opacity: spring({ frame: frame - 1080, fps, config: { damping: 12 } }),
                  transform: `translateY(${interpolate(frame, [1080, 1095], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                }}
              >
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-8 py-5">
                  <span className="text-[18px] font-bold text-red-400 uppercase tracking-wider block">Antes</span>
                  <span className="text-[56px] font-black text-red-500 leading-none">4h</span>
                </div>
                <Zap className="w-10 h-10 text-[#D4AF37]" />
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-8 py-5">
                  <span className="text-[18px] font-bold text-emerald-400 uppercase tracking-wider block">Agora</span>
                  <span className="text-[56px] font-black text-emerald-400 leading-none">40m</span>
                </div>
              </div>
            )}
          </div>
        </Scene>
      </Sequence>

      {/* 🎯 CENA 6 (39.3s–46.5s / 1180–1395 frames): CTA */}
      <Sequence from={1180} durationInFrames={215}>
        <Scene>
          <div className="absolute w-[800px] h-[800px] bg-[#D4AF37]/8 rounded-full blur-[200px] animate-pulse" />

          <div className="flex flex-col items-center justify-center relative z-10">
            {/* Logo do JusCore com escala elástica em ~1185f */}
            <div
              style={{
                transform: `scale(${spring({
                  frame: frame - 1180,
                  fps,
                  config: { damping: 10, stiffness: 100 },
                })})`,
              }}
            >
              <div className="relative">
                <div className="absolute -inset-8 bg-[#D4AF37]/20 rounded-full blur-3xl animate-pulse" />
                <img
                  src={staticFile('/juscore.svg')}
                  className="w-52 h-52 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                  alt="JusCore"
                />
              </div>
            </div>

            {/* Nome da Marca */}
            <h1 className="text-[80px] font-black tracking-tight uppercase mt-10 text-white">
              Jus<span className="text-[#D4AF37]">Core</span>
              <span className="text-[40px] text-[#2563EB]">.net</span>
            </h1>

            <p className="text-[28px] font-extrabold text-gray-400 uppercase tracking-[0.2em] mt-2">
              Simulador OAB com IA
            </p>

            {/* Botão de CTA que sobe quando fala "Acesse JusCore.net" em ~1240f */}
            {frame >= 1240 && (
              <div
                className="mt-14 w-full max-w-lg"
                style={{
                  opacity: spring({ frame: frame - 1240, fps, config: { damping: 12 } }),
                  transform: `translateY(${interpolate(frame, [1240, 1255], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#D4AF37] to-[#F2D272] rounded-3xl blur-xl opacity-70 animate-pulse" />
                  <div className="relative bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-black uppercase text-[32px] rounded-3xl py-6 tracking-wider flex items-center justify-center gap-4 shadow-2xl">
                    Testar Grátis <Zap className="w-8 h-8 stroke-[3]" />
                  </div>
                </div>
                <p className="text-[20px] text-gray-500 font-extrabold uppercase tracking-[0.3em] text-center mt-5">
                  Link na bio
                </p>
              </div>
            )}
          </div>
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
};
