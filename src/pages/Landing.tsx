import { Link } from 'react-router-dom';
import { Music2, Zap, Crown, Star, ChevronRight, Guitar, Headphones, Brain } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-body overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <img src="/logo.png" alt="MelodAI" className="h-8 w-auto" />
          <Link to="/dashboard" className="text-sm text-[#FACC15] border border-[#FACC15]/30 rounded-full px-4 py-1.5 hover:bg-[#FACC15]/10 transition-colors">
            Entrar no App →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="container mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#FACC15]/10 border border-[#FACC15]/20 rounded-full px-4 py-1.5 text-xs text-[#FACC15] mb-8">
            <Zap size={12} />
            O app de cifras com Inteligência Artificial
          </div>
          <img src="/logo.png" alt="MelodAI" className="h-20 w-auto mx-auto mb-6" />
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Cifras completas, modo graus, campo harmônico e muito mais.<br />
            Para quem toca na <strong className="text-white">igreja</strong>, no <strong className="text-white">bar</strong> ou em <strong className="text-white">casa</strong>.
          </p>
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold text-base px-8 py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_30px_-4px_rgba(250,204,21,0.5)]">
            Começar Grátis
            <ChevronRight size={18} />
          </Link>
          <p className="text-xs text-white/30 mt-4">Sem cartão de crédito. Grátis para sempre no plano Músico.</p>
        </div>
      </section>

      {/* Tom */}
      <section className="py-16 px-6 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="container mx-auto max-w-3xl flex flex-col md:flex-row items-center gap-10">
          <div className="flex-shrink-0 w-40 h-40 rounded-3xl bg-gradient-to-br from-[#FACC15]/20 to-[#FACC15]/5 border border-[#FACC15]/20 flex items-center justify-center">
            <Music2 size={64} className="text-[#FACC15]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[#FACC15]/60 mb-2">Apresentando o Tom</p>
            <h2 className="font-display text-2xl font-bold mb-3">Seu guia musical no MelodAI</h2>
            <p className="text-white/60 leading-relaxed">
              O Tom está aqui pra te ajudar a evoluir como músico. Cifras, graus, harmonia — tudo na palma da sua mão. Chega de ficar garimpando em sites bagunçados.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Tudo que você precisa pra tocar</h2>
          <p className="text-center text-white/40 mb-14 text-sm">De músico iniciante a instrumentista experiente</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Guitar size={28} />, title: 'Cifras Completas', desc: 'Mais de 200 músicas organizadas por artista e gênero. Transposição com um toque.', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400' },
              { icon: <Brain size={28} />, title: 'Modo Graus', desc: 'Veja a cifra em graus (I, IV, V) e treine seu ouvido enquanto toca. Exclusivo do MelodAI.', color: 'from-[#FACC15]/20 to-[#FACC15]/5', border: 'border-[#FACC15]/20', text: 'text-[#FACC15]' },
              { icon: <Headphones size={28} />, title: 'Ferramentas Pro', desc: 'Metrônomo visual, afinador, campo harmônico e modo performance. Tudo integrado.', color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
            ].map((f, i) => (
              <div key={i} className={`rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} p-6`}>
                <div className={`mb-4 ${f.text}`}>{f.icon}</div>
                <h3 className="font-display text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Escolha seu plano</h2>
          <p className="text-center text-white/40 mb-14 text-sm">Comece grátis, evolua quando quiser</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Músico */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 flex flex-col">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Músico</p>
              <p className="font-display text-3xl font-bold mb-1">Grátis</p>
              <p className="text-xs text-white/30 mb-6">Para sempre</p>
              <ul className="space-y-2 text-sm text-white/60 flex-1 mb-8">
                {['Cifras completas', 'Só Cifras', 'Cifra Simplificada', 'Capotraste', 'Músicas Favoritas', 'Pedir Música', 'Cifra Rápida (3x/dia)'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center border border-white/20 rounded-xl py-3 text-sm font-semibold hover:bg-white/5 transition-colors">
                Começar Grátis
              </Link>
            </div>

            {/* Artista — destaque */}
            <div className="rounded-2xl border border-[#FACC15]/40 bg-gradient-to-b from-[#FACC15]/10 to-transparent p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FACC15] text-black text-[10px] font-bold px-3 py-1 rounded-full">MAIS POPULAR</div>
              <p className="text-xs uppercase tracking-widest text-[#FACC15]/60 mb-2">Artista</p>
              <p className="font-display text-3xl font-bold mb-1">R$ 14,90<span className="text-base font-normal text-white/40">/mês</span></p>
              <p className="text-xs text-white/30 mb-6">ou R$ 119/ano</p>
              <ul className="space-y-2 text-sm text-white/60 flex-1 mb-8">
                {['Tudo do Músico +', 'Modo Graus', 'Campo Harmônico', 'Metrônomo Visual', 'Modo Performance', 'Cifra Rápida ilimitado', 'Mestre do Campo Harmônico', 'Mestre do Ritmo', 'Afinador'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#FACC15]">✓</span>{f}</li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center bg-[#FACC15] hover:bg-[#E6B800] text-black rounded-xl py-3 text-sm font-bold transition-colors">
                Assinar Artista
              </Link>
            </div>

            {/* Maestro */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={14} className="text-purple-400" />
                <p className="text-xs uppercase tracking-widest text-purple-400/60">Maestro</p>
              </div>
              <p className="font-display text-3xl font-bold mb-1">R$ 24,90<span className="text-base font-normal text-white/40">/mês</span></p>
              <p className="text-xs text-white/30 mb-6">ou R$ 199/ano</p>
              <ul className="space-y-2 text-sm text-white/60 flex-1 mb-8">
                {['Tudo do Artista +', 'Ouvido Biônico', 'Inversão & Baixo', 'Progressões Famosas', 'Metrônomo avançado', 'Prioridade em pedidos'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-purple-400">✓</span>{f}</li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center border border-purple-500/40 rounded-xl py-3 text-sm font-semibold text-purple-300 hover:bg-purple-500/10 transition-colors">
                Assinar Maestro
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 text-center">
        <div className="container mx-auto max-w-xl">
          <Star size={32} className="text-[#FACC15] mx-auto mb-6 fill-[#FACC15]" />
          <h2 className="font-display text-3xl font-bold mb-4">Pronto pra evoluir?</h2>
          <p className="text-white/40 mb-8">Junte-se a músicos de todo o Brasil que já usam o MelodAI para tocar melhor.</p>
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold text-base px-8 py-4 rounded-2xl transition-all shadow-[0_0_30px_-4px_rgba(250,204,21,0.4)]">
            Começar Agora — É Grátis
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center text-xs text-white/20">
        <img src="/logo.png" alt="MelodAI" className="h-6 w-auto mx-auto mb-3 opacity-40" />
        <p>© 2026 MelodAI. Todos os direitos reservados.</p>
        <p className="mt-1">melodai.com.br</p>
      </footer>

    </div>
  );
}
