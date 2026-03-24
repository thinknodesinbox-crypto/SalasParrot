import { createFileRoute } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

export const Route = createFileRoute('/dashboard/help')({
  component: HelpPage,
});

// Article content database
const articles: Article[] = [
  // Getting Started
  {
    id: 'quick-start-guide',
    category: 'Getting Started',
    title: 'Quick start guide',
    time: '5 min',
    content: `
## Welcome to SalesParrot!

This guide will help you get up and running with SalesParrot in just a few minutes.

### Step 1: Connect Your LinkedIn Account

1. Go to **Settings > Integrations** or **Accounts**
2. Click **Connect LinkedIn**
3. Enter your LinkedIn credentials or use cookie authentication
4. Wait for the connection to be verified

### Step 2: Import Your Leads

You can import leads in several ways:
- **LinkedIn Search**: Import directly from LinkedIn search results
- **Sales Navigator**: Import from your saved leads or searches
- **CSV Upload**: Upload a spreadsheet with LinkedIn URLs
- **Paste URLs**: Paste LinkedIn profile URLs directly

### Step 3: Create Your First Campaign

1. Go to **Campaigns** and click **Start New Campaign**
2. Give your campaign a name
3. Select a lead list to target
4. Build your sequence using the visual editor
5. Add connection requests, messages, and follow-ups
6. Review and launch!

### Step 4: Monitor Results

Track your campaign performance in the **Analytics** dashboard:
- Connection acceptance rates
- Reply rates
- Message delivery status

### Pro Tips

- Start with a small test batch (20-50 leads) before scaling up
- Personalize your messages using variables like {{first_name}}
- Set appropriate delays between steps (2-3 days recommended)
- Monitor your LinkedIn account health in the Accounts page
    `,
  },
  {
    id: 'connecting-linkedin-account',
    category: 'Getting Started',
    title: 'Connecting your first LinkedIn account',
    time: '3 min',
    content: `
## Connecting Your LinkedIn Account

SalesParrot needs access to your LinkedIn account to send connection requests and messages on your behalf.

### Connection Methods

#### Method 1: Email & Password (Recommended)

1. Go to **Accounts** page
2. Click **Connect LinkedIn**
3. Enter your LinkedIn email and password
4. If prompted, complete 2-factor authentication
5. Wait for verification (usually takes 30-60 seconds)

#### Method 2: Cookie Authentication

For users who prefer not to enter credentials:

1. Click **Connect with Cookie**
2. Follow the instructions to extract your LinkedIn session cookie
3. Paste the cookie value
4. Click Connect

### After Connecting

Once connected, your account will go through a warmup period:
- **Day 1-3**: Limited sending (10-15 actions/day)
- **Day 4-7**: Gradual increase (20-30 actions/day)
- **Day 8+**: Full capacity based on your plan

### Troubleshooting

**"Invalid credentials" error:**
- Double-check your email and password
- Try logging into LinkedIn directly first
- Clear any CAPTCHA challenges on LinkedIn

**"Checkpoint required" error:**
- LinkedIn is asking for verification
- Complete the verification in the modal
- Try again after verification

**Account disconnected:**
- LinkedIn sessions expire periodically
- Simply reconnect using the same method
    `,
  },
  {
    id: 'importing-leads',
    category: 'Getting Started',
    title: 'Importing leads',
    time: '4 min',
    content: `
## Importing Leads into SalesParrot

Build your prospect lists using multiple import methods.

### Import Methods

#### LinkedIn Search
1. Copy a LinkedIn search URL from your browser
2. Click **Add Leads** > **LinkedIn Search**
3. Paste the URL and set the number of leads to import
4. Click Start Import

#### Sales Navigator (Leads)
1. Open your Sales Navigator saved search or lead list
2. Copy the URL
3. Select **Sales Navigator (Leads)** import method
4. Paste and import

#### Sales Navigator (Accounts)
Import decision-makers from company accounts:
1. Copy a Sales Navigator account list URL
2. Select **Sales Navigator (Accounts)**
3. Choose roles/titles to target
4. Import

#### CSV Upload
Upload a spreadsheet with lead data:

**Required columns:**
- \`linkedin_url\` - LinkedIn profile URL

**Optional columns:**
- \`first_name\`, \`last_name\`
- \`email\`
- \`company\`, \`title\`

#### Paste LinkedIn URLs
Quickly import by pasting URLs:
1. Select **Paste LinkedIn URLs**
2. Paste one URL per line
3. Click Import

### Managing Lead Lists

- **Rename**: Click the menu icon on any list
- **Delete**: Remove lists you no longer need
- **Export**: Download leads as CSV

### Deduplication

SalesParrot automatically prevents duplicates:
- Same LinkedIn URL won't be imported twice
- Leads already in active campaigns are flagged
    `,
  },
  {
    id: 'creating-first-campaign',
    category: 'Getting Started',
    title: 'Creating your first campaign',
    time: '6 min',
    content: `
## Creating Your First Campaign

Build automated outreach sequences with our visual campaign builder.

### Step 1: Start a New Campaign

1. Go to **Campaigns**
2. Click **Start New Campaign**
3. Enter a campaign name (e.g., "Q1 Outreach - Marketing Directors")

### Step 2: Select Your Leads

Choose which leads to target:
1. Click **Select Lead List**
2. Choose from your imported lists
3. Review the lead count and availability

### Step 3: Build Your Sequence

Use the visual editor to create your outreach flow:

#### Available Steps:

**Connection Request**
- First touchpoint with prospects
- Add a personalized note (300 char limit)
- Use variables: {{first_name}}, {{company}}, {{title}}

**LinkedIn Message**
- Send after connection is accepted
- No character limit
- Can include links

**Wait Step**
- Add delays between actions
- Recommended: 2-3 days between steps

**Condition (If/Then)**
- Branch based on prospect behavior
- Example: "If Connected" → Send message, "If Not" → Send email

**Email**
- Requires connected email account
- Use when LinkedIn doesn't work
- Full HTML support

**Enrichment**
- Find prospect's email address
- Required before email steps

### Step 4: Configure Senders

1. Select which LinkedIn accounts to use
2. Attach email accounts for email steps
3. Set sending schedule (business hours recommended)

### Step 5: Review & Launch

1. Click **Review Campaign**
2. Check for warnings or errors
3. Click **Start Campaign**

### Example Sequence

\`\`\`
1. Connection Request (personalized note)
   ↓ Wait 3 days
2. If Connected?
   → Yes: LinkedIn Message (value prop)
   → No: Email (alternative contact)
   ↓ Wait 4 days
3. Follow-up Message
\`\`\`
    `,
  },
  // LinkedIn Safety
  {
    id: 'understanding-sending-limits',
    category: 'LinkedIn Safety',
    title: 'Understanding sending limits',
    time: '4 min',
    content: `
## LinkedIn Sending Limits

Understanding and respecting LinkedIn's limits is crucial for account safety.

### Daily Limits by Action Type

| Action | Safe Daily Limit | Maximum |
|--------|-----------------|---------|
| Connection Requests | 20-25 | 100/week |
| Messages (1st degree) | 50-75 | 150 |
| InMails | 25-50 | Based on plan |
| Profile Views | 100-150 | 500 |

### Factors Affecting Limits

**Account Age**
- New accounts: Lower limits
- Established accounts (1+ year): Higher limits

**Connection Count**
- <500 connections: Conservative limits
- 500-1000: Standard limits
- 1000+: Higher limits allowed

**LinkedIn Premium**
- Premium/Sales Navigator accounts have higher thresholds
- InMail credits increase limits

**Account Health**
- Previous restrictions lower your safe limits
- Clean history allows higher volumes

### How SalesParrot Manages Limits

We automatically:
1. Track all actions across campaigns
2. Distribute sends throughout the day
3. Respect per-account daily caps
4. Pause if approaching limits

### Setting Custom Limits

In **Accounts > LinkedIn > Settings**:
- Set maximum daily connections
- Set maximum daily messages
- Configure working hours

### Warning Signs

Reduce activity if you see:
- "You've reached the weekly invitation limit"
- Unusual CAPTCHA requests
- Connection requests pending for days
    `,
  },
  {
    id: 'account-warmup-explained',
    category: 'LinkedIn Safety',
    title: 'Account warmup explained',
    time: '3 min',
    content: `
## Account Warmup

New or dormant accounts need gradual activity increases to avoid detection.

### What is Warmup?

Warmup is the process of slowly increasing your LinkedIn activity to establish normal usage patterns. This helps LinkedIn's algorithm recognize your account as legitimate.

### Warmup Schedule

**Week 1: Foundation**
- Days 1-2: 5-10 connection requests
- Days 3-4: 10-15 connection requests
- Days 5-7: 15-20 connection requests

**Week 2: Building**
- Increase to 20-25 daily connections
- Start sending messages to new connections
- Engage with content (likes, comments)

**Week 3: Scaling**
- Full sending capacity
- Add automated sequences
- Monitor acceptance rates

### When to Warmup

You need warmup if:
- Account is newly created
- Haven't used LinkedIn in 30+ days
- Recently had restrictions removed
- Connecting a new account to SalesParrot

### Automatic Warmup

SalesParrot handles warmup automatically:
1. New accounts start with reduced limits
2. Limits increase daily based on performance
3. No manual intervention needed

### Tips for Faster Warmup

- Complete your profile (photo, headline, about)
- Connect with people you actually know
- Engage with content in your feed
- Post occasionally (1-2x per week)
- Accept incoming connection requests
    `,
  },
  {
    id: 'best-practices-safe-outreach',
    category: 'LinkedIn Safety',
    title: 'Best practices for safe outreach',
    time: '5 min',
    content: `
## Best Practices for Safe LinkedIn Outreach

Follow these guidelines to maximize results while keeping your account safe.

### Message Quality

**Do:**
- Personalize every message
- Reference something specific about the prospect
- Provide clear value upfront
- Keep messages concise (under 300 chars for connection notes)

**Don't:**
- Send identical messages to everyone
- Use spammy language ("Limited time offer!")
- Include links in connection requests
- Be overly salesy in first touch

### Timing & Frequency

**Optimal Sending Times:**
- Tuesday-Thursday: Best response rates
- 8-10 AM and 2-4 PM local time
- Avoid weekends and holidays

**Spacing:**
- 2-3 days between follow-ups
- Don't message the same person daily
- Limit to 3-4 touchpoints total

### Targeting

**Quality over Quantity:**
- Target relevant prospects only
- Use specific job titles and industries
- Smaller, targeted lists outperform large generic ones

**Avoid:**
- Competitors' employees
- People who've rejected you before
- Inactive profiles (no activity in 6+ months)

### Response Handling

- Reply to responses promptly (within 24 hours)
- Mark "not interested" leads appropriately
- Don't argue with negative responses

### Account Hygiene

- Withdraw pending requests older than 3 weeks
- Keep acceptance rate above 20%
- Regularly check account health metrics
    `,
  },
  {
    id: 'account-restricted-what-to-do',
    category: 'LinkedIn Safety',
    title: 'What to do if your account is restricted',
    time: '4 min',
    content: `
## Handling LinkedIn Account Restrictions

If your account gets restricted, don't panic. Here's what to do.

### Types of Restrictions

**Temporary Limit**
- Can't send connections for 24-72 hours
- Messages may still work
- Usually resolves automatically

**Feature Restriction**
- Specific feature disabled (e.g., InMail)
- May require appeal
- Can last 1-4 weeks

**Account Suspension**
- Full account lockout
- Requires identity verification
- Can take 1-2 weeks to resolve

### Immediate Steps

1. **Stop all automation** - Pause campaigns in SalesParrot
2. **Don't panic** - Most restrictions are temporary
3. **Check LinkedIn notifications** - They'll explain what happened
4. **Wait 24 hours** - Many restrictions auto-lift

### If Restriction Persists

1. **Submit an appeal:**
   - Go to LinkedIn Help Center
   - Select "Appeal a restriction"
   - Explain you'll follow guidelines

2. **Verify identity if asked:**
   - Upload government ID
   - Usually resolves within 48 hours

3. **Be patient:**
   - Don't create new accounts
   - Don't try to circumvent restrictions

### Preventing Future Restrictions

After restriction is lifted:
1. Wait 1 week before resuming automation
2. Start with 50% of previous volume
3. Gradually increase over 2 weeks
4. Improve message personalization
5. Target more relevant prospects

### When to Contact Support

Reach out to team@salesparrot.com if:
- Restriction lasts more than 2 weeks
- You need help with appeal wording
- Account was suspended without warning
    `,
  },
  // Campaigns
  {
    id: 'building-effective-sequences',
    category: 'Campaigns',
    title: 'Building effective sequences',
    time: '6 min',
    content: `
## Building Effective Outreach Sequences

Create sequences that get responses without being pushy.

### Sequence Structure

**The Ideal Flow:**

1. **Initial Contact** - Connection request with personalized note
2. **Wait** - 2-3 days for acceptance
3. **Conditional Branch** - Check if connected
4. **Value Message** - Share something helpful
5. **Wait** - 3-4 days
6. **Soft Follow-up** - Gentle check-in
7. **Final Touch** - Last attempt with different angle

### Writing Effective Messages

**Connection Request Note (300 chars):**
\`\`\`
Hi {{first_name}}, I noticed you're leading marketing at {{company}}.
I've been helping similar teams increase their pipeline by 40%.
Would love to connect and share some ideas.
\`\`\`

**First Message After Connection:**
\`\`\`
Thanks for connecting, {{first_name}}!

I saw that {{company}} recently [specific observation].

We've helped companies like [similar company] solve [relevant problem]
and achieve [specific result].

Would you be open to a quick 15-min chat to see if we could help?
\`\`\`

**Follow-up Message:**
\`\`\`
Hi {{first_name}}, just following up on my previous message.

I understand you're busy - would it help if I sent over a quick
case study showing how we helped [similar company] instead?

Either way, happy to connect you with resources that might help.
\`\`\`

### Personalization Variables

Available variables:
- \`{{first_name}}\` - Prospect's first name
- \`{{last_name}}\` - Last name
- \`{{company}}\` - Current company
- \`{{title}}\` - Job title
- \`{{location}}\` - Location

### Timing Recommendations

| Step | Wait Time |
|------|-----------|
| After connection request | 2-3 days |
| After first message | 3-4 days |
| After follow-up | 5-7 days |
| Final message | 7+ days |
    `,
  },
  {
    id: 'using-if-connected-logic',
    category: 'Campaigns',
    title: 'Using If Connected logic',
    time: '4 min',
    content: `
## Using Conditional Logic in Campaigns

Create smart sequences that adapt based on prospect behavior.

### What is If Connected Logic?

Conditional steps let you branch your sequence based on whether:
- The prospect accepted your connection
- They replied to your message
- They have an email address
- Other conditions

### Setting Up a Condition

1. Drag a **Condition** step onto your sequence
2. Select the condition type (e.g., "If Connected")
3. Connect the **Yes** branch to one path
4. Connect the **No** branch to an alternative path

### Common Condition Types

**If Connected**
- Yes → Send LinkedIn message
- No → Try email outreach

**If Replied**
- Yes → End sequence (manual follow-up)
- No → Continue with follow-ups

**Has Email**
- Yes → Include email steps
- No → LinkedIn only

### Example: Multi-Channel Sequence

\`\`\`
1. Connection Request
   ↓ Wait 3 days
2. If Connected?
   ├─ YES → LinkedIn Message
   │        ↓ Wait 4 days
   │        If Replied?
   │        ├─ YES → End
   │        └─ NO → Follow-up Message
   │
   └─ NO → Enrichment (find email)
          ↓
          Has Email?
          ├─ YES → Send Email
          └─ NO → End Sequence
\`\`\`

### Best Practices

1. **Always have a fallback** - Don't leave prospects stuck
2. **Limit branches** - Keep sequences readable
3. **Test both paths** - Ensure all branches work
4. **Match message to channel** - Email can be longer than LinkedIn
    `,
  },
  {
    id: 'multi-channel-campaigns',
    category: 'Campaigns',
    title: 'Multi-channel campaigns',
    time: '5 min',
    content: `
## Multi-Channel Campaign Strategy

Combine LinkedIn and email for maximum reach and response rates.

### Why Multi-Channel?

- **Higher reach**: Not everyone checks LinkedIn regularly
- **Multiple touchpoints**: More chances to connect
- **Flexibility**: Adapt to prospect preferences
- **Better results**: 2-3x higher response rates

### Channel Strengths

**LinkedIn:**
- Personal, conversational
- Great for initial contact
- Higher open rates
- Professional context

**Email:**
- Longer messages allowed
- Can include attachments
- Works when not connected
- Easier to forward/share

### Multi-Channel Sequence Template

\`\`\`
Day 1: LinkedIn Connection Request
       "Hi {{first_name}}, [personalized note]..."

Day 4: Check Connection Status
       ├─ Connected → LinkedIn Message
       └─ Not Connected → Continue

Day 5: (If not connected) Email #1
       Subject: "Quick question about {{company}}"

Day 8: LinkedIn Follow-up OR Email #2
       (Based on previous response)

Day 15: Final Touch (opposite channel)
\`\`\`

### Setup Requirements

1. **Connect LinkedIn account** (Accounts page)
2. **Connect email account** (Settings > Integrations)
3. **Enable enrichment** for email finding
4. **Attach email to LinkedIn sender** for unified tracking

### Tips for Success

- Keep messaging consistent across channels
- Reference previous touchpoints
- Don't send on both channels same day
- Track which channel gets better responses
    `,
  },
  {
    id: 'ab-testing-messages',
    category: 'Campaigns',
    title: 'A/B testing your messages',
    time: '4 min',
    content: `
## A/B Testing Your Messages

Optimize your outreach through systematic testing.

### What to Test

**Subject Lines (Email)**
- Question vs. statement
- Personalized vs. generic
- Short vs. descriptive

**Connection Notes**
- Different value propositions
- Various personalization approaches
- Casual vs. professional tone

**Message Content**
- Length (short vs. detailed)
- Call-to-action type
- Social proof inclusion

### How to A/B Test in SalesParrot

**Method 1: Separate Campaigns**
1. Create two identical campaigns
2. Change one variable (e.g., connection note)
3. Split your lead list 50/50
4. Run simultaneously
5. Compare results after 1-2 weeks

**Method 2: Sequential Testing**
1. Run version A for 1 week
2. Document results
3. Run version B for 1 week
4. Compare performance

### Metrics to Track

| Metric | What It Tells You |
|--------|-------------------|
| Acceptance Rate | Connection note effectiveness |
| Reply Rate | Message quality |
| Positive Reply Rate | Value proposition resonance |
| Meeting Book Rate | Overall sequence effectiveness |

### Testing Best Practices

1. **Test one variable at a time** - Isolate what's working
2. **Use sufficient sample size** - At least 50-100 per variant
3. **Run tests long enough** - Minimum 1 week
4. **Document everything** - Track what you tested and results
5. **Implement winners** - Apply learnings to all campaigns

### Example Test Results

\`\`\`
Connection Note A: "I'd love to connect and share ideas"
→ 18% acceptance rate

Connection Note B: "Noticed you're scaling the sales team at {{company}}"
→ 31% acceptance rate

Winner: Note B (+72% improvement)
\`\`\`
    `,
  },
  // Email & Enrichment
  {
    id: 'how-email-enrichment-works',
    category: 'Email & Enrichment',
    title: 'How email enrichment works',
    time: '3 min',
    content: `
## How Email Enrichment Works

Find verified business email addresses for your LinkedIn prospects.

### What is Enrichment?

Enrichment is the process of finding additional contact information (primarily email addresses) for your leads based on their LinkedIn profile data.

### How It Works

1. **Data Collection**: We gather name, company, and title from LinkedIn
2. **Pattern Matching**: Check common email patterns (john.doe@company.com)
3. **Database Lookup**: Search verified email databases
4. **Real-time Validation**: Verify email is deliverable
5. **Result Delivery**: Email added to lead profile

### Enrichment Success Rates

| Lead Type | Expected Success |
|-----------|-----------------|
| Enterprise (1000+ employees) | 70-85% |
| Mid-market (100-1000) | 60-75% |
| Small business (<100) | 40-60% |
| Personal emails | 20-30% |

### Using Enrichment in Campaigns

**Automatic (Recommended):**
- Add an Enrichment step before email steps
- System enriches just-in-time
- Only enriches leads that reach that step

**Manual:**
- Select leads in a list
- Click "Enrich Selected"
- Bulk enrich before campaign

### Enrichment Credits

- Each successful enrichment uses 1 credit
- Failed lookups don't use credits
- Credits included in your plan
- Additional credits available for purchase

### Tips for Better Results

- Ensure LinkedIn profiles have current company info
- Enterprise companies have higher success rates
- Some industries (tech, finance) enrich better
- Keep lead data up-to-date
    `,
  },
  {
    id: 'improving-email-deliverability',
    category: 'Email & Enrichment',
    title: 'Improving deliverability',
    time: '5 min',
    content: `
## Improving Email Deliverability

Ensure your emails reach the inbox, not spam.

### Deliverability Factors

**Sender Reputation**
- Based on your sending history
- Affected by bounces and spam reports
- Builds over time with good practices

**Email Content**
- Spam trigger words
- HTML vs. plain text
- Link and image usage

**Technical Setup**
- SPF, DKIM, DMARC records
- Sending domain age
- IP reputation

### Best Practices

**Warm Up Your Email**
1. Start with 10-20 emails/day
2. Increase by 10-20% weekly
3. Mix with manual emails
4. Target engaged recipients first

**Write Deliverable Emails**
- Avoid spam words: "FREE", "ACT NOW", "LIMITED TIME"
- Keep subject lines natural
- Use plain text or minimal HTML
- Include unsubscribe option
- Personalize content

**Maintain List Hygiene**
- Remove bounced emails immediately
- Clean inactive contacts
- Use verified emails only
- Don't buy email lists

### Technical Checklist

For your sending domain, ensure:
- [ ] SPF record configured
- [ ] DKIM signing enabled
- [ ] DMARC policy set
- [ ] Custom tracking domain (optional)

### Monitoring Deliverability

Track these metrics:
- **Bounce rate**: Keep under 2%
- **Spam complaints**: Keep under 0.1%
- **Open rate**: Industry average 20-25%

### Troubleshooting Low Deliverability

1. Check if domain is blacklisted (mxtoolbox.com)
2. Review recent email content
3. Reduce sending volume temporarily
4. Warm up again gradually
    `,
  },
  {
    id: 'email-personalization',
    category: 'Email & Enrichment',
    title: 'Email personalization',
    time: '4 min',
    content: `
## Email Personalization

Write emails that feel personal at scale.

### Why Personalization Matters

- **3x higher open rates** with personalized subject lines
- **6x higher transaction rates** with relevant content
- **Builds trust** and stands out from generic outreach

### Personalization Variables

**Basic Variables:**
\`\`\`
{{first_name}} - John
{{last_name}} - Smith
{{company}} - Acme Corp
{{title}} - VP of Sales
\`\`\`

**Advanced Variables:**
\`\`\`
{{location}} - San Francisco, CA
{{industry}} - Software
\`\`\`

### Personalization Levels

**Level 1: Name Only**
\`\`\`
Hi {{first_name}},

I wanted to reach out about...
\`\`\`

**Level 2: Name + Company**
\`\`\`
Hi {{first_name}},

I've been following {{company}}'s growth and...
\`\`\`

**Level 3: Contextual**
\`\`\`
Hi {{first_name}},

Congrats on {{company}}'s recent Series B! As you scale
the sales team, I thought you might find this relevant...
\`\`\`

### Subject Line Personalization

**Good Examples:**
- "{{first_name}}, quick question about {{company}}"
- "Idea for {{company}}'s sales team"
- "{{first_name}} - saw your post on [topic]"

**Avoid:**
- "{{first_name}}, you won't believe this!"
- Generic subjects without personalization
- All caps or excessive punctuation

### Dynamic Content Blocks

Create variants for different segments:

\`\`\`
{{#if title contains "CEO"}}
As a fellow founder, I know how challenging...
{{else if title contains "VP"}}
Leading a team at a growing company like {{company}}...
{{else}}
In your role at {{company}}...
{{/if}}
\`\`\`

### Testing Personalization

Compare results:
- Personalized vs. generic subject lines
- Different personalization depths
- Various opening hooks
    `,
  },
  {
    id: 'managing-bounces',
    category: 'Email & Enrichment',
    title: 'Managing bounces',
    time: '3 min',
    content: `
## Managing Email Bounces

Handle bounced emails to protect your sender reputation.

### Types of Bounces

**Hard Bounce**
- Email address doesn't exist
- Permanent delivery failure
- Remove immediately

**Soft Bounce**
- Temporary issue (full inbox, server down)
- May succeed on retry
- Monitor and remove if persists

### Bounce Handling in SalesParrot

**Automatic Actions:**
- Hard bounces: Email removed, lead flagged
- Soft bounces: Retry up to 3 times
- Repeated soft bounces: Treated as hard bounce

**Manual Review:**
- Check bounced leads in campaign reports
- Update email addresses if you have alternatives
- Mark as "no email" to try other channels

### Acceptable Bounce Rates

| Rate | Status | Action |
|------|--------|--------|
| <2% | Healthy | Continue normally |
| 2-5% | Warning | Review list quality |
| >5% | Critical | Pause and clean list |

### Reducing Bounces

**Before Sending:**
1. Use only enriched/verified emails
2. Remove role-based emails (info@, sales@)
3. Clean old lists before reusing
4. Validate emails before large campaigns

**During Campaigns:**
1. Monitor bounce rates daily
2. Pause if rate exceeds 5%
3. Remove bouncing domains

### Bounce Recovery

If you had high bounces:
1. Stop sending immediately
2. Clean your list thoroughly
3. Wait 24-48 hours
4. Resume with smaller volume
5. Gradually increase if rates stay low

### Email Validation Tips

Signs of potentially invalid emails:
- Generic patterns that don't match company style
- Very old company domains
- Personal domains for business contacts
- Catch-all domains (test carefully)
    `,
  },
];

