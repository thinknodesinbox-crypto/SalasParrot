import { motion } from 'framer-motion'
import { Container } from '@/components/ui'

const integrations = [
  { name: 'Clay' },
  { name: 'HubSpot' },
  { name: 'Salesforce' },
  { name: 'Pipedrive' },
  { name: 'Zapier' },
]

export function Integrations() {
  return (
    <section className="bg-white py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <h2 className="text-[24px] sm:text-[28px] md:text-[36px] font-bold text-[#1E293B] leading-tight tracking-[-0.01em] mb-3 sm:mb-4">
            Fits your GTM stack
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#475569] max-w-[560px] mx-auto leading-[1.7] font-medium px-4 sm:px-0">
            Sync with your CRM. Trigger automations. Keep data flowing.
          </p>
        </motion.div>

        {/* Logo grid - horizontal row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 mb-6"
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
              className="w-[80px] sm:w-[100px] h-[40px] sm:h-[48px] bg-[#F1F5F9] rounded-lg flex items-center justify-center"
            >
              <span className="text-[#475569] font-semibold text-xs sm:text-sm">{integration.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* API access note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-[14px] text-[#64748B] font-medium"
        >
          Full API access on all plans
        </motion.p>
      </Container>
    </section>
  )
}
