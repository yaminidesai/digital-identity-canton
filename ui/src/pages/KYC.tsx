import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useContracts } from '../hooks/useContracts';
import { useCommand } from '../hooks/useCommand';
import { ContractCard } from '../components/ContractCard';
import { ChoiceButton } from '../components/ChoiceButton';
import { SkeletonList } from '../components/Skeleton';
import { TEMPLATES } from '../types/contracts';
import type { RiskLevel } from '../types/contracts';
import { formatPartyId } from '../utils/formatParty';

export function KYC() {
  const { state, parties } = useLedger();
  const { create, exercise, loading: cmdLoading, error: cmdError } = useCommand();

  const { contracts: kycRequests, loading: loadingReq, refresh: refreshKycRequests } = useContracts(TEMPLATES.KYCRequest);
  const { contracts: submissions, loading: loadingSub, refresh: refreshSubmissions } = useContracts(TEMPLATES.KYCSubmission);
  const { contracts: clearances, loading: loadingClear, refresh: refreshClearances } = useContracts(TEMPLATES.KYCClearance);
  const { contracts: sars, refresh: refreshSars } = useContracts(TEMPLATES.SuspiciousActivityReport);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ customer: '', purpose: '' });
  const [reqSubmitted, setReqSubmitted] = useState(false);

  const [showKycForm, setShowKycForm] = useState(false);
  const [kycForm, setKycForm] = useState({
    targetCid: '',
    fullName: '', dateOfBirth: '', nationality: '',
    address: '', taxId: '', sourceOfFunds: '', occupation: '',
  });

  // Flag KYC modal state (replaces prompt())
  const [flagTarget, setFlagTarget] = useState<string | null>(null);
  const [flagRegulator, setFlagRegulator] = useState('');

  if (!state) {
    return <p className="text-gray-500">Select a party to manage KYC/AML compliance.</p>;
  }

  const handleCreateRequest = async () => {
    setReqSubmitted(true);
    if (!requestForm.customer || !requestForm.purpose) return;
    const result = await create(TEMPLATES.KYCRequest.module, TEMPLATES.KYCRequest.entity, {
      institution: state.partyId,
      customer: requestForm.customer,
      purpose: requestForm.purpose,
    });
    if (result) { setShowRequestForm(false); setReqSubmitted(false); refreshKycRequests(); }
  };

  const handleProvideKYC = async () => {
    const result = await exercise(TEMPLATES.KYCRequest.module, TEMPLATES.KYCRequest.entity, kycForm.targetCid, 'ProvideKYC', {
      kycData: {
        personalInfo: { fullName: kycForm.fullName, dateOfBirth: kycForm.dateOfBirth, nationality: kycForm.nationality },
        address: kycForm.address,
        taxId: kycForm.taxId,
        sourceOfFunds: kycForm.sourceOfFunds,
        occupation: kycForm.occupation,
      },
    });
    if (result) { setShowKycForm(false); refreshKycRequests(); refreshSubmissions(); }
  };

  const handleDecline = async (cid: string) => {
    const r = await exercise(TEMPLATES.KYCRequest.module, TEMPLATES.KYCRequest.entity, cid, 'Decline');
    if (r) refreshKycRequests();
  };

  const handleApproveKYC = async (cid: string, riskLevel: RiskLevel) => {
    const r = await exercise(TEMPLATES.KYCSubmission.module, TEMPLATES.KYCSubmission.entity, cid, 'ApproveKYC', { riskLevel });
    if (r) { refreshSubmissions(); refreshClearances(); }
  };

  const handleFlagKYC = async () => {
    if (!flagTarget || !flagRegulator) return;
    const r = await exercise(TEMPLATES.KYCSubmission.module, TEMPLATES.KYCSubmission.entity, flagTarget, 'FlagKYC', { regulator: flagRegulator });
    if (r) { refreshSubmissions(); refreshSars(); setFlagTarget(null); setFlagRegulator(''); }
  };

  const handleRejectKYC = async (cid: string) => {
    const r = await exercise(TEMPLATES.KYCSubmission.module, TEMPLATES.KYCSubmission.entity, cid, 'RejectKYC');
    if (r) refreshSubmissions();
  };

  const handleRevokeClearance = async (cid: string) => {
    const r = await exercise(TEMPLATES.KYCClearance.module, TEMPLATES.KYCClearance.entity, cid, 'RevokeClearance');
    if (r) refreshClearances();
  };

  const handleAcknowledgeSAR = async (cid: string) => {
    const r = await exercise(TEMPLATES.SuspiciousActivityReport.module, TEMPLATES.SuspiciousActivityReport.entity, cid, 'Acknowledge');
    if (r) refreshSars();
  };

  const refreshAll = () => { refreshKycRequests(); refreshSubmissions(); refreshClearances(); refreshSars(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC / AML Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage know-your-customer requests, submissions, and compliance clearances.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshAll} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Refresh</button>
          <button onClick={() => { setShowRequestForm(!showRequestForm); setReqSubmitted(false); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {showRequestForm ? 'Cancel' : 'New KYC Request'}
          </button>
        </div>
      </div>

      {cmdError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{cmdError}</div>}

      {/* Flag KYC modal (replaces browser prompt) */}
      {flagTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFlagTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Flag Suspicious Activity</h3>
            <p className="text-sm text-gray-600 mb-4">Select the regulator party to receive the suspicious activity report.</p>
            <select
              value={flagRegulator}
              onChange={(e) => setFlagRegulator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
            >
              <option value="">Select regulator...</option>
              {parties.map((p) => <option key={p.party} value={p.party}>{p.displayName || formatPartyId(p.party)}</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setFlagTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={handleFlagKYC}
                disabled={!flagRegulator || cmdLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cmdLoading ? 'Flagging...' : 'Flag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create KYC Request form */}
      {showRequestForm && (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Create KYC Request</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer <span className="text-red-500">*</span></label>
              <select value={requestForm.customer} onChange={(e) => setRequestForm({ ...requestForm, customer: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${reqSubmitted && !requestForm.customer ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                <option value="">Select customer...</option>
                {parties.map((p) => <option key={p.party} value={p.party}>{p.displayName || formatPartyId(p.party)}</option>)}
              </select>
              {reqSubmitted && !requestForm.customer && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Purpose <span className="text-red-500">*</span></label>
              <input type="text" value={requestForm.purpose} onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${reqSubmitted && !requestForm.purpose ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {reqSubmitted && !requestForm.purpose && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
          </div>
          <button onClick={handleCreateRequest} disabled={cmdLoading} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {cmdLoading ? 'Creating...' : 'Send Request'}
          </button>
        </div>
      )}

      {/* KYC Requests */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">KYC Requests ({kycRequests.length})</h2>
        {loadingReq ? <SkeletonList count={2} /> : kycRequests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No KYC requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {kycRequests.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <>
                  <ChoiceButton label="Provide KYC" onClick={() => { setKycForm({ ...kycForm, targetCid: c.contractId }); setShowKycForm(true); }} variant="success" small />
                  <ChoiceButton label="Decline" onClick={() => handleDecline(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will decline the KYC request." />
                </>
              } />
            ))}
          </div>
        )}
      </section>

      {/* Provide KYC form */}
      {showKycForm && (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Provide KYC Data</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Full Name</label><input type="text" value={kycForm.fullName} onChange={(e) => setKycForm({ ...kycForm, fullName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Date of Birth</label><input type="date" value={kycForm.dateOfBirth} onChange={(e) => setKycForm({ ...kycForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Nationality</label><input type="text" value={kycForm.nationality} onChange={(e) => setKycForm({ ...kycForm, nationality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Address</label><input type="text" value={kycForm.address} onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Tax ID</label><input type="text" value={kycForm.taxId} onChange={(e) => setKycForm({ ...kycForm, taxId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Source of Funds</label><input type="text" value={kycForm.sourceOfFunds} onChange={(e) => setKycForm({ ...kycForm, sourceOfFunds: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /><p className="text-xs text-gray-400 mt-0.5">e.g. Employment, Investment, Inheritance</p></div>
            <div><label className="block text-xs text-gray-500 mb-1">Occupation</label><input type="text" value={kycForm.occupation} onChange={(e) => setKycForm({ ...kycForm, occupation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleProvideKYC} disabled={cmdLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              {cmdLoading ? 'Submitting...' : 'Submit KYC'}
            </button>
            <button onClick={() => setShowKycForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {/* KYC Submissions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending Submissions ({submissions.length})</h2>
        {loadingSub ? <SkeletonList count={2} /> : submissions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No pending submissions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <>
                  <ChoiceButton label="Approve (Low)" onClick={() => handleApproveKYC(c.contractId, 'Low')} loading={cmdLoading} variant="success" small />
                  <ChoiceButton label="Approve (High)" onClick={() => handleApproveKYC(c.contractId, 'High')} loading={cmdLoading} variant="secondary" small />
                  <ChoiceButton label="Flag" onClick={() => { setFlagTarget(c.contractId); setFlagRegulator(''); }} loading={cmdLoading} variant="danger" small />
                  <ChoiceButton label="Reject" onClick={() => handleRejectKYC(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will reject the KYC submission." />
                </>
              } />
            ))}
          </div>
        )}
      </section>

      {/* Clearances */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Active Clearances ({clearances.length})</h2>
        {loadingClear ? <SkeletonList count={1} /> : clearances.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No clearances.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clearances.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <ChoiceButton label="Revoke" onClick={() => handleRevokeClearance(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will revoke the KYC clearance." />
              } />
            ))}
          </div>
        )}
      </section>

      {/* SARs */}
      {sars.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Suspicious Activity Reports ({sars.length})</h2>
          <div className="space-y-3">
            {sars.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <ChoiceButton label="Acknowledge" onClick={() => handleAcknowledgeSAR(c.contractId)} loading={cmdLoading} variant="success" small />
              } />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
