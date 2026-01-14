# SalesParrot Landing Page

## Project Overview
SalesParrot is a B2B SaaS platform for LinkedIn + Email outreach automation. This is the marketing landing page.

## Tech Stack
- React 18+ with TypeScript
- Tailwind CSS for styling
- TanStack Router for routing
- TanStack Query for data fetching (future)
- Zustand for state management (future)
- Framer Motion for animations

## Project Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Feature.tsx
│   │   ├── DarkSection.tsx
│   │   ├── Integrations.tsx
│   │   ├── FinalCTA.tsx
│   │   └── FAQ.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Container.tsx
│       └── Badge.tsx
├── assets/
│   └── images/
├── styles/
│   └── globals.css
├── lib/
│   └── utils.ts
├── routes/
│   └── index.tsx
└── App.tsx
```

## Brand Guidelines

### Colors
```
Primary Orange: #FF6B35 (CTAs, highlights, email differentiator)
Deep Navy: #1E293B (text, dark sections)
Tropical Teal: #14B8A6 (accents, icons)
White: #FFFFFF (backgrounds)
Cream: #FFFBEB (alternate backgrounds)
Light Gray: #F8FAFC (footer)
Text Primary: #1E293B
Text Secondary: #64748B
Text Muted: #94A3B8
Border: #E2E8F0
Success: #22C55E
```

### Typography
- Font: Plus Jakarta Sans (Google Fonts)
- Weights: 400, 500, 600, 700
- Hero headline: 56px, 700 weight, -0.02em letter-spacing
- Section headlines: 36px, 700 weight
- Body: 16px, 400 weight, 1.6 line-height

### Spacing
- Base unit: 8px
- Section padding: 80-96px vertical
- Container max-width: 1200px
- Border radius: 8px (buttons), 12px (cards)

### Shadows
```
shadow-sm: 0 1px 2px rgba(30, 41, 59, 0.05)
shadow-md: 0 4px 12px rgba(30, 41, 59, 0.08)
shadow-lg: 0 8px 24px rgba(30, 41, 59, 0.12)
```

## Page Sections (in order)

1. **Header** - Sticky, white background
   - Logo (left)
   - "Pricing" link
   - "Login" link
   - "Start $1 Trial" button (orange)

2. **Hero** - White to cream gradient
   - Centered headline: "Scale your LinkedIn outreach with ease. Follow up with unlimited emails — without juggling tools."
   - Subheadline: "For agencies, sales teams, and GTM experts who want to automate LinkedIn outreach, boost reply rates with email followups, and book more meetings. All from one dashboard."
   - Two CTAs: "Start $1 Trial" (orange), "Watch Demo" (outline)
   - Supporting: "7-day full access. Cancel anytime."
   - Hero image: Two-panel product demo (will be added as PNG)

3. **Feature 1** - White background
   - Headline: "Combine LinkedIn + Email steps"
   - Body: "Automate actions like connection requests, messages, profile views, and email follow-ups. Use "If Connected" logic to message existing connections on LinkedIn — and email the rest."
   - Image on right

4. **Feature 2** - Cream background
   - Headline: "Manage replies in one place"
   - Body: "LinkedIn DMs and email replies together. Respond faster, never miss a message, never lose context."
   - Image on left

5. **Feature 3** - White background
   - Headline: "Find emails automatically"
   - Body: "Import leads from Sales Navigator or CSV. We find verified business emails in the background — no manual lookups, no separate tool."
   - Image on right

6. **Feature 4** - Cream background
   - Headline: "Scale with multiple senders"
   - Body: "Connect multiple LinkedIn accounts to one campaign. Auto-rotate sending to reach more prospects while each account stays within safe limits."
   - Image on left

7. **Dark Section** - Navy background
   - Headline: "How it works"
   - 3 steps: Import leads → Run sequences → Get replies
   - Simple icons or illustrations

8. **Integrations** - White background
   - Headline: "Integrate your GTM stack"
   - Body: "Push leads to your CRM. Trigger workflows. Keep everything in sync."
   - Logo grid: Clay, HubSpot, Salesforce, Pipedrive, Zapier

9. **Final CTA** - Cream background
   - Headline: "Ready to simplify your outreach?"
   - Subheadline: "LinkedIn + Email + Enrichment. One platform."
   - CTA: "Start $1 Trial"
   - Supporting: "7-day full access. Cancel anytime."

10. **FAQ** - White background
    - Accordion style, 5 questions
    - Q: How does the $1 trial work?
    - Q: Are my LinkedIn accounts safe?
    - Q: How does email enrichment work?
    - Q: What integrations do you support?
    - Q: Can I cancel anytime?

11. **Footer** - Light gray background
    - Logo
    - 4-column links: Product, Resources, Company, Legal
    - Copyright

## Component Guidelines

### Buttons
- Primary: Orange bg (#FF6B35), white text, 12px 24px padding, 8px radius
- Secondary: Transparent, 1.5px border (#E2E8F0), navy text
- Hover: Slight lift (translateY -1px), shadow

### Feature Section Pattern
- Alternating layout (text left/right)
- Alternating backgrounds (white/cream)
- Image has subtle shadow, 12px radius

### Animations (Framer Motion)
- Fade in + slight Y translate on scroll
- Stagger children where appropriate
- Respect prefers-reduced-motion

## Important Notes
- Mobile-first responsive design
- All images will be added later (use placeholder divs)
- Keep components modular and reusable
- Use semantic HTML
- Ensure accessibility (proper heading hierarchy, alt text, focus states)
