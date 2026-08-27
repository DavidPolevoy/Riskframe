import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('Rubber Duck app shell', () => {
  it('renders the Rubber Duck heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Rubber Duck' })).toBeInTheDocument();
  });
});
