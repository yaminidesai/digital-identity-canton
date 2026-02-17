import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLedger } from '../hooks/useLedger';
import { allocateParty, createUser } from '../api/parties';
import { PartySelector } from './PartySelector';
import { formatPartyId } from '../utils/formatParty';

const navItems = [
  {
    to: '/', label: 'Dashboard', subtitle: 'Overview of all contracts',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />,
  },
  {
    to: '/identity', label: 'Identity', subtitle: 'Authority roles',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />,
  },
  {
    to: '/birth-cert', label: 'Birth Certs', subtitle: 'Certificates & amendments',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    to: '/passport', label: 'Passports', subtitle: 'Issue & verify',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    to: '/voting', label: 'Voting', subtitle: 'Elections & ballots',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
  {
    to: '/kyc', label: 'KYC / AML', subtitle: 'Compliance checks',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  },
  {
    to: '/content', label: 'Content Auth', subtitle: 'Licenses & disputes',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
  },
];

function PartyAvatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const color = colors[name.length % colors.length];
  return (
    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
      {letter}
    </div>
  );
}

export function Layout() {
  const { state, clearParty, parties, setParty } = useLedger();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">Digital Identity</h1>
          <p className="text-xs text-gray-400 mt-1">Canton Platform</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <PartySelector />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div />
          {state ? (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setShowSwitcher(!showSwitcher)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <PartyAvatar name={state.displayName} />
                <span className="text-sm font-medium text-gray-700">{state.displayName}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSwitcher && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                  <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100">Switch Party</div>
                  {parties.map((p) => (
                    <button
                      key={p.party}
                      onClick={() => {
                        const userId = (p.displayName || p.party).toLowerCase().replace(/\s+/g, '-') + '-user';
                        setParty({ partyId: p.party, userId, displayName: p.displayName || formatPartyId(p.party) });
                        setShowSwitcher(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                        p.party === state.partyId ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <PartyAvatar name={p.displayName || p.party} />
                      {p.displayName || formatPartyId(p.party)}
                      {p.party === state.partyId && (
                        <svg className="w-4 h-4 ml-auto text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { clearParty(); setShowSwitcher(false); }}
                      className="w-full px-3 py-2 text-sm text-left text-gray-500 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">No party selected</span>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Onboarding overlay when no party selected */}
      {!state && <OnboardingOverlay />}
    </div>
  );
}

function OnboardingOverlay() {
  const { parties, setParty, refreshParties } = useLedger();
  const [newName, setNewName] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (party: { party: string; displayName: string }) => {
    const userId = (party.displayName || party.party).toLowerCase().replace(/\s+/g, '-') + '-user';
    try { await createUser(userId, party.party); } catch { /* may exist */ }
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
      await refreshParties();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Digital Identity</h2>
          <p className="text-gray-500 mt-2">Select a party to get started, or create a new one.</p>
        </div>

        {parties.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Parties</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {parties.map((p) => (
                <button
                  key={p.party}
                  onClick={() => handleSelect(p)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  <PartyAvatar name={p.displayName || p.party} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.displayName || formatPartyId(p.party)}</div>
                    <div className="text-xs text-gray-400">Click to sign in</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Party</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Party name (e.g. Alice)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAllocate()}
            />
            <button
              onClick={handleAllocate}
              disabled={allocating || !newName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {allocating ? 'Creating...' : 'Create'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
