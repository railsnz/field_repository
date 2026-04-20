import { Field, Option } from '@/types'
import { randomUUID } from 'crypto'

const SEED_FIELDS: (Omit<Field, 'id' | 'createdAt'> & { description?: string })[] = [
  { name: 'Matter Jurisdiction', type: 'Lookup', hint: 'Select the governing jurisdiction for this matter', description: "Court's authority to hear and decide a specific type", placeholder: '', defaultOption: '' },
  { name: 'Claims', type: 'Lookup', hint: 'What are the claims in this litigation', description: '', placeholder: '', defaultOption: '' },
  { name: 'Communication Channels', type: 'Lookup (multi)', hint: '', description: '', placeholder: '', defaultOption: '' },
  { name: 'Counterparties', type: 'Lookup (multi)', hint: '', description: '', placeholder: '', defaultOption: '' },
  { name: 'External Legal Services Providers (LSP)', type: 'Lookup (multi)', hint: 'Add the name(s) of LSP for this matter', description: '', placeholder: '', defaultOption: '' },
  { name: 'Firm Name', type: 'Lookup', hint: '', description: '', placeholder: '', defaultOption: '' },
  { name: 'Governing law', type: 'Lookup', hint: 'Start typing to add, or leave blank if same country', description: '', placeholder: '', defaultOption: '' },
  { name: 'HQ Location', type: 'Lookup', hint: '', description: '', placeholder: '', defaultOption: '' },
  { name: 'Industry Category', type: 'Lookup', hint: '', description: '', placeholder: '', defaultOption: '' },
  { name: 'Board Members', type: 'Lookup (multi)', hint: 'Multi Selection', description: '', placeholder: '', defaultOption: '' },
]

const BASE_OPTION_LABELS = [
  // Australia
  'Australia — New South Wales',
  'Australia — Victoria',
  'Australia — Queensland',
  'Australia — Western Australia',
  'Australia — South Australia',
  'Australia — Tasmania',
  'Australia — Northern Territory',
  'Australia — Australian Capital Territory',

  // New Zealand
  'New Zealand',

  // United Kingdom
  'United Kingdom — England & Wales',
  'United Kingdom — Scotland',
  'United Kingdom — Northern Ireland',

  // United States
  'United States — Alabama',
  'United States — Alaska',
  'United States — Arizona',
  'United States — Arkansas',
  'United States — California',
  'United States — Colorado',
  'United States — Connecticut',
  'United States — Delaware',
  'United States — Florida',
  'United States — Georgia',
  'United States — Hawaii',
  'United States — Idaho',
  'United States — Illinois',
  'United States — Indiana',
  'United States — Iowa',
  'United States — Kansas',
  'United States — Kentucky',
  'United States — Louisiana',
  'United States — Maine',
  'United States — Maryland',
  'United States — Massachusetts',
  'United States — Michigan',
  'United States — Minnesota',
  'United States — Mississippi',
  'United States — Missouri',
  'United States — Montana',
  'United States — Nebraska',
  'United States — Nevada',
  'United States — New Hampshire',
  'United States — New Jersey',
  'United States — New Mexico',
  'United States — New York',
  'United States — North Carolina',
  'United States — North Dakota',
  'United States — Ohio',
  'United States — Oklahoma',
  'United States — Oregon',
  'United States — Pennsylvania',
  'United States — Rhode Island',
  'United States — South Carolina',
  'United States — South Dakota',
  'United States — Tennessee',
  'United States — Texas',
  'United States — Utah',
  'United States — Vermont',
  'United States — Virginia',
  'United States — Washington',
  'United States — West Virginia',
  'United States — Wisconsin',
  'United States — Wyoming',
  'United States — District of Columbia',

  // Canada
  'Canada — Ontario',
  'Canada — British Columbia',
  'Canada — Quebec',
  'Canada — Alberta',
  'Canada — Manitoba',
  'Canada — Saskatchewan',
  'Canada — Nova Scotia',
  'Canada — New Brunswick',
  'Canada — Newfoundland and Labrador',
  'Canada — Prince Edward Island',
  'Canada — Northwest Territories',
  'Canada — Nunavut',
  'Canada — Yukon',

  // Asia-Pacific
  'Singapore',
  'Hong Kong',
  'Japan',
  'South Korea',
  'China — Mainland',
  'China — Hong Kong SAR',
  'China — Macau SAR',
  'Taiwan',
  'India',
  'India — Maharashtra',
  'India — Karnataka',
  'India — Delhi',
  'India — Tamil Nadu',
  'Indonesia',
  'Malaysia',
  'Philippines',
  'Thailand',
  'Vietnam',
  'Bangladesh',
  'Pakistan',
  'Sri Lanka',
  'Myanmar',
  'Cambodia',
  'Laos',
  'Brunei',
  'Papua New Guinea',
  'Fiji',

  // Europe
  'Germany',
  'France',
  'Netherlands',
  'Switzerland',
  'Ireland',
  'Luxembourg',
  'Sweden',
  'Denmark',
  'Norway',
  'Finland',
  'Spain',
  'Italy',
  'Portugal',
  'Belgium',
  'Austria',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Romania',
  'Bulgaria',
  'Croatia',
  'Slovakia',
  'Slovenia',
  'Estonia',
  'Latvia',
  'Lithuania',
  'Greece',
  'Cyprus',
  'Malta',
  'Iceland',
  'Liechtenstein',
  'Monaco',
  'Andorra',
  'San Marino',

  // Middle East & Africa
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Jordan',
  'Israel',
  'Turkey',
  'Egypt',
  'South Africa',
  'Nigeria',
  'Kenya',
  'Ghana',
  'Morocco',
  'Tunisia',
  'Ethiopia',
  'Tanzania',
  'Rwanda',
  'Mauritius',
  'Seychelles',

  // Americas
  'Brazil',
  'Mexico',
  'Argentina',
  'Chile',
  'Colombia',
  'Peru',
  'Venezuela',
  'Ecuador',
  'Bolivia',
  'Paraguay',
  'Uruguay',
  'Panama',
  'Costa Rica',
  'Jamaica',
  'Trinidad and Tobago',
  'Bermuda',
  'Cayman Islands',
  'British Virgin Islands',

  // Special
  'International / Multi-jurisdiction',
  'Other',
]

