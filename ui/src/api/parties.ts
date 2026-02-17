import { API_BASE } from '../config';

export interface PartyDetails {
  party: string;
  displayName: string;
  isLocal: boolean;
}

export interface UserDetails {
  id: string;
  primaryParty: string;
}

export async function listParties(): Promise<PartyDetails[]> {
  const res = await fetch(`${API_BASE}/parties`);
  if (!res.ok) throw new Error(`Failed to list parties: ${res.status}`);
  const data = await res.json();
  return data.partyDetails || [];
}

export async function allocateParty(
  displayName: string,
  partyIdHint: string,
): Promise<PartyDetails> {
  const res = await fetch(`${API_BASE}/parties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partyIdHint,
      displayName,
      localMetadata: { annotations: {}, resourceVersion: '' },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to allocate party: ${text}`);
  }
  return res.json();
}

export async function createUser(
  userId: string,
  partyId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: {
        id: userId,
        primaryParty: partyId,
        metadata: { annotations: {}, resourceVersion: '' },
      },
      rights: [
        { CanActAs: { party: partyId } },
        { CanReadAs: { party: partyId } },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (!text.includes('USER_ALREADY_EXISTS')) {
      throw new Error(`Failed to create user: ${text}`);
    }
  }
}

export async function listUsers(): Promise<UserDetails[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error(`Failed to list users: ${res.status}`);
  const data = await res.json();
  return (data.users || []).map((u: { user: { id: string; primaryParty: string } }) => ({
    id: u.user.id,
    primaryParty: u.user.primaryParty,
  }));
}
