import { useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import type { AssistantTranscriptResponse } from '@/lib/types';

type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface VoiceCapability {
  supported: boolean;
  reason: string | null;
}

interface UseAssistantVoiceOptions {
  workspaceId: string | null;
  threadId: string | null;
  onTranscriptSaved?: () => void;
}

interface PersistTranscriptInput {
  role: 'user' | 'assistant';
  content: string;
  externalItemId?: string | null;
  eventIndex?: number | null;
  eventCreatedAt?: string | null;
}

interface StartVoiceOptions {
  workspaceId?: string | null;
  threadId?: string | null;
}

export function getFriendlyVoiceError(message: string | null | undefined) {
  const cleaned = message?.trim();
  if (!cleaned) return 'Voice mode could not start. Please try again.';
  const lower = cleaned.toLowerCase();
  if (lower.includes('voice daily limit reached')) {
    return 'Voice daily limit reached for this workspace. Increase the voice daily minutes in assistant settings or try again tomorrow.';
  }
  if (lower.includes('openai api key') || lower.includes('invalid_api_key')) {
    return 'Voice mode needs a valid OpenAI API key configured on the backend.';
  }
  if (lower.includes('model_not_found') || lower.includes('gpt-realtime')) {
    return 'Voice mode could not start because the configured OpenAI key cannot access the realtime voice model.';
  }
  if (lower.includes('status code 401') || lower.includes('unauthorized')) {
    return 'Your session needs to be refreshed before voice mode can start.';
  }
  if (lower.includes('status code 403') || lower.includes('permission')) {
    return 'Voice mode is not enabled for this workspace or account yet.';
  }
  if (lower.includes('status code 429') || lower.includes('rate limit')) {
    return 'Voice mode is busy right now. Wait a moment, then try again.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'The connection dropped before voice mode could start.';
  }
  if (lower.includes('status code 400')) {
    return 'Voice mode could not start. The backend rejected the voice setup request.';
  }
  return cleaned;
}

interface RealtimeCallAnswerInput {
  ephemeralKey: string;
  offerSdp: string;
}

export async function createRealtimeCallAnswer({
  ephemeralKey,
  offerSdp,
}: RealtimeCallAnswerInput): Promise<string> {
  const formData = new FormData();
  formData.set('sdp', offerSdp);

  const response = await fetch('https://api.openai.com/v1/realtime/calls', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Failed to establish realtime voice session. OpenAI returned status code ${response.status}${
        errorText ? `: ${errorText}` : ''
      }`
    );
  }
  return response.text();
}

export function useAssistantVoice({
  workspaceId,
  threadId,
  onTranscriptSaved,
}: UseAssistantVoiceOptions) {
  const getVoiceCapability = (): VoiceCapability => {
    if (typeof window === 'undefined') {
      return { supported: false, reason: 'Voice chat is only available in the browser.' };
    }
    if (!window.isSecureContext) {
      return { supported: false, reason: 'Voice chat requires a secure HTTPS connection.' };
    }
    if (typeof window.RTCPeerConnection === 'undefined') {
      return { supported: false, reason: 'This browser does not support realtime voice chat.' };
    }
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      return { supported: false, reason: 'Microphone access is not available in this browser.' };
    }
    return { supported: true, reason: null };
  };

  const [capability, setCapability] = useState<VoiceCapability>(() => getVoiceCapability());
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState('');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const persistedItemIdsRef = useRef<Set<string>>(new Set());
  const sessionIdRef = useRef<string | null>(null);
  const sessionWorkspaceIdRef = useRef<string | null>(null);
  const sessionThreadIdRef = useRef<string | null>(null);
  const eventIndexRef = useRef(0);
  const userTranscriptBuffersRef = useRef<Map<string, string>>(new Map());
  const assistantTranscriptBuffersRef = useRef<Map<string, string>>(new Map());
  const isStoppingRef = useRef(false);
  const pendingSessionBindingRef = useRef<{ workspaceId: string; threadId: string } | null>(null);

  const getVoiceReviewText = (response: AssistantTranscriptResponse | null): string | null => {
    const metadata =
      response?.assistant_message?.metadata &&
      typeof response.assistant_message.metadata === 'object'
        ? (response.assistant_message.metadata as Record<string, unknown>)
        : null;
    const explicitText =
      metadata &&
      typeof metadata.voice_review_text === 'string' &&
      metadata.voice_review_text.trim()
        ? metadata.voice_review_text.trim()
        : null;
    if (explicitText) return explicitText;
    if (metadata?.action_id) {
      const actionStatus =
        typeof metadata.action_status === 'string' ? metadata.action_status : null;
      if (actionStatus && ['executed', 'rejected', 'failed', 'expired'].includes(actionStatus)) {
        const content = response?.assistant_message?.content?.trim();
        return content ? content : null;
      }
      if (metadata.voice_requires_visual_review === true) {
        return 'I prepared an action that requires visual review. Open the review card to continue.';
      }
      return null;
    }
    const fallback = response?.assistant_message?.content?.trim();
    return fallback ? fallback : null;
  };

  const speakAssistantText = (text: string) => {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== 'open' || !text.trim()) return;
    setLiveAssistantTranscript(text);
    channel.send(
      JSON.stringify({
        type: 'response.create',
        response: {
          input: [],
          instructions: `Say exactly the following text to the user. Do not add or remove words.\n\n${text}`,
        },
      })
    );
  };

  const completeVoiceSession = async () => {
    if (!sessionWorkspaceIdRef.current || !sessionThreadIdRef.current || !sessionIdRef.current)
      return;
    try {
      await api.post(
        `/assistant/threads/${sessionThreadIdRef.current}/voice-session/complete?workspace_id=${sessionWorkspaceIdRef.current}`,
        {
          session_id: sessionIdRef.current,
        }
      );
    } catch {
      // voice completion should not hard-fail UI teardown
    } finally {
      sessionIdRef.current = null;
      sessionWorkspaceIdRef.current = null;
      sessionThreadIdRef.current = null;
    }
  };

  const persistTranscript = async ({
    role,
    content,
    externalItemId,
    eventIndex,
    eventCreatedAt,
  }: PersistTranscriptInput): Promise<AssistantTranscriptResponse | null> => {
    if (!sessionWorkspaceIdRef.current || !sessionThreadIdRef.current || !content.trim()) {
      return null;
    }
    const dedupeKey = `${role}:${externalItemId || content}`;
    if (persistedItemIdsRef.current.has(dedupeKey)) return null;
    try {
      const response = await api.post<AssistantTranscriptResponse>(
        `/assistant/threads/${sessionThreadIdRef.current}/messages/transcript?workspace_id=${sessionWorkspaceIdRef.current}`,
        {
          role,
          content,
          external_item_id: externalItemId,
          session_id: sessionIdRef.current,
          event_index: eventIndex ?? null,
          event_created_at: eventCreatedAt ?? null,
          transcript_kind: 'voice_transcript',
        }
      );
      persistedItemIdsRef.current.add(dedupeKey);
      onTranscriptSaved?.();
      return response.data;
    } catch {
      return null;
    }
  };

  const stop = async () => {
    isStoppingRef.current = true;
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    setLiveUserTranscript('');
    setLiveAssistantTranscript('');
    userTranscriptBuffersRef.current.clear();
    assistantTranscriptBuffersRef.current.clear();
    persistedItemIdsRef.current.clear();
    eventIndexRef.current = 0;
    pendingSessionBindingRef.current = null;
    await completeVoiceSession();
    setStatus('idle');
    isStoppingRef.current = false;
  };

  const clearError = () => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  };

  const start = async (options?: StartVoiceOptions) => {
    const targetWorkspaceId = options?.workspaceId ?? workspaceId;
    const targetThreadId = options?.threadId ?? threadId;
    setError(null);
    if (
      !targetWorkspaceId ||
      !targetThreadId ||
      status === 'connecting' ||
      status === 'connected'
    ) {
      return;
    }

    const nextCapability = getVoiceCapability();
    setCapability(nextCapability);
    if (!nextCapability.supported) {
      setStatus('error');
      setError(nextCapability.reason);
      return;
    }

    setStatus('connecting');
    setError(null);
    setLiveUserTranscript('');
    setLiveAssistantTranscript('');
    userTranscriptBuffersRef.current.clear();
    assistantTranscriptBuffersRef.current.clear();
    eventIndexRef.current = 0;

    try {
      pendingSessionBindingRef.current = {
        workspaceId: targetWorkspaceId,
        threadId: targetThreadId,
      };
      sessionWorkspaceIdRef.current = targetWorkspaceId;
      sessionThreadIdRef.current = targetThreadId;
      const tokenResponse = await api.post<{
        session_id: string;
        client_secret: string;
        expires_at?: number | null;
        model: string;
        voice: string;
      }>(`/assistant/threads/${targetThreadId}/voice-token?workspace_id=${targetWorkspaceId}`);

      sessionIdRef.current = tokenResponse.data.session_id;
      const ephemeralKey = tokenResponse.data.client_secret;
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setStatus('connected');
          return;
        }
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'closed'
        ) {
          if (!isStoppingRef.current) {
            setError('Voice connection was interrupted. Start voice chat again to continue.');
            void stop();
          }
        }
      };
      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === 'failed' ||
          pc.iceConnectionState === 'disconnected' ||
          pc.iceConnectionState === 'closed'
        ) {
          if (!isStoppingRef.current) {
            setError('Network connectivity interrupted the voice session.');
            void stop();
          }
        }
      };

      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      remoteAudioRef.current = remoteAudio;
      pc.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      dc.onopen = () => {
        setStatus('connected');
      };
      dc.onerror = () => {
        setError('Voice event channel failed.');
      };
      dc.onclose = () => {
        if (!isStoppingRef.current && peerConnectionRef.current) {
          setError('Voice event channel closed unexpectedly.');
          void stop();
        }
      };

      dc.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.type === 'conversation.item.input_audio_transcription.delta' &&
            payload.delta &&
            payload.item_id
          ) {
            const nextTranscript = `${userTranscriptBuffersRef.current.get(payload.item_id) || ''}${payload.delta}`;
            userTranscriptBuffersRef.current.set(payload.item_id, nextTranscript);
            setLiveUserTranscript(nextTranscript);
          }
          if (payload.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript =
              payload.transcript ||
              (payload.item_id ? userTranscriptBuffersRef.current.get(payload.item_id) : '') ||
              '';
            const eventIndex = ++eventIndexRef.current;
            const eventCreatedAt = new Date().toISOString();
            void (async () => {
              const persisted = await persistTranscript({
                role: 'user',
                content: transcript,
                externalItemId: payload.item_id || null,
                eventIndex,
                eventCreatedAt,
              });
              if (persisted) {
                if (payload.item_id) {
                  userTranscriptBuffersRef.current.delete(payload.item_id);
                }
                setLiveUserTranscript('');
                const voiceReviewText = getVoiceReviewText(persisted);
                if (voiceReviewText) {
                  speakAssistantText(voiceReviewText);
                }
              } else {
                setError('Failed to save transcript.');
                setLiveUserTranscript(transcript);
              }
            })();
          }
          if (
            (payload.type === 'response.audio_transcript.delta' ||
              payload.type === 'response.output_audio_transcript.delta') &&
            payload.delta &&
            payload.item_id
          ) {
            const nextTranscript = `${assistantTranscriptBuffersRef.current.get(payload.item_id) || ''}${payload.delta}`;
            assistantTranscriptBuffersRef.current.set(payload.item_id, nextTranscript);
            setLiveAssistantTranscript(nextTranscript);
          }
          if (
            payload.type === 'response.audio_transcript.done' ||
            payload.type === 'response.output_audio_transcript.done'
          ) {
            if (payload.item_id) {
              assistantTranscriptBuffersRef.current.delete(payload.item_id);
            }
            setLiveAssistantTranscript('');
          }
        } catch {
          // ignore malformed events
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const answerSdp = await createRealtimeCallAnswer({
        ephemeralKey,
        offerSdp: offer.sdp || '',
      });
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    } catch (err) {
      await stop();
      setStatus('error');
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission was denied.');
          return;
        }
        if (err.name === 'NotFoundError') {
          setError('No microphone was found on this device.');
          return;
        }
        if (err.name === 'NotReadableError') {
          setError('The microphone is already in use by another application.');
          return;
        }
      }
      setError(getFriendlyVoiceError(getErrorMessage(err)));
    }
  };

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  useEffect(() => {
    const activeWorkspaceId = sessionWorkspaceIdRef.current;
    const activeThreadId = sessionThreadIdRef.current;
    const hasLiveSession =
      status === 'connecting' || status === 'connected' || Boolean(peerConnectionRef.current);
    if (!hasLiveSession) return;
    if (!activeWorkspaceId || !activeThreadId) return;
    const pendingBinding = pendingSessionBindingRef.current;
    if (
      status === 'connecting' &&
      pendingBinding &&
      pendingBinding.workspaceId === activeWorkspaceId &&
      pendingBinding.threadId === activeThreadId &&
      (!workspaceId || !threadId)
    ) {
      return;
    }
    if (workspaceId === activeWorkspaceId && threadId === activeThreadId) {
      pendingSessionBindingRef.current = null;
      return;
    }
    if (
      pendingBinding &&
      workspaceId === pendingBinding.workspaceId &&
      threadId === pendingBinding.threadId
    ) {
      pendingSessionBindingRef.current = null;
      return;
    }
    void stop();
  }, [threadId, workspaceId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && peerConnectionRef.current) {
        setError('Voice chat stopped after the tab was backgrounded.');
        void stop();
      }
    };
    const handlePageHide = () => {
      if (peerConnectionRef.current) {
        void stop();
      }
    };
    const handleOffline = () => {
      if (peerConnectionRef.current) {
        setError('Voice chat stopped because the device went offline.');
        void stop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    capability,
    status,
    error,
    liveUserTranscript,
    liveAssistantTranscript,
    isConnected: status === 'connected',
    start,
    stop,
    clearError,
  };
}
