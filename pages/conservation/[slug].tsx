import type { GetServerSideProps } from 'next'
import { getContent } from '../../lib/content'
import type { SiteContent } from '../../lib/content-schema'
import Seo from '../../components/Seo'
import { PageIntro } from '../../components/Shared'
import { formatDate } from '../../lib/site'
type Report=SiteContent['impactReports'][number]
export const getServerSideProps:GetServerSideProps=async({params})=>{const {content}=await getContent();const report=content.impactReports.find(r=>r.slug===params?.slug);return report?{props:{report}}:{notFound:true}}
export default function Impact({report}:{report:Report}){return <><Seo title={report.title}/><PageIntro eyebrow={`VERIFIED REPORT · ${formatDate(report.date)}`} title={report.title}>{report.location}</PageIntro><article className="container prose"><h2>Method and evidence</h2><p>{report.methodology}</p><h2>Outcomes</h2><p>{report.outcomes}</p><h2>Limitations</h2><p>{report.limitations}</p><h2>What happens next</h2><p>{report.nextSteps}</p></article></>}
