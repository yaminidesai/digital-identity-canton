import { useState, useCallback } from 'react';
import { submitCreate, submitExercise, type CreateResult } from '../api/ledger';
import { useLedger } from './useLedger';
import { useToast } from '../components/Toast';

export function useCommand() {
  const { state } = useLedger();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (
      module: string,
      entity: string,
      args: Record<string, unknown>,
    ): Promise<CreateResult | null> => {
      if (!state) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await submitCreate(state.userId, [state.partyId], module, entity, args);
        showToast(`${entity} created successfully`, 'success');
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Command failed';
        setError(msg);
        showToast(`Failed to create ${entity}`, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [state, showToast],
  );

  const exercise = useCallback(
    async (
      module: string,
      entity: string,
      contractId: string,
      choice: string,
      choiceArgument: Record<string, unknown> = {},
    ): Promise<CreateResult | null> => {
      if (!state) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await submitExercise(
          state.userId,
          [state.partyId],
          module,
          entity,
          contractId,
          choice,
          choiceArgument,
        );
        const label = choice.replace(/([A-Z])/g, ' $1').trim();
        showToast(`${label} completed successfully`, 'success');
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Command failed';
        setError(msg);
        const label = choice.replace(/([A-Z])/g, ' $1').trim();
        showToast(`${label} failed`, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [state, showToast],
  );

  return { create, exercise, loading, error };
}
