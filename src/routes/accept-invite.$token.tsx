import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/auth';
import {
  useValidateInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
} from '@/lib/hooks/queries/useInvitations';
import { Check, X, AlertCircle, Clock, Users, Mail } from 'lucide-react';

export const Route = createFileRoute('/accept-invite/$token')({
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setTokens = useAuthStore((state) => state.setTokens);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Form state for new user signup
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: validation, isLoading: validating } = useValidateInvitation(token);
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  // Pre-fill name from email if available
  useEffect(() => {
    if (validation?.email && !name) {
      const emailName = validation.email.split('@')[0];
      setName(emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._]/g, ' '));
    }
  }, [validation?.email, name]);

  // Handle logged-in user accepting
  const handleAcceptAsLoggedInUser = async () => {
    try {
      const result = await acceptMutation.mutateAsync({ token });
      if (result.success) {
        navigate({ to: '/dashboard' });
      }
    } catch {
      // Error handled by mutation
    }
  };

  // Handle new user signup and accept
  const handleAcceptAsNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your name');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      const result = await acceptMutation.mutateAsync({
        token,
        data: { name: name.trim(), password },
      });

      if (result.success && result.access_token && result.refresh_token) {
        // New user created - set tokens and fetch user
        setTokens(result.access_token, result.refresh_token);
        await fetchUser();
        navigate({ to: '/dashboard' });
      }
    } catch {
      // Error handled by mutation
    }
  };

  // Handle decline
  const handleDecline = async () => {
    try {
      await declineMutation.mutateAsync(token);
      navigate({ to: '/' });
    } catch {
      // Error handled by mutation
    }
  };

  // Loading state
  if (validating || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBEB]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
          <p className="mt-4 text-[#64748B]">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid token states
  if (!validation?.valid) {
    const errorMessages: Record<
      string,
      { title: string; description: string; icon: React.ReactNode }
    > = {
      not_found: {
        title: 'Invitation Not Found',
        description: 'This invitation link is invalid or has been removed.',
        icon: <AlertCircle className="h-12 w-12 text-red-500" />,
      },
      expired: {
        title: 'Invitation Expired',
        description:
          'This invitation has expired. Please ask the workspace admin to send a new invitation.',
        icon: <Clock className="h-12 w-12 text-amber-500" />,
      },
      already_accepted: {
        title: 'Already Accepted',
        description:
          'This invitation has already been accepted. You may already have access to the workspace.',
        icon: <Check className="h-12 w-12 text-green-500" />,
      },
      already_declined: {
        title: 'Invitation Declined',
        description: 'This invitation was previously declined.',
        icon: <X className="h-12 w-12 text-gray-500" />,
      },
    };

    const error = errorMessages[validation?.error || 'not_found'] || errorMessages.not_found;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBEB] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"
        >
          <div className="mx-auto mb-4">{error.icon}</div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{error.title}</h1>
          <p className="mt-2 text-[#64748B]">{error.description}</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-[#FF6B35] px-6 py-3 font-medium text-white hover:bg-[#E85A2A]"
          >
            Go to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  // Check if logged-in user's email matches
  const emailMatches =
    user && validation.email && user.email.toLowerCase() === validation.email.toLowerCase();
  const emailMismatch =
    user && validation.email && user.email.toLowerCase() !== validation.email.toLowerCase();

  // Logged-in user with email mismatch
  if (emailMismatch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBEB] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"
        >
          <Mail className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold text-[#1E293B]">Different Email</h1>
          <p className="mt-2 text-[#64748B]">
            This invitation was sent to <strong>{validation.email}</strong>, but you're logged in as{' '}
            <strong>{user.email}</strong>.
          </p>
          <p className="mt-4 text-sm text-[#64748B]">
            Please log out and sign in with the correct email, or ask the workspace admin to invite
            your current email.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/login"
              className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-3 font-medium text-[#1E293B] hover:bg-[#F8FAFC]"
            >
              Log Out & Sign In
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 rounded-lg bg-[#FF6B35] px-4 py-3 font-medium text-white hover:bg-[#E85A2A]"
            >
              Go to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Logged-in user with matching email - show accept/decline
  if (emailMatches) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBEB] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
        >
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B35]/10">
              <Users className="h-8 w-8 text-[#FF6B35]" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[#1E293B]">Join Workspace</h1>
            <p className="mt-2 text-[#64748B]">
              <strong>{validation.inviter_name}</strong> invited you to join
            </p>
            <p className="text-xl font-semibold text-[#1E293B]">{validation.workspace_name}</p>
            <p className="mt-2 text-sm text-[#64748B]">
              Role: <span className="font-medium capitalize">{validation.role}</span>
            </p>
          </div>

          {acceptMutation.error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {acceptMutation.error.message}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDecline}
              disabled={declineMutation.isPending || acceptMutation.isPending}
              className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-3 font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              {declineMutation.isPending ? 'Declining...' : 'Decline'}
            </button>
            <button
              onClick={handleAcceptAsLoggedInUser}
              disabled={acceptMutation.isPending || declineMutation.isPending}
              className="flex-1 rounded-lg bg-[#FF6B35] px-4 py-3 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
            >
              {acceptMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Joining...
                </span>
              ) : (
                'Accept & Join'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not logged in - show signup form
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFBEB] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B35]/10">
            <Users className="h-8 w-8 text-[#FF6B35]" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#1E293B]">You're Invited!</h1>
          <p className="mt-2 text-[#64748B]">
            <strong>{validation.inviter_name}</strong> invited you to join
          </p>
          <p className="text-xl font-semibold text-[#1E293B]">{validation.workspace_name}</p>
        </div>

        <div className="mt-6 rounded-lg bg-[#F8FAFC] p-4">
          <p className="text-sm text-[#64748B]">
            <Mail className="mr-2 inline-block h-4 w-4" />
            Invitation sent to: <strong>{validation.email}</strong>
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            Role: <span className="font-medium capitalize">{validation.role}</span>
          </p>
        </div>

        <form onSubmit={handleAcceptAsNewUser} className="mt-6 space-y-4">
          <p className="text-sm font-medium text-[#1E293B]">Create your account to join:</p>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#1E293B]">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-4 py-3 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1E293B]">
              Create Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-4 py-3 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1E293B]">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-4 py-3 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
              placeholder="Confirm your password"
              required
            />
          </div>

          {(formError || acceptMutation.error) && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {formError || acceptMutation.error?.message}
            </div>
          )}

          <button
            type="submit"
            disabled={acceptMutation.isPending}
            className="w-full rounded-lg bg-[#FF6B35] px-4 py-3 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {acceptMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating account...
              </span>
            ) : (
              'Create Account & Join'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-[#64748B]">
            Already have an account?{' '}
            <Link
              to="/login"
              search={{ redirect: `/accept-invite/${token}` }}
              className="font-medium text-[#FF6B35] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <div className="mt-4 border-t border-[#E2E8F0] pt-4 text-center">
          <button
            onClick={handleDecline}
            disabled={declineMutation.isPending}
            className="text-sm text-[#64748B] hover:text-[#1E293B]"
          >
            {declineMutation.isPending ? 'Declining...' : 'Decline this invitation'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
