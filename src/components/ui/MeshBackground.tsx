interface MeshBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'hero' | 'feature';
}

export function MeshBackground({ children, className, variant = 'feature' }: MeshBackgroundProps) {
  const isHero = variant === 'hero';

  return (
    <div
      className={`mesh-background mesh-background--${variant} ${className || ''} relative isolate overflow-hidden`}
    >
      {/* Optimized Liquid Blur Layer - High Vibrancy Edition */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white"
        style={{ willChange: 'transform' }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-60 saturate-[1.8]"
          style={{ filter: 'blur(100px)' }}
        >
          {/* Main Teal/Neon Blob - Overlay for vibrant brightness */}
          <div
            className="animate-drift-1 absolute -left-[15%] top-[10%] h-[80%] w-[80%] mix-blend-overlay"
            style={{
              background: 'radial-gradient(circle at center, #06B6D4 0%, rgba(6, 182, 212, 0) 70%)',
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            }}
          />

          {/* Deep Violet/Purple - Multiply for rich depth */}
          <div
            className="animate-drift-2 absolute -top-[20%] left-[10%] h-[70%] w-[70%] opacity-90 mix-blend-multiply"
            style={{
              background:
                'radial-gradient(circle at center, #8B5CF6 0%, rgba(139, 92, 246, 0) 70%)',
              borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            }}
          />
          <div
            className="animate-drift-3 absolute -right-[10%] top-[30%] h-[65%] w-[65%] opacity-80 mix-blend-multiply"
            style={{
              background:
                'radial-gradient(circle at center, #6366F1 0%, rgba(99, 102, 241, 0) 70%)',
              borderRadius: '40% 60% 70% 30% / 50% 60% 30% 50%',
            }}
          />

          {/* Radiant Orange/Pink - Color Dodge for "Glow" highlights */}
          <div
            className="animate-drift-3 absolute left-[35%] top-[15%] h-[55%] w-[55%] opacity-70 mix-blend-color-dodge"
            style={{
              background:
                'radial-gradient(circle at center, #F472B6 0%, rgba(244, 114, 182, 0) 70%)',
              borderRadius: '70% 30% 50% 50% / 30% 30% 70% 70%',
            }}
          />
          <div
            className="animate-drift-1 absolute bottom-[0%] right-[10%] h-[65%] w-[65%] mix-blend-overlay"
            style={{
              background:
                'radial-gradient(circle at center, #FB923C 0%, rgba(251, 146, 60, 0) 70%)',
              borderRadius: '30% 70% 70% 30% / 50% 30% 70% 50%',
            }}
          />

          {/* Intense Neon Teal highlight - Screen for light popping */}
          <div
            className="animate-drift-2 absolute bottom-[20%] left-[20%] h-[45%] w-[45%] opacity-60 mix-blend-screen"
            style={{
              background:
                'radial-gradient(circle at center, #22D3EE 0%, rgba(34, 211, 238, 0) 70%)',
              borderRadius: '50% 50% 20% 80% / 40% 40% 60% 60%',
            }}
          />

          {isHero && (
            <>
              {/* Extra intense layers for Hero */}
              <div
                className="absolute left-[15%] top-[45%] h-[50%] w-[50%] opacity-50 mix-blend-overlay"
                style={{
                  background:
                    'radial-gradient(circle at center, #0D9488 0%, rgba(13, 148, 136, 0) 70%)',
                  borderRadius: '50%',
                }}
              />
              <div
                className="absolute right-[20%] top-[20%] h-[40%] w-[40%] opacity-40 mix-blend-color-dodge"
                style={{
                  background:
                    'radial-gradient(circle at center, #EC4899 0%, rgba(236, 72, 153, 0) 70%)',
                  borderRadius: '50%',
                }}
              />
            </>
          )}
        </div>

        {/* Static Refinement Texture (Grain) - Soften the vibrancy */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 flex h-full w-full items-center justify-center">{children}</div>
    </div>
  );
}
