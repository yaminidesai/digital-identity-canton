import { useState, useEffect, useCallback } from 'react';
import { queryActiveContracts, type ActiveContract } from '../api/ledger';
import { useLedger } from './useLedger';

export function useContracts(
  templateFilter?: { module: string; entity: string },
) {
  const { state } = useLedger();
  const [contracts, setContracts] = useState<ActiveContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!state) return;
    setLoading(true);
    setError(null);
    try {
      const result = await queryActiveContracts([state.partyId], templateFilter);
      setContracts(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to query contracts');
    } finally {
      setLoading(false);
    }
  }, [state, templateFilter?.module, templateFilter?.entity]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { contracts, loading, error, refresh };
}
