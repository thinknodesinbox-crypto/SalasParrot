import { Link } from '@tanstack/react-router'
import { Container, Logo } from '@/components/ui'

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '/' },
      { label: 'Pricing', href: '/' },
      { label: 'Integrations', href: '/' },
      { label: 'Changelog', href: '/' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/' },
      { label: 'Help Center', href: '/' },
      { label: 'Tutorials', href: '/' },
      { label: 'API Docs', href: '/' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About', href: '/' },
      { label: 'Careers', href: '/' },
      { label: 'Contact', href: '/' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/' },
      { label: 'Terms', href: '/' },
      { label: 'Security', href: '/' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0]">
      <Container>
        <div className="pt-10 sm:pt-16 pb-8">
          {/* Top section */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-10">
            {/* Logo column */}
            <div className="col-span-2">
              <Link to="/" className="inline-block mb-3 sm:mb-4">
                <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
              </Link>
              <p className="text-[13px] sm:text-[14px] text-[#64748B] leading-relaxed max-w-[280px]">
                LinkedIn + Email outreach platform
              </p>
            </div>

            {/* Links columns */}
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-[#1E293B] mb-2 sm:mb-4 text-[13px] sm:text-[14px]">{section.title}</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-[#64748B] hover:text-[#1E293B] transition-colors duration-200 text-[12px] sm:text-[14px]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom section */}
          <div className="pt-4 sm:pt-6 border-t border-[#E2E8F0]">
            <p className="text-[#94A3B8] text-[12px] sm:text-[14px]">
              &copy; {new Date().getFullYear()} SalesParrot. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
