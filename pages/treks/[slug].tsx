import type { GetServerSideProps } from 'next'
import { getContent } from '../../lib/content'
import { upcomingTreks } from '../../lib/content-schema'
export { default } from '../../components/TrekDetail'
export const getServerSideProps:GetServerSideProps=async({params})=>{const {content,contentUnavailable}=await getContent();const trek=!contentUnavailable&&upcomingTreks(content.treks).find(t=>t.slug===params?.slug);return trek?{props:{trek}}:{notFound:true}}
