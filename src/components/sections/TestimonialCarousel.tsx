import { useRef, useEffect, useCallback } from 'react';

interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  headline: string;
  body: string;
  avatar: string;
  logo: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Samuel A',
    title: 'Director of Sales',
    company: 'KP',
    headline: 'I woke up to meetings I didn\u2019t book.',
    body: 'The AI replied to my LinkedIn messages overnight, handled the back and forth, and scheduled calls while I slept. Like having an SDR that never clocks out.',
    avatar: '/images/testimonials/john_dukes.webp',
    logo: '/images/testimonials/kingdom_printers.webp',
  },
  {
    id: '2',
    name: 'Eric Thomas',
    title: 'CEO',
    company: 'Catalyst Commerce',
    headline: 'We canceled 3 tools in our first week.',
    body: 'We were paying for a LinkedIn tool, a cold email tool, and enrichment credits separately. SalesParrot replaced all three. Setup took 20 minutes. Our outbound bill dropped by 60%.',
    avatar: '/images/testimonials/eric_thomas.webp',
    logo: '/images/testimonials/catalyst_corporation.webp',
  },
  {
    id: '3',
    name: 'Garrison Kemp',
    title: 'Founder & CEO',
    company: 'Apex Dynamics',
    headline: '47 meetings in 30 days. All decision makers.',
    body: 'I imported our list from Sales Navigator, launched one sequence, and the replies started within 48 hours. Not tire kickers. VPs, founders, C-suite. Exactly who we needed.',
    avatar: '/images/testimonials/garrison_kemp.webp',
    logo: '/images/testimonials/apex_dynamics.webp',
  },
  {
    id: '4',
    name: 'Jennifer Moore',
    title: 'Head of Growth',
    company: 'Prism',
    headline: 'I finally see my whole team\u2019s pipeline in one place.',
    body: '5 reps, 5 LinkedIn accounts, one dashboard. I know who\u2019s sending, who\u2019s getting replies, and what\u2019s converting. No more chasing anyone for updates.',
    avatar: '/images/testimonials/jennifer_moore.webp',
    logo: '/images/testimonials/meridian_solutions.webp',
  },
  {
    id: '5',
    name: 'Luna Northcott',
    title: 'VP of Sales',
    company: 'Maven Digital',
    headline: '30% of our meetings came from people who ignored us on LinkedIn.',
    body: 'They didn\u2019t accept the connection request. SalesParrot found their email and followed up automatically. That\u2019s pipeline we would\u2019ve lost with any other tool.',
    avatar: '/images/testimonials/luna_northcott.webp',
    logo: '/images/testimonials/arcadia_holdings.webp',
  },
  {
    id: '6',
    name: 'Anthony Harris',
    title: 'COO',
    company: 'Obsidian Partners',
    headline: 'Outbound finally runs without me.',
    body: 'I used to spend 2 hours a day in LinkedIn DMs. Now I launch a sequence, the AI handles replies, and I just show up to the calls. Got my mornings back.',
    avatar: '/images/testimonials/anthony_harris.webp',
    logo: '/images/testimonials/obsidian_partners.webp',
  },
  {
    id: '7',
    name: 'Samuel A',
    title: 'Director of Sales',
    company: 'KP',
    headline: '4 LinkedIn accounts, 6 months, zero restrictions.',
    body: 'After getting flagged on another tool, I was paranoid. SalesParrot\u2019s proxy setup and daily limits just work. All four accounts still clean. Haven\u2019t thought about it once.',
    avatar: '/images/testimonials/john_dukes.webp',
    logo: '/images/testimonials/kingdom_printers.webp',
  },
  {
    id: '8',
    name: 'Jennifer Moore',
    title: 'Head of Growth',
    company: 'Prism',
    headline: 'The only tool that didn\u2019t stop at sending.',
    body: 'We\u2019ve tried every outreach platform out there. They all send messages and wish you luck. SalesParrot actually handles the replies and books the meeting. That\u2019s the difference.',
    avatar: '/images/testimonials/jennifer_moore.webp',
    logo: '/images/testimonials/meridian_solutions.webp',
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="mx-2 w-[280px] flex-shrink-0 rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-[0_2px_12px_rgba(30,41,59,0.06)] sm:mx-3 sm:w-[320px] sm:p-6">
      <p className="mb-2 text-[13px] font-bold leading-snug text-[#1E293B] sm:text-[14px]">
        &ldquo;{testimonial.headline}&rdquo;
      </p>
      <p className="mb-4 text-[12px] leading-[1.7] text-[#475569] sm:mb-5 sm:text-[13px]">
        &ldquo;{testimonial.body}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="h-8 w-8 rounded-full object-cover object-center sm:h-10 sm:w-10"
          />
          <div>
            <p className="text-[12px] font-semibold text-[#1E293B] sm:text-[13px]">
              {testimonial.name}
            </p>
            <p className="text-[10px] text-[#64748B] sm:text-[11px]">
              {testimonial.title}, {testimonial.company}
            </p>
          </div>
        </div>
        <img
          src={testimonial.logo}
          alt={testimonial.company}
          className="h-7 w-7 object-contain sm:h-9 sm:w-9"
        />
      </div>
    </div>
  );
}

