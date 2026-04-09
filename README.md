# Digital Identity on Canton

This project implements BSA Section 5318(g) tipping-off prohibition at the architectural level — not as application policy but as a structural impossibility enforced by the DAML ledger interpreter. A flagged customer has no observer rights on their own SuspiciousActivityReport. The architecture makes disclosure impossible, not just prohibited.

Built on the Canton distributed ledger, the system models the full lifecycle of sovereign identity documents, electoral participation, and regulated financial activity across six compliance modules. For financial institutions operating under AML and KYC mandates, this demonstrates that compliance obligations are not a policy overlay but a structural property of the ledger itself: unauthorized disclosures are not merely prohibited, they are architecturally impossible.

---

## The Tipping-Off Prohibition — The Most Important Design Decision

Under **BSA Section 5318(g)**, a financial institution that files a Suspicious Activity Report (SAR) is **criminally prohibited** from disclosing to the subject of that report — or to any person — that the report was filed. This prohibition exists because disclosure would allow subjects to destroy evidence, restructure transactions to evade thresholds, or flee jurisdiction before law enforcement can act. The statute carries criminal penalties for institutions and individuals who violate it.

This creates a fundamental tension for any digital system: how do you store a record *about* a party without that party being able to see it?

In DAML, the answer is structural. A contract is visible only to its **signatories** and **observers**. The `SuspiciousActivityReport` template is designed as follows:

```
template SuspiciousActivityReport
  signatory institution      -- files and controls the SAR
  observer  regulator        -- FinCEN / financial regulator receives it
  -- customer is NOT listed
```

The customer is **not a signatory and not an observer**. This is not enforced by an access control list, a middleware policy, or a database permission. It is a consequence of DAML's privacy model: the Canton ledger will not deliver the contract's transaction events to any participant whose party is not a stakeholder. No API call, no administrative override, and no bug in application-layer code can expose the SAR to the customer. The ledger itself enforces the tipping-off prohibition.

SAR confidentiality is also protected under the Freedom of Information Act exemption — meaning even a court-ordered subpoena cannot compel disclosure of SAR filing status in most circumstances.

The test suite verifies this guarantee directly using `queryContractId` — the customer party receives `None` for a SAR they are the subject of, not an authorization error, but structural absence of the data on their participant node.

---

## Architecture Overview

```
digital-identity-canton/
├── daml.yaml                    # SDK 3.4.10, daml-script
├── daml/
│   ├── Identity/
│   │   ├── Types.daml           # PersonalInfo — shared data type
│   │   └── Roles.daml           # Authority role templates (5)
│   ├── Civil/
│   │   └── BirthCertificate.daml
│   ├── Passport/
│   │   ├── Passport.daml
│   │   └── Types.daml
│   ├── Voting/
│   │   └── Voting.daml
│   ├── AML/
│   │   └── Compliance.daml      # KYC, SAR, FreezeOrder, AssetTransfer
│   ├── Content/
│   │   └── ContentAuth.daml
│   └── Test/
│       ├── AMLTest.daml         # 5 tests
│       ├── BirthCertificateTest.daml
│       ├── ContentAuthTest.daml
│       ├── IntegrationTest.daml
│       ├── PassportTest.daml
│       └── VotingTest.daml
└── ui/                          # React + Vite + Tailwind
```

---

## Contract Table

The seven primary state contracts, their authorization model, and the real-world compliance obligation each satisfies:

| Template | Signatories | Observers | Controller (key choices) | Compliance Purpose |
|---|---|---|---|---|
| `BirthCertificate` | `registry`, `holder` | — | `registry` (Void), `holder` (RequestAmendment) | Civil registration; dual-signatory ensures neither party can unilaterally alter foundational identity record |
| `DigitalPassport` | `authority`, `holder` | — | `authority` (Revoke, Suspend), `holder` (RequestUpdate) | Travel document lifecycle; GDPR data minimization — only passport authority and holder are stakeholders |
| `VoterRegistration` | `commission`, `voter` | — | `commission` (Deregister) | Electoral integrity; commission co-signs to prevent self-registration; `Election.CastBallot` enforces one-person-one-vote by tracking `voters : [Party]` |
| `KYCClearance` | `institution`, `customer` | — | `institution` (RevokeClearance, FlagClearance) | BSA/FinCEN KYC compliance; institution controls revocation and escalation; customer co-signs as consent record under GDPR |
| `SuspiciousActivityReport` | `institution` | `regulator` | `regulator` (Acknowledge, Escalate) | **BSA §5318(g) tipping-off prohibition** — customer is not a stakeholder; the ledger enforces non-disclosure by construction |
| `FreezeOrder` | `regulator` | `institution`, `customer` | `regulator` (LiftFreeze), `institution` (AcknowledgeFreeze) | OFAC / FinCEN enforcement order; regulator is sole signatory; customer is observer (freeze must be disclosed once issued, unlike the SAR that triggered it) |
| `ContentCertificate` | `registry` | `creator` | `registry` (Revoke), `creator` (RequestLicense, TransferOwnership) | IP provenance and chain-of-custody; registry as sole signatory enables lifecycle management across disputes and transfers without requiring re-consent from prior owners |

