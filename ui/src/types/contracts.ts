// Mirrors Daml types from the digital-identity-canton project

// Identity.Types
export interface PersonalInfo {
  fullName: string;
  dateOfBirth: string; // ISO date
  nationality: string;
}

// Identity.Roles
export interface IssuingAuthority {
  authority: string;
  country: string;
}

export interface CivilRegistryAuthority {
  authority: string;
  jurisdiction: string;
}

export interface ElectionCommission {
  authority: string;
  jurisdiction: string;
}

export interface FinancialRegulator {
  authority: string;
  jurisdiction: string;
}

export interface ContentRegistry {
  authority: string;
  domain: string;
}

// Civil.BirthCertificate
export type Sex = 'Male' | 'Female' | 'Other';

export interface BirthInfo {
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  sex: Sex;
  motherName: string;
  fatherName: string;
  registrationNumber: string;
}

export type BirthCertStatus = 'Active' | 'Amended' | 'Voided';

export interface BirthRegistrationRequest {
  requester: string;
  registry: string;
  birthInfo: BirthInfo;
}

export interface BirthCertificate {
  registry: string;
  holder: string;
  birthInfo: BirthInfo;
  status: BirthCertStatus;
}

export interface AmendmentRequest {
  holder: string;
  registry: string;
  certificateCid: string;
  updatedBirthInfo: BirthInfo;
}

// Passport.Types
export interface PassportInfo {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  photoHash: string;
  issueDate: string;
  expiryDate: string;
}

export type PassportStatus = 'Active' | 'Suspended' | 'Revoked';

export interface DisclosurePolicy {
  discloseName: boolean;
  discloseDateOfBirth: boolean;
  discloseNationality: boolean;
  disclosePassportNumber: boolean;
  disclosePhotoHash: boolean;
  discloseIssueDate: boolean;
  discloseExpiryDate: boolean;
}

export interface UpdateFields {
  newFullName: string | null;
  newNationality: string | null;
  newPhotoHash: string | null;
}

// Passport.Passport
export interface IdentityRequest {
  holder: string;
  authority: string;
  passportInfo: PassportInfo;
}

export interface DigitalPassport {
  authority: string;
  holder: string;
  passportInfo: PassportInfo;
  status: PassportStatus;
}

export interface UpdateRequest {
  holder: string;
  authority: string;
  passportCid: string;
  updateFields: UpdateFields;
}

// Passport.Verification
export interface VerificationRequest {
  verifier: string;
  holder: string;
  purpose: string;
  requestedDisclosure: DisclosurePolicy;
}

export interface DisclosedIdentity {
  fullName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  passportNumber: string | null;
  photoHash: string | null;
  issueDate: string | null;
  expiryDate: string | null;
}

export interface VerificationResponse {
  holder: string;
  verifier: string;
  purpose: string;
  disclosedIdentity: DisclosedIdentity;
}

// Voting.Voting
export interface VoterInfo {
  personalInfo: PersonalInfo;
  constituency: string;
  voterIdNumber: string;
}

export type ElectionStatus = 'Open' | 'Closed';

export interface VoterRegistrationRequest {
  voter: string;
  commission: string;
  voterInfo: VoterInfo;
}

export interface VoterRegistration {
  commission: string;
  voter: string;
  voterInfo: VoterInfo;
}

export interface Election {
  commission: string;
  electionId: string;
  description: string;
  candidates: string[];
  status: ElectionStatus;
  voters: string[];
}

export interface Ballot {
  commission: string;
  electionId: string;
  voter: string;
  choice_: string;
}

export interface ElectionResult {
  commission: string;
  electionId: string;
  results: string;
}

