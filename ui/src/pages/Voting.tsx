import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useContracts } from '../hooks/useContracts';
import { useCommand } from '../hooks/useCommand';
import { ContractCard } from '../components/ContractCard';
import { ChoiceButton } from '../components/ChoiceButton';
import { SkeletonList } from '../components/Skeleton';
import { TEMPLATES } from '../types/contracts';
import { formatPartyId } from '../utils/formatParty';

type VotingTab = 'registration' | 'elections' | 'results';

export function Voting() {
  const { state, parties } = useLedger();
  const { create, exercise, loading: cmdLoading, error: cmdError } = useCommand();

  const { contracts: regRequests, loading: loadingRegReq, refresh: refreshRegRequests } = useContracts(TEMPLATES.VoterRegistrationRequest);
  const { contracts: registrations, loading: loadingRegs, refresh: refreshRegistrations } = useContracts(TEMPLATES.VoterRegistration);
  const { contracts: elections, loading: loadingElections, refresh: refreshElections } = useContracts(TEMPLATES.Election);
  const { contracts: ballots, refresh: refreshBallots } = useContracts(TEMPLATES.Ballot);
  const { contracts: results, loading: loadingResults, refresh: refreshResults } = useContracts(TEMPLATES.ElectionResult);

  const [tab, setTab] = useState<VotingTab>('elections');

  // Registration form
  const [regForm, setRegForm] = useState({ commission: '', fullName: '', dateOfBirth: '', nationality: '', constituency: '', voterIdNumber: '' });
  const [showRegForm, setShowRegForm] = useState(false);
  const [regSubmitted, setRegSubmitted] = useState(false);

  // Election form
  const [electionForm, setElectionForm] = useState({ electionId: '', description: '', candidates: '' });
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [electionSubmitted, setElectionSubmitted] = useState(false);

  // Cast ballot form
  const [ballotForm, setBallotForm] = useState({ electionCid: '', voterRegCid: '', choice: '' });
  const [showBallotForm, setShowBallotForm] = useState(false);
  const [ballotSubmitted, setBallotSubmitted] = useState(false);

  if (!state) {
    return <p className="text-gray-500">Select a party to manage voting.</p>;
  }

  const handleRegister = async () => {
    setRegSubmitted(true);
    if (!regForm.commission || !regForm.fullName || !regForm.voterIdNumber) return;
    const result = await create(TEMPLATES.VoterRegistrationRequest.module, TEMPLATES.VoterRegistrationRequest.entity, {
      voter: state.partyId,
      commission: regForm.commission,
      voterInfo: {
        personalInfo: { fullName: regForm.fullName, dateOfBirth: regForm.dateOfBirth, nationality: regForm.nationality },
        constituency: regForm.constituency,
        voterIdNumber: regForm.voterIdNumber,
      },
    });
    if (result) { setShowRegForm(false); setRegSubmitted(false); refreshRegRequests(); }
  };

  const handleApproveReg = async (cid: string) => {
    const r = await exercise(TEMPLATES.VoterRegistrationRequest.module, TEMPLATES.VoterRegistrationRequest.entity, cid, 'ApproveRegistration');
    if (r) { refreshRegRequests(); refreshRegistrations(); }
  };

  const handleRejectReg = async (cid: string) => {
    const r = await exercise(TEMPLATES.VoterRegistrationRequest.module, TEMPLATES.VoterRegistrationRequest.entity, cid, 'RejectRegistration');
    if (r) refreshRegRequests();
  };

  const handleCreateElection = async () => {
    setElectionSubmitted(true);
    if (!electionForm.electionId || !electionForm.description || !electionForm.candidates) return;
    const result = await create(TEMPLATES.Election.module, TEMPLATES.Election.entity, {
      commission: state.partyId,
      electionId: electionForm.electionId,
      description: electionForm.description,
      candidates: electionForm.candidates.split(',').map((s) => s.trim()).filter(Boolean),
      status: 'Open',
      voters: [],
    });
    if (result) { setShowElectionForm(false); setElectionSubmitted(false); refreshElections(); }
  };

  const handleCastBallot = async () => {
    setBallotSubmitted(true);
    if (!ballotForm.electionCid || !ballotForm.voterRegCid || !ballotForm.choice) return;
    const r = await exercise(TEMPLATES.Election.module, TEMPLATES.Election.entity, ballotForm.electionCid, 'CastBallot', {
      voter: state.partyId,
      voterRegCid: ballotForm.voterRegCid,
      choice_: ballotForm.choice,
    });
    if (r) { setShowBallotForm(false); setBallotSubmitted(false); refreshElections(); refreshBallots(); }
  };

  const handleCloseElection = async (cid: string) => {
    const r = await exercise(TEMPLATES.Election.module, TEMPLATES.Election.entity, cid, 'CloseElection');
    if (r) refreshElections();
  };

  const refreshAll = () => { refreshRegRequests(); refreshRegistrations(); refreshElections(); refreshBallots(); refreshResults(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voting & Elections</h1>
          <p className="text-sm text-gray-500 mt-1">Register voters, create elections, and cast ballots.</p>
        </div>
        <button onClick={refreshAll} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Refresh</button>
      </div>

      {cmdError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{cmdError}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['registration', 'elections', 'results'] as VotingTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Registration tab */}
      {tab === 'registration' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setShowRegForm(!showRegForm); setRegSubmitted(false); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {showRegForm ? 'Cancel' : 'Register to Vote'}
            </button>
          </div>

          {showRegForm && (
            <div className="bg-white rounded-lg shadow border p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3">Voter Registration</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Election Commission <span className="text-red-500">*</span></label>
                  <select value={regForm.commission} onChange={(e) => setRegForm({ ...regForm, commission: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${regSubmitted && !regForm.commission ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <option value="">Select...</option>
                    {parties.map((p) => <option key={p.party} value={p.party}>{p.displayName || formatPartyId(p.party)}</option>)}
                  </select>
                  {regSubmitted && !regForm.commission && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={regForm.fullName} onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${regSubmitted && !regForm.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
                  {regSubmitted && !regForm.fullName && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                  <input type="date" value={regForm.dateOfBirth} onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nationality</label>
                  <input type="text" value={regForm.nationality} onChange={(e) => setRegForm({ ...regForm, nationality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Constituency</label>
                  <input type="text" value={regForm.constituency} onChange={(e) => setRegForm({ ...regForm, constituency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Voter ID <span className="text-red-500">*</span></label>
                  <input type="text" value={regForm.voterIdNumber} onChange={(e) => setRegForm({ ...regForm, voterIdNumber: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${regSubmitted && !regForm.voterIdNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
                  {regSubmitted && !regForm.voterIdNumber && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
              </div>
              <button onClick={handleRegister} disabled={cmdLoading} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {cmdLoading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending Registrations ({regRequests.length})</h2>
          {loadingRegReq ? <SkeletonList count={2} /> : regRequests.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300 mb-6">
              <p className="text-gray-500 text-sm">No pending registrations.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {regRequests.map((c) => (
                <ContractCard key={c.contractId} contract={c} actions={
                  <>
                    <ChoiceButton label="Approve" onClick={() => handleApproveReg(c.contractId)} loading={cmdLoading} variant="success" small />
                    <ChoiceButton label="Reject" onClick={() => handleRejectReg(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will reject the voter registration." />
                  </>
                } />
              ))}
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-800 mb-3">Approved Registrations ({registrations.length})</h2>
          {loadingRegs ? <SkeletonList count={1} /> : registrations.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">No approved registrations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.map((c) => <ContractCard key={c.contractId} contract={c} />)}
            </div>
          )}
        </div>
      )}

      {/* Elections tab */}
      {tab === 'elections' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setShowElectionForm(!showElectionForm); setElectionSubmitted(false); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {showElectionForm ? 'Cancel' : 'Create Election'}
            </button>
            <button onClick={() => { setShowBallotForm(!showBallotForm); setBallotSubmitted(false); }} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
              {showBallotForm ? 'Cancel' : 'Cast Ballot'}
            </button>
          </div>

          {showElectionForm && (
            <div className="bg-white rounded-lg shadow border p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3">Create Election</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Election ID <span className="text-red-500">*</span></label>
                  <input type="text" value={electionForm.electionId} onChange={(e) => setElectionForm({ ...electionForm, electionId: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${electionSubmitted && !electionForm.electionId ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
                  {electionSubmitted && !electionForm.electionId && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description <span className="text-red-500">*</span></label>
                  <input type="text" value={electionForm.description} onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${electionSubmitted && !electionForm.description ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
                  {electionSubmitted && !electionForm.description && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Candidates <span className="text-red-500">*</span></label>
                  <input type="text" value={electionForm.candidates} onChange={(e) => setElectionForm({ ...electionForm, candidates: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${electionSubmitted && !electionForm.candidates ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} placeholder="Alice, Bob, Charlie" />
                  {electionSubmitted && !electionForm.candidates ? (
                    <p className="text-xs text-red-500 mt-0.5">Required</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Comma-separated list of candidate names</p>
                  )}
                </div>
              </div>
              <button onClick={handleCreateElection} disabled={cmdLoading} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {cmdLoading ? 'Creating...' : 'Create Election'}
              </button>
            </div>
          )}

          {showBallotForm && (
            <div className="bg-white rounded-lg shadow border p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3">Cast Ballot</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Election <span className="text-red-500">*</span></label>
                  <select value={ballotForm.electionCid} onChange={(e) => setBallotForm({ ...ballotForm, electionCid: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${ballotSubmitted && !ballotForm.electionCid ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <option value="">Select election...</option>
                    {elections.filter((e) => (e.createArguments.status as string) === 'Open').map((e) => (
                      <option key={e.contractId} value={e.contractId}>{(e.createArguments as Record<string, unknown>).description as string}</option>
                    ))}
                  </select>
                  {ballotSubmitted && !ballotForm.electionCid && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Voter Registration <span className="text-red-500">*</span></label>
                  <select value={ballotForm.voterRegCid} onChange={(e) => setBallotForm({ ...ballotForm, voterRegCid: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${ballotSubmitted && !ballotForm.voterRegCid ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <option value="">Select registration...</option>
                    {registrations.map((r) => {
                      const info = r.createArguments.voterInfo as Record<string, unknown> | undefined;
                      const pInfo = info?.personalInfo as Record<string, unknown> | undefined;
                      const name = pInfo?.fullName as string || r.contractId.slice(0, 16);
                      return <option key={r.contractId} value={r.contractId}>{name}</option>;
                    })}
                  </select>
                  {ballotSubmitted && !ballotForm.voterRegCid && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Your Choice <span className="text-red-500">*</span></label>
                  <input type="text" value={ballotForm.choice} onChange={(e) => setBallotForm({ ...ballotForm, choice: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${ballotSubmitted && !ballotForm.choice ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} placeholder="Candidate name" />
                  {ballotSubmitted && !ballotForm.choice && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
              </div>
              <button onClick={handleCastBallot} disabled={cmdLoading} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                {cmdLoading ? 'Casting...' : 'Cast Ballot'}
              </button>
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-800 mb-3">Elections ({elections.length})</h2>
          {loadingElections ? <SkeletonList count={2} /> : elections.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300 mb-6">
              <p className="text-gray-500 text-sm">No elections created.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {elections.map((c) => {
                const isOpen = (c.createArguments.status as string) === 'Open';
                return (
                  <ContractCard key={c.contractId} contract={c} actions={
                    isOpen ? <ChoiceButton label="Close Election" onClick={() => handleCloseElection(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will permanently close the election. No more ballots can be cast." /> : undefined
                  } />
                );
              })}
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-800 mb-3">Ballots Cast ({ballots.length})</h2>
          {ballots.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">No ballots cast yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ballots.map((c) => <ContractCard key={c.contractId} contract={c} />)}
            </div>
          )}
        </div>
      )}

      {/* Results tab */}
      {tab === 'results' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Election Results ({results.length})</h2>
          {loadingResults ? <SkeletonList count={1} /> : results.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">No results published yet.</p>
              <p className="text-xs text-gray-400 mt-1">Close an election to generate results.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((c) => <ContractCard key={c.contractId} contract={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
