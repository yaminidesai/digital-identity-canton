import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useContracts } from '../hooks/useContracts';
import { useCommand } from '../hooks/useCommand';
import { ContractCard } from '../components/ContractCard';
import { ChoiceButton } from '../components/ChoiceButton';
import { SkeletonList } from '../components/Skeleton';
import { TEMPLATES } from '../types/contracts';
import type { ContentType } from '../types/contracts';
import { formatPartyId } from '../utils/formatParty';

export function Content() {
  const { state, parties } = useLedger();
  const { create, exercise, loading: cmdLoading, error: cmdError } = useCommand();

  const { contracts: regRequests, loading: loadingRegReq, refresh: refreshRegRequests } = useContracts(TEMPLATES.ContentRegistrationRequest);
  const { contracts: certificates, loading: loadingCerts, refresh: refreshCertificates } = useContracts(TEMPLATES.ContentCertificate);
  const { contracts: licenseRequests, refresh: refreshLicenseRequests } = useContracts(TEMPLATES.LicenseRequest);
  const { contracts: agreements, refresh: refreshAgreements } = useContracts(TEMPLATES.LicenseAgreement);
  const { contracts: disputes, refresh: refreshDisputes } = useContracts(TEMPLATES.ContentDispute);

  const [showRegForm, setShowRegForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regForm, setRegForm] = useState({
    registry: '', title: '', contentHash: '', contentType: 'Article' as ContentType,
    creationDate: '', description: '',
  });

  if (!state) {
    return <p className="text-gray-500">Select a party to manage content authentication.</p>;
  }

  const requiredFields = ['registry', 'title', 'contentHash', 'creationDate'] as const;
  const isFormValid = requiredFields.every((f) => regForm[f].trim() !== '');
  const fieldError = (field: keyof typeof regForm) => submitted && !regForm[field].trim();

  const handleRegister = async () => {
    setSubmitted(true);
    if (!isFormValid) return;
    const result = await create(TEMPLATES.ContentRegistrationRequest.module, TEMPLATES.ContentRegistrationRequest.entity, {
      creator: state.partyId,
      registry: regForm.registry,
      contentInfo: {
        title: regForm.title,
        contentHash: regForm.contentHash,
        contentType: regForm.contentType,
        creator: state.partyId,
        creationDate: regForm.creationDate,
        description: regForm.description,
      },
    });
    if (result) { setShowRegForm(false); setSubmitted(false); refreshRegRequests(); }
  };

  const handleApproveReg = async (cid: string) => {
    const r = await exercise(TEMPLATES.ContentRegistrationRequest.module, TEMPLATES.ContentRegistrationRequest.entity, cid, 'ApproveRegistration');
    if (r) { refreshRegRequests(); refreshCertificates(); }
  };

  const handleRejectReg = async (cid: string) => {
    const r = await exercise(TEMPLATES.ContentRegistrationRequest.module, TEMPLATES.ContentRegistrationRequest.entity, cid, 'RejectRegistration');
    if (r) refreshRegRequests();
  };

  const handleRevokeCert = async (cid: string) => {
    const r = await exercise(TEMPLATES.ContentCertificate.module, TEMPLATES.ContentCertificate.entity, cid, 'Revoke');
    if (r) refreshCertificates();
  };

  const handleApproveLicense = async (cid: string) => {
    const r = await exercise(TEMPLATES.LicenseRequest.module, TEMPLATES.LicenseRequest.entity, cid, 'ApproveLicense');
    if (r) { refreshLicenseRequests(); refreshAgreements(); }
  };

  const handleRejectLicense = async (cid: string) => {
    const r = await exercise(TEMPLATES.LicenseRequest.module, TEMPLATES.LicenseRequest.entity, cid, 'RejectLicense');
    if (r) refreshLicenseRequests();
  };

  const handleTerminate = async (cid: string) => {
    const r = await exercise(TEMPLATES.LicenseAgreement.module, TEMPLATES.LicenseAgreement.entity, cid, 'Terminate');
    if (r) refreshAgreements();
  };

  const handleResolveForOwner = async (cid: string) => {
    const r = await exercise(TEMPLATES.ContentDispute.module, TEMPLATES.ContentDispute.entity, cid, 'ResolveForOwner');
    if (r) refreshDisputes();
  };

  const refreshAll = () => { refreshRegRequests(); refreshCertificates(); refreshLicenseRequests(); refreshAgreements(); refreshDisputes(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Authentication</h1>
          <p className="text-sm text-gray-500 mt-1">Register content, manage licenses, and resolve ownership disputes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshAll} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Refresh</button>
          <button onClick={() => { setShowRegForm(!showRegForm); setSubmitted(false); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {showRegForm ? 'Cancel' : 'Register Content'}
          </button>
        </div>
      </div>

      {cmdError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{cmdError}</div>}

      {/* Registration form */}
      {showRegForm && (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Register Content</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Registry <span className="text-red-500">*</span></label>
              <select value={regForm.registry} onChange={(e) => setRegForm({ ...regForm, registry: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('registry') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                <option value="">Select registry...</option>
                {parties.map((p) => <option key={p.party} value={p.party}>{p.displayName || formatPartyId(p.party)}</option>)}
              </select>
              {fieldError('registry') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" value={regForm.title} onChange={(e) => setRegForm({ ...regForm, title: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('title') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('title') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Content Hash <span className="text-red-500">*</span></label>
              <input type="text" value={regForm.contentHash} onChange={(e) => setRegForm({ ...regForm, contentHash: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('contentHash') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('contentHash') ? (
                <p className="text-xs text-red-500 mt-0.5">Required</p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">SHA-256 hash of the content file for verification</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Content Type</label>
              <select value={regForm.contentType} onChange={(e) => setRegForm({ ...regForm, contentType: e.target.value as ContentType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Article</option>
                <option>Image</option>
                <option>Video</option>
                <option>Audio</option>
                <option>Software</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Creation Date <span className="text-red-500">*</span></label>
              <input type="date" value={regForm.creationDate} onChange={(e) => setRegForm({ ...regForm, creationDate: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${fieldError('creationDate') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
              {fieldError('creationDate') && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <input type="text" value={regForm.description} onChange={(e) => setRegForm({ ...regForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <button onClick={handleRegister} disabled={cmdLoading} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {cmdLoading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
      )}

      {/* Registration Requests */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Registration Requests ({regRequests.length})</h2>
        {loadingRegReq ? <SkeletonList count={2} /> : regRequests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No pending registrations.</p>
            {!showRegForm && <button onClick={() => setShowRegForm(true)} className="text-blue-600 text-sm mt-1 hover:underline">Register content</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {regRequests.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <>
                  <ChoiceButton label="Approve" onClick={() => handleApproveReg(c.contractId)} loading={cmdLoading} variant="success" small />
                  <ChoiceButton label="Reject" onClick={() => handleRejectReg(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will reject the content registration request." />
                </>
              } />
            ))}
          </div>
        )}
      </section>

      {/* Content Certificates */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Content Certificates ({certificates.length})</h2>
        {loadingCerts ? <SkeletonList count={2} /> : certificates.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No certificates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <ChoiceButton label="Revoke" onClick={() => handleRevokeCert(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will permanently revoke the content certificate." />
              } />
            ))}
          </div>
        )}
      </section>

      {/* License Requests */}
      {licenseRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">License Requests ({licenseRequests.length})</h2>
          <div className="space-y-3">
            {licenseRequests.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <>
                  <ChoiceButton label="Approve" onClick={() => handleApproveLicense(c.contractId)} loading={cmdLoading} variant="success" small />
                  <ChoiceButton label="Reject" onClick={() => handleRejectLicense(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will reject the license request." />
                </>
              } />
            ))}
          </div>
        </section>
      )}

      {/* License Agreements */}
      {agreements.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">License Agreements ({agreements.length})</h2>
          <div className="space-y-3">
            {agreements.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <ChoiceButton label="Terminate" onClick={() => handleTerminate(c.contractId)} loading={cmdLoading} variant="danger" small confirm="This will permanently terminate the license agreement." />
              } />
            ))}
          </div>
        </section>
      )}

      {/* Disputes */}
      {disputes.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Content Disputes ({disputes.length})</h2>
          <div className="space-y-3">
            {disputes.map((c) => (
              <ContractCard key={c.contractId} contract={c} actions={
                <ChoiceButton label="Resolve for Owner" onClick={() => handleResolveForOwner(c.contractId)} loading={cmdLoading} variant="success" small />
              } />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
