import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Inject keyframe styles once ── */
const STYLE_ID = 'ai-agent-flow-keyframes';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ai-dot-bounce {
      0%,60%,100%{transform:translateY(0);opacity:.35}
      30%{transform:translateY(-3px);opacity:1}
    }
    @keyframes ai-pulse-ring {
      0%{transform:scale(1);opacity:1}
      100%{transform:scale(2.2);opacity:0}
    }
    .ai-typing-dot{width:5px;height:5px;border-radius:50%;background:#22C55E;display:inline-block;animation:ai-dot-bounce 1.2s ease-in-out infinite}
    .ai-typing-dot:nth-child(2){animation-delay:.15s}
    .ai-typing-dot:nth-child(3){animation-delay:.3s}
    .ai-msg{opacity:0;transform:translateY(8px);transition:opacity .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1)}
    .ai-msg.v{opacity:1;transform:translateY(0)}
    .ai-sys{opacity:0;transition:opacity .35s ease;font-size:12px;color:#9CA3AF;display:flex;align-items:center;gap:5px;padding:2px 0 2px 38px}
    .ai-sys.v{opacity:1}
    .ai-sys.done{color:#16A34A}
    .ai-badge-in{opacity:0;transform:scale(.85);transition:opacity .4s cubic-bezier(.22,1,.36,1),transform .4s cubic-bezier(.34,1.56,.64,1)}
    .ai-badge-in.v{opacity:1;transform:scale(1)}
    .ai-row-in{opacity:0;transform:translateX(6px);transition:opacity .3s ease,transform .3s ease}
    .ai-row-in.v{opacity:1;transform:translateX(0)}
    .ai-live-dot{width:8px;height:8px;border-radius:50%;background:#22C55E;position:relative;flex-shrink:0}
    .ai-live-dot::after{content:'';position:absolute;inset:-2px;border-radius:50%;border:1.5px solid #22C55E;animation:ai-pulse-ring 2s ease-out infinite}
  `;
  document.head.appendChild(s);
}

/* ── Minimal SVG icons (monoline, 14-16px) ── */
const CalendarSearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <circle cx="15" cy="16" r="2" />
    <path d="M16.5 17.5L18 19" />
  </svg>
);
const CheckCircleIcon = ({ color = '#16A34A' }: { color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);
const CalendarPlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
  </svg>
);
const CheckmarkSmall = ({ color = '#16A34A' }: { color?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);
const ClockArrowIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#D97706"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l3 3" />
  </svg>
);

export function AIReplyAgentPanel({ variant = 'feature' }: { variant?: 'hero' | 'feature' }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    injectStyles();
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  // Scroll down whenever step advances
  useEffect(() => {
    if (step >= 0) {
      const t = setTimeout(scrollToBottom, 60);
      return () => clearTimeout(t);
    }
  }, [step, scrollToBottom]);

  /* ── IntersectionObserver: one-shot play ── */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !played.current) {
          played.current = true;
          const m = window.innerWidth < 768 ? 0.7 : 1;
          setStep(0); // Lead message
          setTimeout(() => setStep(1), 1200 * m); // Checking calendar...
          setTimeout(() => setStep(2), 2200 * m); // 3 slots found
          setTimeout(() => setStep(3), 3000 * m); // Typing dots
          setTimeout(() => setStep(3.5), 3800 * m); // AI suggests times
          setTimeout(() => setStep(4), 4800 * m); // Lead confirms
          setTimeout(() => setStep(5), 5800 * m); // Booking on calendar...
          setTimeout(() => setStep(5.5), 6600 * m); // Calendar invite sent
          setTimeout(() => setStep(6), 7200 * m); // Typing dots
          setTimeout(() => setStep(6.5), 7700 * m); // AI confirms
          setTimeout(() => setStep(7), 8500 * m); // Meeting booked badge
          setTimeout(() => setStep(8), 9000 * m); // Summary rows
          setTimeout(() => setStep(9), 9800 * m); // Counter
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const w = variant === 'hero' ? 340 : 390;

  return (
    <div
      ref={outerRef}
      className="glass-panel"
      style={{ width: w, maxWidth: '100%', overflow: 'hidden', position: 'relative' }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '14px 18px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, color: '#1E293B', margin: 0 }}>
            AI Reply Agent
          </h3>
          <div className="ai-live-dot" />
        </div>
        <span
          style={{
            padding: '4px 10px',
            background: 'rgba(34,197,94,.15)',
            color: '#16A34A',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Active
        </span>
      </div>

      {/* ── Scrollable conversation area ── */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 340,
          overflowY: 'hidden',
          position: 'relative',
          padding: '0 14px 12px',
        }}
      >
        {/* Top fade gradient */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            height: 20,
            zIndex: 2,
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(255,255,255,.95), rgba(255,255,255,0))',
          }}
        />

        {/* Step 0: Lead message 1 */}
        <div className={`ai-msg ${step >= 0 ? 'v' : ''}`}>
          <LeadBubble
            name="Emily Zhang"
            text="Hey! Yeah I'd be down for a quick chat. What's your availability like?"
          />
        </div>

        {/* Step 1: Checking calendar */}
        <div
          className={`ai-sys ${step >= 1 ? 'v' : ''} ${step >= 2 ? 'done' : ''}`}
          style={{ margin: '6px 0' }}
        >
          {step >= 2 ? (
            <>
              <CheckCircleIcon /> <span>3 open slots found this week</span>
            </>
          ) : (
            <>
              <CalendarSearchIcon /> <span>Checking your calendar...</span>
            </>
          )}
        </div>

        {/* Step 3: Typing / Step 3.5: AI suggests times */}
        {step >= 3 && step < 3.5 && (
          <div style={{ paddingLeft: 38, marginBottom: 8 }}>
            <AILabel />
            <TypingDots />
          </div>
        )}
        <div
          className={`ai-msg ${step >= 3.5 ? 'v' : ''}`}
          style={{ visibility: step >= 3.5 ? 'visible' : 'hidden' }}
        >
          <AIBubble text="I've got a few open slots: Tue 10am, Wed 2pm, or Thu 11am ET. Which works best for you?" />
        </div>

        {/* Step 4: Lead confirms */}
        <div
          className={`ai-msg ${step >= 4 ? 'v' : ''}`}
          style={{ visibility: step >= 4 ? 'visible' : 'hidden' }}
        >
          <LeadBubble name="Emily Zhang" text="Tuesday 10am works!" />
        </div>

        {/* Step 5: Booking... / Step 5.5: Invite sent */}
        {step >= 5 && (
          <div className={`ai-sys v ${step >= 5.5 ? 'done' : ''}`} style={{ margin: '6px 0' }}>
            {step >= 5.5 ? (
              <>
                <CheckCircleIcon /> <span>Calendar invite sent</span>
              </>
            ) : (
              <>
                <CalendarPlusIcon /> <span>Booking on your calendar...</span>
              </>
            )}
          </div>
        )}

        {/* Step 6: Typing / Step 6.5: AI confirms */}
        {step >= 6 && step < 6.5 && (
          <div style={{ paddingLeft: 38, marginBottom: 8 }}>
            <AILabel />
            <TypingDots />
          </div>
        )}
        <div
          className={`ai-msg ${step >= 6.5 ? 'v' : ''}`}
          style={{ visibility: step >= 6.5 ? 'visible' : 'hidden' }}
        >
          <AIBubble text="All set, Emily! Calendar invite sent for Tuesday at 10am ET. See you then!" />
        </div>

        {/* Step 7: Meeting booked badge */}
        <div
          className={`ai-badge-in ${step >= 7 ? 'v' : ''}`}
          style={{
            marginLeft: 38,
            marginTop: 6,
            marginBottom: 8,
            visibility: step >= 7 ? 'visible' : 'hidden',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              background: '#10B981',
              padding: '5px 10px',
              borderRadius: 8,
            }}
          >
            <CheckmarkSmall color="#fff" />
            Meeting booked · Tue, 10:00 AM ET
          </span>
        </div>

        {/* Divider before summary */}
        {step >= 8 && (
          <div style={{ height: 1, background: 'rgba(226,232,240,.5)', margin: '6px 0 8px' }} />
        )}

        {/* Step 8: Summary rows */}
        <div
          className={`ai-row-in ${step >= 8 ? 'v' : ''}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 2px',
            visibility: step >= 8 ? 'visible' : 'hidden',
          }}
        >
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Michael Torres</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#16A34A',
            }}
          >
            <CheckCircleIcon color="#16A34A" /> Invite sent · Thu, 2:00 PM ET
          </span>
        </div>
        <div
          className={`ai-row-in ${step >= 8 ? 'v' : ''}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 2px',
            transitionDelay: step >= 8 ? '300ms' : '0ms',
            visibility: step >= 8 ? 'visible' : 'hidden',
          }}
        >
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Jessica Patel</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#D97706',
            }}
          >
            <ClockArrowIcon /> Nurturing · Follow-up Q2
          </span>
        </div>

        {/* Step 9: Footer counter */}
        {step >= 9 && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid rgba(226,232,240,.5)',
              textAlign: 'center',
            }}
          >
            <CounterFooter />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function LeadBubble({ name, text }: { name: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src="/images/avatars/emily-zhang.webp"
          alt={name}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(226,232,240,.8)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #fff',
          }}
        >
          <svg width="7" height="7" viewBox="0 0 20 20" fill="#0A66C2">
            <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
          </svg>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: '#1E293B' }}>{name}</span>
        <div
          style={{
            marginTop: 3,
            padding: '7px 11px',
            background: '#F3F4F6',
            borderRadius: '3px 12px 12px 12px',
            fontSize: 13,
            color: '#475569',
            lineHeight: '1.5',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function AILabel() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#14B8A6' }}>AI Reply</span>
    </div>
  );
}

function AIBubble({ text }: { text: string }) {
  return (
    <div style={{ marginLeft: 36, marginBottom: 8 }}>
      <AILabel />
      <div
        style={{
          padding: '7px 11px',
          background: 'rgba(20,184,166,.05)',
          borderRadius: '12px 12px 3px 12px',
          borderLeft: '3px solid #14B8A6',
          fontSize: 13,
          color: '#475569',
          lineHeight: '1.5',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: '9px 14px',
        background: 'rgba(20,184,166,.05)',
        borderRadius: '12px 12px 3px 12px',
        borderLeft: '3px solid #14B8A6',
      }}
    >
      <span className="ai-typing-dot" />
      <span className="ai-typing-dot" />
      <span className="ai-typing-dot" />
    </div>
  );
}

function CounterFooter() {
  const [r, setR] = useState(0);
  const [m, setM] = useState(0);
  useEffect(() => {
    const dur = 700,
      steps = 10,
      iv = dur / steps;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setR(Math.min(Math.round((i / steps) * 4), 4));
      setM(Math.min(Math.round((i / steps) * 3), 3));
      if (i >= steps) clearInterval(t);
    }, iv);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
      <span style={{ color: '#14B8A6', fontWeight: 700 }}>{r}</span> replies handled ·{' '}
      <span style={{ color: '#16A34A', fontWeight: 700 }}>{m}</span> meetings booked
    </span>
  );
}
