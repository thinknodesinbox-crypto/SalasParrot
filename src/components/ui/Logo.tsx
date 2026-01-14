import logoImage from '@/assets/images/logo.png'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = 'w-10 h-10', showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoImage}
        alt="SalesParrot"
        className={`${className} object-contain`}
      />
      {showText && (
        <span className="font-bold text-xl text-[#1E293B]">SalesParrot</span>
      )}
    </div>
  )
}
