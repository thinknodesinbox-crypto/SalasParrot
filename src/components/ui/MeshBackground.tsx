interface MeshBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'hero' | 'feature';
}

export function MeshBackground({ children, className, variant = 'feature' }: MeshBackgroundProps) {
  return (
    <div
      className={`mesh-background mesh-background--${variant} ${className || ''}`}
      style={{
        backgroundImage: `
          url(/images/hero-mesh-bg.webp),
          radial-gradient(ellipse 70% 70% at 0% 50%, rgba(20, 184, 166, 0.9) 0%, transparent 60%),
          radial-gradient(ellipse 60% 60% at 30% 30%, rgba(167, 139, 250, 0.85) 0%, transparent 55%),
          radial-gradient(ellipse 70% 70% at 100% 30%, rgba(167, 139, 250, 0.7) 0%, transparent 50%),
          radial-gradient(ellipse 60% 60% at 50% 60%, rgba(255, 180, 150, 0.8) 0%, transparent 55%),
          radial-gradient(ellipse 50% 50% at 80% 70%, rgba(255, 200, 170, 0.6) 0%, transparent 50%),
          linear-gradient(135deg, #f8fafb 0%, #fefefe 50%, #f8fafb 100%)
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </div>
  );
}
