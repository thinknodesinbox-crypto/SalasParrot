import { Link } from '@tanstack/react-router'
import { Container, Button, Logo } from '@/components/ui'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]/50">
      <Container>
        <nav className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="group hover:opacity-90 transition-opacity duration-200">
            <Logo className="w-10 h-10" />
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-6">
            <Link
              to="/pricing"
              className="hidden sm:block text-[#64748B] hover:text-[#1E293B] transition-colors duration-200 font-medium text-sm px-3 py-2"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="hidden sm:block text-[#64748B] hover:text-[#1E293B] transition-colors duration-200 font-medium text-sm px-3 py-2"
            >
              Login
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="default">
                Start $1 Trial
              </Button>
            </Link>
          </div>
        </nav>
      </Container>
    </header>
  )
}
