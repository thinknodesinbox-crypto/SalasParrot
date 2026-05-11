import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRealtimeCallAnswer } from '../useAssistantVoice';

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
