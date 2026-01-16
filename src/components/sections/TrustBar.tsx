import { motion } from 'framer-motion';

const integrations = [
  { name: 'Clay', logo: '/images/logos/clay.png', height: 44, width: 100 },
  { name: 'HubSpot', logo: '/images/logos/hubspot.png', height: 40, width: 145 },
  { name: 'Salesforce', logo: '/images/logos/salesforce.png', height: 54, width: 78 },
  { name: 'Pipedrive', logo: '/images/logos/pipedrive.png', height: 38, width: 140 },
  { name: 'Zapier', logo: '/images/logos/zapier.png', height: 42, width: 125 },
];

export function TrustBar() {
  return (
    <section className="bg-[#FAFBFC] py-10 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.p
          className="mb-6 text-center text-[13px] font-medium tracking-wide text-slate-400 sm:mb-8 sm:text-[14px] md:mb-10 md:text-[15px]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Integrates with tools you already use
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-14 lg:gap-20">
          {integrations.map((item, index) => (
            <motion.div
              key={item.name}
              className="flex scale-[0.65] items-center justify-center sm:scale-[0.8] md:scale-100"
              style={{ width: item.width, height: item.height }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <img
                src={item.logo}
                alt={item.name}
                style={{
                  maxHeight: item.height,
                  maxWidth: item.width,
                  objectFit: 'contain',
                }}
                className="opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