interface Article {
  id: string;
  category: string;
  title: string;
  time: string;
  content: string;
}

interface Category {
  title: string;
  icon: JSX.Element;
  color: string;
  articles: Article[];
}

const faqs = [
  {
    question: 'Can I cancel my subscription?',
    answer:
      'Yes. You can cancel your subscription at any time from the Billing tab in Settings. Your access remains active until the end of the current billing period.',
  },
  {
    question: 'Is my LinkedIn account safe?',
    answer:
      "Yes! We use industry-leading safety measures including smart rate limiting, account warmup, and human-like sending patterns. Our system respects LinkedIn's guidelines to keep your account safe.",
  },
  {
    question: 'How do you find email addresses?',
    answer:
      'We use a combination of verified databases, pattern matching, and real-time validation to find and verify business email addresses for your leads. Only verified emails are used for outreach.',
  },
  {
    question: 'Can I connect multiple LinkedIn accounts?',
    answer:
      'Yes! Depending on your plan, you can connect multiple LinkedIn accounts. Our system automatically rotates between senders to maximize daily sending capacity while keeping each account safe.',
  },
];

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Group articles by category
  const categories: Category[] = useMemo(() => {
    const categoryMap: Record<string, Category> = {
      'Getting Started': {
        title: 'Getting Started',
        icon: <RocketIcon />,
        color: '#FF6B35',
        articles: [],
      },
      'LinkedIn Safety': {
        title: 'LinkedIn Safety',
        icon: <ShieldIcon />,
        color: '#22C55E',
        articles: [],
      },
      Campaigns: {
        title: 'Campaigns',
        icon: <CampaignIcon />,
        color: '#3B82F6',
        articles: [],
      },
      'Email & Enrichment': {
        title: 'Email & Enrichment',
        icon: <EmailIcon />,
        color: '#14B8A6',
        articles: [],
      },
    };

    articles.forEach((article) => {
      if (categoryMap[article.category]) {
        categoryMap[article.category].articles.push(article);
      }
    });

    return Object.values(categoryMap);
  }, []);

  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        articles: category.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(query) ||
            article.content.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.articles.length > 0);
  }, [categories, searchQuery]);

  // Filter FAQs based on search
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  if (selectedArticle) {
    return (
      <ArticleView
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        allArticles={articles}
        onSelectArticle={setSelectedArticle}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="pb-4 text-center md:pb-6">
        <h1 className="text-xl font-bold text-[#1E293B] sm:text-2xl">How can we help?</h1>
        <p className="mt-2 text-sm text-[#64748B] sm:text-base">
          Search our knowledge base or browse categories below
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-4 max-w-md md:mt-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] sm:left-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 sm:py-3 sm:pl-11 sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {searchQuery && (
          <p className="mt-3 text-sm text-[#64748B]">
            Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}{' '}
            matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && filteredArticles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#1E293B] sm:text-base">Search Results</h2>
          <ul className="space-y-2">
            {filteredArticles.map((article) => (
              <li key={article.id}>
                <button
                  onClick={() => setSelectedArticle(article)}
                  className="group flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-[#F8FAFC]"
                >
                  <div>
                    <span className="text-sm font-medium text-[#1E293B] group-hover:text-[#FF6B35]">
                      {article.title}
                    </span>
                    <span className="ml-2 text-xs text-[#94A3B8]">{article.category}</span>
                  </div>
                  <span className="text-xs text-[#94A3B8]">{article.time}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* No Results */}
      {searchQuery && filteredArticles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9]">
            <SearchIcon className="h-6 w-6 text-[#94A3B8]" />
          </div>
          <h3 className="mb-1 font-semibold text-[#1E293B]">No results found</h3>
          <p className="text-sm text-[#64748B]">
            Try different keywords or{' '}
            <button onClick={() => setSearchQuery('')} className="text-[#FF6B35] hover:underline">
              browse all articles
            </button>
          </p>
        </motion.div>
      )}

      {/* Categories */}
      {(!searchQuery || filteredCategories.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {(searchQuery ? filteredCategories : categories).map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#FF6B35]/30 hover:shadow-md sm:p-5"
            >
              <div className="mb-3 flex items-center gap-3 sm:mb-4">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <div style={{ color: category.color }}>{category.icon}</div>
                </div>
                <h2 className="text-sm font-semibold text-[#1E293B] sm:text-base">
                  {category.title}
                </h2>
              </div>
              <ul className="space-y-1 sm:space-y-2">
                {category.articles.map((article) => (
                  <li key={article.id}>
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="group flex w-full items-center justify-between py-1.5 text-left text-xs text-[#64748B] transition-colors hover:text-[#FF6B35] sm:py-2 sm:text-sm"
                    >
                      <span className="group-hover:underline">{article.title}</span>
                      <span className="ml-2 flex-shrink-0 text-xs text-[#94A3B8]">
                        {article.time}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAQs */}
      {(!searchQuery || filteredFaqs.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
        >
          <h2 className="mb-3 text-base font-semibold text-[#1E293B] sm:mb-4 sm:text-lg">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {(searchQuery ? filteredFaqs : faqs).map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-[#FF6B35]/20 bg-[#FFF7ED] p-4 text-center sm:p-6"
      >
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm sm:mb-4 sm:h-12 sm:w-12">
          <ChatIcon className="h-5 w-5 text-[#FF6B35] sm:h-6 sm:w-6" />
        </div>
        <h2 className="mb-1 text-sm font-semibold text-[#1E293B] sm:mb-2 sm:text-base">
          Still need help?
        </h2>
        <p className="mb-3 text-xs text-[#64748B] sm:mb-4 sm:text-sm">
          Our support team is here to help you succeed
        </p>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <a
            href="mailto:team@salesparrot.com"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] sm:w-auto"
          >
            <EmailSmallIcon />
            Email Support
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function ArticleView({
  article,
  onBack,
  allArticles,
  onSelectArticle,
}: {
  article: Article;
  onBack: () => void;
  allArticles: Article[];
  onSelectArticle: (article: Article) => void;
}) {
  // Get related articles from same category
  const relatedArticles = allArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  // Process inline markdown (bold, code, links)
  const processInlineMarkdown = (text: string): string => {
    let result = text;
    // Bold text
    result = result.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-semibold text-[#1E293B]">$1</strong>'
    );
    // Inline code
    result = result.replace(
      /`([^`]+)`/g,
      '<code class="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#DC2626] text-sm font-mono">$1</code>'
    );
    // Links
    result = result.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-[#FF6B35] hover:underline" target="_blank" rel="noopener">$1</a>'
    );
    return result;
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' = 'ul';
    let inTable = false;
    let tableRows: string[][] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType;
        elements.push(
          <ListTag
            key={elements.length}
            className={`mb-4 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} space-y-1 pl-6 text-[#475569]`}
          >
            {listItems.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
            ))}
          </ListTag>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={elements.length} className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  {tableRows[0].map((cell, i) => (
                    <th key={i} className="px-4 py-2 text-left font-semibold text-[#1E293B]">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(2).map((row, i) => (
                  <tr key={i} className="border-b border-[#E2E8F0]">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2 text-[#475569]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={elements.length}
              className="mb-4 overflow-x-auto rounded-lg bg-[#1E293B] p-4 text-sm text-[#E2E8F0]"
            >
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          flushList();
          flushTable();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Tables - check for separator row to identify table
      if (line.trim().startsWith('|') && line.includes('-')) {
        // This might be a separator row, skip it
        if (inTable && line.includes('---')) {
          tableRows.push([]); // placeholder for separator
          continue;
        }
      }

      if (line.trim().startsWith('|')) {
        flushList();
        if (!inTable) {
          inTable = true;
        }
        const cells = line
          .split('|')
          .filter((c) => c.trim() !== '')
          .map((c) => c.trim());
        if (cells.length > 0 && !cells.every((c) => c.match(/^-+$/))) {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headers - check #### first, then ###, then ##
      if (line.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={elements.length} className="mb-2 mt-5 text-base font-semibold text-[#1E293B]">
            {line.slice(5)}
          </h4>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={elements.length} className="mb-3 mt-6 text-lg font-semibold text-[#1E293B]">
            {line.slice(4)}
          </h3>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={elements.length} className="mb-4 mt-8 text-xl font-bold text-[#1E293B]">
            {line.slice(3)}
          </h2>
        );
        continue;
      }

      // Checkbox lists
      if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
        flushList();
        const isChecked = line.trim().startsWith('- [x] ');
        const text = line.trim().slice(6);
        elements.push(
          <div key={elements.length} className="mb-1 flex items-center gap-2 text-[#475569]">
            <input type="checkbox" checked={isChecked} readOnly className="rounded" />
            <span dangerouslySetInnerHTML={{ __html: processInlineMarkdown(text) }} />
          </div>
        );
        continue;
      }

      // Unordered lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(line.trim().slice(2));
        continue;
      }

      // Ordered lists
      if (/^\d+\.\s/.test(line.trim())) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(line.trim().replace(/^\d+\.\s/, ''));
        continue;
      }

      // Empty line ends list
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // If we're in a list but hit non-list content, flush the list first
      if (inList) {
        flushList();
      }

      // Regular paragraph
      if (line.trim()) {
        elements.push(
          <p
            key={elements.length}
            className="mb-4 leading-relaxed text-[#475569]"
            dangerouslySetInnerHTML={{ __html: processInlineMarkdown(line) }}
          />
        );
      }
    }

    // Flush any remaining content
    flushList();
    flushTable();

    if (inCodeBlock && codeContent.length > 0) {
      elements.push(
        <pre
          key={elements.length}
          className="mb-4 overflow-x-auto rounded-lg bg-[#1E293B] p-4 text-sm text-[#E2E8F0]"
        >
          <code>{codeContent.join('\n')}</code>
        </pre>
      );
    }

    return elements;
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm text-[#64748B] transition-colors hover:text-[#1E293B]"
      >
        <BackIcon />
        Back to Help Center
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Article Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-8"
        >
          {/* Article Header */}
          <div className="mb-6 border-b border-[#E2E8F0] pb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-[#FF6B35]/10 px-3 py-1 text-xs font-medium text-[#FF6B35]">
                {article.category}
              </span>
              <span className="text-xs text-[#94A3B8]">{article.time} read</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B]">{article.title}</h1>
          </div>

          {/* Article Body */}
          <div className="prose prose-slate max-w-none">{renderContent(article.content)}</div>

          {/* Helpful */}
          <div className="mt-8 border-t border-[#E2E8F0] pt-6">
            <p className="mb-3 text-sm font-medium text-[#1E293B]">Was this article helpful?</p>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#64748B] transition-colors hover:border-[#22C55E] hover:bg-[#F0FDF4] hover:text-[#22C55E]">
                <ThumbsUpIcon />
                Yes
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#64748B] transition-colors hover:border-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444]">
                <ThumbsDownIcon />
                No
              </button>
            </div>
          </div>
        </motion.article>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-[#E2E8F0] bg-white p-4"
            >
              <h3 className="mb-3 text-sm font-semibold text-[#1E293B]">Related Articles</h3>
              <ul className="space-y-2">
                {relatedArticles.map((related) => (
                  <li key={related.id}>
                    <button
                      onClick={() => onSelectArticle(related)}
                      className="text-left text-sm text-[#64748B] transition-colors hover:text-[#FF6B35] hover:underline"
                    >
                      {related.title}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Need Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-[#FF6B35]/20 bg-[#FFF7ED] p-4"
          >
            <h3 className="mb-2 text-sm font-semibold text-[#1E293B]">Still need help?</h3>
            <p className="mb-3 text-xs text-[#64748B]">Our support team is ready to assist you.</p>
            <a
              href="mailto:team@salesparrot.com"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A]"
            >
              <EmailSmallIcon />
              Contact Support
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#E2E8F0] pb-3 last:border-0 last:pb-0 sm:pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 py-1.5 text-left sm:py-2"
      >
        <span className="text-sm font-medium text-[#1E293B] sm:text-base">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDownIcon />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-2 text-xs text-[#64748B] sm:text-sm">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Icons
function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function CampaignIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function ChatIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

function EmailSmallIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
      />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"
      />
    </svg>
  );
}
