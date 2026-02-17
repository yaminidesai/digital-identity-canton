import { useState } from 'react';
import type { ActiveContract } from '../api/ledger';
import { formatPartyId } from '../utils/formatParty';

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') {
    if (value.includes('::')) return formatPartyId(value);
    return value;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(formatValue).join(', ') || '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const FIELD_LABELS: Record<string, string> = {
  'birthInfo.fullName': 'Full Name',
  'birthInfo.dateOfBirth': 'Date of Birth',
  'birthInfo.placeOfBirth': 'Place of Birth',
  'birthInfo.sex': 'Sex',
  'birthInfo.motherName': 'Mother',
  'birthInfo.fatherName': 'Father',
  'birthInfo.registrationNumber': 'Reg. Number',
  'passportInfo.fullName': 'Full Name',
  'passportInfo.dateOfBirth': 'Date of Birth',
  'passportInfo.nationality': 'Nationality',
  'passportInfo.passportNumber': 'Passport Number',
  'passportInfo.photoHash': 'Photo Hash',
  'passportInfo.issueDate': 'Issue Date',
  'passportInfo.expiryDate': 'Expiry Date',
  'voterInfo.personalInfo.fullName': 'Full Name',
  'voterInfo.personalInfo.dateOfBirth': 'Date of Birth',
  'voterInfo.personalInfo.nationality': 'Nationality',
  'voterInfo.constituency': 'Constituency',
  'voterInfo.voterIdNumber': 'Voter ID',
  'personalInfo.fullName': 'Full Name',
  'personalInfo.dateOfBirth': 'Date of Birth',
  'personalInfo.nationality': 'Nationality',
  'kycData.personalInfo.fullName': 'Full Name',
  'kycData.personalInfo.dateOfBirth': 'Date of Birth',
  'kycData.personalInfo.nationality': 'Nationality',
  'kycData.address': 'Address',
  'kycData.taxId': 'Tax ID',
  'kycData.sourceOfFunds': 'Source of Funds',
  'kycData.occupation': 'Occupation',
  'contentInfo.title': 'Title',
  'contentInfo.contentHash': 'Content Hash',
  'contentInfo.contentType': 'Type',
  'contentInfo.creator': 'Creator',
  'contentInfo.creationDate': 'Created',
  'contentInfo.description': 'Description',
  'terms.licensee': 'Licensee',
  'terms.startDate': 'Start Date',
  'terms.endDate': 'End Date',
  'terms.scope': 'Scope',
  'updatedBirthInfo.fullName': 'New Full Name',
  'updatedBirthInfo.dateOfBirth': 'New Date of Birth',
  'updateFields.newFullName': 'New Full Name',
  'updateFields.newNationality': 'New Nationality',
  'updateFields.newPhotoHash': 'New Photo Hash',
  'requestedDisclosure.discloseName': 'Share Name',
  'requestedDisclosure.discloseDateOfBirth': 'Share DOB',
  'requestedDisclosure.discloseNationality': 'Share Nationality',
  'requestedDisclosure.disclosePassportNumber': 'Share Passport #',
  'requestedDisclosure.disclosePhotoHash': 'Share Photo',
  'requestedDisclosure.discloseIssueDate': 'Share Issue Date',
  'requestedDisclosure.discloseExpiryDate': 'Share Expiry Date',
  authority: 'Authority',
  holder: 'Holder',
  registry: 'Registry',
  requester: 'Requester',
  voter: 'Voter',
  commission: 'Commission',
  creator: 'Creator',
  licensee: 'Licensee',
  challenger: 'Challenger',
  currentOwner: 'Current Owner',
  verifier: 'Verifier',
  institution: 'Institution',
  customer: 'Customer',
  regulator: 'Regulator',
  status: 'Status',
  country: 'Country',
  jurisdiction: 'Jurisdiction',
  domain: 'Domain',
  purpose: 'Purpose',
  reason: 'Reason',
  riskLevel: 'Risk Level',
  electionId: 'Election',
  description: 'Description',
  candidates: 'Candidates',
  choice_: 'Vote',
  results: 'Results',
  voters: 'Voters',
  contentHash: 'Content Hash',
};

