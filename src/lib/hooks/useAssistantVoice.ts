import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UseAssistantVoiceOptions {
  workspaceId: string | null;
  threadId: string | null;
}

interface PersistTranscriptInput {
  role: 'user' | 'assistant';
  content: string;
  externalItemId?: string | null;
}

export function useAssistantVoice({ workspaceId, threadId }: UseAssistantVoiceOptions) {
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
  const userTranscriptBuffersRef = useRef<Map<string, string>>(new Map());
  const assistantTranscriptBuffersRef = useRef<Map<string, string>>(new Map());

  const completeVoiceSession = async () => {
    if (!workspaceId || !threadId || !sessionIdRef.current) return;
    try {
      await api.post(
        `/assistant/threads/${threadId}/voice-session/complete?workspace_id=${workspaceId}`,
        {
          session_id: sessionIdRef.current,
        }
      );
    } catch {
      // voice completion should not hard-fail UI teardown
    } finally {
      sessionIdRef.current = null;
    }
  };

  const persistTranscript = async ({ role, content, externalItemId }: PersistTranscriptInput) => {
    if (!workspaceId || !threadId || !content.trim()) return;
    const dedupeKey = `${role}:${externalItemId || content}`;
    if (persistedItemIdsRef.current.has(dedupeKey)) return;
    persistedItemIdsRef.current.add(dedupeKey);
    try {
      await api.post(
        `/assistant/threads/${threadId}/messages/transcript?workspace_id=${workspaceId}`,
        {
          role,
          content,
          external_item_id: externalItemId,
          transcript_kind: 'voice_transcript',
        }
      );
    } catch {
      // transcript persistence should not hard-fail the session
    }
  };

  const stop = async () => {
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
    await completeVoiceSession();
    setStatus('idle');
  };

  const start = async () => {
    if (!workspaceId || !threadId || status === 'connecting' || status === 'connected') return;

    setStatus('connecting');
    setError(null);
    setLiveUserTranscript('');
    setLiveAssistantTranscript('');
    userTranscriptBuffersRef.current.clear();
    assistantTranscriptBuffersRef.current.clear();

    try {
      const tokenResponse = await api.post<{
        session_id: string;
        client_secret: string;
        expires_at?: number | null;
        model: string;
        voice: string;
      }>(`/assistant/threads/${threadId}/voice-token?workspace_id=${workspaceId}`);

      sessionIdRef.current = tokenResponse.data.session_id;
      const ephemeralKey = tokenResponse.data.client_secret;
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

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
            if (payload.item_id) {
              userTranscriptBuffersRef.current.delete(payload.item_id);
            }
            setLiveUserTranscript('');
            void persistTranscript({
              role: 'user',
              content: transcript,
              externalItemId: payload.item_id || null,
            });
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
            const transcript =
              payload.transcript ||
              (payload.item_id ? assistantTranscriptBuffersRef.current.get(payload.item_id) : '') ||
              '';
            if (payload.item_id) {
              assistantTranscriptBuffersRef.current.delete(payload.item_id);
            }
            setLiveAssistantTranscript('');
            void persistTranscript({
              role: 'assistant',
              content: transcript,
              externalItemId: payload.item_id || null,
            });
          }
        } catch {
          // ignore malformed events
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp || '',
      });
      if (!sdpResponse.ok) {
        throw new Error('Failed to establish realtime voice session.');
      }
      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setStatus('connected');
    } catch (err) {
      await stop();
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Voice connection failed.');
    }
  };

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  useEffect(() => {
    void stop();
  }, [threadId, workspaceId]);

  return {
    status,
    error,
    liveUserTranscript,
    liveAssistantTranscript,
    isConnected: status === 'connected',
    start,
    stop,
  };
}
