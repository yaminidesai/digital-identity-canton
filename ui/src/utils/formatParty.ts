/** Strip the Canton ::1220... cryptographic suffix from party IDs */
export function formatPartyId(party: string): string {
  const idx = party.indexOf('::');
  return idx > 0 ? party.substring(0, idx) : party;
}