---

## Privacy Model

DAML's authorization model is built on three concepts that map directly to legal relationships:

**Signatories** are parties whose off-ledger signature is required to create the contract. Every signatory is a stakeholder — they see the contract on their participant node and must authorize its creation. From a legal standpoint, signatories are the parties bound by the agreement. In this system, the `institution` is the signatory on a `SuspiciousActivityReport` because the institution, not the customer, is the party making the legal filing with FinCEN.

**Observers** are parties granted read access without signing authority. They see the contract but cannot control it. The `regulator` is an observer on `SuspiciousActivityReport` because FinCEN is the recipient of the report, not a co-filer. The `customer` is an observer on `KYCRequest` because the institution must notify the customer that KYC is being collected — but the institution controls the request lifecycle.

**Controllers** are parties authorized to exercise a specific choice on a contract. A controller does not need to be a stakeholder on the contract they are exercising against, but DAML's `submitMulti` / `readAs` mechanism is required if they need visibility into referenced contracts. In this system, controllers are always stakeholders of the contract they control, preserving the audit trail.

The privacy implications are concrete:

- A customer who submits KYC data (`KYCSubmission`, signed by `customer`) can query their own submission — they are the signatory.
- When the institution flags that submission and files a `SuspiciousActivityReport`, the SAR is created with only `institution` as signatory and `regulator` as observer. The customer's participant node never receives the SAR transaction event.
- When the regulator escalates to a `FreezeOrder`, the customer *becomes* an observer — because the freeze must be disclosed to the subject. This models the legal distinction between the confidential SAR and the enforceable freeze that follows from it.

---

## Parties

Nine distinct parties model the real-world actors in a regulated identity and financial ecosystem:

| Party | Role | Authority Basis |
|---|---|---|
| `IssuingAuthority` | Sovereign government body that issues and revokes digital passports | National legislation; sole signatory on `DigitalPassport` |
| `CivilRegistry` | Government registry that registers births and issues certificates | Civil registration law; co-signatory on `BirthCertificate` |
| `ElectionCommission` | Independent body administering voter registration and elections | Electoral law; sole signatory on `Election`; co-signatory on `VoterRegistration` |
| `FinancialRegulator` | Prudential or AML regulator (analogous to FinCEN, FCA, or equivalent) | BSA / AML statute; observer on SAR, sole signatory on `FreezeOrder` |
| `ContentRegistry` | Intellectual property registry for content authentication | Registry authority; sole signatory on `ContentCertificate` |
| `Institution` | Regulated financial institution with BSA/AML obligations | Licensing; sole signatory on `KYCRequest`, `SuspiciousActivityReport`, `AssetTransfer` |
| `Customer` | Individual or entity subject to KYC and AML obligations | Consent / data subject; co-signatory on `KYCClearance` |
| `Citizen / Holder` | Natural person holding identity documents and voting rights | Civic status; co-signatory on `BirthCertificate`, `DigitalPassport`, `VoterRegistration` |
| `ContentCreator` | Author or owner of authenticated digital content | IP ownership; observer on `ContentCertificate`, controller of licensing |

---

## Security and Compliance

### Regulatory Coverage

| Contract | Regulation | Obligation Satisfied |
|---|---|---|
| `KYCRequest`, `KYCSubmission`, `KYCClearance` | BSA / FinCEN | Customer identification program (CIP); documented KYC data collection and approval |
| `SuspiciousActivityReport` | BSA §5318(g), FinCEN SAR rules | Mandatory SAR filing; tipping-off prohibition enforced by DAML privacy model |
| `FreezeOrder` | OFAC / FinCEN | Regulatory freeze and sanctions enforcement with institution acknowledgement |
| `AssetTransfer`, `TransferRecord` | BSA / FinCEN / MiFID II | KYC-gated transfer execution; immutable compliant transfer audit record |
| `DigitalPassport` | GDPR Art. 5(1)(c) | Data minimization — only the authority and holder are stakeholders |
| `BirthCertificate` | GDPR / civil registration law | Foundational identity record requiring dual authorization for any amendment |
| `ContentCertificate` | GDPR / IP law | Provenance chain; registry as sole signatory enables dispute resolution and ownership transfer |

### Attack Scenarios Prevented by Tests

