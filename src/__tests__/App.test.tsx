import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { createInitialState, reducer } from '../state/reducer';
import { validSnapshot } from './decisionGraphFixtures';

function seededDecisionState() {
  return reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
}

describe('Riskframe app shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Riskframe heading without browser-side decision intake controls', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Riskframe' })).toBeInTheDocument();
    expect(screen.queryByText(/decision intake/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/messy decision/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /map my reasoning/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /startup\/product/i })).not.toBeInTheDocument();
  });

  it('auto-populates a fresh browser session with the demo decision graph', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: 'Pivot the project or continue the current Riskframe path?' })).toBeInTheDocument();
    expect(screen.getByTestId('path-trace-option-pivot')).toBeInTheDocument();
    expect(screen.getByTestId('path-trace-option-continue')).toBeInTheDocument();
  });

  it('populates the board with a two-sided demo decision graph', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /populate board/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Pivot the project or continue the current Riskframe path?' })).toBeInTheDocument();
    expect(screen.getByTestId('path-trace-option-pivot')).toBeInTheDocument();
    expect(screen.getByTestId('path-trace-option-continue')).toBeInTheDocument();
    expect(screen.getByText('Pivot scope spiral')).toBeInTheDocument();
    expect(screen.getByText('Continue with poor fit')).toBeInTheDocument();
    expect(screen.getByText('No clearer story after one prototype')).toBeInTheDocument();
    expect(screen.getByText('Connections still hard to follow')).toBeInTheDocument();
  });

  it('renders draft proposals after ChatGPT initializes a decision graph through WebMCP', () => {
    render(<App initialState={seededDecisionState()} />);

    expect(screen.getByText(/reasoning canvas/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Ship now or run onboarding validation first?',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/inferred/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Change path').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status quo').length).toBeGreaterThan(0);
    expect(screen.getByTestId('decision-cockpit')).toHaveClass('decision-cockpit');
    expect(screen.getByTestId('reasoning-viewport')).toHaveAttribute('data-layout-target', 'compact-split');
    expect(screen.getByText('Compact split-screen mode')).toBeInTheDocument();
    expect(screen.getByTestId('path-column-change_path')).toBeInTheDocument();
    expect(screen.getByTestId('path-column-status_quo')).toBeInTheDocument();
    const changeTrace = screen.getByTestId('path-trace-option-ship');
    expect(within(changeTrace).getByText('Ship now')).toBeInTheDocument();
    expect(within(changeTrace).getByText('Ship adoption risk')).toBeInTheDocument();
    expect(within(changeTrace).getByText('Watch activation quality')).toBeInTheDocument();
    expect(within(changeTrace).getByText('Learning quality')).toBeInTheDocument();

    const statusQuoTrace = screen.getByTestId('path-trace-option-validate');
    expect(within(statusQuoTrace).getByText('Validate first')).toBeInTheDocument();
    expect(within(statusQuoTrace).getByText('Validation delay risk')).toBeInTheDocument();
    expect(within(statusQuoTrace).getByText('Validation window expires')).toBeInTheDocument();
    expect(within(statusQuoTrace).getByText('Learning quality')).toBeInTheDocument();

    expect(screen.queryByTestId('unassigned-card-stack')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('cockpit-card').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Risk management').length).toBeGreaterThan(0);
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
  });

  it('renders a draggable infinite-style canvas with zoom controls', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    render(<App initialState={seededDecisionState()} />);

    expect(screen.getByTestId('reasoning-viewport')).toHaveAttribute('data-board-width', '3200');
    expect(screen.getByTestId('reasoning-viewport')).toHaveAttribute('data-board-height', '2200');
    expect(screen.getByTestId('reasoning-world')).toHaveStyle({ transform: 'translate(0px, 0px) scale(1)' });
    expect(screen.getByText('100%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /zoom in/i }));

    expect(screen.getByTestId('reasoning-world')).toHaveStyle({ transform: 'translate(0px, 0px) scale(1.1)' });
    expect(screen.getByText('110%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset zoom/i }));

    expect(screen.getByTestId('reasoning-world')).toHaveStyle({ transform: 'translate(0px, 0px) scale(1)' });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('pans the canvas by dragging the board instead of using scrollbars', () => {
    render(<App initialState={seededDecisionState()} />);

    const viewport = screen.getByTestId('reasoning-viewport');
    fireEvent.pointerDown(viewport, { clientX: 120, clientY: 140, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 170, clientY: 180, pointerId: 1 });
    fireEvent.pointerUp(viewport, { clientX: 170, clientY: 180, pointerId: 1 });

    expect(screen.getByTestId('reasoning-world')).toHaveStyle({
      transform: 'translate(50px, 40px) scale(1)',
    });
  });

  it('zooms the canvas with the scroll wheel', () => {
    render(<App initialState={seededDecisionState()} />);

    const viewport = screen.getByTestId('reasoning-viewport');
    fireEvent.wheel(viewport, { deltaY: -100 });

    expect(screen.getByTestId('reasoning-world')).toHaveStyle({
      transform: 'translate(0px, 0px) scale(1.1)',
    });
    expect(screen.getByText('110%')).toBeInTheDocument();

    fireEvent.wheel(viewport, { deltaY: 100 });

    expect(screen.getByTestId('reasoning-world')).toHaveStyle({
      transform: 'translate(0px, 0px) scale(1)',
    });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('uses a non-passive wheel listener so scratchboard zoom blocks page scroll', () => {
    const addEventListener = vi.spyOn(HTMLElement.prototype, 'addEventListener');

    render(<App initialState={seededDecisionState()} />);

    expect(addEventListener).toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      expect.objectContaining({ passive: false }),
    );
  });

  it('parks declined proposals for later retrieval', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    render(<App initialState={seededDecisionState()} />);

    await user.click(screen.getAllByRole('button', { name: /park/i })[0]);

    expect(screen.getByText(/parking lot/i)).toBeInTheDocument();
    expect(screen.getByText('Ship now')).toBeInTheDocument();
  });

  it('shows the WebMCP agent surface for graph operations', () => {
    render(<App />);

    expect(screen.getByText(/agent tool surface/i)).toBeInTheDocument();
    expect(screen.getByText('get_riskframe_context')).toBeInTheDocument();
    expect(screen.getByText('initialize_decision_graph')).toBeInTheDocument();
    expect(screen.getByText('get_reasoning_graph')).toBeInTheDocument();
    expect(screen.getByText('propose_card')).toBeInTheDocument();
    expect(screen.queryByText('start_decision')).not.toBeInTheDocument();
    expect(screen.queryByText('score_confidence')).not.toBeInTheDocument();
  });
});
