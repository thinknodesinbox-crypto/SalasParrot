import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantAction } from '@/lib/types';
import { AssistantActionCard } from '../AssistantActionCard';

function buildAction(overrides: Partial<AssistantAction> = {}): AssistantAction {
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
    ...overrides,
  };
}

describe('AssistantActionCard', () => {
  it('renders review controls for awaiting confirmation actions', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction()}
        onApprove={onApprove}
        onReject={onReject}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('Pause campaign')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Execute' })).not.toBeInTheDocument();
  });

  it('renders execute control for approved actions', () => {
    const onExecute = vi.fn();

    render(
      <AssistantActionCard action={buildAction({ status: 'approved' })} onExecute={onExecute} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));
    expect(onExecute).toHaveBeenCalledWith('action-1');
  });

  it('shows waiting state and options for pending target selection', () => {
    render(
      <AssistantActionCard
        action={buildAction({
          status: 'proposed',
          target_ref: {
            campaign_name: 'Apollo',
            options: ['Apollo Q2', 'Apollo Enterprise'],
            target_key: 'campaign_name',
          },
          preview: {
            title: 'Pause campaign',
            summary: "I found multiple campaigns matching 'Apollo'.",
            before: {},
            after: {},
            exact_payload: {},
            warnings: ['Awaiting target selection.'],
          },
        })}
      />
    );

    expect(screen.getByText('Waiting For Target Selection')).toBeInTheDocument();
    expect(screen.getByText('Apollo Q2')).toBeInTheDocument();
    expect(screen.getByText('Apollo Enterprise')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
  });

  it('supports inline editing and submits parsed payload', () => {
    const onEdit = vi.fn();

    render(<AssistantActionCard action={buildAction()} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: JSON.stringify({ name: 'Apollo Q3' }) } });
    fireEvent.click(screen.getByRole('button', { name: 'Save edits' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      { name: 'Apollo Q3' },
      'Action updated from review card.'
    );
  });
});
