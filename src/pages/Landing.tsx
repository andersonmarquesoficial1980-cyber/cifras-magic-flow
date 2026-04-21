import { Link } from 'react-router-dom';
import { Music2, Zap, Crown, Star, ChevronRight, Brain, Headphones, Guitar } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1a1a2e] font-body overflow-x-hidden">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F7F2]/95 backdrop-blur border-b border-black/[0.06] px-6 py-3">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <img src="/logo.png" alt="MelodAI" className="h-10 w-auto" />
          <Link to="/dashboard" className="text-sm font-bold text-white bg-[#1a1a2e] rounded-full px-5 py-2 hover:bg-[#2d2d4e] transition-colors">
            Abrir App →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 px-6 text-center bg-gradient-to-b from-[#F9F7F2] to-white">
        <div className="container mx-auto max-w-2xl">
          <img src="/logo.png" alt="MelodAI" className="h-28 w-auto mx-auto mb-8" />
          <h1 className="font-display text-4xl md:text-5xl font-black text-[#1a1a2e] mb-5 leading-tight">
            O app de cifras feito pra quem <span className="text-[#4F6EF7]">toca de verdade</span>
          </h1>
          <p className="text-xl font-bold text-[#1a1a2e] mb-2 leading-relaxed">
            Igreja, bar ou sala de casa — o MelodAI tem tudo que você precisa.
          </p>
          <p className="text-lg text-[#4F6EF7] font-bold mb-8">
            Cifras, modo graus, campo harmônico e muito mais.
          </p>
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 bg-[#4F6EF7] hover:bg-[#3a5be0] text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#4F6EF7]/30">
            Começar Grátis
            <ChevronRight size={20} />
          </Link>
          <p className="text-sm font-bold text-[#1a1a2e]/50 mt-4">Sem cartão de crédito. Grátis para sempre no plano Músico.</p>
        </div>
      </section>

      {/* Features 3 cards */}
      <section className="py-14 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Guitar size={32} />, title: 'Cifras Completas', desc: 'Mais de 200 músicas organizadas. Transposição com um toque.', bg: 'bg-purple-50', border: 'border-purple-100', icon_color: 'text-purple-500' },
              { icon: <Brain size={32} />, title: 'Modo Graus ⭐', desc: 'Veja I, IV, V na cifra e treine seu ouvido. Exclusivo do MelodAI.', bg: 'bg-blue-50', border: 'border-blue-100', icon_color: 'text-[#4F6EF7]' },
              { icon: <Headphones size={32} />, title: 'Ferramentas Pro', desc: 'Metrônomo, afinador, campo harmônico e modo performance.', bg: 'bg-yellow-50', border: 'border-yellow-100', icon_color: 'text-yellow-500' },
            ].map((f, i) => (
              <div key={i} className={`${f.bg} border ${f.border} rounded-3xl p-7`}>
                <div className={`${f.icon_color} mb-4`}>{f.icon}</div>
                <h3 className="font-display text-xl font-bold text-[#1a1a2e] mb-2">{f.title}</h3>
                <p className="text-[#1a1a2e]/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tom */}
      <section className="py-14 px-6 bg-gradient-to-br from-[#4F6EF7]/10 to-purple-100/50">
        <div className="container mx-auto max-w-3xl flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="flex-shrink-0 w-28 h-28 rounded-3xl bg-gradient-to-br from-[#4F6EF7] to-purple-500 flex items-center justify-center shadow-lg shadow-[#4F6EF7]/30">
            <Music2 size={52} className="text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[#4F6EF7] mb-1">Seu guia musical</p>
            <h2 className="font-display text-2xl font-black text-[#1a1a2e] mb-2">Conheça o Tom</h2>
            <p className="text-[#1a1a2e]/60 leading-relaxed">
              O Tom é o personagem do MelodAI. Músico raiz, apaixonado por ensinar. Ele te guia por cifras, graus e harmonia de um jeito que nenhum outro app faz.
            </p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-black text-center text-[#1a1a2e] mb-2">Escolha seu plano</h2>
          <p className="text-center text-[#1a1a2e]/40 mb-12 text-sm">Comece grátis, evolua quando quiser</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Músico */}
            <div className="rounded-3xl border-2 border-[#1a1a2e]/10 bg-[#F9F7F2] p-7 flex flex-col">
              <p className="text-xs uppercase tracking-widest text-[#1a1a2e]/40 mb-1">Músico</p>
              <p className="font-display text-4xl font-black text-[#1a1a2e] mb-1">Grátis</p>
              <p className="text-xs text-[#1a1a2e]/30 mb-6">Para sempre</p>
              <ul className="space-y-2.5 text-sm text-[#1a1a2e]/60 flex-1 mb-8">
                {['Cifras completas', 'Só Cifras', 'Cifra Simplificada', 'Capotraste', 'Músicas Favoritas', 'Pedir Música', 'Cifra Rápida (3×/dia)'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center border-2 border-[#1a1a2e]/20 rounded-xl py-3 text-sm font-bold text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-colors">
                Começar Grátis
              </Link>
            </div>

            {/* Artista */}
            <div className="rounded-3xl border-2 border-[#4F6EF7] bg-[#4F6EF7] p-7 flex flex-col relative shadow-xl shadow-[#4F6EF7]/25">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FACC15] text-[#1a1a2e] text-[11px] font-black px-4 py-1.5 rounded-full shadow">MAIS POPULAR</div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Artista</p>
              <p className="font-display text-4xl font-black text-white mb-1">R$14,90<span className="text-base font-normal text-white/50">/mês</span></p>
              <p className="text-xs text-white/40 mb-6">ou R$ 119/ano</p>
              <ul className="space-y-2.5 text-sm text-white/80 flex-1 mb-8">
                {['Tudo do Músico +', 'Modo Graus', 'Campo Harmônico', 'Metrônomo Visual', 'Modo Performance', 'Cifra Rápida ilimitado', 'Mestre do Campo Harmônico', 'Mestre do Ritmo', 'Afinador'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#FACC15] font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center bg-white hover:bg-white/90 text-[#4F6EF7] rounded-xl py-3 text-sm font-black transition-colors">
                Assinar Artista
              </Link>
            </div>

            {/* Maestro */}
            <div className="rounded-3xl border-2 border-purple-200 bg-purple-50 p-7 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={14} className="text-purple-500" />
                <p className="text-xs uppercase tracking-widest text-purple-400">Maestro</p>
              </div>
              <p className="font-display text-4xl font-black text-[#1a1a2e] mb-1">R$24,90<span className="text-base font-normal text-[#1a1a2e]/40">/mês</span></p>
              <p className="text-xs text-[#1a1a2e]/30 mb-6">ou R$ 199/ano</p>
              <ul className="space-y-2.5 text-sm text-[#1a1a2e]/60 flex-1 mb-8">
                {['Tudo do Artista +', 'Ouvido Biônico', 'Inversão & Baixo', 'Progressões Famosas', 'Metrônomo avançado', 'Prioridade em pedidos'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center border-2 border-purple-300 rounded-xl py-3 text-sm font-bold text-purple-600 hover:bg-purple-100 transition-colors">
                Assinar Maestro
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 px-6 text-center bg-gradient-to-b from-white to-[#F9F7F2]">
        <div className="container mx-auto max-w-xl">
          <Star size={36} className="text-[#FACC15] mx-auto mb-5 fill-[#FACC15]" />
          <h2 className="font-display text-3xl font-black text-[#1a1a2e] mb-4">Pronto pra tocar melhor?</h2>
          <p className="text-[#1a1a2e]/40 mb-8 text-sm">Junte-se a músicos de todo o Brasil.</p>
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 bg-[#4F6EF7] hover:bg-[#3a5be0] text-white font-black text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-[#4F6EF7]/30">
            Começar Agora — É Grátis
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-black/[0.06] text-center text-xs text-[#1a1a2e]/30 bg-[#F9F7F2]">
        <img src="/logo.png" alt="MelodAI" className="h-7 w-auto mx-auto mb-3 opacity-40" />
        <p>© 2026 MelodAI. Todos os direitos reservados.</p>
        <p className="mt-1">melodai.com.br</p>
      </footer>

    </div>
  );
}
