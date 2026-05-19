import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Button, Logo } from '@/components/ui';
import { useAuthStore } from '@/lib/auth';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <header className="sticky top-4 z-50 mx-4 max-w-4xl rounded-full border border-[#E2E8F0] bg-white/80 backdrop-blur-md transition-all duration-300 md:mx-auto">
      <Container>
        <nav className="flex h-12 items-center justify-between md:h-14">
          {/* Logo */}
          <Link to="/" className="group transition-opacity duration-200 hover:opacity-90">
            <Logo className="h-8 w-8 md:h-9 md:w-9" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 sm:flex">
            <a
              href="#product"
              className="px-3 py-1.5 text-base font-medium text-[#64748B] transition-colors duration-200 hover:text-[#1E293B]"
            >
              Product
            </a>
            <a
              href="#playbooks"
              className="px-3 py-1.5 text-base font-medium text-[#64748B] transition-colors duration-200 hover:text-[#1E293B]"
            >
              Playbooks
            </a>
            <Link
              to="/pricing"
              className="px-3 py-1.5 text-base font-medium text-[#64748B] transition-colors duration-200 hover:text-[#1E293B]"
            >
              Pricing
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                search={{ next: undefined }}
                className="px-3 py-1.5 text-base font-medium text-[#64748B] transition-colors duration-200 hover:text-[#1E293B]"
              >
                Login
              </Link>
            )}
            <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
              <Button variant="primary" size="default" className="px-4 py-1.5 text-xs">
                {isAuthenticated ? 'Dashboard' : 'Get Started'}
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="flex h-10 w-10 flex-col items-center justify-center rounded-lg transition-colors hover:bg-slate-100 sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <motion.span
              className="h-0.5 w-5 rounded-full bg-slate-600"
              animate={{
                rotate: isMenuOpen ? 45 : 0,
                y: isMenuOpen ? 3 : 0,
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="mt-1.5 h-0.5 w-5 rounded-full bg-slate-600"
              animate={{
                opacity: isMenuOpen ? 0 : 1,
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="mt-1.5 h-0.5 w-5 rounded-full bg-slate-600"
              animate={{
                rotate: isMenuOpen ? -45 : 0,
                y: isMenuOpen ? -9 : 0,
              }}
              transition={{ duration: 0.2 }}
            />
          </button>
        </nav>
      </Container>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-b-3xl border-t border-[#E2E8F0]/50 bg-white/95 sm:hidden"
          >
            <Container>
              <div className="flex flex-col gap-2 py-4">
                <a
                  href="#product"
                  className="rounded-lg px-4 py-3 text-[17px] font-medium text-[#1E293B] transition-colors hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Product
                </a>
                <a
                  href="#playbooks"
                  className="rounded-lg px-4 py-3 text-[17px] font-medium text-[#1E293B] transition-colors hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Playbooks
                </a>
                <Link
                  to="/pricing"
                  className="rounded-lg px-4 py-3 text-[17px] font-medium text-[#1E293B] transition-colors hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    search={{ next: undefined }}
                    className="rounded-lg px-4 py-3 text-[17px] font-medium text-[#64748B] transition-colors hover:bg-slate-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
                <div className="px-4 pt-2">
                  <Link
                    to={isAuthenticated ? '/dashboard' : '/signup'}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="primary" size="lg" className="w-full justify-center">
                      {isAuthenticated ? 'Dashboard' : 'Get Started'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
