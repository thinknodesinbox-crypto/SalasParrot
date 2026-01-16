import { motion } from 'framer-motion';
import { Container, MeshBackground } from '@/components/ui';

interface FeatureProps {
  headline: string;
  body: string;
  imagePosition?: 'left' | 'right';
  background?: 'white' | 'cream';
  imagePlaceholder?: string;
  panel?: React.ReactNode;
}

export function Feature({
  headline,
  body,
  imagePosition = 'right',
  background = 'white',
  imagePlaceholder = 'Feature Image',
  panel,
}: FeatureProps) {
  const bgClass = background === 'cream' ? 'bg-[#FFFBEB]' : 'bg-white';

  return (
    <section className={`${bgClass} py-16 md:py-24`}>
      <Container>
        <div
          className={`grid items-center gap-8 sm:gap-12 md:grid-cols-2 lg:gap-16 ${
            imagePosition === 'left' ? 'md:flex-row-reverse' : ''
          }`}
        >
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={imagePosition === 'left' ? 'md:order-2' : ''}
          >
            <div className="mx-auto max-w-full px-2 text-center sm:px-0 md:mx-0 md:max-w-[420px] md:text-left">
              <h2 className="mb-3 text-[22px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1E293B] sm:mb-5 sm:text-[26px] md:text-[32px] lg:text-[36px]">
                {headline}
              </h2>
              <p className="text-[14px] font-medium leading-[1.7] text-[#475569] sm:text-[16px] md:text-[17px]">
                {body}
              </p>
            </div>
          </motion.div>

          {/* Interactive Panel or Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={imagePosition === 'left' ? 'md:order-1' : ''}
          >
            <MeshBackground variant="feature">
              {panel || <div className="text-sm text-white/50">{imagePlaceholder}</div>}
            </MeshBackground>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
