import type { GetStaticPaths, GetStaticProps } from 'next'
import { getStaticContent } from '../../lib/content'
import { upcomingTreks } from '../../lib/content-schema'
export { default } from '../../components/TrekDetail'
// Trek pages are built on first visit, then refreshed like the other content pages.
export const getStaticPaths:GetStaticPaths=async()=>({paths:[],fallback:'blocking'})
export const getStaticProps:GetStaticProps=async({params})=>{const {props:{content,contentUnavailable},revalidate}=await getStaticContent();const trek=!contentUnavailable&&upcomingTreks(content.treks).find(t=>t.slug===params?.slug);return trek?{props:{trek},revalidate}:{notFound:true,revalidate}}
