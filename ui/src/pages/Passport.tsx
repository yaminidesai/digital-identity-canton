import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useContracts } from '../hooks/useContracts';
import { useCommand } from '../hooks/useCommand';
import { ContractCard } from '../components/ContractCard';
import { ChoiceButton } from '../components/ChoiceButton';
import { SkeletonList } from '../components/Skeleton';
import { TEMPLATES } from '../types/contracts';
import { formatPartyId } from '../utils/formatParty';

export function Passport() {
  const { state, parties } = useLedger();
  const { create, exercise, loading: cmdLoading, error: cmdError } = useCommand();

  const { contracts: requests, loading: loadingReq, refresh: refreshRequests } = useContracts(TEMPLATES.IdentityRequest);
  const { contracts: passports, loading: loadingPass, refresh: refreshPassports } = useContracts(TEMPLATES.DigitalPassport);
  const { contracts: updates, loading: loadingUpd, refresh: refreshUpdates } = useContracts(TEMPLATES.UpdateRequest);
  const { contracts: verifications, refresh: refreshVerifications } = useContracts(TEMPLATES.VerificationRequest);

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    authority: '',
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    photoHash: '',
    issueDate: '',
    expiryDate: '',
  });

  if (!state) {
    return <p className="text-gray-500">Select a party to manage passports.</p>;
  }

  const requiredFields = ['authority', 'fullName', 'dateOfBirth', 'nationality', 'passportNumber', 'issueDate', 'expiryDate'] as const;
  const isFormValid = requiredFields.every((f) => form[f].trim() !== '');
  const fieldError = (field: keyof typeof form) => submitted && !form[field].trim();

  const handleSubmitRequest = async () => {
    setSubmitted(true);
    if (!isFormValid) return;
    const result = await create(
      TEMPLATES.IdentityRequest.module,
      TEMPLATES.IdentityRequest.entity,
      {
        holder: state.partyId,
        authority: form.authority,
        passportInfo: {
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          nationality: form.nationality,
          passportNumber: form.passportNumber,
          photoHash: form.photoHash,
          issueDate: form.issueDate,
          expiryDate: form.expiryDate,
        },
      },
    );
    if (result) { setShowForm(false); setSubmitted(false); refreshRequests(); }
  };

  const handleApprove = async (cid: string) => {
    const r = await exercise(TEMPLATES.IdentityRequest.module, TEMPLATES.IdentityRequest.entity, cid, 'Approve');
    if (r) { refreshRequests(); refreshPassports(); }
  };

  const handleReject = async (cid: string) => {
    const r = await exercise(TEMPLATES.IdentityRequest.module, TEMPLATES.IdentityRequest.entity, cid, 'Reject');
    if (r) refreshRequests();
  };

  const handleSuspend = async (cid: string) => {
    const r = await exercise(TEMPLATES.DigitalPassport.module, TEMPLATES.DigitalPassport.entity, cid, 'Suspend');
    if (r) refreshPassports();
  };

  const handleReactivate = async (cid: string) => {
    const r = await exercise(TEMPLATES.DigitalPassport.module, TEMPLATES.DigitalPassport.entity, cid, 'Reactivate');
    if (r) refreshPassports();
  };

  const handleRevoke = async (cid: string) => {
    const r = await exercise(TEMPLATES.DigitalPassport.module, TEMPLATES.DigitalPassport.entity, cid, 'Revoke');
    if (r) refreshPassports();
  };

  const handleApproveUpdate = async (cid: string) => {
    const r = await exercise(TEMPLATES.UpdateRequest.module, TEMPLATES.UpdateRequest.entity, cid, 'ApproveUpdate');
    if (r) { refreshUpdates(); refreshPassports(); }
  };

  const refreshAll = () => { refreshRequests(); refreshPassports(); refreshUpdates(); refreshVerifications(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Passports</h1>
          <p className="text-sm text-gray-500 mt-1">Issue, verify, suspend, and revoke digital passports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshAll} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Refresh</button>
          <button onClick={() => { setShowForm(!showForm); setSubmitted(false); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {showForm ? 'Cancel' : 'New Request'}
          </button>
        </div>
      </div>

      {cmdError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{cmdError}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Submit Passport Request</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Issuing Authority <span className="text-red-500">*</span></label>
              <select value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('authority') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                <option value="">Select authority...</option>
                {parties.map((p) => <option key={p.party} value={p.party}>{p.displayName || formatPartyId(p.party)}</option>)}
              </select>
              {fieldError('authority') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('fullName') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('fullName') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date of Birth <span className="text-red-500">*</span></label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('dateOfBirth') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('dateOfBirth') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nationality <span className="text-red-500">*</span></label>
              <input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('nationality') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('nationality') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Passport Number <span className="text-red-500">*</span></label>
              <input type="text" value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('passportNumber') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('passportNumber') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Photo Hash</label>
              <input type="text" value={form.photoHash} onChange={(e) => setForm({ ...form, photoHash: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <p className="text-xs text-gray-400 mt-0.5">SHA-256 hash of the passport photo file</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Issue Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('issueDate') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('issueDate') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expiry Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('expiryDate') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('expiryDate') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
          </div>
          <button onClick={handleSubmitRequest} disabled={cmdLoading} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {cmdLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      )}

      {/* Pending requests */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending Requests ({requests.length})</h2>
        {loadingReq ? <SkeletonList count={2} /> : requests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No pending requests.</p>
            {!showForm && <button onClick={() => setShowForm(true)} className="text-blue-600 text-sm mt-1 hover:underline">Create one</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <>
                  <ChoiceButton label="Approve" onClick={() => handleApprove(c.contractId)} loading={cmdLoading} variant="success" small />
                  <ChoiceButton label="Reject" onClick={() => handleReject(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will reject the passport request." />
                </>
              } />
            ))}
          </div>
        )}
      </section>

      {/* Update requests */}
      {(updates.length > 0 || loadingUpd) && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Update Requests ({updates.length})</h2>
          {loadingUpd ? <SkeletonList count={1} /> : (
            <div className="space-y-3">
              {updates.map((c) => (
                <ContractCard key={c.contractId} contract={c} actions={
                  <ChoiceButton label="Approve Update" onClick={() => handleApproveUpdate(c.contractId)} loading={cmdLoading} variant="success" small />
                } />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Verification requests */}
      {verifications.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Verification Requests ({verifications.length})</h2>
          <div className="space-y-3">
            {verifications.map((c) => <ContractCard key={c.contractId} contract={c} />)}
          </div>
        </section>
      )}

      {/* Issued passports */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Issued Passports ({passports.length})</h2>
        {loadingPass ? <SkeletonList count={2} /> : passports.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No passports issued.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {passports.map((c) => {
              const status = c.createArguments.status as string;
              return (
                <ContractCard key={c.contractId} contract={c} actions={
                  <>
                    {status === 'Active' && <ChoiceButton label="Suspend" onClick={() => handleSuspend(c.contractId)} loading={cmdLoading} variant="secondary" small confirm="This will suspend the passport. It can be reactivated later." />}
                    {status === 'Suspended' && <ChoiceButton label="Reactivate" onClick={() => handleReactivate(c.contractId)} loading={cmdLoading} variant="success" small />}
                    {status !== 'Revoked' && <ChoiceButton label="Revoke" onClick={() => handleRevoke(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will permanently revoke this passport. This action cannot be undone." />}
                  </>
                } />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
