import type { GetStaticPaths, GetStaticProps } from 'next'
import { getStaticContent } from '../../lib/content'
import type { SiteContent } from '../../lib/content-schema'
import Seo from '../../components/Seo'
import { PageIntro } from '../../components/Shared'
import { formatDate } from '../../lib/site'
type Report=SiteContent['impactReports'][number]
export const getStaticPaths:GetStaticPaths=async()=>({paths:[],fallback:'blocking'})
export const getStaticProps:GetStaticProps=async({params})=>{const {props:{content},revalidate}=await getStaticContent();const report=content.impactReports.find(r=>r.slug===params?.slug);return report?{props:{report},revalidate}:{notFound:true,revalidate}}
export default function Impact({report}:{report:Report}){return <><Seo title={report.title}/><PageIntro eyebrow={`VERIFIED REPORT · ${formatDate(report.date)}`} title={report.title}>{report.location}</PageIntro><article className="container prose"><h2>Method and evidence</h2><p>{report.methodology}</p><h2>Outcomes</h2><p>{report.outcomes}</p><h2>Limitations</h2><p>{report.limitations}</p><h2>What happens next</h2><p>{report.nextSteps}</p></article></>}
