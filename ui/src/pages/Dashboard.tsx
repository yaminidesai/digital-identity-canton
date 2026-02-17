import { useContracts } from '../hooks/useContracts';
import { useLedger } from '../hooks/useLedger';
import { ContractCard } from '../components/ContractCard';
import { SkeletonList, SkeletonSummaryCards } from '../components/Skeleton';
import { TEMPLATES } from '../types/contracts';
import { useNavigate } from 'react-router-dom';

const MODULE_COLORS: Record<string, string> = {
  IssuingAuthority: 'border-l-blue-500',
  CivilRegistryAuthority: 'border-l-blue-500',
  ElectionCommission: 'border-l-blue-500',
  FinancialRegulator: 'border-l-blue-500',
  ContentRegistry: 'border-l-blue-500',
  BirthRegistrationRequest: 'border-l-yellow-500',
  BirthCertificate: 'border-l-green-500',
  AmendmentRequest: 'border-l-yellow-500',
  IdentityRequest: 'border-l-yellow-500',
  DigitalPassport: 'border-l-indigo-500',
  UpdateRequest: 'border-l-yellow-500',
  VerificationRequest: 'border-l-purple-500',
  VerificationResponse: 'border-l-purple-500',
  VoterRegistrationRequest: 'border-l-yellow-500',
  VoterRegistration: 'border-l-green-500',
  Election: 'border-l-orange-500',
  Ballot: 'border-l-teal-500',
  ElectionResult: 'border-l-green-500',
  KYCRequest: 'border-l-yellow-500',
  KYCSubmission: 'border-l-orange-500',
  KYCClearance: 'border-l-green-500',
  SuspiciousActivityReport: 'border-l-red-500',
  ContentRegistrationRequest: 'border-l-yellow-500',
  ContentCertificate: 'border-l-green-500',
  LicenseRequest: 'border-l-yellow-500',
  LicenseAgreement: 'border-l-indigo-500',
  ContentDispute: 'border-l-red-500',
};

const PENDING_TEMPLATES = [
  'BirthRegistrationRequest', 'IdentityRequest', 'UpdateRequest',
  'VoterRegistrationRequest', 'KYCRequest', 'KYCSubmission',
  'ContentRegistrationRequest', 'LicenseRequest', 'AmendmentRequest',
  'VerificationRequest', 'ContentDispute',
];

export function Dashboard() {
  const { state } = useLedger();
  const { contracts, loading, error, refresh } = useContracts();

  // Count contracts needing action
  const { contracts: birthReqs } = useContracts(TEMPLATES.BirthRegistrationRequest);
  const { contracts: passportReqs } = useContracts(TEMPLATES.IdentityRequest);
  const { contracts: voterReqs } = useContracts(TEMPLATES.VoterRegistrationRequest);
  const { contracts: kycReqs } = useContracts(TEMPLATES.KYCRequest);
  const { contracts: contentReqs } = useContracts(TEMPLATES.ContentRegistrationRequest);
  const actionCount = birthReqs.length + passportReqs.length + voterReqs.length + kycReqs.length + contentReqs.length;

  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to Digital Identity Platform</h2>
        <p className="text-gray-500">Select or allocate a party from the sidebar to get started.</p>
      </div>
    );
  }

  const grouped = contracts.reduce<Record<string, typeof contracts>>((acc, c) => {
    const name = c.templateId.replace(/^#/, '').split(':').pop() || 'Unknown';
    (acc[name] ??= []).push(c);
    return acc;
  }, {});

  const pendingCount = Object.entries(grouped)
    .filter(([name]) => PENDING_TEMPLATES.includes(name))
    .reduce((sum, [, list]) => sum + list.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Viewing as <span className="font-medium">{state.displayName}</span> &mdash;{' '}
            {contracts.length} active contract{contracts.length !== 1 && 's'}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Action needed banner */}
      {actionCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="bg-amber-100 rounded-full p-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-medium text-amber-800">{actionCount} pending request{actionCount !== 1 ? 's' : ''} need your attention</span>
            <p className="text-xs text-amber-600 mt-0.5">Review and approve or reject incoming requests across modules.</p>
          </div>
        </div>
      )}

      {/* Getting started guide (when no contracts) */}
      {contracts.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => navigate('/identity')} className="text-left p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
                <span className="text-sm font-medium text-gray-800">Create Authority</span>
              </div>
              <p className="text-xs text-gray-500">Set up an authority role (issuer, registry, commission) for your party.</p>
            </button>
            <button onClick={() => navigate('/birth-cert')} className="text-left p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                <span className="text-sm font-medium text-gray-800">Submit Request</span>
              </div>
              <p className="text-xs text-gray-500">Submit a registration request to an authority (birth cert, passport, etc).</p>
            </button>
            <button onClick={() => navigate('/birth-cert')} className="text-left p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                <span className="text-sm font-medium text-gray-800">Approve Requests</span>
              </div>
              <p className="text-xs text-gray-500">Switch to the authority party and approve pending requests.</p>
            </button>
          </div>
        </div>
      )}

      {loading && contracts.length === 0 && (
        <>
          <SkeletonSummaryCards />
          <div className="mt-6">
            <SkeletonList count={3} />
          </div>
        </>
      )}

      {/* Summary cards */}
      {Object.keys(grouped).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(grouped).map(([name, list]) => (
            <div key={name} className={`bg-white rounded-lg shadow border border-l-4 p-4 ${MODULE_COLORS[name] || 'border-l-gray-300'}`}>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-gray-900">{list.length}</div>
                {PENDING_TEMPLATES.includes(name) && (
                  <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">{name.replace(/([A-Z])/g, ' $1').trim()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pending items first, then the rest */}
      {pendingCount > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending Requests ({pendingCount})</h2>
          <div className="space-y-3">
            {contracts
              .filter((c) => {
                const name = c.templateId.replace(/^#/, '').split(':').pop() || '';
                return PENDING_TEMPLATES.includes(name);
              })
              .map((c) => (
                <ContractCard key={c.contractId} contract={c} />
              ))}
          </div>
        </section>
      )}

      {contracts.filter((c) => {
        const name = c.templateId.replace(/^#/, '').split(':').pop() || '';
        return !PENDING_TEMPLATES.includes(name);
      }).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Active Contracts</h2>
          <div className="space-y-3">
            {contracts
              .filter((c) => {
                const name = c.templateId.replace(/^#/, '').split(':').pop() || '';
                return !PENDING_TEMPLATES.includes(name);
              })
              .map((c) => (
                <ContractCard key={c.contractId} contract={c} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
