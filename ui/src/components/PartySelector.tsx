import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { allocateParty, createUser } from '../api/parties';
import { formatPartyId } from '../utils/formatParty';

function PartyAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const letter = name.charAt(0).toUpperCase();
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const color = colors[name.length % colors.length];
  const sizeClass = size === 'md' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs';
  return (
    <div className={`${sizeClass} rounded-full ${color} flex items-center justify-center text-white font-bold`}>
      {letter}
    </div>
  );
}

export function PartySelector() {
  const { state, parties, setParty, clearParty, refreshParties } = useLedger();
  const [newName, setNewName] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSelect = async (party: { party: string; displayName: string }) => {
    const userId = party.displayName.toLowerCase().replace(/\s+/g, '-') + '-user';
    try {
      await createUser(userId, party.party);
    } catch {
      // user may already exist, that's fine
    }
    setParty({ partyId: party.party, userId, displayName: party.displayName || formatPartyId(party.party) });
  };

  const handleAllocate = async () => {
    if (!newName.trim()) return;
    setAllocating(true);
    setError(null);
    try {
      const hint = newName.toLowerCase().replace(/\s+/g, '-');
      const result = await allocateParty(newName, hint);
      const userId = hint + '-user';
      await createUser(userId, result.party);
      setParty({ partyId: result.party, userId, displayName: newName });
      setNewName('');
      setShowForm(false);
      await refreshParties();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  if (state) {
    return (
      <div>
        <div className="text-xs text-gray-400 mb-1.5">Active Party</div>
        <div className="flex items-center gap-2">
          <PartyAvatar name={state.displayName} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-green-400 truncate">{state.displayName}</div>
          </div>
        </div>
        <button
          onClick={clearParty}
          className="mt-2 text-xs text-gray-400 hover:text-white flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Switch Party
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs text-gray-400 mb-2">Select Party</div>
      {parties.length > 0 && (
        <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
          {parties.map((p) => (
            <button
              key={p.party}
              onClick={() => handleSelect(p)}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-800 text-gray-300"
            >
              <PartyAvatar name={p.displayName || formatPartyId(p.party)} />
              <span className="truncate">{p.displayName || formatPartyId(p.party)}</span>
            </button>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Party name (e.g. Alice)"
            className="w-full px-2 py-1 text-sm bg-gray-800 rounded border border-gray-700 text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleAllocate()}
          />
          <div className="flex gap-1">
            <button
              onClick={handleAllocate}
              disabled={allocating}
              className="flex-1 px-2 py-1 text-xs bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {allocating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Allocate New Party
        </button>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
