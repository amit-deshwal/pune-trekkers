import Link from 'next/link'
import type { GetStaticProps } from 'next'
import Seo from '../../components/Seo'
import { PageIntro, Note, ButtonLink } from '../../components/Shared'
import { listApprovedPlans, type PublicPlan } from '../../lib/member-plans'
import MemberPlanCard from '../../components/MemberPlanCard'

export const getStaticProps: GetStaticProps<{ plans: PublicPlan[] }> = async () => {
  let plans: PublicPlan[] = []
  try { plans = await listApprovedPlans() } catch { /* Supabase not configured yet: show the empty state */ }
  return { props: { plans }, revalidate: 60 }
}

export default function Plans({ plans }: { plans: PublicPlan[] }) {
  return <>
    <Seo title="Hikes planned by members" description="Hikes planned by Pune Trekkers members. Going out on your own? Share your plan and find company. Every plan is reviewed by an admin first."/>
    <PageIntro eyebrow="MEMBER HIKES" title="Heading out? Find company.">Members share their own hike plans here. See one you like, message the organiser and go together.</PageIntro>
    <section className="container listing-section">
      <Note>These are <strong>member-organised</strong> hikes, not official Pune Trekkers treks. Check the route, meet in a public place and tell someone where you are going. Every plan is reviewed by an admin before it appears.</Note>
      <div className="inline-actions" style={{ margin: '24px 0' }}><ButtonLink href="/plans/new">Share your hike plan</ButtonLink></div>
      {plans.length === 0
        ? <div className="empty-state"><h2>No member hikes yet.</h2><p>Be the first to share a plan. It only takes a minute, and an admin will review it before it goes live.</p></div>
        : <div className="card-grid">{plans.map(plan => <MemberPlanCard key={plan.id} plan={plan}/>)}</div>}
      <p className="small" style={{ marginTop: 28 }}>Looking for official, organiser-confirmed treks instead? See <Link href="/treks" className="text-link">upcoming treks</Link>.</p>
    </section>
  </>
}
