import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSimulationStore } from '@/lib/simulationStore';

interface SequenceBuilderPanelProps {
  onEmailNodeHover?: (isHovered: boolean) => void;
  variant?: 'hero' | 'feature';
}

interface NodeStats {
  sent: number;
  delivered: number;
  replied: number;
}

export function SequenceBuilderPanel({
  onEmailNodeHover,
  variant = 'hero',
}: SequenceBuilderPanelProps) {
  const isHero = variant === 'hero';
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Node stats with live updates
  const [stats, setStats] = useState({
    campaignStart: { sent: 1247, delivered: 1189, replied: 0 },
    connectionRequest: { sent: 1189, delivered: 1156, replied: 0 },
    accepted: { sent: 847, delivered: 823, replied: 312 },
    notAccepted: { sent: 309, delivered: 298, replied: 0 },
    sendMessage: { sent: 823, delivered: 801, replied: 284 },
    sendEmail: { sent: 298, delivered: 276, replied: 67 },
  });

  const tick = useSimulationStore((state) => state.tick);

  // Increment stats periodically based on global tick
  useEffect(() => {
    if (tick > 0 && tick % 4 === 0) {
      setStats((prev) => ({
        ...prev,
        campaignStart: { ...prev.campaignStart, sent: prev.campaignStart.sent + 1 },
        connectionRequest: { ...prev.connectionRequest, sent: prev.connectionRequest.sent + 1 },
      }));
    }
  }, [tick]);

  return (
    <motion.div
      className={!isHero ? 'w-full max-w-[320px] sm:max-w-[420px] md:max-w-[520px]' : ''}
      style={{
        width: isHero ? 520 : undefined,
        background: isHero
          ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(25, 35, 50, 0.98) 100%)'
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.88) 50%, rgba(248, 250, 252, 0.92) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: isHero
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(226, 232, 240, 0.5)',
        borderRadius: 20,
        boxShadow: isHero
          ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          : '0 8px 30px rgba(30, 41, 59, 0.08)',
        overflow: 'hidden',
        position: 'relative',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div
        style={{ padding: isHero ? '24px 32px 16px 32px' : undefined }}
        className={!isHero ? 'px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5 md:px-8 md:pt-6' : ''}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              fontSize: isHero ? 18 : undefined,
              fontWeight: 600,
              color: isHero ? 'white' : '#1E293B',
              margin: 0,
            }}
            className={!isHero ? 'text-sm font-semibold sm:text-base md:text-lg' : ''}
          >
            Smart Outreach Sequence
          </h3>
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'rgba(20, 184, 166, 0.15)',
              borderRadius: 8,
            }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#14B8A6' }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#14B8A6' }}>Live</span>
          </motion.div>
        </div>
      </div>

      {/* Flow Chart */}
      <div
        style={{ padding: isHero ? '0 24px 36px 24px' : undefined, position: 'relative' }}
        className={!isHero ? 'relative px-3 pb-6 sm:px-4 sm:pb-8 md:px-6 md:pb-9' : ''}
      >
        {/* Flowing particles on main line */}
        <FlowingParticles />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Campaign Start */}
          <FlowNode
            icon={<PlayIcon />}
            label="Campaign Start"
            color="teal"
            isHero={isHero}
            stats={stats.campaignStart}
            isActive={activeNode === 'campaign'}
            onHover={(h) => setActiveNode(h ? 'campaign' : null)}
          />

          <VerticalArrow color="teal" animate />

          {/* Connection Request */}
          <FlowNode
            icon={<LinkedInIcon />}
            label="Connection Request"
            color="teal"
            isHero={isHero}
            stats={stats.connectionRequest}
            isActive={activeNode === 'connection'}
            onHover={(h) => setActiveNode(h ? 'connection' : null)}
          />

          <VerticalArrow color="teal" animate />

          {/* If Connected? Decision Node */}
          <motion.div
            className={!isHero ? 'px-4 py-2 sm:px-5 sm:py-2.5 md:px-7 md:py-3' : ''}
            style={{
              padding: isHero ? '12px 28px' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isHero ? 8 : 6,
              borderRadius: 999,
              background: isHero
                ? 'linear-gradient(135deg, rgba(45, 55, 72, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
              border: isHero
                ? '2px solid rgba(20, 184, 166, 0.4)'
                : '2px solid rgba(20, 184, 166, 0.5)',
              cursor: 'pointer',
              position: 'relative',
            }}
            whileHover={{ scale: 1.03, y: -2, borderColor: 'rgba(20, 184, 166, 0.8)' }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span
              style={{ color: '#14B8A6', fontSize: isHero ? 14 : undefined }}
              className={!isHero ? 'text-xs md:text-sm' : ''}
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              ◇
            </motion.span>
            <span
              style={{
                fontSize: isHero ? 14 : undefined,
                fontWeight: 500,
                color: isHero ? 'white' : '#334155',
              }}
              className={!isHero ? 'text-xs font-medium sm:text-[13px] md:text-sm' : ''}
            >
              If Connected?
            </span>
          </motion.div>

          {/* Branch Arrows with flowing particles */}
          <svg
            width={isHero ? '416' : undefined}
            height={isHero ? '44' : undefined}
            className={
              !isHero
                ? 'h-[36px] w-full max-w-[280px] sm:h-[40px] sm:max-w-[340px] md:h-[44px] md:max-w-[416px]'
                : ''
            }
            viewBox="0 0 416 44"
            preserveAspectRatio="xMidYMid meet"
            style={{ margin: '4px auto' }}
          >
            {/* Left branch */}
            <motion.path
              d="M208 0 L208 10 Q208 20 160 20 L108 20 L108 36"
              stroke="rgba(16, 185, 129, 0.7)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.path
              d="M104 32 L108 40 L112 32"
              stroke="rgba(16, 185, 129, 0.7)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Left branch flowing dot */}
            <motion.circle
              r="3"
              fill="#10B981"
              initial={{ cx: 208, cy: 0, opacity: 0 }}
              animate={{
                cx: [208, 208, 160, 108, 108],
                cy: [0, 10, 20, 20, 36],
                opacity: [0, 1, 1, 1, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5 }}
            />

            {/* Right branch */}
            <motion.path
              d="M208 0 L208 10 Q208 20 256 20 L308 20 L308 36"
              stroke="rgba(20, 184, 166, 0.7)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.path
              d="M304 32 L308 40 L312 32"
              stroke="rgba(20, 184, 166, 0.7)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right branch flowing dot */}
            <motion.circle
              r="3"
              fill="#14B8A6"
              initial={{ cx: 208, cy: 0, opacity: 0 }}
              animate={{
                cx: [208, 208, 256, 308, 308],
                cy: [0, 10, 20, 20, 36],
                opacity: [0, 1, 1, 1, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, delay: 1.5 }}
            />

            {/* Branch labels */}
            <text x="65" y="18" fill="#10B981" fontSize="10" fontWeight="600">
              Yes
            </text>
            <text x="340" y="18" fill="#14B8A6" fontSize="10" fontWeight="600">
              No
            </text>
          </svg>

          {/* Two Column Branches */}
          <div
            style={
              isHero
                ? { display: 'flex', gap: 16, width: '100%', justifyContent: 'center' }
                : undefined
            }
            className={!isHero ? 'flex w-full justify-center gap-2 sm:gap-3 md:gap-4' : ''}
          >
            {/* Left Branch - Accepted */}
            <div
              style={
                isHero
                  ? { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200 }
                  : undefined
              }
              className={
                !isHero ? 'flex w-[130px] flex-col items-center sm:w-[160px] md:w-[200px]' : ''
              }
            >
              <BranchNode
                icon={<ThumbsUpIcon />}
                label="Accepted"
                color="green"
                isHero={isHero}
                isActive={activeNode === 'accepted'}
                onHover={(h) => setActiveNode(h ? 'accepted' : null)}
              />
              <VerticalArrow color="green" animate />
              <BranchNode
                icon={<ClockIcon />}
                label="Wait 1 Day"
                color="green"
                isHero={isHero}
                isActive={activeNode === 'wait1'}
                onHover={(h) => setActiveNode(h ? 'wait1' : null)}
              />
              <VerticalArrow color="green" animate />
              {/* Send Message Button - Green gradient */}
              <motion.div
                className={!isHero ? 'w-full px-2 py-2 sm:px-3 sm:py-2.5 md:px-5 md:py-3' : ''}
                style={{
                  width: isHero ? '100%' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isHero ? 8 : 4,
                  padding: isHero ? '12px 20px' : undefined,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer',
                }}
                whileHover={{
                  scale: 1.03,
                  y: -2,
                  boxShadow:
                    '0 10px 30px rgba(16, 185, 129, 0.5), 0 0 0 2px rgba(16, 185, 129, 0.3)',
                }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setActiveNode('sendMsg')}
                onMouseLeave={() => setActiveNode(null)}
              >
                <MessageIcon white />
                <span
                  style={{ color: 'white', fontSize: isHero ? 13 : undefined, fontWeight: 600 }}
                  className={
                    !isHero
                      ? 'whitespace-nowrap text-[10px] font-semibold text-white sm:text-[11px] md:text-[13px]'
                      : ''
                  }
                >
                  Send Message
                </span>
              </motion.div>
            </div>

            {/* Right Branch - Not Accepted */}
            <div
              style={
                isHero
                  ? { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200 }
                  : undefined
              }
              className={
                !isHero ? 'flex w-[130px] flex-col items-center sm:w-[160px] md:w-[200px]' : ''
              }
            >
              <BranchNode
                icon={<ClockWaitIcon />}
                label="Not Accepted"
                color="teal"
                isHero={isHero}
                isActive={activeNode === 'notAccepted'}
                onHover={(h) => setActiveNode(h ? 'notAccepted' : null)}
              />
              <VerticalArrow color="teal" animate />
              <BranchNode
                icon={<ClockIcon />}
                label="Wait 3 Days"
                color="teal"
                isHero={isHero}
                isActive={activeNode === 'wait3'}
                onHover={(h) => setActiveNode(h ? 'wait3' : null)}
              />
              <VerticalArrow color="teal" animate />
              {/* Send Email Button - Teal */}
              <motion.div
                className={!isHero ? 'w-full px-2 py-2 sm:px-3 sm:py-2.5 md:px-5 md:py-3' : ''}
                style={{
                  width: isHero ? '100%' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isHero ? 8 : 4,
                  padding: isHero ? '12px 20px' : undefined,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                  boxShadow: '0 6px 20px rgba(20, 184, 166, 0.35)',
                  cursor: 'pointer',
                }}
                whileHover={{
                  scale: 1.03,
                  y: -2,
                  boxShadow:
                    '0 10px 30px rgba(20, 184, 166, 0.5), 0 0 0 2px rgba(20, 184, 166, 0.3)',
                }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => {
                  setActiveNode('sendEmail');
                  onEmailNodeHover?.(true);
                }}
                onMouseLeave={() => {
                  setActiveNode(null);
                  onEmailNodeHover?.(false);
                }}
              >
                <EmailIcon />
                <span
                  style={{ color: 'white', fontSize: isHero ? 13 : undefined, fontWeight: 600 }}
                  className={
                    !isHero
                      ? 'whitespace-nowrap text-[10px] font-semibold text-white sm:text-[11px] md:text-[13px]'
                      : ''
                  }
                >
                  Send Email
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Flowing particles animation
function FlowingParticles() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 2,
        height: 140,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(20, 184, 166, 0.6)',
            left: -2,
          }}
          animate={{
            top: [0, 140],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Top-level flow nodes with stats
function FlowNode({
  icon,
  label,
  color,
  isHero,
  stats,
  isActive,
  onHover,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'teal' | 'green';
  isHero: boolean;
  stats?: NodeStats;
  isActive?: boolean;
  onHover?: (hovered: boolean) => void;
}) {
  const borderColors = {
    teal: isActive ? 'rgba(20, 184, 166, 0.8)' : 'rgba(20, 184, 166, 0.5)',
    green: isActive ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.5)',
  };

  return (
    <motion.div
      className={
        !isHero
          ? 'min-w-[140px] px-3 py-2 sm:min-w-[170px] sm:px-4 sm:py-2.5 md:min-w-[200px] md:px-6 md:py-3'
          : ''
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isHero ? 10 : 6,
        padding: isHero ? '12px 24px' : undefined,
        borderRadius: 10,
        background: isHero ? 'rgba(51, 65, 85, 0.8)' : 'white',
        border: `2px solid ${borderColors[color]}`,
        cursor: 'pointer',
        position: 'relative',
        minWidth: isHero ? 200 : undefined,
      }}
      whileHover={{
        scale: 1.03,
        y: -2,
        borderColor: color === 'teal' ? 'rgba(20, 184, 166, 0.8)' : 'rgba(16, 185, 129, 0.8)',
      }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <span
        style={{ fontSize: isHero ? 16 : undefined }}
        className={!isHero ? 'text-sm md:text-base' : ''}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: isHero ? 14 : undefined,
          fontWeight: 500,
          color: isHero ? 'white' : '#334155',
        }}
        className={!isHero ? 'whitespace-nowrap text-xs font-medium sm:text-[13px] md:text-sm' : ''}
      >
        {label}
      </span>
      {stats && (
        <motion.span
          className={
            !isHero
              ? 'ml-1 rounded px-1.5 py-0.5 text-[9px] font-semibold sm:px-2 sm:text-[10px] md:text-[11px]'
              : ''
          }
          style={{
            marginLeft: isHero ? 4 : undefined,
            padding: isHero ? '2px 8px' : undefined,
            background: color === 'teal' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            borderRadius: isHero ? 6 : undefined,
            fontSize: isHero ? 11 : undefined,
            color: color === 'teal' ? '#14B8A6' : '#10B981',
            fontWeight: isHero ? 600 : undefined,
          }}
          key={stats.sent}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
        >
          {stats.sent.toLocaleString()}
        </motion.span>
      )}
    </motion.div>
  );
}

