import Icon from './Icon'
import { formatDate, formatTime } from '../lib/site'
import type { PublicPlan } from '../lib/member-plans'

export default function MemberPlanCard({ plan }: { plan: PublicPlan }) {
  return <article className="trek-card" id={`plan-${plan.id}`}>
    <div className="card-body">
      <span className="status-chip">{plan.difficulty.toUpperCase()} · MEMBER HIKE</span>
      <span className="card-meta"><Icon name="pin" size={14}/>{plan.destination}</span>
      <h3>{formatDate(plan.date)}{plan.startTime ? ` · ${formatTime(plan.startTime)}` : ''}</h3>
      <p>{plan.summary}</p>
      {plan.meetingPoint && <p className="small"><strong>Meeting point:</strong> {plan.meetingPoint}</p>}
      <div className="card-bottom"><span>Posted by {plan.name}{plan.maxPeople ? ` · up to ${plan.maxPeople} people` : ''}</span></div>
      <a className="button" href={`/api/plans/chat/${plan.id}`} target="_blank" rel="nofollow noopener noreferrer">Message {plan.name} on WhatsApp <Icon name="chat" size={17}/></a>
    </div>
  </article>
}
