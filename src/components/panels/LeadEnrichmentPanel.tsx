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
    avatar: 'https://i.pravatar.cc/150?u=sarahchen',
    company: 'Acme Inc',
    email: 'sarah@acme.com',
    status: 'found',
  },
  {
    id: '2',
    name: 'Mike Johnson',
    avatar: 'https://i.pravatar.cc/150?u=mikejohnson',
    company: 'TechCorp',
    email: 'mike@techcorp.io',
    status: 'found',
  },
  {
    id: '3',
    name: 'Lisa Park',
    avatar: 'https://i.pravatar.cc/150?u=lisapark',
    company: 'StartupXYZ',
    email: null,
    status: 'finding',
  },
  {
    id: '4',
    name: 'James Wilson',
    avatar: 'https://i.pravatar.cc/150?u=jameswilson',
    company: 'BigCo',
    email: 'jwilson@bigco.com',
    status: 'found',
  },
  {
    id: '5',
    name: 'Anna Lee',
    avatar: 'https://i.pravatar.cc/150?u=annalee',
    company: 'NewCo',
    email: null,
    status: 'queued',
  },
]

interface LeadEnrichmentPanelProps {
  variant?: 'hero' | 'feature'
}

export function LeadEnrichmentPanel({ variant = 'feature' }: LeadEnrichmentPanelProps) {
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
  // Hero: larger for visual impact, Feature: fits in 472px container
  const panelWidth = variant === 'hero' ? 360 : 460

  return (
    <motion.div
      className="glass-panel p-4"
      style={{ width: panelWidth }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Lead Enrichment</h3>
        <motion.span
          className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs font-medium rounded-full flex items-center gap-1"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
          Auto-finding
        </motion.span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 text-xs text-white/50 mb-2 px-2">
        <div className="col-span-4">Name</div>
        <div className="col-span-4">Company</div>
        <div className="col-span-4">Email</div>
      </div>

      {/* Lead Rows */}
      <div className="space-y-1">
        {leads.map((lead, index) => (
          <motion.div
            key={lead.id}
            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${
              hoveredLead === lead.id ? 'bg-white/10' : 'bg-white/5'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredLead(lead.id)}
            onMouseLeave={() => setHoveredLead(null)}
          >
            {/* Name + Avatar */}
            <div className="col-span-4 flex items-center gap-2">
              <img src={lead.avatar} alt={lead.name} className="w-6 h-6 rounded-full" />
              <span className="text-white text-xs truncate">{lead.name}</span>
            </div>

            {/* Company */}
            <div className="col-span-4 text-white/70 text-xs truncate">{lead.company}</div>

            {/* Email Status */}
            <div className="col-span-4">
              {lead.status === 'found' ? (
                <motion.span
                  className="text-green-400 text-xs flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Found
                </motion.span>
              ) : lead.status === 'finding' ? (
                <span className="text-yellow-400 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3 spinner" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Finding...
                </span>
              ) : (
                <span className="text-white/40 text-xs">● Queued</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
        <span className="text-white/50 text-xs">
          Found: {foundCount}/{leads.length} emails
        </span>
        <motion.button
          className="px-3 py-1.5 bg-teal-500/20 text-teal-400 text-xs rounded-lg hover:bg-teal-500/30 transition-colors flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Export to Sequence
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}
