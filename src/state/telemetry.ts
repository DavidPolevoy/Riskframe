import type { AppState } from '../data/types';
import { getGraphCoverage } from './reducer';

export function getGraphSignal(state: AppState) {
  return {
    acceptedCount: state.cards.length,
    proposalCount: state.proposals.length,
    parkedCount: state.parkingLot.length,
    conflictCount: state.conflicts.length,
    fragilePathCount: state.fragilePaths.length,
    coverage: getGraphCoverage(state),
  };
}
