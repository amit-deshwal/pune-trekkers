// One spelling per district for hike labels. Renamed districts keep the old name in brackets so searches for either match.
const variants: Record<string, string> = {
  ahmednagar: 'Ahilyanagar (Ahmednagar)', ahmadnagar: 'Ahilyanagar (Ahmednagar)', nagar: 'Ahilyanagar (Ahmednagar)', ahilyanagar: 'Ahilyanagar (Ahmednagar)',
  csambhajinagar: 'Chhatrapati Sambhajinagar (Aurangabad)', chhatrapatisambhajinagar: 'Chhatrapati Sambhajinagar (Aurangabad)', aurangabad: 'Chhatrapati Sambhajinagar (Aurangabad)',
  usmanabad: 'Dharashiv (Osmanabad)', osmanabad: 'Dharashiv (Osmanabad)', dharashiv: 'Dharashiv (Osmanabad)',
  kolhaapur: 'Kolhapur', nahsik: 'Nashik', sindhudurga: 'Sindhudurg',
}

// Maharashtra's 36 districts (Mumbai City and Mumbai Suburban as "Mumbai"), after the renames above.
const districts = new Set(['Ahilyanagar (Ahmednagar)', 'Akola', 'Amravati', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Chhatrapati Sambhajinagar (Aurangabad)', 'Dharashiv (Osmanabad)', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'])
export const isDistrict = (raw?: string | null) => districts.has(districtName(raw) ?? '')

export function districtName(raw?: string | null) {
  const name = raw?.trim()
  if (!name) return null
  return variants[name.toLowerCase().replace(/[^a-z]/g, '')] ?? name
}

// The label shown for a hike: "Pune district", or "Maval · Pune district" when a curated override names the taluka.
export const districtLabel = (raw?: string | null) => { const name = districtName(raw); return name ? `${name} district` : null }