// AML.Compliance
export interface KYCData {
  personalInfo: PersonalInfo;
  address: string;
  taxId: string;
  sourceOfFunds: string;
  occupation: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplianceStatus = 'Pending' | 'Cleared' | 'Flagged' | 'Rejected';

export interface KYCRequest {
  institution: string;
  customer: string;
  purpose: string;
}

export interface KYCSubmission {
  institution: string;
  customer: string;
  kycData: KYCData;
}

export interface KYCClearance {
  institution: string;
  customer: string;
  kycData: KYCData;
  riskLevel: RiskLevel;
}

export interface SuspiciousActivityReport {
  institution: string;
  customer: string;
  kycData: KYCData;
  regulator: string;
  reason: string;
}

// Content.ContentAuth
export type ContentType = 'Article' | 'Image' | 'Video' | 'Audio' | 'Software';
export type ContentStatus = 'Registered' | 'Disputed' | 'Revoked';

export interface ContentInfo {
  title: string;
  contentHash: string;
  contentType: ContentType;
  creator: string;
  creationDate: string;
  description: string;
}

export interface LicenseTerms {
  licensee: string;
  startDate: string;
  endDate: string;
  scope: string;
}

export interface ContentRegistrationRequest {
  creator: string;
  registry: string;
  contentInfo: ContentInfo;
}

export interface ContentCertificate {
  registry: string;
  creator: string;
  contentInfo: ContentInfo;
  status: ContentStatus;
}

export interface LicenseRequest {
  creator: string;
  licensee: string;
  registry: string;
  contentHash: string;
  terms: LicenseTerms;
}

export interface LicenseAgreement {
  creator: string;
  licensee: string;
  contentHash: string;
  terms: LicenseTerms;
}

export interface ContentDispute {
  challenger: string;
  registry: string;
  currentOwner: string;
  contentHash: string;
  reason: string;
}

// Template name to module mapping for API calls
export const TEMPLATES = {
  // Identity.Roles
  IssuingAuthority: { module: 'Identity.Roles', entity: 'IssuingAuthority' },
  CivilRegistryAuthority: { module: 'Identity.Roles', entity: 'CivilRegistryAuthority' },
  ElectionCommission: { module: 'Identity.Roles', entity: 'ElectionCommission' },
  FinancialRegulator: { module: 'Identity.Roles', entity: 'FinancialRegulator' },
  ContentRegistry: { module: 'Identity.Roles', entity: 'ContentRegistry' },
  // Civil.BirthCertificate
  BirthRegistrationRequest: { module: 'Civil.BirthCertificate', entity: 'BirthRegistrationRequest' },
  BirthCertificate: { module: 'Civil.BirthCertificate', entity: 'BirthCertificate' },
  AmendmentRequest: { module: 'Civil.BirthCertificate', entity: 'AmendmentRequest' },
  // Passport.Passport
  IdentityRequest: { module: 'Passport.Passport', entity: 'IdentityRequest' },
  DigitalPassport: { module: 'Passport.Passport', entity: 'DigitalPassport' },
  UpdateRequest: { module: 'Passport.Passport', entity: 'UpdateRequest' },
  // Passport.Verification
  VerificationRequest: { module: 'Passport.Verification', entity: 'VerificationRequest' },
  VerificationResponse: { module: 'Passport.Verification', entity: 'VerificationResponse' },
  // Voting.Voting
  VoterRegistrationRequest: { module: 'Voting.Voting', entity: 'VoterRegistrationRequest' },
  VoterRegistration: { module: 'Voting.Voting', entity: 'VoterRegistration' },
  Election: { module: 'Voting.Voting', entity: 'Election' },
  Ballot: { module: 'Voting.Voting', entity: 'Ballot' },
  ElectionResult: { module: 'Voting.Voting', entity: 'ElectionResult' },
  // AML.Compliance
  KYCRequest: { module: 'AML.Compliance', entity: 'KYCRequest' },
  KYCSubmission: { module: 'AML.Compliance', entity: 'KYCSubmission' },
  KYCClearance: { module: 'AML.Compliance', entity: 'KYCClearance' },
  SuspiciousActivityReport: { module: 'AML.Compliance', entity: 'SuspiciousActivityReport' },
  // Content.ContentAuth
  ContentRegistrationRequest: { module: 'Content.ContentAuth', entity: 'ContentRegistrationRequest' },
  ContentCertificate: { module: 'Content.ContentAuth', entity: 'ContentCertificate' },
  LicenseRequest: { module: 'Content.ContentAuth', entity: 'LicenseRequest' },
  LicenseAgreement: { module: 'Content.ContentAuth', entity: 'LicenseAgreement' },
  ContentDispute: { module: 'Content.ContentAuth', entity: 'ContentDispute' },
} as const;