// Fields to show in the primary (always visible) section
const PRIMARY_FIELDS = new Set([
  'birthInfo.fullName', 'birthInfo.dateOfBirth', 'birthInfo.placeOfBirth', 'birthInfo.sex',
  'passportInfo.fullName', 'passportInfo.nationality', 'passportInfo.passportNumber', 'passportInfo.expiryDate',
  'voterInfo.personalInfo.fullName', 'voterInfo.constituency', 'voterInfo.voterIdNumber',
  'contentInfo.title', 'contentInfo.contentType', 'contentInfo.creationDate',
  'kycData.personalInfo.fullName', 'kycData.occupation',
  'terms.licensee', 'terms.startDate', 'terms.endDate',
  'authority', 'holder', 'registry', 'requester', 'voter', 'commission',
  'creator', 'institution', 'customer', 'verifier', 'challenger', 'currentOwner',
  'status', 'country', 'jurisdiction', 'domain', 'purpose', 'reason',
  'riskLevel', 'electionId', 'description', 'candidates', 'choice_', 'results',
  'fullName', 'nationality', 'passportNumber',
]);

function humanizeKey(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const last = key.split('.').pop() || key;
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_$/, '')
    .trim();
}

function flattenFields(
  obj: Record<string, unknown>,
  prefix = '',
): Array<{ key: string; value: unknown }> {
  const entries: Array<{ key: string; value: unknown }> = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      entries.push(...flattenFields(val as Record<string, unknown>, fullKey));
    } else {
      entries.push({ key: fullKey, value: val });
    }
  }
  return entries;
}

function extractTemplateName(templateId: string): string {
  const parts = templateId.replace(/^#/, '').split(':');
  return parts.length >= 3 ? parts[2] : parts[parts.length - 1];
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Open: 'bg-green-100 text-green-800',
  Registered: 'bg-green-100 text-green-800',
  Cleared: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Suspended: 'bg-orange-100 text-orange-800',
  Flagged: 'bg-orange-100 text-orange-800',
  Amended: 'bg-blue-100 text-blue-800',
  Disputed: 'bg-orange-100 text-orange-800',
  Revoked: 'bg-red-100 text-red-800',
  Voided: 'bg-red-100 text-red-800',
  Rejected: 'bg-red-100 text-red-800',
  Closed: 'bg-gray-100 text-gray-800',
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
};

function StatusBadge({ value }: { value: string }) {
  const style = STATUS_STYLES[value] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${style}`}>
      {value}
    </span>
  );
}

interface ContractCardProps {
  contract: ActiveContract;
  actions?: React.ReactNode;
}

export function ContractCard({ contract, actions }: ContractCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showId, setShowId] = useState(false);

  const templateName = extractTemplateName(contract.templateId);
  const allFields = flattenFields(contract.createArguments);

  const status = contract.createArguments.status as string | undefined;
  const riskLevel = contract.createArguments.riskLevel as string | undefined;

  const primaryFields = allFields.filter((f) => PRIMARY_FIELDS.has(f.key) && f.key !== 'status' && f.key !== 'riskLevel');
  const detailFields = allFields.filter((f) => !PRIMARY_FIELDS.has(f.key) && f.key !== 'status' && f.key !== 'riskLevel');

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {templateName}
          </span>
          {status && <StatusBadge value={status} />}
          {riskLevel && <StatusBadge value={riskLevel} />}
          <button
            onClick={() => setShowId(!showId)}
            className="text-xs text-gray-400 hover:text-gray-600 font-mono"
            title="Click to show contract ID"
          >
            {showId ? contract.contractId : `#${contract.contractId.slice(0, 8)}...`}
          </button>
        </div>
        {actions && <div className="flex gap-2 shrink-0 ml-3">{actions}</div>}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {primaryFields.map(({ key, value }) => (
          <div key={key} className="text-sm">
            <span className="text-gray-400 text-xs">{humanizeKey(key)}</span>
            <div className="text-gray-900 truncate" title={formatValue(value)}>
              {formatValue(value)}
            </div>
          </div>
        ))}
      </div>

      {detailFields.length > 0 && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {showDetails ? 'Hide details' : `${detailFields.length} more field${detailFields.length !== 1 ? 's' : ''}`}
          </button>
          {showDetails && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 pt-2 border-t border-gray-100">
              {detailFields.map(({ key, value }) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-400 text-xs">{humanizeKey(key)}</span>
                  <div className="text-gray-900 truncate" title={formatValue(value)}>
                    {formatValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