| Scenario | Test | Mechanism |
|---|---|---|
| Customer self-approves KYC | `testAMLNegativeCases` — `submitMustFail alice ApproveKYC` | `ApproveKYC` controller is `institution`; customer cannot exercise it |
| Third party revokes another customer's clearance | `testAMLNegativeCases` — `submitMustFail bob RevokeClearance` | `RevokeClearance` controller is `institution`; Bob is not a stakeholder |
| Flagged customer executes asset transfer | `testTransferGateBlocked` | `ExecuteTransfer` asserts `clearance.status == Cleared`; Flagged status fails assertion |
| Cross-customer clearance substitution | `testTransferGateBlocked` — Bob's clearance used for Alice's transfer | `ExecuteTransfer` asserts `clearance.customer == sender`; customer mismatch fails |
| Customer reads their own SAR | `testSARFiling` — `queryContractId alice sarCid == None` | Customer is not a stakeholder; Canton does not route transaction events to non-stakeholder nodes |
| Unauthorized passport suspension | `PassportTest` | `Suspend` controller is `authority`; holder cannot suspend their own passport |
| Double voting | `VotingTest` | `CastBallot` asserts `notElem voter voters`; second ballot attempt fails |
| Unauthorized amendment to birth certificate | `BirthCertificateTest` | `ApproveAmendment` controller is `registry`; holder can only request, not approve |

---

## Prerequisites

- **Daml SDK 3.4.x** — install via [DPM](https://docs.digitalasset.com/build/3.4/dpm/dpm.html) or the Daml assistant
- **Node.js 18+** — for the React frontend

Verify your SDK version:

```bash
daml version
# or
dpm --version
```

---

## Running Locally

### Run the Test Suite

```bash
cd digital-identity-canton
daml test
```

Expected output — 26 tests across 6 test files, all passing:

```
Test.AMLTest:testKYCWorkflow               ok
Test.AMLTest:testSARFiling                 ok
Test.AMLTest:testAMLNegativeCases          ok
Test.AMLTest:testTransferGate              ok
Test.AMLTest:testTransferGateBlocked       ok
Test.BirthCertificateTest:...              ok  (3 tests)
Test.ContentAuthTest:...                   ok  (3 tests)
Test.IntegrationTest:...                   ok  (4 tests)
Test.PassportTest:...                      ok  (6 tests)
Test.VotingTest:...                        ok  (4 tests)
```

### Start the Canton Sandbox

```bash
daml start
```

This launches the Canton sandbox and executes the setup script, which pre-allocates all nine parties and creates seed contracts for each module.

### Start the Frontend

```bash
cd ui
npm install
npm run dev
```

The React application runs at `http://localhost:5173` and connects to the Canton JSON API at `http://localhost:7575`. The UI surfaces contract queries per party, reflecting the DAML privacy model — each party sees only the contracts on which they are a stakeholder.

---

## Testing

### What the Privacy Tests Verify

**`testSARFiling`** — This test creates the complete SAR workflow: bank requests KYC, customer provides data, bank flags the submission, regulator escalates to a FreezeOrder. Crucially, it verifies that `queryContractId alice sarCid` returns `None`. This is not an authorization rejection; it is structural absence. The SAR transaction was never delivered to Alice's participant node because she is not a stakeholder. This is the ledger-level enforcement of BSA §5318(g).

**`testAMLNegativeCases`** — Three `submitMustFail` assertions verify the authorization boundary of the KYC approval chain: (1) a customer cannot self-approve their own KYC submission, (2) the subject cannot revoke their own clearance, and (3) a third party cannot revoke another customer's clearance. Each failure is a consequence of DAML's controller model — the choices are locked to the `institution` party.

**`testTransferGateBlocked`** — Two `submitMustFail` assertions verify that the `AssetTransfer.ExecuteTransfer` choice enforces clearance integrity. A flagged clearance (status `Flagged`) is rejected by the assertion `clearance.status == Cleared`. A valid clearance belonging to a different customer is rejected by `clearance.customer == sender`. This models the BSA requirement that asset transfers be gated on current, valid KYC clearance for the specific transferring party.

### Why `submitMustFail` Tests Are Compliance Tests

In a conventional system, access control failures are an application-layer concern — a middleware bug or a misconfigured permission can bypass them. In DAML, `submitMustFail` tests demonstrate that the authorization failure occurs at the **interpreter level**, before any application code executes. The tests in this suite are not just regression tests; they are machine-checkable proofs that the contract's authorization logic cannot be bypassed by any caller.

---

## Repository

**Description:** DAML smart contracts on Canton implementing privacy-preserving digital identity and BSA/AML compliance, with ledger-enforced tipping-off prohibition on Suspicious Activity Reports.

**Topics:** `daml` `canton-network` `digital-identity` `kyc` `aml` `privacy` `compliance` `blockchain` `smart-contracts` `tipping-off-prohibition` `financial-regulation` `bsa` `fincen` `gdpr` `zero-trust`
