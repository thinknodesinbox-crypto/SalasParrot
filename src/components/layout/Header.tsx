import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Container, Button, Logo } from '@/components/ui'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]/50">
      <Container>
        <nav className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="group hover:opacity-90 transition-opacity duration-200">
            <Logo className="w-10 h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/pricing"
              className="text-[#64748B] hover:text-[#1E293B] transition-colors duration-200 font-medium text-sm px-3 py-2"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="text-[#64748B] hover:text-[#1E293B] transition-colors duration-200 font-medium text-sm px-3 py-2"
            >
              Login
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="default">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="sm:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <motion.span
              className="w-5 h-0.5 bg-slate-600 rounded-full"
              animate={{
                rotate: isMenuOpen ? 45 : 0,
                y: isMenuOpen ? 3 : 0,
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="w-5 h-0.5 bg-slate-600 rounded-full mt-1.5"
              animate={{
                opacity: isMenuOpen ? 0 : 1,
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="w-5 h-0.5 bg-slate-600 rounded-full mt-1.5"
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
            className="sm:hidden overflow-hidden bg-white border-t border-[#E2E8F0]/50"
          >
            <Container>
              <div className="py-4 flex flex-col gap-2">
                <Link
                  to="/pricing"
                  className="text-[#1E293B] font-medium text-[15px] px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/login"
                  className="text-[#64748B] font-medium text-[15px] px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <div className="pt-2 px-4">
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" size="lg" className="w-full justify-center">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
