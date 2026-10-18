// Single source of truth for the roles shown on /volunteer and accepted by the application form.
export const volunteerRoles = [
  { id: 'trek-writer', title: 'Trek post writer', body: 'Write a short report after each trek: the route, the highlights and tips for the next group.' },
  { id: 'cinematographer', title: 'Trek cinematographer / photographer', body: 'Shoot on the trail, respect no-photo requests, and share the footage for the site and Instagram.' },
  { id: 'instagram', title: 'Instagram handler', body: 'Post, reply and keep @punetrekkersofficial active, working from the writers’ and photographers’ material.' },
  { id: 'reddit', title: 'Reddit handler', body: 'Share trek reports and answer questions in r/pune, r/trekking and similar communities, openly and without spam.' },
  { id: 'trek-lead', title: 'Trek lead', body: 'Plan and lead treks. Needs real trail experience, and every lead is approved by the admins.' },
  { id: 'sweeper', title: 'Sweeper', body: 'Walk at the back so nobody is left behind. Needs trail experience, and every sweeper is approved by the admins.' },
  { id: 'first-aid', title: 'First-aid support', body: 'For members with a current first-aid or medical qualification who can support a group on the trail.' },
  { id: 'other', title: 'Something else', body: 'Drone, video editing, local history or geology, medical, or a skill we haven’t thought of.' },
] as const
export type VolunteerRoleId = (typeof volunteerRoles)[number]['id']
export const volunteerRoleIds = volunteerRoles.map(role => role.id) as [VolunteerRoleId, ...VolunteerRoleId[]]
export const roleTitle = (id: string) => volunteerRoles.find(role => role.id === id)?.title ?? id
