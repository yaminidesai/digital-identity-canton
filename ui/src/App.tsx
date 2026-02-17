import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LedgerContext, type LedgerState } from './hooks/useLedger';
import { listParties, type PartyDetails } from './api/parties';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Identity } from './pages/Identity';
import { BirthCert } from './pages/BirthCert';
import { Passport } from './pages/Passport';
import { Voting } from './pages/Voting';
import { KYC } from './pages/KYC';
import { Content } from './pages/Content';

export default function App() {
  const [state, setState] = useState<LedgerState | null>(null);
  const [parties, setParties] = useState<PartyDetails[]>([]);

  const refreshParties = useCallback(async () => {
    try {
      const result = await listParties();
      setParties(result);
    } catch {
      // API not reachable yet, will retry on user action
    }
  }, []);

  useEffect(() => {
    refreshParties();
  }, [refreshParties]);

  const setParty = (p: LedgerState) => setState(p);
  const clearParty = () => setState(null);

  return (
    <LedgerContext.Provider value={{ state, parties, setParty, clearParty, refreshParties }}>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/identity" element={<Identity />} />
                <Route path="/birth-cert" element={<BirthCert />} />
                <Route path="/passport" element={<Passport />} />
                <Route path="/voting" element={<Voting />} />
                <Route path="/kyc" element={<KYC />} />
                <Route path="/content" element={<Content />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </LedgerContext.Provider>
  );
}