function makeOptions(): Option[] {
  return BASE_OPTION_LABELS.map((label, i) => ({ id: randomUUID(), label, order: i }))
}

function makeField(seed: typeof SEED_FIELDS[0], index: number): Field {
  return {
    id: randomUUID(),
    name: seed.name,
    type: seed.type,
    hint: seed.hint,
    description: seed.description ?? '',
    placeholder: seed.placeholder ?? '',
    defaultOption: seed.defaultOption ?? '',
    createdAt: Date.now() - (SEED_FIELDS.length - index) * 1000,
  }
}

// Module-level in-memory store — persists within the Node.js process lifetime
let fields: Field[] = SEED_FIELDS.map((s, i) => makeField(s, i))
const optionsByField = new Map<string, Option[]>()
// Only Matter Jurisdiction (index 0) gets the full options list seeded
fields.forEach((f, i) => optionsByField.set(f.id, i === 0 ? makeOptions() : []))

export const store = {
  getFields(): Field[] {
    return [...fields]
  },

  getField(id: string): Field | undefined {
    return fields.find(f => f.id === id)
  },

  createField(data: { name: string; type: string; hint?: string; description?: string; placeholder?: string }): Field {
    const field: Field = {
      id: randomUUID(),
      name: data.name,
      type: data.type,
      hint: data.hint ?? '',
      description: data.description ?? '',
      placeholder: data.placeholder ?? '',
      defaultOption: '',
      createdAt: Date.now(),
    }
    fields.unshift(field)
    optionsByField.set(field.id, [])
    return field
  },

  updateField(id: string, updates: Partial<Omit<Field, 'id' | 'createdAt'>>): Field | undefined {
    const idx = fields.findIndex(f => f.id === id)
    if (idx === -1) return undefined
    fields[idx] = { ...fields[idx], ...updates }
    return fields[idx]
  },

  deleteField(id: string): boolean {
    const before = fields.length
    fields = fields.filter(f => f.id !== id)
    optionsByField.delete(id)
    return fields.length < before
  },

  getOptions(fieldId: string): Option[] {
    return [...(optionsByField.get(fieldId) ?? [])]
  },

  addOption(fieldId: string, label: string): Option[] {
    const opts = optionsByField.get(fieldId) ?? []
    const newOpt: Option = { id: randomUUID(), label, order: 0 }
    // Prepend: shift all existing orders up
    const updated = [newOpt, ...opts].map((o, i) => ({ ...o, order: i }))
    optionsByField.set(fieldId, updated)
    return [...updated]
  },

  bulkUpdateOptions(fieldId: string, opts: Option[]): Option[] {
    const reordered = opts.map((o, i) => ({ ...o, order: i }))
    optionsByField.set(fieldId, reordered)
    return [...reordered]
  },

  updateOption(fieldId: string, optId: string, label: string): Option | undefined {
    const opts = optionsByField.get(fieldId)
    if (!opts) return undefined
    const opt = opts.find(o => o.id === optId)
    if (!opt) return undefined
    opt.label = label
    return { ...opt }
  },

  deleteOption(fieldId: string, optId: string): Option[] {
    const opts = optionsByField.get(fieldId) ?? []
    const updated = opts.filter(o => o.id !== optId).map((o, i) => ({ ...o, order: i }))
    optionsByField.set(fieldId, updated)
    return [...updated]
  },

  mergeOptions(fieldId: string, sourceId: string, _targetId: string): Option[] {
    return this.deleteOption(fieldId, sourceId)
  },
}
