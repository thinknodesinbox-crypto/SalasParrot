import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssistantComposer } from '../AssistantComposer';

describe('AssistantComposer', () => {
  it('keeps the draft text when sending fails', async () => {
    const onSend = vi.fn().mockRejectedValue(new Error('network failed'));

    render(<AssistantComposer isSending={false} onSend={onSend} />);

    const input = screen.getByPlaceholderText('Ask what is going on in this workspace right now');
    fireEvent.change(input, { target: { value: 'Help me pick a lead list' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Help me pick a lead list');
    });
    expect(input).toHaveValue('Help me pick a lead list');
  });

  it('clears the draft after a successful send', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);

    render(<AssistantComposer isSending={false} onSend={onSend} />);

    const input = screen.getByPlaceholderText('Ask what is going on in this workspace right now');
    fireEvent.change(input, { target: { value: 'Show my sender accounts' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});
