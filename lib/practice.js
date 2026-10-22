// lib/practice.js — canned replies used ONLY when no API key is set (local building).
// The app shows a "PRACTICE MODE" banner whenever these are in use. Never used for the demo.

const LEASE = {
  readable: true,
  is_agreement: true,
  description: 'Residential tenancy agreement',
  type: 'residential_tenancy',
  type_label: 'Rental agreement',
  category: 'housing',
  party_name: 'Drop Tine Properties Ltd.',
  party_role: 'Landlord',
  user_name: 'Alex Morgan',
  agreement_date: '2025-08-15',
  file_purpose: 'residential-lease',
  signed: true,
  term_type: 'fixed',
  term_start: '2025-09-01',
  term_end: '2026-08-31',
  rent_amount: '$1,450.00 per month',
  rent_day: 1,
  rental_address: 'Unit 204, 10123 – 99 Avenue, Grande Prairie, Alberta T8V 0R5',
  other_party_address: null,
  lease_identifiers: 'Agreement No. DT-2025-0417',
  summary: 'A one-year fixed-term lease for Unit 204 at $1,450 a month.',
  key_dates_and_actions: [
    { date: '2026-08-31', action: 'Fixed term ended' },
    { date: 'Monthly on the 1st', action: 'Rent of $1,450 due' },
  ],
  contacts: [
    { name: 'Quan Yuan', organization: 'Drop Tine Properties Ltd.', role: 'Property manager', phone: '587-000-0000', email: 'demotest@notrealemail.com', address: null },
  ],
  message: "[Practice reply] Looks like you've uploaded a rental agreement 🏠 with Drop Tine Properties. This fixed-term tenancy ended on August 31, 2026, about 2 months ago. Are you looking to renew with your landlord?",
  choices: null,
  action: 'ask_renewal',
  explains_rule: false,
};

const MORTGAGE = {
  readable: true,
  is_agreement: true,
  description: 'Residential mortgage agreement',
  type: 'mortgage',
  type_label: 'Mortgage agreement',
  category: 'housing',
  party_name: 'Aurora Hearth Mortgage Corp.',
  party_role: 'Lender',
  user_name: 'Alex Morgan and Sam Morgan',
  agreement_date: '2025-10-08',
  file_purpose: 'mortgage',
  signed: true,
  term_type: 'fixed',
  term_start: '2025-10-15',
  term_end: '2030-10-15',
  rent_amount: null,
  rent_day: null,
  rental_address: '4812 – 37 Street, Grande Prairie, Alberta T8W 1C4',
  other_party_address: 'Suite 900, 4400 Gateway Boulevard NW, Edmonton, Alberta T6H 0A1',
  lease_identifiers: 'Mortgage No. AHM-77-30215',
  summary: 'A 5-year fixed-rate mortgage of $385,000 at 4.79%.',
  key_dates_and_actions: [
    { date: 'Monthly on the 15th', action: 'Mortgage payment of $2,186.40' },
    { date: 'Every year by July 31', action: 'Send proof of property tax payment' },
    { date: 'Every year by October 15', action: 'Send proof of home insurance' },
    { date: '2030-10-15', action: 'Term ends: renewal offer at least 21 days before' },
  ],
  contacts: [
    { name: 'Priya Raman', organization: 'Aurora Hearth Mortgage Corp.', role: 'Mortgage specialist', phone: '1-800-555-0177', email: 'priya.raman@aurorahearth.example', address: 'Suite 900, 4400 Gateway Boulevard NW, Edmonton, Alberta T6H 0A1' },
  ],
  message: "[Practice reply] This looks like a signed mortgage agreement with Aurora Hearth Mortgage Corp. I've noted the following dates and actions from the document. Would you like to store it or review it?",
  choices: null,
  action: 'store_or_review',
  explains_rule: false,
};

export function practiceRead(files) {
  const name = (files && files[0] && files[0].name || '').toLowerCase();
  return name.includes('mortgage') ? MORTGAGE : LEASE;
}
