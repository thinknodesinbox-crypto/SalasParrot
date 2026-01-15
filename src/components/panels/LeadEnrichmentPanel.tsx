import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Lead {
  id: string
  name: string
  avatar: string
  company: string
  email: string | null
  status: 'found' | 'finding' | 'queued'
}

const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: '/images/avatars/sarah-chen.png',
    company: 'Acme Inc',
    email: 'sarah@acme.com',
    status: 'found',
  },
  {
    id: '2',
    name: 'Mike Johnson',
    avatar: '/images/avatars/mike-johnson.png',
    company: 'TechCorp',
    email: 'mike@techcorp.io',
    status: 'found',
  },
  {
    id: '3',
    name: 'Lisa Park',
    avatar: '/images/avatars/lisa-park.png',
    company: 'StartupXYZ',
    email: null,
    status: 'finding',
  },
  {
    id: '4',
    name: 'James Wilson',
    avatar: '/images/avatars/james-wilson.png',
    company: 'BigCo',
    email: 'jwilson@bigco.com',
    status: 'found',
  },
  {
    id: '5',
    name: 'Anna Lee',
    avatar: '/images/avatars/anna-lee.png',
    company: 'NewCo',
    email: null,
    status: 'queued',
  },
]

interface LeadEnrichmentPanelProps {
  variant?: 'hero' | 'feature'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LeadEnrichmentPanel({ variant: _variant = 'feature' }: LeadEnrichmentPanelProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [hoveredLead, setHoveredLead] = useState<string | null>(null)

  // Simulate finding email after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === '3' ? { ...lead, email: 'lisa@startupxyz.com', status: 'found' as const } : lead
        )
      )
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const foundCount = leads.filter((l) => l.status === 'found').length

  return (
    <motion.div
      className="glass-panel p-3 sm:p-4 w-full max-w-[300px] sm:max-w-[380px] md:max-w-[460px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-slate-800 font-semibold text-xs sm:text-sm">Lead Enrichment</h3>
        <motion.span
          className="px-1.5 sm:px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] sm:text-xs font-medium rounded-full flex items-center gap-1"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-teal-500 rounded-full" />
          Auto
        </motion.span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 mb-2 px-1 sm:px-2">
        <div className="col-span-5 sm:col-span-4">Name</div>
        <div className="col-span-4 sm:col-span-4">Company</div>
        <div className="col-span-3 sm:col-span-4">Status</div>
      </div>

      {/* Lead Rows */}
      <div className="space-y-1">
        {leads.map((lead, index) => (
          <motion.div
            key={lead.id}
            className={`grid grid-cols-12 gap-1 sm:gap-2 items-center p-1.5 sm:p-2 rounded-lg transition-colors ${
              hoveredLead === lead.id ? 'bg-slate-100/80' : 'bg-slate-50/50'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredLead(lead.id)}
            onMouseLeave={() => setHoveredLead(null)}
          >
            {/* Name + Avatar */}
            <div className="col-span-5 sm:col-span-4 flex items-center gap-1 sm:gap-2">
              <img src={lead.avatar} alt={lead.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full ring-1 ring-white shadow-sm flex-shrink-0" />
              <span className="text-slate-800 text-[10px] sm:text-xs font-medium truncate">{lead.name}</span>
            </div>

            {/* Company */}
            <div className="col-span-4 text-slate-600 text-[10px] sm:text-xs truncate">{lead.company}</div>

            {/* Email Status */}
            <div className="col-span-3 sm:col-span-4">
              {lead.status === 'found' ? (
                <motion.span
                  className="text-emerald-600 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Found</span>
                </motion.span>
              ) : lead.status === 'finding' ? (
                <span className="text-amber-600 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 font-medium">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 spinner flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="hidden sm:inline">...</span>
                </span>
              ) : (
                <span className="text-slate-400 text-[10px] sm:text-xs">●</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200/60">
        <span className="text-slate-500 text-[10px] sm:text-xs">
          {foundCount}/{leads.length} found
        </span>
        <motion.button
          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-teal-50 text-teal-700 text-[10px] sm:text-xs font-medium rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1 border border-teal-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="hidden sm:inline">Export</span>
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}
