import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('Rubber Duck app shell', () => {
  it('renders the Rubber Duck heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Rubber Duck' })).toBeInTheDocument();
  });

  it('shows the study canvas, three hint tokens, and a spend control', () => {
    render(<App />);
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText(/3 hint tokens/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spend hint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset session/i })).toBeInTheDocument();
  });
});
