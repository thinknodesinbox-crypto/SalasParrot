import { Link } from '@tanstack/react-router';
import { Container, Logo } from '@/components/ui';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Open Lists', href: '/openlists' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'API Docs', href: '/docs/api' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
};

export function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
      <Container>
        <div className="pb-8 pt-10 sm:pt-16">
          {/* Top section */}
          <div className="mb-8 grid grid-cols-2 gap-6 sm:mb-10 sm:gap-8 md:grid-cols-6 lg:gap-12">
            {/* Logo column */}
            <div className="col-span-2">
              <Link to="/" className="mb-3 inline-block sm:mb-4">
                <Logo className="h-8 w-8 sm:h-10 sm:w-10" />
              </Link>
              <p className="max-w-[280px] text-[13px] leading-relaxed text-[#64748B] sm:text-[14px]">
                LinkedIn + Email outreach platform
              </p>
            </div>

            {/* Links columns */}
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h4 className="mb-2 text-[13px] font-semibold text-[#1E293B] sm:mb-4 sm:text-[14px]">
                  {section.title}
                </h4>
                <ul className="space-y-2 sm:space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-[12px] text-[#64748B] transition-colors duration-200 hover:text-[#1E293B] sm:text-[14px]"
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
          <div className="border-t border-[#E2E8F0] pt-4 sm:pt-6">
            <p className="text-[12px] text-[#94A3B8] sm:text-[14px]">
              &copy; {new Date().getFullYear()} SalesParrot. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
