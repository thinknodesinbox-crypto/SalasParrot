/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
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
          className={`grid items-center gap-8 sm:gap-12 md:grid-cols-2 lg:gap-20 ${
            imagePosition === 'left' ? 'md:flex-row-reverse' : ''
          }`}
        >
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0.2, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-200px' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center ${imagePosition === 'left' ? 'md:order-2' : ''}`}
          >
            <div className="mx-auto max-w-full px-2 text-center sm:px-0 md:mx-0 md:max-w-[520px] md:text-left">
              <h2 className="mb-2 text-[22px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1E293B] sm:mb-2.5 sm:text-[24px] md:text-[28px] lg:text-[30px]">
                {headline}
              </h2>
              <p className="text-[15px] font-medium leading-[1.7] text-[#374151] sm:text-[16px] md:text-[17px]">
                {body}
              </p>
            </div>
          </motion.div>

          {/* Interactive Panel or Placeholder */}
          <motion.div
            initial={{ opacity: 0.15, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-200px' }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
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
