import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  chooseVoiceLatencyFiller,
  createRealtimeCallAnswer,
  getFriendlyVoiceError,
  getVoiceLatencyFillerCategory,
  shouldPlayVoiceLatencyFiller,
} from '../useAssistantVoice';

describe('createRealtimeCallAnswer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the SDP offer as multipart form data to OpenAI Realtime calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('answer-sdp'),
    });
    vi.stubGlobal('fetch', fetchMock);

    const answer = await createRealtimeCallAnswer({
      ephemeralKey: 'secret_123',
      offerSdp: 'offer-sdp',
    });

    expect(answer).toBe('answer-sdp');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime/calls',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer secret_123',
        },
      })
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get('sdp')).toBe('offer-sdp');
  });

  it('surfaces Realtime call response details when the handshake fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('bad sdp'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createRealtimeCallAnswer({
        ephemeralKey: 'secret_123',
        offerSdp: 'offer-sdp',
      })
    ).rejects.toThrow('status code 400: bad sdp');
  });
});

describe('getFriendlyVoiceError', () => {
  it('does not collapse backend voice limit errors into workspace setup copy', () => {
    expect(getFriendlyVoiceError('Voice daily limit reached for this workspace.')).toContain(
      'Voice daily limit reached'
    );
  });

  it('explains realtime model access errors directly', () => {
    expect(getFriendlyVoiceError('model_not_found: gpt-realtime')).toContain(
      'cannot access the realtime voice model'
    );
  });
});

describe('voice latency fillers', () => {
  it('chooses lead-search fillers for lead discovery turns', () => {
    expect(
      getVoiceLatencyFillerCategory('Help me find founders in New York that need more clients')
    ).toBe('lead_search');
  });

  it('skips action approval and execution phrases', () => {
    expect(shouldPlayVoiceLatencyFiller('Approve and execute it now')).toBe(false);
    expect(chooseVoiceLatencyFiller('Go ahead', null, () => 0)).toBeNull();
  });

  it('avoids repeating the previous filler when alternatives exist', () => {
    const previous = 'Got you, shaping that search.';
    const next = chooseVoiceLatencyFiller(
      'Find new leads for my product in New York',
      previous,
      () => 0
    );

    expect(next).not.toBe(previous);
    expect(next).toBe('Okay, narrowing that down.');
  });
});
