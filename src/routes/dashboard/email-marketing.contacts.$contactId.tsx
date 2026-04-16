import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  useMarketingContact,
  useMarketingContactActivity,
  useUpdateMarketingContact,
} from '@/lib/hooks/queries';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export const Route = createFileRoute('/dashboard/email-marketing/contacts/$contactId')({
  component: EmailMarketingContactDetailPage,
});

function EmailMarketingContactDetailPage() {
  const { contactId } = Route.useParams();
  const { data: contact, isLoading } = useMarketingContact(contactId);
  const { data: activityData } = useMarketingContactActivity(contactId);
  const updateMutation = useUpdateMarketingContact();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [attributesText, setAttributesText] = useState('{}');

  useEffect(() => {
    if (!contact) return;
    setFirstName(contact.first_name || '');
    setLastName(contact.last_name || '');
    setTimezone(contact.timezone || '');
    setAttributesText(JSON.stringify(contact.attributes || {}, null, 2));
  }, [contact]);

  const handleSave = async () => {
    let attributes: Record<string, unknown> = {};
    try {
      attributes = attributesText.trim() ? JSON.parse(attributesText) : {};
      if (typeof attributes !== 'object' || Array.isArray(attributes) || attributes === null) {
        throw new Error('Attributes must be a JSON object.');
      }
    } catch (error) {
      showErrorToast('Invalid attributes JSON', error instanceof Error ? error.message : undefined);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        contactId,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        timezone: timezone.trim() || null,
        attributes,
      });
      showSuccessToast('Contact updated', 'Marketing contact details were saved.');
    } catch (error) {
      showErrorToast(
        'Failed to update contact',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  if (isLoading) {
    return <p className="text-sm text-[#64748B]">Loading contact...</p>;
  }

  if (!contact) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <p className="text-sm text-[#64748B]">Contact not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-[#64748B]">Contact Detail</div>
            <h2 className="mt-1 text-xl font-semibold text-[#1E293B]">{contact.email}</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Edit reusable marketing profile data that can power personalization and segmentation.
            </p>
          </div>
          <Link
            to="/dashboard/email-marketing/contacts"
            className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#334155]"
          >
            Back to imports
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155]">
              <span className="font-medium">First name</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 focus:border-[#FF6B35] focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-[#334155]">
              <span className="font-medium">Last name</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 focus:border-[#FF6B35] focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-[#334155] md:col-span-2">
              <span className="font-medium">Timezone</span>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Africa/Lagos"
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 focus:border-[#FF6B35] focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-[#334155] md:col-span-2">
              <span className="font-medium">Attributes JSON</span>
              <textarea
                value={attributesText}
                onChange={(e) => setAttributesText(e.target.value)}
                rows={14}
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 font-mono text-xs focus:border-[#FF6B35] focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save contact
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#64748B]">Status</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#64748B]">Source</dt>
              <dd className="text-right font-medium text-[#1E293B]">{contact.source}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#64748B]">Contact status</dt>
              <dd className="text-right font-medium text-[#1E293B]">{contact.status}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#64748B]">Created</dt>
              <dd className="text-right font-medium text-[#1E293B]">
                {new Date(contact.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#64748B]">Updated</dt>
              <dd className="text-right font-medium text-[#1E293B]">
                {new Date(contact.updated_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#64748B]">
            List Memberships
          </h3>
          {activityData?.memberships.length ? (
            <div className="mt-4 space-y-3">
              {activityData.memberships.map((membership) => (
                <div
                  key={`${membership.list_id}-${membership.created_at}`}
                  className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                >
                  <div className="text-sm font-medium text-[#1E293B]">{membership.list_name}</div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {membership.status} · added {new Date(membership.created_at).toLocaleString()}
                  </div>
                  {membership.subscribed_at ? (
                    <div className="mt-1 text-xs text-[#0F766E]">
                      Subscribed {new Date(membership.subscribed_at).toLocaleString()}
                    </div>
                  ) : null}
                  {membership.unsubscribed_at ? (
                    <div className="mt-1 text-xs text-[#B91C1C]">
                      Unsubscribed {new Date(membership.unsubscribed_at).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#64748B]">No list memberships recorded.</p>
          )}
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#64748B]">Activity</h3>
          {activityData?.activity.length ? (
            <div className="mt-4 space-y-3">
              {activityData.activity.map((item, index) => (
                <div
                  key={`${item.kind}-${item.event_type}-${item.occurred_at}-${index}`}
                  className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[#1E293B]">{item.event_type}</div>
                    <div className="text-xs text-[#64748B]">
                      {new Date(item.occurred_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {item.kind === 'consent'
                      ? item.list_name || item.source || 'Consent event'
                      : item.broadcast_name || 'Broadcast event'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#64748B]">No activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
