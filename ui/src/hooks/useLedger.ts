import { createContext, useContext } from 'react';

export interface LedgerState {
  partyId: string;
  userId: string;
  displayName: string;
}

export interface LedgerContextType {
  state: LedgerState | null;
  parties: Array<{ party: string; displayName: string }>;
  setParty: (party: LedgerState) => void;
  clearParty: () => void;
  refreshParties: () => Promise<void>;
}

export const LedgerContext = createContext<LedgerContextType>({
  state: null,
  parties: [],
  setParty: () => {},
  clearParty: () => {},
  refreshParties: async () => {},
});

export function useLedger() {
  return useContext(LedgerContext);
}
