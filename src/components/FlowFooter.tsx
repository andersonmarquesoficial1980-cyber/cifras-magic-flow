export function FlowFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="container mx-auto max-w-3xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <div
              className="absolute inset-0 rounded-lg opacity-40 blur-md"
              style={{ background: 'hsl(var(--flow-glow))' }}
            />
            <span className="relative text-sm">🎵</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground font-body">Próximo Passo do Flow</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground font-body animate-pulse">
              IA analisando o tom e o ritmo para sugerir a próxima música...
            </p>
          </div>
          <div
            className="h-2 w-2 rounded-full"
            style={{
              background: 'hsl(var(--flow-glow))',
              boxShadow: '0 0 8px 2px hsl(var(--flow-glow) / 0.5)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
