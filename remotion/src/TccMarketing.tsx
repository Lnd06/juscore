import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from 'remotion';
import { 
  GraduationCap, FileText, Sparkles, Star, BookOpen, 
  ListChecks, Check, ShieldAlert, ArrowRight, User, Send, Loader2
} from 'lucide-react';

// Word-by-word subtitle timing data
const SUBTITLES = [
  { text: "Meu orientador devolveu o capítulo 3 do TCC três vezes. Três.", start: 0, end: 120 },
  { text: "Joguei 40 PDFs no Assistente de TCC do JusCore. Ele fez resumos por tema.", start: 120, end: 300 },
  { text: "Pedi a estrutura. Ele montou: introdução, três seções de desenvolvimento, conclusão. Lógica, coerente, pronta pra escrever.", start: 300, end: 600 },
  { text: "Resultado: escrevi 15 páginas em 2 dias. Antes eu tava empacado há 3 semanas.", start: 600, end: 960 },
  { text: "Orientador devolveu: 'Melhor versão que vi. Só ajustar rodapé.'", start: 960, end: 1260 },
  { text: "IA não escreve por você. Ela te impede de escrever errado. Deep Research 5x/dia no plano Pesquisador.", start: 1260, end: 1560 },
  { text: "Testa grátis o Assistente de TCC. Link na bio.", start: 1560, end: 1800 }
];

