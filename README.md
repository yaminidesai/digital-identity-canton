# Digital Identity on Canton

A digital identity management system built with **Daml 3.x** smart contracts on the **Canton** ledger, featuring six interconnected modules and a React frontend.

## Modules

| Module | Template | Description |
|--------|----------|-------------|
| **Identity** | `Roles`, `Types` | Shared party roles (IssuingAuthority, CivilRegistry, ElectionCommission, etc.) and common data types |
| **Civil** | `BirthCertificate` | Birth registration requests, certificate issuance, and amendments |
| **Passport** | `Passport`, `Verification` | Passport lifecycle — request, approval, renewal, revocation, and selective disclosure |
| **Voting** | `Voting` | Voter registration, elections, ballot casting with double-vote prevention, and result publishing |
| **AML** | `Compliance` | KYC requests, data submission, clearance approval, and suspicious activity reports |
| **Content** | `ContentAuth` | Content registration, licensing, ownership transfer, and dispute resolution |

## Project Structure

```
digital-identity-canton/
├── daml.yaml                  # Daml project config (SDK 3.4.10)
├── daml/
│   ├── Identity/              # Shared roles and types
│   ├── Civil/                 # Birth certificate workflows
│   ├── Passport/              # Passport lifecycle
│   ├── Voting/                # Elections and voter registration
│   ├── AML/                   # KYC/AML compliance
│   ├── Content/               # Content authentication
│   └── Test/                  # 24 tests across 6 test files
└── ui/                        # React + Vite + Tailwind frontend
```

## Prerequisites

- [Daml SDK 3.4.x](https://docs.digitalasset.com/build/3.4/getting-started) (or [DPM](https://docs.digitalasset.com/build/3.4/dpm/dpm.html))
- Node.js 18+ (for the UI)

## Quick Start

### Run Tests

```bash
daml test
```

All 24 tests should pass across 6 test files:
- `AMLTest` (3 tests)
- `BirthCertificateTest` (3 tests)
- `ContentAuthTest` (3 tests)
- `IntegrationTest` (4 tests)
- `PassportTest` (6 tests)
- `VotingTest` (4 tests)

### Start the Ledger

```bash
daml start
```

This launches the Canton sandbox with the setup script that pre-populates parties, authorities, and sample contracts.

### Start the UI

```bash
cd ui
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and connects to the Canton JSON API.

## Test Coverage

- **27/27** templates created (100%)
- **29/78** template choices exercised (37.2%)
- Integration tests cover cross-module workflows: birth cert to passport, identity to voter registration, and identity to KYC

## Architecture

All contracts use **ContractId-based lookups** (contract keys are not supported in Daml 3.x). Authorization follows the stakeholder model — parties must be signatories or observers to see contracts, and `archive` requires all signatories.

Key design patterns:
- **Request/Approve workflows** for identity documents and registrations
- **Consuming choices** for state transitions (e.g., `CastBallot` recreates the election with an updated voter list)
- **Role-based authority templates** that gate administrative actions per jurisdiction
