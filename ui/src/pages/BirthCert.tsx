import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useContracts } from '../hooks/useContracts';
import { useCommand } from '../hooks/useCommand';
import { ContractCard } from '../components/ContractCard';
import { ChoiceButton } from '../components/ChoiceButton';
import { SkeletonList } from '../components/Skeleton';
import { TEMPLATES } from '../types/contracts';
import type { Sex } from '../types/contracts';
import { formatPartyId } from '../utils/formatParty';

export function BirthCert() {
  const { state, parties } = useLedger();
  const { create, exercise, loading: cmdLoading, error: cmdError } = useCommand();

  const { contracts: requests, loading: loadingReq, refresh: refreshRequests } = useContracts(TEMPLATES.BirthRegistrationRequest);
  const { contracts: certs, loading: loadingCerts, refresh: refreshCerts } = useContracts(TEMPLATES.BirthCertificate);
  const { contracts: amendments, loading: loadingAmend, refresh: refreshAmendments } = useContracts(TEMPLATES.AmendmentRequest);

  const [form, setForm] = useState({
    registry: '',
    fullName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    sex: 'Male' as Sex,
    motherName: '',
    fatherName: '',
    registrationNumber: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!state) {
    return <p className="text-gray-500">Select a party to manage birth certificates.</p>;
  }

  const requiredFields = ['registry', 'fullName', 'dateOfBirth', 'placeOfBirth', 'registrationNumber'] as const;
  const isFormValid = requiredFields.every((f) => form[f].trim() !== '');

  const handleSubmitRequest = async () => {
    setSubmitted(true);
    if (!isFormValid) return;
    const result = await create(
      TEMPLATES.BirthRegistrationRequest.module,
      TEMPLATES.BirthRegistrationRequest.entity,
      {
        requester: state.partyId,
        registry: form.registry,
        birthInfo: {
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          placeOfBirth: form.placeOfBirth,
          sex: form.sex,
          motherName: form.motherName,
          fatherName: form.fatherName,
          registrationNumber: form.registrationNumber,
        },
      },
    );
    if (result) {
      setShowForm(false);
      setSubmitted(false);
      refreshRequests();
    }
  };

  const handleApprove = async (contractId: string) => {
    const result = await exercise(TEMPLATES.BirthRegistrationRequest.module, TEMPLATES.BirthRegistrationRequest.entity, contractId, 'Approve');
    if (result) { refreshRequests(); refreshCerts(); }
  };

  const handleReject = async (contractId: string) => {
    const result = await exercise(TEMPLATES.BirthRegistrationRequest.module, TEMPLATES.BirthRegistrationRequest.entity, contractId, 'Reject');
    if (result) refreshRequests();
  };

  const handleWithdraw = async (contractId: string) => {
    const result = await exercise(TEMPLATES.BirthRegistrationRequest.module, TEMPLATES.BirthRegistrationRequest.entity, contractId, 'WithdrawRequest');
    if (result) refreshRequests();
  };

  const handleVoid = async (contractId: string) => {
    const result = await exercise(TEMPLATES.BirthCertificate.module, TEMPLATES.BirthCertificate.entity, contractId, 'Void');
    if (result) refreshCerts();
  };

  const handleApproveAmendment = async (contractId: string) => {
    const result = await exercise(TEMPLATES.AmendmentRequest.module, TEMPLATES.AmendmentRequest.entity, contractId, 'ApproveAmendment');
    if (result) { refreshAmendments(); refreshCerts(); }
  };

  const handleRejectAmendment = async (contractId: string) => {
    const result = await exercise(TEMPLATES.AmendmentRequest.module, TEMPLATES.AmendmentRequest.entity, contractId, 'RejectAmendment');
    if (result) refreshAmendments();
  };

  const refreshAll = () => { refreshRequests(); refreshCerts(); refreshAmendments(); };

  const fieldError = (field: keyof typeof form) => submitted && !form[field].trim();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Birth Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">Register births, manage certificates, and process amendments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshAll} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Refresh
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setSubmitted(false); }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'New Request'}
          </button>
        </div>
      </div>

      {cmdError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{cmdError}</div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Submit Birth Registration Request</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Registry Party <span className="text-red-500">*</span></label>
              <select
                value={form.registry}
                onChange={(e) => setForm({ ...form, registry: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('registry') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="">Select registry...</option>
                {parties.map((p) => (
                  <option key={p.party} value={p.party}>
                    {p.displayName || formatPartyId(p.party)}
                  </option>
                ))}
              </select>
              {fieldError('registry') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
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
              <label className="block text-xs text-gray-500 mb-1">Place of Birth <span className="text-red-500">*</span></label>
              <input type="text" value={form.placeOfBirth} onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('placeOfBirth') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('placeOfBirth') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sex</label>
              <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as Sex })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Registration Number <span className="text-red-500">*</span></label>
              <input type="text" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('registrationNumber') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('registrationNumber') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
              <p className="text-xs text-gray-400 mt-0.5">Unique identifier assigned by the registry</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mother's Name</label>
              <input type="text" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Father's Name</label>
              <input type="text" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <button
            onClick={handleSubmitRequest}
            disabled={cmdLoading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {cmdLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      )}

      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Pending Requests ({requests.length})
        </h2>
        {loadingReq ? (
          <SkeletonList count={2} />
        ) : requests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No pending requests.</p>
            {!showForm && <button onClick={() => setShowForm(true)} className="text-blue-600 text-sm mt-1 hover:underline">Create one</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((c) => (
              <ContractCard
                key={c.contractId}
                contract={c}
                actions={
                  <>
                    <ChoiceButton label="Approve" onClick={() => handleApprove(c.contractId)} loading={cmdLoading} variant="success" small />
                    <ChoiceButton label="Reject" onClick={() => handleReject(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will permanently reject the birth registration request." />
                    <ChoiceButton label="Withdraw" onClick={() => handleWithdraw(c.contractId)} loading={cmdLoading} variant="secondary" small />
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Amendment Requests */}
      {(amendments.length > 0 || loadingAmend) && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Amendment Requests ({amendments.length})
          </h2>
          {loadingAmend ? (
            <SkeletonList count={1} />
          ) : (
            <div className="space-y-3">
              {amendments.map((c) => (
                <ContractCard
                  key={c.contractId}
                  contract={c}
                  actions={
                    <>
                      <ChoiceButton label="Approve" onClick={() => handleApproveAmendment(c.contractId)} loading={cmdLoading} variant="success" small />
                      <ChoiceButton label="Reject" onClick={() => handleRejectAmendment(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will reject the amendment request." />
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Issued Certificates */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Issued Certificates ({certs.length})
        </h2>
        {loadingCerts ? (
          <SkeletonList count={2} />
        ) : certs.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No certificates issued.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map((c) => (
              <ContractCard
                key={c.contractId}
                contract={c}
                actions={
                  <ChoiceButton label="Void" onClick={() => handleVoid(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will permanently void this birth certificate. This action cannot be undone." />
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
