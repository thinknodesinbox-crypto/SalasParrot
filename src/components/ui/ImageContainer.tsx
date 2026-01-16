interface ImageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ImageContainer({ children, className }: ImageContainerProps) {
  return (
    <div className={`gradient-container ${className || ''}`}>
      <div className="illustration-wrapper">{children}</div>
    </div>
  );
}
