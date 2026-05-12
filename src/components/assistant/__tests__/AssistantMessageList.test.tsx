import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantAction, AssistantMessage } from '@/lib/types';
import { AssistantMessageList } from '../AssistantMessageList';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    search,
    ...props
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, unknown>;
  }) => {
    const params = new URLSearchParams();
    Object.entries(search || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
    const href = params.toString() ? `${to}?${params.toString()}` : to;
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

function buildMessage(overrides: Partial<AssistantMessage> = {}): AssistantMessage {
  return {
    id: 'message-1',
    thread_id: 'thread-1',
    workspace_id: 'workspace-1',
    user_id: null,
    role: 'assistant',
    content: 'I prepared an action for review.',
    message_type: 'text',
    interface: 'dashboard_text',
    metadata: {},
    created_at: '2026-04-22T10:00:00Z',
    ...overrides,
  };
}

function buildAction(): AssistantAction {
  return {
    id: 'action-1',
    workspace_id: 'workspace-1',
    thread_id: 'thread-1',
    proposed_by_message_id: null,
    approved_by_user_id: null,
    executed_by_user_id: null,
    action_type: 'pause_campaign',
    risk_level: 'medium',
    status: 'awaiting_confirmation',
    requires_confirmation: true,
    target_ref: {
      campaign_id: 'campaign-1',
      campaign_name: 'Apollo Enterprise',
      before: {},
    },
    payload: {},
    preview: {
      title: 'Pause campaign',
      summary: 'Campaign: Apollo Enterprise',
      before: {},
      after: {},
      exact_payload: {},
      warnings: [],
    },
    result: null,
    error: null,
    expires_at: null,
    approved_at: null,
    executed_at: null,
    created_at: '2026-04-22T10:00:00Z',
    updated_at: '2026-04-22T10:00:00Z',
  };
}

describe('AssistantMessageList', () => {
  it('renders empty state when no messages are present', () => {
    render(<AssistantMessageList messages={[]} isLoading={false} />);

    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
  });

  it('renders linked action card for assistant messages with action metadata', () => {
    const onApproveAction = vi.fn();
    const action = buildAction();
    const message = buildMessage({
      metadata: {
        action_id: action.id,
      },
    });

    render(
      <AssistantMessageList
        messages={[message]}
        actionsById={{ [action.id]: action }}
        isLoading={false}
        onApproveAction={onApproveAction}
      />
    );

    expect(screen.getByText('I prepared an action for review.')).toBeInTheDocument();
    expect(screen.getByText('Pause campaign')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });

  it('renders only the latest action card for repeated action lifecycle messages', () => {
    const action = buildAction();
    const firstMessage = buildMessage({
      id: 'message-1',
      content: 'I prepared an action for review.',
      metadata: {
        action_id: action.id,
      },
    });
    const secondMessage = buildMessage({
      id: 'message-2',
      content: 'Action approved. Execute when ready.',
      metadata: {
        action_id: action.id,
      },
      created_at: '2026-04-22T10:01:00Z',
    });

    render(
      <AssistantMessageList
        messages={[firstMessage, secondMessage]}
        actionsById={{ [action.id]: action }}
        isLoading={false}
      />
    );

    expect(screen.getByText('I prepared an action for review.')).toBeInTheDocument();
    expect(screen.getByText('Action approved. Execute when ready.')).toBeInTheDocument();
    expect(screen.getAllByText('Pause campaign')).toHaveLength(1);
  });

  it('renders response cards for structured assistant insights', () => {
    const message = buildMessage({
      content: 'Here is the current campaign status.',
      metadata: {
        response_card: {
          kind: 'campaign_detail',
          tone: 'orange',
          eyebrow: 'Campaign',
          title: 'Apollo Enterprise',
          subtitle: 'Status: active',
          stats: [
            { label: 'Status', value: 'active' },
            { label: 'Leads', value: '42' },
          ],
          sections: [
            {
              title: 'Performance',
              items: ['6 replied leads', '2 accepted leads'],
            },
          ],
          cta: {
            label: 'Open In Campaigns',
            href: '/dashboard/campaigns?campaignId=campaign-1',
          },
        },
      },
    });

    render(<AssistantMessageList messages={[message]} isLoading={false} />);

    expect(screen.getByText('Apollo Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Status: active')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open In Campaigns' })).toHaveAttribute(
      'href',
      '/dashboard/campaigns?campaignId=campaign-1'
    );
  });

  it('renders voice draft transcripts and errors alongside persisted messages', () => {
    render(
      <AssistantMessageList
        messages={[buildMessage({ role: 'user', user_id: 'user-1', content: 'Hello' })]}
        isLoading={false}
        draftUserMessage="Draft user transcript"
        draftAssistantMessage="Draft assistant transcript"
        error="Transcript save failed."
      />
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Draft user transcript')).toBeInTheDocument();
    expect(screen.getByText('Draft assistant transcript')).toBeInTheDocument();
    expect(screen.getByText('Transcript save failed.')).toBeInTheDocument();
  });

  it('keeps optimistic suggested-prompt drafts visible while a new thread loads', () => {
    render(
      <AssistantMessageList
        messages={[]}
        isLoading
        isResponding
        draftUserMessage="Which campaigns need attention first?"
      />
    );

    expect(screen.getByText('Which campaigns need attention first?')).toBeInTheDocument();
    expect(screen.getByText('SalesParrot is thinking')).toBeInTheDocument();
  });
});
