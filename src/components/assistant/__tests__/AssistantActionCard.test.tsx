import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantAction } from '@/lib/types';
import { AssistantActionCard } from '../AssistantActionCard';

vi.mock('@/lib/hooks/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/hooks/queries')>();
  return {
    ...actual,
    useSequenceStepSuggestions: () => ({
      mutate: vi.fn(),
      data: null,
      error: null,
      isPending: false,
    }),
    useSuggestionFeedback: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

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
    expect(screen.getByRole('button', { name: 'Edit JSON' })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: 'Edit JSON' }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: JSON.stringify({ name: 'Apollo Q3' }) } });
    fireEvent.click(screen.getByRole('button', { name: 'Save edits' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      { name: 'Apollo Q3' },
      'Action updated from review card.'
    );
  });

  it('supports visual selection editing for lead actions', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'tag_leads',
          preview: {
            title: 'Tag leads',
            summary: 'Tags: no-email | Affects: 12 of your leads',
            before: {},
            after: {},
            exact_payload: {
              tags: ['no-email'],
              lead_filters: {
                lead_list_name: 'Founders',
                status: 'new',
                has_email: false,
              },
            },
            warnings: [],
            scope_review: {
              matched_count: 12,
              sample_records: [{ name: 'Ada Lovelace', company: 'Analytical', status: 'new' }],
              filters: {
                lead_list_name: 'Founders',
                status: 'new',
                has_email: false,
              },
              stale: false,
              stale_reason: null,
            },
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit Selection' }));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'qualified' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'has_email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save selection' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        lead_filters: {
          lead_list_name: 'Founders',
          status: 'qualified',
          has_email: true,
        },
      },
      'Lead selection updated from review card.'
    );
  });

  it('supports structured campaign editing for rename actions', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'rename_campaign',
          payload: { name: 'Apollo Enterprise' },
          preview: {
            title: 'Rename campaign',
            summary: "Rename campaign 'Apollo Enterprise'",
            before: {},
            after: {},
            exact_payload: { name: 'Apollo Enterprise' },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByDisplayValue('Apollo Enterprise'), {
      target: { value: 'Apollo Q3 Enterprise' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      { name: 'Apollo Q3 Enterprise' },
      'Campaign details updated from review card.'
    );
  });

  it('supports structured campaign step editing', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'update_campaign_steps',
          payload: {
            steps: [
              {
                order: 1,
                type: 'message',
                config: {
                  message: 'Hi {{first_name}}, wanted to reach out.',
                },
                next_step_order: null,
                true_branch_order: null,
                false_branch_order: null,
              },
            ],
          },
          preview: {
            title: 'Update campaign steps',
            summary: "Update the sequence for 'Apollo Enterprise'",
            before: {},
            after: {},
            exact_payload: {
              steps: [
                {
                  order: 1,
                  type: 'message',
                  config: {
                    message: 'Hi {{first_name}}, wanted to reach out.',
                  },
                  next_step_order: null,
                  true_branch_order: null,
                  false_branch_order: null,
                },
              ],
            },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit Campaign Sequence')).toBeInTheDocument();
    expect(
      screen.getByText('Step order and branch structure stay locked here. Edit step content only.')
    ).toBeInTheDocument();
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Hi {{first_name}}, wanted to follow up today.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        steps: [
          {
            order: 1,
            type: 'message',
            config: {
              message: 'Hi {{first_name}}, wanted to follow up today.',
            },
            next_step_order: null,
            true_branch_order: null,
            false_branch_order: null,
          },
        ],
      },
      'Campaign sequence updated from review card.'
    );
  });

  it('renders typed import review details with advanced fallback', () => {
    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'start_leads_import',
          target_ref: {
            linkedin_account_name: 'Jay Sender',
          },
          payload: {
            list_name: 'Founders',
            import_type: 'linkedin_people_search',
            keywords: 'fintech founders',
            location_name: 'London',
            network_distance: ['2nd', '3rd'],
            max_leads: 200,
          },
          preview: {
            title: 'Start leads import',
            summary: "Import people search for fintech founders in London into 'Founders'",
            before: {},
            after: {},
            exact_payload: {
              list_name: 'Founders',
              import_type: 'linkedin_people_search',
              keywords: 'fintech founders',
              location_name: 'London',
              network_distance: ['2nd', '3rd'],
              max_leads: 200,
            },
            warnings: [],
          },
        })}
      />
    );

    expect(screen.getByText('Import Review')).toBeInTheDocument();
    expect(screen.getByText('Destination')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
    expect(screen.getByText('New list: Founders')).toBeInTheDocument();
    expect(screen.getByText('Account: Jay Sender')).toBeInTheDocument();
    expect(screen.getByText('Keywords: fintech founders')).toBeInTheDocument();
    expect(screen.getByText('Advanced details')).toBeInTheDocument();
  });

  it('renders append import review against an existing list', () => {
    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'start_leads_import',
          target_ref: {
            lead_list_id: 'list-1',
            lead_list_name: 'Founders',
            linkedin_account_name: 'Jay Sender',
          },
          payload: {
            import_type: 'paste_urls',
            source_data: ['https://www.linkedin.com/in/jane-doe'],
          },
          preview: {
            title: 'Start leads import',
            summary: "Import paste URLs import with 1 URLs into existing list 'Founders'",
            before: {},
            after: {},
            exact_payload: {
              import_type: 'paste_urls',
              source_data: ['https://www.linkedin.com/in/jane-doe'],
            },
            warnings: [],
          },
        })}
      />
    );

    expect(screen.getByText('Existing list: Founders')).toBeInTheDocument();
  });

  it('supports structured import editing', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'start_leads_import',
          target_ref: {
            linkedin_account_name: 'Jay Sender',
          },
          payload: {
            list_name: 'Founders',
            import_type: 'linkedin_people_search',
            keywords: 'fintech founders',
            location_name: 'London',
            network_distance: [2, 3],
            max_leads: 200,
          },
          preview: {
            title: 'Start leads import',
            summary: "Import people search for fintech founders in London into 'Founders'",
            before: {},
            after: {},
            exact_payload: {
              list_name: 'Founders',
              import_type: 'linkedin_people_search',
              keywords: 'fintech founders',
              location_name: 'London',
              network_distance: [2, 3],
              max_leads: 200,
            },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByDisplayValue('Founders'), {
      target: { value: 'Series A Founders' },
    });
    fireEvent.change(screen.getByDisplayValue('fintech founders'), {
      target: { value: 'b2b founders' },
    });
    fireEvent.change(screen.getByDisplayValue('London'), { target: { value: 'New York' } });
    fireEvent.change(screen.getByDisplayValue('2, 3'), { target: { value: '1, 2' } });
    fireEvent.change(screen.getByDisplayValue('200'), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        list_name: 'Series A Founders',
        import_type: 'linkedin_people_search',
        source_url: null,
        source_data: [],
        keywords: 'b2b founders',
        location_name: 'New York',
        network_distance: [1, 2],
        search_params: null,
        max_leads: 150,
      },
      'Import criteria updated from review card.'
    );
  });

  it('keeps existing import target list during structured edits', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'start_leads_import',
          target_ref: {
            lead_list_id: 'list-1',
            lead_list_name: 'Founders',
            linkedin_account_name: 'Jay Sender',
          },
          payload: {
            import_type: 'paste_urls',
            source_data: ['https://www.linkedin.com/in/jane-doe'],
          },
          preview: {
            title: 'Start leads import',
            summary: "Import paste URLs import with 1 URLs into existing list 'Founders'",
            before: {},
            after: {},
            exact_payload: {
              import_type: 'paste_urls',
              source_data: ['https://www.linkedin.com/in/jane-doe'],
            },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Profile URLs' }), {
      target: {
        value: 'https://www.linkedin.com/in/jane-doe\nhttps://www.linkedin.com/in/john-doe',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        list_name: null,
        import_type: 'paste_urls',
        source_url: null,
        source_data: [
          'https://www.linkedin.com/in/jane-doe',
          'https://www.linkedin.com/in/john-doe',
        ],
        keywords: null,
        location_name: null,
        network_distance: [],
        search_params: null,
        max_leads: null,
      },
      'Import criteria updated from review card.'
    );
  });

  it('renders typed merge lead list review details', () => {
    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'merge_lead_lists',
          target_ref: {
            lead_list_id: 'list-target',
            lead_list_name: 'Q2 Prospects',
          },
          payload: {
            source_list_names: ['Founders', 'CEOs'],
            delete_source_lists: true,
          },
          preview: {
            title: 'Merge lead lists',
            summary:
              "Merge Founders, CEOs into 'Q2 Prospects' | Adds 40 unique leads | Skips 6 duplicates",
            before: {},
            after: {
              merge_preview: {
                leads_to_add: 40,
                duplicates_skipped: 6,
                source_lists_ready_for_deletion: 1,
                source_lists_blocked_from_deletion: 1,
                source_lists: [
                  { id: 'list-1', name: 'Founders' },
                  { id: 'list-2', name: 'CEOs' },
                ],
              },
            },
            exact_payload: {
              source_list_names: ['Founders', 'CEOs'],
              delete_source_lists: true,
            },
            warnings: [],
          },
        })}
      />
    );

    expect(screen.getByText('Lead List Merge Review')).toBeInTheDocument();
    expect(screen.getByText('Target list: Q2 Prospects')).toBeInTheDocument();
    expect(screen.getByText('Unique leads to add: 40')).toBeInTheDocument();
    expect(screen.getByText('Duplicates skipped: 6')).toBeInTheDocument();
    expect(screen.getByText('Ready to delete: 1')).toBeInTheDocument();
    expect(screen.getByText('Blocked from deletion: 1')).toBeInTheDocument();
  });

  it('renders typed reply review details', () => {
    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'send_reply_draft',
          target_ref: {
            conversation_id: 'conversation-1',
            conversation_name: 'Ada Lovelace',
            draft_message_id: 'draft-1',
          },
          payload: {
            subject: 'Re: Intro',
            body: 'Thanks for the note.\nHappy to help.',
          },
          preview: {
            title: 'Send reply draft',
            summary: "Send the drafted reply for 'Ada Lovelace'",
            before: {},
            after: {},
            exact_payload: {
              subject: 'Re: Intro',
              body: 'Thanks for the note.\nHappy to help.',
            },
            warnings: [],
          },
        })}
      />
    );

    expect(screen.getByText('Reply Review')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Draft Preview')).toBeInTheDocument();
    expect(screen.getByText('Send this drafted reply now')).toBeInTheDocument();
    expect(screen.getByText(/Subject:/)).toBeInTheDocument();
    expect(screen.getByText(/35 characters/)).toBeInTheDocument();
    expect(screen.getByText('Advanced details')).toBeInTheDocument();
  });

  it('supports structured reply editing', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'send_reply_draft',
          target_ref: {
            conversation_id: 'conversation-1',
            conversation_name: 'Ada Lovelace',
            draft_message_id: 'draft-1',
          },
          payload: {
            subject: 'Re: Intro',
            body: 'Thanks for the note.\nHappy to help.',
          },
          preview: {
            title: 'Send reply draft',
            summary: "Send the drafted reply for 'Ada Lovelace'",
            before: {},
            after: {},
            exact_payload: {
              subject: 'Re: Intro',
              body: 'Thanks for the note.\nHappy to help.',
            },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByDisplayValue('Re: Intro'), { target: { value: 'Re: Follow up' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Body' }), {
      target: { value: 'Thanks for the follow up.\nCan we speak tomorrow?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        subject: 'Re: Follow up',
        body: 'Thanks for the follow up.\nCan we speak tomorrow?',
      },
      'Reply content updated from review card.'
    );
  });

  it('supports structured delivery settings editing', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'update_delivery_settings',
          risk_level: 'low',
          payload: {
            daily_summary_enabled: false,
            delivery_channel: 'whatsapp',
            daily_summary_time: '08:30',
            timezone: 'UTC',
          },
          preview: {
            title: 'Update assistant delivery settings',
            summary: 'Update assistant delivery settings | Daily summary: disabled',
            before: {},
            after: {},
            exact_payload: {
              daily_summary_enabled: false,
              delivery_channel: 'whatsapp',
              daily_summary_time: '08:30',
              timezone: 'UTC',
            },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Daily summary enabled' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Delivery channel' }), {
      target: { value: 'both' },
    });
    fireEvent.change(screen.getByDisplayValue('08:30'), { target: { value: '09:15' } });
    fireEvent.change(screen.getByDisplayValue('UTC'), { target: { value: 'Africa/Lagos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        daily_summary_enabled: true,
        delivery_channel: 'both',
        daily_summary_time: '09:15',
        timezone: 'Africa/Lagos',
      },
      'Delivery settings updated from review card.'
    );
  });

  it('supports structured workspace context editing', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'update_workspace_context',
          payload: {
            brand_tone: 'Direct and calm',
            value_proposition: 'Book more demos with less manual outreach.',
          },
          preview: {
            title: 'Update workspace context',
            summary: 'Update workspace context | Context fields: brand tone, value proposition',
            before: {},
            after: {},
            exact_payload: {
              brand_tone: 'Direct and calm',
              value_proposition: 'Book more demos with less manual outreach.',
            },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByDisplayValue('Direct and calm'), {
      target: { value: 'Confident and concise' },
    });
    fireEvent.change(screen.getByDisplayValue('Book more demos with less manual outreach.'), {
      target: { value: 'Create more qualified pipeline from every sender.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        brand_tone: 'Confident and concise',
        value_proposition: 'Create more qualified pipeline from every sender.',
      },
      'Workspace context updated from review card.'
    );
  });

  it('supports structured list editing for marketing lists', () => {
    const onEdit = vi.fn();

    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'rename_marketing_list',
          target_ref: {
            marketing_list_id: 'marketing-list-1',
            marketing_list_name: 'Newsletter Leads',
          },
          payload: {
            name: 'Newsletter Leads',
            description: 'Monthly product updates.',
          },
          preview: {
            title: 'Rename marketing list',
            summary: "Rename marketing list 'Newsletter Leads'",
            before: {},
            after: {},
            exact_payload: {
              name: 'Newsletter Leads',
              description: 'Monthly product updates.',
            },
            warnings: [],
          },
        })}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByDisplayValue('Newsletter Leads'), {
      target: { value: 'VIP Newsletter Leads' },
    });
    fireEvent.change(screen.getByDisplayValue('Monthly product updates.'), {
      target: { value: 'High-intent subscribers for launch updates.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith(
      'action-1',
      {
        name: 'VIP Newsletter Leads',
        description: 'High-intent subscribers for launch updates.',
      },
      'List details updated from review card.'
    );
  });

  it('shows stale scope warning and hides execute for stale approved lead actions', () => {
    render(
      <AssistantActionCard
        action={buildAction({
          action_type: 'tag_leads',
          status: 'approved',
          preview: {
            title: 'Tag leads',
            summary: 'Tags: no-email | Affects: 12 of your leads',
            before: {},
            after: {},
            exact_payload: { tags: ['no-email'], lead_filters: { status: 'new' } },
            warnings: [],
            scope_review: {
              matched_count: 14,
              reviewed_matched_count: 12,
              sample_records: [{ name: 'Ada Lovelace', company: 'Analytical', status: 'new' }],
              filters: { status: 'new' },
              stale: true,
              stale_reason:
                'Lead selection changed since review. Reviewed 12 leads, now 14 match. Review and approve again before execution.',
            },
          },
        })}
      />
    );

    expect(screen.getByText('Scope Changed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Lead selection changed since review. Reviewed 12 leads, now 14 match. Review and approve again before execution.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Execute' })).not.toBeInTheDocument();
  });
});
