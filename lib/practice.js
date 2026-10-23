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
  user_name: 'Ballerina Cappucina',
  agreement_date: '2025-08-15',
  file_purpose: 'residential-lease',
  signed: true,
  term_type: 'fixed',
  term_start: '2025-09-01',
  term_end: '2026-08-31',
  rent_amount: '$1,450.00 per month',
  rent_day: 1,
  rental_address: 'Unit 204, 123 Sample Street, Grande Prairie, Alberta TXX 0ZZ',
  jurisdiction: 'Alberta, Canada',
  other_party_address: null,
  lease_identifiers: 'Agreement No. DT-2025-0417',
  summary: 'A one-year fixed-term lease for Unit 204 at $1,450 a month.',
  key_dates_and_actions: [
    { date: '2026-08-31', action: 'Fixed term ended' },
    { date: 'Monthly on the 1st', action: 'Rent of $1,450 due' },
  ],
  contacts: [
    { name: 'Quan Yuan', organization: 'Drop Tine Properties Ltd.', role: 'Property manager', phone: '587-000-0000', email: 'demotest@droptine.example', address: null },
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
  party_name: 'Roulette Interest Rate Mortgage Corp.',
  party_role: 'Lender',
  user_name: 'Ballerina Cappucina',
  agreement_date: '2025-10-08',
  file_purpose: 'mortgage',
  signed: true,
  term_type: 'fixed',
  term_start: '2025-10-15',
  term_end: '2030-10-15',
  rent_amount: null,
  rent_day: null,
  rental_address: '00000 Range Road 00, County of Grande Prairie No. 1, Alberta TXX 0ZZ',
  jurisdiction: 'Alberta, Canada',
  other_party_address: 'Suite 000, 456 Example Boulevard NW, Edmonton, Alberta TXX 0ZZ',
  lease_identifiers: 'Mortgage No. RIR-77-30215',
  summary: 'A 5-year fixed-rate mortgage of $385,000 at 4.79%.',
  key_dates_and_actions: [
    { date: 'Monthly on the 15th', action: 'Mortgage payment of $2,186.40' },
    { date: 'Every year by July 31', action: 'Send proof of property tax payment' },
    { date: 'Every year by October 15', action: 'Send proof of home insurance' },
    { date: '2030-10-15', action: 'Term ends: renewal offer at least 21 days before' },
  ],
  contacts: [
    { name: 'Squidward Tentacles', organization: 'Roulette Interest Rate Mortgage Corp.', role: 'Mortgage specialist', phone: '1-800-000-0000', email: 'latepayments@rouletteinterest.example', address: 'Suite 000, 456 Example Boulevard NW, Edmonton, Alberta TXX 0ZZ' },
  ],
  is_new_home_purchase: true,
  celebration_post: "🏡🔑 I bought a house! All the paperwork is signed and it's officially mine. Stay tuned for housewarming party details 🥂🎉 #NewHome",
  message: "[Practice reply] This looks like a signed mortgage agreement with Roulette Interest Rate Mortgage Corp. I've noted the following dates and actions from the document. Would you like to store it or review it?",
  choices: null,
  action: 'store_or_review',
  explains_rule: false,
};

const NOT_AGREEMENT = {
  readable: true,
  is_agreement: false,
  description: 'a grocery receipt',
  message: "[Practice reply] The document you've uploaded looks like a grocery receipt. Would you like to continue to store this document?",
  action: 'store_prompt',
};

export function practiceRead(files) {
  const name = (files && files[0] && files[0].name || '').toLowerCase();
  if (name.includes('mortgage')) return MORTGAGE;
  if (name.includes('receipt') || name.includes('photo')) return NOT_AGREEMENT;
  return LEASE;
}

export function practiceChat(body) {
  const m = String(body.message || '').toLowerCase();
  if (body.facts && /move|not renew|leav|no\b/.test(m)) {
    return {
      message: "[Practice reply] Got it 📦 Under Alberta's Residential Tenancies Act: since you've stayed on past August 31, your lease is now month-to-month. In Alberta, you need to give your landlord one full tenancy month's notice in writing, with the rental address, the date you'll move out, and your signature. You don't have to give a reason. Would you like me to draft the notice?",
      choices: ['Yes, draft it', 'No thanks'],
      action: 'offer_draft',
      intent: 'move_out',
      explains_rule: true,
    };
  }
  return {
    message: '[Practice reply] Good question! In practice mode I can only give canned answers. With the AI connected, I\'d answer this in plain language using your agreements.',
    choices: null,
    action: 'none',
    intent: 'question',
    explains_rule: false,
  };
}
