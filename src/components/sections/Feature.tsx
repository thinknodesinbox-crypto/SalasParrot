import { motion } from 'framer-motion'
import { Container, MeshBackground } from '@/components/ui'

interface FeatureProps {
  headline: string
  body: string
  imagePosition?: 'left' | 'right'
  background?: 'white' | 'cream'
  imagePlaceholder?: string
  panel?: React.ReactNode
}

export function Feature({
  headline,
  body,
  imagePosition = 'right',
  background = 'white',
  imagePlaceholder = 'Feature Image',
  panel,
}: FeatureProps) {
  const bgClass = background === 'cream' ? 'bg-[#FFFBEB]' : 'bg-white'

  return (
    <section className={`${bgClass} py-16 md:py-24`}>
      <Container>
        <div
          className={`grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center ${
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
            <div className="max-w-full md:max-w-[420px] mx-auto md:mx-0 text-center md:text-left px-2 sm:px-0">
              <h2 className="text-[22px] sm:text-[26px] md:text-[32px] lg:text-[36px] font-bold text-[#1E293B] leading-[1.2] tracking-[-0.02em] mb-3 sm:mb-5">
                {headline}
              </h2>
              <p className="text-[14px] sm:text-[16px] md:text-[17px] text-[#475569] leading-[1.7] font-medium">{body}</p>
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
              {panel || (
                <div className="text-white/50 text-sm">
                  {imagePlaceholder}
                </div>
              )}
            </MeshBackground>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
