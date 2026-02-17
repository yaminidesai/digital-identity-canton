import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useContracts } from '../hooks/useContracts';
import { useCommand } from '../hooks/useCommand';
import { ContractCard } from '../components/ContractCard';
import { SkeletonList } from '../components/Skeleton';
import { TEMPLATES } from '../types/contracts';

type RoleType = 'IssuingAuthority' | 'CivilRegistryAuthority' | 'ElectionCommission' | 'FinancialRegulator' | 'ContentRegistry';

const roleConfig: Record<RoleType, { label: string; field: string; fieldLabel: string; helpText: string }> = {
  IssuingAuthority: { label: 'Issuing Authority', field: 'country', fieldLabel: 'Country', helpText: 'Country code or name this authority operates in' },
  CivilRegistryAuthority: { label: 'Civil Registry', field: 'jurisdiction', fieldLabel: 'Jurisdiction', helpText: 'Geographic jurisdiction (e.g. "State of California")' },
  ElectionCommission: { label: 'Election Commission', field: 'jurisdiction', fieldLabel: 'Jurisdiction', helpText: 'Electoral jurisdiction this commission oversees' },
  FinancialRegulator: { label: 'Financial Regulator', field: 'jurisdiction', fieldLabel: 'Jurisdiction', helpText: 'Regulatory jurisdiction (e.g. "Federal", "EU")' },
  ContentRegistry: { label: 'Content Registry', field: 'domain', fieldLabel: 'Domain', helpText: 'Content domain (e.g. "Music", "Software", "Film")' },
};

export function Identity() {
  const { state } = useLedger();
  const [selectedRole, setSelectedRole] = useState<RoleType>('IssuingAuthority');
  const [fieldValue, setFieldValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { create, loading: cmdLoading, error: cmdError } = useCommand();

  const template = TEMPLATES[selectedRole];
  const { contracts, loading, refresh } = useContracts(template);
  const config = roleConfig[selectedRole];

  if (!state) {
    return <p className="text-gray-500">Select a party to manage authority roles.</p>;
  }

  const handleCreate = async () => {
    setSubmitted(true);
    if (!fieldValue.trim()) return;
    const args: Record<string, unknown> = { authority: state.partyId };
    args[config.field] = fieldValue.trim();
    const result = await create(template.module, template.entity, args);
    if (result) {
      setFieldValue('');
      setSubmitted(false);
      refresh();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Authority Management</h1>
        <p className="text-sm text-gray-500 mt-1">Create and manage authority roles for your party across all modules.</p>
      </div>

      {/* Role selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.entries(roleConfig) as [RoleType, typeof config][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setSelectedRole(key); setSubmitted(false); }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedRole === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Create form */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Create {config.label}
        </h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              placeholder={config.fieldLabel}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                submitted && !fieldValue.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            {submitted && !fieldValue.trim() ? (
              <p className="text-xs text-red-500 mt-1">{config.fieldLabel} is required</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">{config.helpText}</p>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={cmdLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 self-start"
          >
            {cmdLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
        {cmdError && <p className="text-sm text-red-600 mt-2">{cmdError}</p>}
      </div>

      {/* Active contracts */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Active {config.label} Contracts
        </h2>
        <button onClick={refresh} className="text-sm text-blue-600 hover:underline font-normal">
          Refresh
        </button>
      </div>
      {loading ? (
        <SkeletonList count={2} />
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500 text-sm">No {config.label.toLowerCase()} contracts found.</p>
          <p className="text-gray-400 text-xs mt-1">Create one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <ContractCard key={c.contractId} contract={c} />
          ))}
        </div>
      )}
    </div>
  );
}