// Branch nodes with enhanced interactivity
function BranchNode({
  icon,
  label,
  color,
  isHero,
  isActive,
  onHover,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'green' | 'teal';
  isHero: boolean;
  isActive?: boolean;
  onHover?: (hovered: boolean) => void;
}) {
  const borderColors = {
    green: isActive ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.5)',
    teal: isActive ? 'rgba(20, 184, 166, 0.8)' : 'rgba(20, 184, 166, 0.5)',
  };

  return (
    <motion.div
      className={!isHero ? 'w-full px-2 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5' : ''}
      style={{
        width: isHero ? '100%' : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isHero ? 8 : 4,
        padding: isHero ? '10px 14px' : undefined,
        borderRadius: 8,
        background: isHero ? 'rgba(51, 65, 85, 0.8)' : 'white',
        border: `1.5px solid ${borderColors[color]}`,
        cursor: 'pointer',
        position: 'relative',
      }}
      whileHover={{
        scale: 1.02,
        y: -1,
        borderColor: color === 'green' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(20, 184, 166, 0.8)',
      }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <span
        style={{ fontSize: isHero ? 14 : undefined }}
        className={!isHero ? 'text-xs md:text-sm' : ''}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: isHero ? 13 : undefined,
          fontWeight: 500,
          color: isHero ? 'white' : '#334155',
        }}
        className={
          !isHero ? 'whitespace-nowrap text-[10px] font-medium sm:text-[11px] md:text-[13px]' : ''
        }
      >
        {label}
      </span>
    </motion.div>
  );
}

// Vertical arrow with animation
function VerticalArrow({ color, animate }: { color: 'teal' | 'green'; animate?: boolean }) {
  const colors = {
    teal: 'rgba(20, 184, 166, 0.7)',
    green: 'rgba(16, 185, 129, 0.7)',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '6px 0',
        position: 'relative',
      }}
    >
      <motion.div
        style={{
          width: 2,
          height: 16,
          background: colors[color],
          borderRadius: 1,
        }}
        initial={animate ? { scaleY: 0 } : {}}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3 }}
      />
      <svg width="12" height="8" viewBox="0 0 12 8" style={{ marginTop: -2 }}>
        <motion.path
          d="M6 8L0 0h12L6 8z"
          fill={colors[color]}
          initial={animate ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
      </svg>
    </div>
  );
}

// Icons
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#14B8A6">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="#0A66C2">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="white">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ClockWaitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function MessageIcon({ white }: { white?: boolean } = {}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={white ? 'white' : '#10B981'}
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
      />
    </svg>
  );
}
