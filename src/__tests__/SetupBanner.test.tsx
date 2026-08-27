import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../tools/useTool', () => ({ getModelContext: () => null }));
import { SetupBanner } from '../components/SetupBanner';

describe('ChatGPT site-tools setup banner', () => {
  it('explains the ChatGPT browser path before the Chrome fallback', async () => {
    render(<SetupBanner />);
    expect(await screen.findByText(/ChatGPT site tools are unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Browser settings/i)).toBeInTheDocument();
  });
});