// Subtitles rendering
const SubtitlesOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const currentSub = SUBTITLES.find(s => frame >= s.start && frame < s.end);
  if (!currentSub) return null;

  const words = currentSub.text.split(" ");
  const duration = currentSub.end - currentSub.start;
  const progress = (frame - currentSub.start) / duration;
  const activeWordIndex = Math.min(
    Math.floor(progress * words.length),
    words.length - 1
  );

  return (
    <div className="absolute bottom-32 left-8 right-8 flex flex-wrap justify-center gap-x-2 gap-y-3 px-6 py-6 bg-black/75 backdrop-blur-md rounded-3xl border border-white/10 z-50">
      {words.map((word, idx) => {
        const isActive = idx === activeWordIndex;
        return (
          <span
            key={idx}
            className={`text-3xl font-extrabold uppercase tracking-wide transition-all duration-100 ${
              isActive 
                ? 'text-[#F2D272] scale-110 drop-shadow-[0_0_15px_rgba(242,210,114,0.7)]' 
                : 'text-white/50'
            }`}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// Animated Audio Waves
const AudioWaves: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div className="flex items-center justify-center gap-2 h-14 mt-6">
      {[...Array(8)].map((_, i) => {
        const height = Math.abs(Math.sin((frame + i * 8) * 0.2)) * 50 + 10;
        return (
          <div
            key={i}
            style={{ height: `${height}px` }}
            className="w-2 bg-gradient-to-t from-[#D4AF37] to-[#F2D272] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          />
        );
      })}
    </div>
  );
};

export const TccMarketing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scene = (start: number, end: number) => frame >= start && frame < end;

  // Scene transition logic (spring based)
  const sceneSpring = (triggerFrame: number) => {
    return spring({
      frame: frame - triggerFrame,
      fps,
      config: { damping: 15, stiffness: 100 }
    });
  };

  // Dynamic Camera Zoom & Pan system
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  
  if (scene(120, 300)) {
    // Zoom in on PDF drop then slide to results
    zoom = interpolate(frame, [120, 140, 220, 250], [1, 1.15, 1.15, 1.05], { extrapolateRight: 'clamp' });
    panY = interpolate(frame, [120, 140, 220, 250], [0, -30, -30, 40], { extrapolateRight: 'clamp' });
  } else if (scene(300, 600)) {
    // Pan across the roadmap and chat panel
    zoom = interpolate(frame, [300, 350, 480, 550], [1, 1.12, 1.12, 1.02], { extrapolateRight: 'clamp' });
    panX = interpolate(frame, [300, 350, 480, 550], [0, 40, -40, 0], { extrapolateRight: 'clamp' });
    panY = interpolate(frame, [300, 350, 480, 550], [0, -20, -20, 0], { extrapolateRight: 'clamp' });
  }

  const cameraStyle = {
    transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
    transition: 'transform 0.1s ease-out'
  };

  // UI Floating float animation
  const floatY = Math.sin(frame * 0.04) * 8;

  return (
    <AbsoluteFill className="bg-[#05070c] font-sans overflow-hidden text-white flex flex-col justify-between">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[90%] h-[40%] bg-[#D4AF37]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#2563EB]/5 rounded-full blur-[160px] pointer-events-none" />

      {/* ─── Header bar using Real Logo ─── */}
      <div className="h-20 w-full flex items-center justify-between px-8 border-b border-white/5 bg-[#0B0F19]/60 backdrop-blur-md relative z-40">
        <div className="flex items-center gap-3">
          <img src={staticFile("/juscore.svg")} className="w-10 h-10 object-contain shadow-lg" alt="JusCore Logo" />
          <span className="font-extrabold text-xl tracking-tight uppercase">
            Jus<span className="text-[#D4AF37]">Core</span> <span className="text-xs font-semibold text-[#2563EB]">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-[#F2D272] uppercase">
          <Star className="w-3 h-3 fill-[#F2D272]" /> TCC PRO
        </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 w-full flex items-center justify-center px-6 relative z-30">
        
        {/* ============================================================== */}
        {/* SCENE 1 (0s - 4s): Speaker close-up with float & glow          */}
        {/* ============================================================== */}
        {scene(0, 120) && (
          <div className="flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
            <div className="relative" style={{ transform: `translateY(${floatY}px)` }}>
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#D4AF37] to-[#2563EB] rounded-full blur-xl opacity-70 animate-pulse" />
              <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-[#131B2E] to-[#1F2A45] border-[3px] border-[#D4AF37] flex items-center justify-center overflow-hidden relative z-10 shadow-2xl">
                <User className="w-24 h-24 text-gray-300" />
              </div>
            </div>
            
            <h2 className="text-4xl font-black text-white mt-12 leading-tight tracking-tight uppercase">
              Orientador devolveu <br />
              <span className="text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 block mt-2 shadow-inner">3x o mesmo</span>
              capítulo!
            </h2>
            <AudioWaves frame={frame} />
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENE 2 (4s - 10s): Real JusCore TccAssistant PDF Mockup       */}
        {/* ============================================================== */}
        {scene(120, 300) && (
          <div style={cameraStyle} className="w-full flex flex-col gap-5 animate-in fade-in duration-300">
            {/* Top Indicator */}
            <div className="self-center bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-md">
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Leitor e Analisador de PDFs</span>
            </div>

            {/* Simulated PDF drag & drop zone */}
            <div className="w-full bg-[#131B2E] rounded-3xl border-2 border-dashed border-[#2563EB]/40 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[#2563EB]/5 animate-pulse pointer-events-none" />
              
              {frame < 210 ? (
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* File flying in animation */}
                  <div 
                    style={{ 
                      transform: `translateY(${interpolate(frame, [120, 160], [-80, 0], { extrapolateRight: 'clamp' })}px) scale(${interpolate(frame, [120, 160], [0.5, 1], { extrapolateRight: 'clamp' })})`,
                      opacity: interpolate(frame, [120, 140], [0, 1], { extrapolateRight: 'clamp' })
                    }}
                    className="w-14 h-14 bg-[#2563EB]/20 rounded-2xl flex items-center justify-center text-[#2563EB] mb-3 border border-[#2563EB]/40 shadow-xl"
                  >
                    <FileText className="w-7 h-7" />
                  </div>
                  <span className="text-md font-bold text-gray-200">Enviando 40 PDFs de doutrina...</span>
                  
                  {/* Custom animated progress bar */}
                  <div className="w-52 h-2.5 bg-white/10 rounded-full mt-4 overflow-hidden border border-white/5 relative">
                    <div 
                      style={{ width: `${interpolate(frame, [120, 210], [0, 100])}%` }}
                      className="h-full bg-gradient-to-r from-[#2563EB] to-blue-400 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-3 border border-[#D4AF37]/40 shadow-xl">
                    <Sparkles className="w-7 h-7 animate-spin" />
                  </div>
                  <span className="text-[#D4AF37] text-lg font-black uppercase tracking-wider">Análise concluída</span>
                  <p className="text-[10px] text-gray-400 mt-1">Fontes sintetizadas por tema na base</p>
                </div>
              )}
            </div>

            {/* Results appearing sequentially matching real interface style */}
            {frame >= 210 && (
              <div className="space-y-2">
                {[
                  { title: "STF sobre responsabilidade civil do Estado", count: "Fase 2" },
                  { title: "Doutrina majoritária / Teoria do risco", count: "Fase 2" },
                  { title: "Votos divergentes nos tribunais", count: "Fase 3" }
                ].map((item, idx) => {
                  const itemDelay = 210 + idx * 22;
                  if (frame < itemDelay) return null;
                  return (
                    <div 
                      key={idx}
                      className="p-3.5 bg-[#131B2E] border border-white/5 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-3 duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/25">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-gray-200 truncate max-w-[220px]">{item.title}</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENE 3 (10s - 20s): Real TccAssistant UI Roadmap Mockup     */}
        {/* ============================================================== */}
        {scene(300, 600) && (
          <div style={cameraStyle} className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Real TccAssistant Sidebar layout simulation */}
            <div className="w-full bg-[#131B2E] border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 relative">
              
              {/* Header inside the panel */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-gray-200">Estrutura ABNT</span>
                </div>
                <span className="text-[8px] font-black uppercase bg-[#2563EB]/15 text-[#2563EB] px-2.5 py-0.5 rounded-full border border-[#2563EB]/30">
                  Gerador Automático
                </span>
              </div>

              {/* Roadmap sections popping up matching SECOES config */}
              <div className="space-y-2 max-h-[360px] overflow-hidden">
                {[
                  { id: 'Definição do Tema', desc: 'Recorte temático e problema', fase: 'Fase 1' },
                  { id: 'Introdução', desc: 'Objetivos e justificativa', fase: 'Fase 1' },
                  { id: 'Desenvolvimento / Análise', desc: 'Capítulos de mérito', fase: 'Fase 3' },
                  { id: 'Conclusão', desc: 'Fechamento do problema', fase: 'Fase 3' }
                ].map((s, idx) => {
                  const itemDelay = 310 + idx * 45;
                  if (frame < itemDelay) return null;
                  
                  const isDone = frame >= itemDelay + 25;
                  
                  return (
                    <div 
                      key={s.id}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 animate-in slide-in-from-bottom-2 ${
                        isDone 
                          ? 'bg-[#2563EB]/10 border-[#2563EB]/25 text-[#2563EB]' 
                          : 'bg-[#0B0F19] border-white/5 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white shrink-0 ${
                          isDone ? 'bg-[#2563EB]' : 'bg-white/10'
                        }`}>
                          {isDone ? <Check className="w-2.5 h-2.5" /> : null}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[11px] font-extrabold truncate uppercase ${isDone ? 'text-white' : 'text-gray-400'}`}>{s.id}</span>
                          <span className="text-[9px] text-gray-500 truncate mt-0.5">{s.desc}</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded shrink-0">
                        {s.fase}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic typing response overlay on top of layout */}
              {frame >= 490 && (
                <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#D4AF37]/20 shadow-xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-1.5 text-[#D4AF37] mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-wider">IA Orientadora</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-semibold italic">
                    "Estrutura gerada: Introdução + 3 Capítulos de desenvolvimento + Conclusão com ABNT."
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENE 4 (20s - 32s): Dynamic result highlights                 */}
        {/* ============================================================== */}
        {scene(600, 960) && (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            {/* Animated card badge */}
            <div 
              style={{ transform: `translateY(${floatY}px)` }}
              className="bg-[#131B2E] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center w-full max-w-sm mb-6"
            >
              <div className="w-16 h-16 bg-[#2563EB]/15 rounded-2xl flex items-center justify-center text-[#2563EB] mb-4 border border-[#2563EB]/30">
                <BookOpen className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">3 Semanas Travado</span>
              <h3 className="text-2xl font-black text-white mt-1 uppercase">Produtividade Zero</h3>
            </div>

            {/* Glowing separator */}
            <div className="w-12 h-1 bg-gradient-to-r from-[#2563EB] to-[#D4AF37] rounded-full my-2 animate-pulse" />

            {/* Dynamic count scale */}
            <div 
              style={{ transform: `translateY(${-floatY}px)` }}
              className="bg-[#131B2E] border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center w-full max-w-sm"
            >
              <div className="w-16 h-16 bg-[#D4AF37]/15 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-4 border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>
              <span className="text-[10px] font-extrabold text-[#F2D272] uppercase tracking-widest">Com JusCore AI</span>
              <h3 className="text-3xl font-black text-white mt-1 uppercase">15 Págs em 2 Dias!</h3>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENE 5 (32s - 42s): WhatsApp Mockup                          */}
        {/* ============================================================== */}
        {scene(960, 1260) && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Phone mockup */}
            <div 
              style={{ transform: `translateY(${floatY}px) rotate(${Math.sin(frame * 0.05) * 1.5}deg)` }}
              className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-[36px] p-5 shadow-2xl flex flex-col relative overflow-hidden h-[440px]"
            >
              {/* Top notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-50" />

              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/5 pb-3.5 mt-2 shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#1F2A45] border border-white/10 flex items-center justify-center text-[#D4AF37] font-black uppercase text-sm">
                  O
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs text-white uppercase tracking-wider">Orientador TCC</span>
                  <span className="text-[9px] text-[#22c55e] font-semibold tracking-wide">online</span>
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 py-4 flex flex-col justify-end gap-3.5 overflow-hidden">
                {/* User message */}
                {frame >= 980 && (
                  <div className="self-end bg-[#2563EB] text-white rounded-2xl rounded-tr-none px-4 py-2 text-xs max-w-[85%] shadow-md animate-in slide-in-from-right-4 duration-300">
                    <p className="font-semibold">Enviei a versão corrigida do Capítulo 3 com a fundamentação do STF.</p>
                    <span className="text-[8px] text-white/50 block text-right mt-1">14:31</span>
                  </div>
                )}

                {/* Orientador response */}
                {frame >= 1040 && (
                  <div className="self-start bg-[#1F2A45] text-white rounded-2xl rounded-tl-none px-4.5 py-3 text-xs max-w-[85%] shadow-lg border border-white/5 animate-in slide-in-from-left-4 duration-300">
                    <p className="font-extrabold text-[#F2D272] uppercase text-[9px] tracking-widest mb-1">Orientador TCC</p>
                    <p className="font-black text-sm text-white leading-relaxed">
                      "Melhor versão que vi. Só ajustar o rodapé."
                    </p>
                    <span className="text-[8px] text-white/40 block text-right mt-1.5">14:32</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENE 6 (42s - 52s): Deep Research & Pro details               */}
        {/* ============================================================== */}
        {scene(1260, 1560) && (
          <div className="flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg mb-8">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>

            <h2 className="text-4xl font-black leading-tight tracking-tight uppercase">
              IA não escreve <br />por você.
            </h2>
            <h3 className="text-4xl font-black text-[#F2D272] mt-4 leading-tight tracking-tight uppercase">
              Ela te impede de <br />escrever errado!
            </h3>
            
            <div className="mt-8 bg-[#131B2E] border border-[#D4AF37]/20 px-6 py-4 rounded-2xl shadow-xl max-w-sm">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Deep Research Integrado</span>
              <span className="text-lg font-black text-[#D4AF37] uppercase mt-1 block">5x Pesquisas Avançadas / Dia</span>
              <span className="text-[10px] text-gray-450 block mt-1">Disponível no Plano Pesquisador</span>
            </div>
            
            <AudioWaves frame={frame} />
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENE 7 (52s - 60s): End Branding with Real Logo              */}
        {/* ============================================================== */}
        {scene(1560, 1800) && (
          <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            {/* Real pulsing Logo */}
            <div className="relative mb-8" style={{ transform: `scale(${interpolate(frame, [1560, 1600], [0.8, 1], { extrapolateRight: 'clamp' })})` }}>
              <div className="absolute -inset-4 bg-[#D4AF37]/20 rounded-full blur-3xl scale-125 animate-pulse" />
              <img src={staticFile("/juscore.svg")} className="w-36 h-36 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" alt="JusCore Real Logo" />
            </div>

            <h1 className="text-5xl font-black tracking-tight uppercase">
              Jus<span className="text-[#D4AF37]">Core</span><span className="text-2xl font-bold text-[#2563EB]">.net</span>
            </h1>
            <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-extrabold">O Assistente Oficial de TCC Acadêmico</p>

            {/* CTA Button expand spring animation */}
            {frame >= 1610 && (
              <div className="mt-10 w-full max-w-xs animate-in slide-in-from-bottom-4 duration-300">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#F2D272] rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000" />
                  <div className="relative px-6 py-4 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-black uppercase text-sm rounded-2xl tracking-widest flex items-center justify-center gap-2 shadow-xl">
                    Testar Grátis <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 font-extrabold block mt-3.5 uppercase tracking-widest">Link na Bio</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Subtitles Overlay */}
      <SubtitlesOverlay frame={frame} />
    </AbsoluteFill>
  );
};