// Build a tripled array for seamless infinite scrolling
const tripled = [...testimonials, ...testimonials, ...testimonials];

export function TestimonialCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPosRef = useRef(0);
  const velocityRef = useRef(0);
  const lastDragXRef = useRef(0);
  const lastDragTimeRef = useRef(0);

  // Auto-scroll speed: pixels per frame (~0.8px at 60fps = ~48px/s)
  const BASE_SPEED = 0.8;

  // Get width of one full set of cards
  const getSetWidth = useCallback(() => {
    if (!trackRef.current) return 1;
    return trackRef.current.scrollWidth / 3;
  }, []);

  // Apply position to track (GPU-accelerated via translate3d)
  const applyPosition = useCallback(() => {
    if (!trackRef.current) return;
    trackRef.current.style.transform = `translate3d(${-posRef.current}px, 0, 0)`;
  }, []);

  // Wrap position for infinite loop
  const wrapPosition = useCallback(() => {
    const setWidth = getSetWidth();
    if (posRef.current >= setWidth * 2) {
      posRef.current -= setWidth;
    } else if (posRef.current < 0) {
      posRef.current += setWidth;
    }
  }, [getSetWidth]);

  // Main animation loop
  const animate = useCallback(() => {
    if (!isDraggingRef.current) {
      // If there's residual velocity from a swipe, apply momentum
      if (Math.abs(velocityRef.current) > 0.5) {
        posRef.current += velocityRef.current;
        velocityRef.current *= 0.95; // friction
      } else {
        // Normal auto-scroll
        velocityRef.current = 0;
        posRef.current += BASE_SPEED;
      }
      wrapPosition();
      applyPosition();
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [wrapPosition, applyPosition]);

  useEffect(() => {
    // Start at the beginning of the second copy (middle of 3 copies)
    // so we have room to scroll backwards
    const setWidth = getSetWidth();
    posRef.current = setWidth;
    applyPosition();
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate, getSetWidth, applyPosition]);

  // ---- Touch handlers ----
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDraggingRef.current = true;
    velocityRef.current = 0;
    dragStartXRef.current = e.touches[0].clientX;
    dragStartPosRef.current = posRef.current;
    lastDragXRef.current = e.touches[0].clientX;
    lastDragTimeRef.current = Date.now();
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = e.touches[0].clientX;
      const now = Date.now();

      // Calculate velocity for momentum
      const dt = now - lastDragTimeRef.current;
      if (dt > 0) {
        velocityRef.current = ((lastDragXRef.current - currentX) / dt) * 16; // normalize to ~frame time
      }
      lastDragXRef.current = currentX;
      lastDragTimeRef.current = now;

      // Move track
      const dx = dragStartXRef.current - currentX;
      posRef.current = dragStartPosRef.current + dx;
      wrapPosition();
      applyPosition();
    },
    [wrapPosition, applyPosition]
  );

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    // velocity is already set from handleTouchMove, momentum will kick in via animate()
  }, []);

  // ---- Mouse drag handlers (for desktop testing) ----
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    velocityRef.current = 0;
    dragStartXRef.current = e.clientX;
    dragStartPosRef.current = posRef.current;
    lastDragXRef.current = e.clientX;
    lastDragTimeRef.current = Date.now();
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = e.clientX;
      const now = Date.now();

      const dt = now - lastDragTimeRef.current;
      if (dt > 0) {
        velocityRef.current = ((lastDragXRef.current - currentX) / dt) * 16;
      }
      lastDragXRef.current = currentX;
      lastDragTimeRef.current = now;

      const dx = dragStartXRef.current - currentX;
      posRef.current = dragStartPosRef.current + dx;
      wrapPosition();
      applyPosition();
    },
    [wrapPosition, applyPosition]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  }, []);

  return (
    <section className="overflow-hidden bg-[#FAFBFC] py-12 md:py-16">
      {/* Section header */}
      <div className="mx-auto mb-8 max-w-5xl px-6 text-center md:mb-14">
        <h2 className="text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#1E293B] sm:text-[28px] md:text-[36px]">
          Trusted by Entrepreneurs, Teams &amp; Enterprises
        </h2>
      </div>

      {/* Infinite scrolling carousel with touch/drag support */}
      <div
        className="relative select-none overflow-hidden"
        style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={trackRef}
          className="flex will-change-transform"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {tripled.map((t, i) => (
            <TestimonialCard key={`t-${i}`} testimonial={t} />
          ))}
        </div>

        {/* Edge fades */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-[#FAFBFC] to-transparent sm:w-24" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-[#FAFBFC] to-transparent sm:w-24" />
      </div>
    </section>
  );
}
