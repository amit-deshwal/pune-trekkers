import type { GetStaticPaths, GetStaticProps } from 'next'
import { getStaticContent } from '../../lib/content'
import { upcomingTreks } from '../../lib/upcoming-treks'
import { guideForTrek } from '../../lib/maharashtra-explorer'
export { default } from '../../components/TrekDetail'
// Trek pages are built on first visit, then refreshed like the other content pages.
export const getStaticPaths:GetStaticPaths=async()=>({paths:[],fallback:'blocking'})
// Once a trek is over its page would 404 and lose any search ranking it earned, so send it on instead: finished treks
// to the fort guide (or the archive) for good; cancelled or not-yet-archived ones to the upcoming list for now.
export const getStaticProps:GetStaticProps=async({params})=>{const {props:{content,contentUnavailable},revalidate}=await getStaticContent();if(contentUnavailable)return {notFound:true,revalidate}
  const trek=upcomingTreks(content.treks).find(t=>t.slug===params?.slug);if(trek)return {props:{trek},revalidate}
  const old=content.treks.find(t=>t.slug===params?.slug);if(!old)return {notFound:true,revalidate}
  const guide=old.status==='completed'&&guideForTrek(old)
  return {redirect:old.status==='completed'?{destination:guide?`/treks-near-pune/${guide.slug}`:'/past-treks',permanent:true}:{destination:'/treks',permanent:false},revalidate}}
