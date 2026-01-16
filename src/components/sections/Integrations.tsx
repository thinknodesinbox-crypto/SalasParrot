import { motion } from 'framer-motion';
import { Container } from '@/components/ui';

const integrations = [
  { name: 'Clay' },
  { name: 'HubSpot' },
  { name: 'Salesforce' },
  { name: 'Pipedrive' },
  { name: 'Zapier' },
];

export function Integrations() {
  return (
    <section className="bg-white py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="mb-3 text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#1E293B] sm:mb-4 sm:text-[28px] md:text-[36px]">
            Fits your GTM stack
          </h2>
          <p className="mx-auto max-w-[560px] px-4 text-[15px] font-medium leading-[1.7] text-[#475569] sm:px-0 sm:text-[17px]">
            Sync with your CRM. Trigger automations. Keep data flowing.
          </p>
        </motion.div>

        {/* Logo grid - horizontal row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6"
        >
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: 0.2 + index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex h-[40px] w-[80px] items-center justify-center rounded-lg bg-[#F1F5F9] sm:h-[48px] sm:w-[100px]"
            >
              <span className="text-xs font-semibold text-[#475569] sm:text-sm">
                {integration.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* API access note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-[14px] font-medium text-[#64748B]"
        >
          Full API access on all plans
        </motion.p>
      </Container>
    </section>
  );
}
