import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui';

const learningBlocks = [
  {
    title: 'Understand what works',
    desc: 'See which audiences, messages, signals, and channels create the best conversations.',
  },
  {
    title: 'Act with better context',
    desc: 'Use data from inbound and outbound activity to decide what action to take next.',
  },
  {
    title: 'Improve every motion',
    desc: 'Turn every campaign, reply, meeting, and customer touchpoint into learning.',
  },
];

export function LearningSection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="border-t border-slate-100 bg-white py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[1000px]">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-2xl px-4 text-center">
            <h2 className="mb-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1E293B] md:text-[38px]">
              Every motion makes your growth engine smarter.
            </h2>
            <p className="text-[15px] font-medium leading-relaxed text-slate-500 md:text-[16px]">
              SalesParrot learns from audiences, signals, replies, campaigns, and customer
              interactions, so every new motion starts with better context.
            </p>
          </div>

          {/* 3-Column Split Layout with Active Progress Animation */}
          <div className="relative mx-2 grid grid-cols-1 gap-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.01)] sm:mx-0 md:grid-cols-3">
            {learningBlocks.map((block, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={block.title}
                  onClick={() => setActiveStep(idx)}
                  className={`relative flex cursor-pointer select-none flex-col items-center p-8 text-center transition-all duration-500 md:items-start md:text-left ${
                    isActive ? 'bg-[#F8FAFC]' : 'bg-white hover:bg-slate-50/30'
                  } ${idx < 2 ? 'border-b border-slate-200 md:border-b-0 md:border-r' : ''}`}
                >
                  {/* Premium Sequential Top Progress Filler Bar */}
                  <div className="absolute left-0 right-0 top-0 h-[2.5px] overflow-hidden bg-slate-100/60">
                    {isActive && (
                      <motion.div
                        className="h-full bg-[#EA580C]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3.5, ease: 'linear' }}
                      />
                    )}
                  </div>

                  {/* Clean Editorial Mono Number */}
                  <span
                    className={`mb-3.5 block font-mono text-[20px] font-semibold transition-colors duration-300 ${
                      isActive ? 'text-[#EA580C]' : 'text-slate-300'
                    }`}
                  >
                    0{idx + 1}
                  </span>

                  <h3 className="mb-2.5 text-[17px] font-bold leading-tight tracking-tight text-[#1E293B]">
                    {block.title}
                  </h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">
                    {block.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
