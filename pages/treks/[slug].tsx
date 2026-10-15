import type { GetServerSideProps } from 'next'
import { getCachedContent } from '../../lib/content'
import { upcomingTreks } from '../../lib/content-schema'
export { default } from '../../components/TrekDetail'
export const getServerSideProps:GetServerSideProps=async({params,res})=>{const {content,contentUnavailable}=await getCachedContent(res);const trek=!contentUnavailable&&upcomingTreks(content.treks).find(t=>t.slug===params?.slug);return trek?{props:{trek}}:{notFound:true}}
