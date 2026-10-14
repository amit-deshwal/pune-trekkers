import type { GetServerSideProps } from 'next'
import { getContent } from '../../lib/content'
export { default } from '../../components/TrekDetail'
export const getServerSideProps:GetServerSideProps=async({params})=>{const {content,preview}=await getContent();const trek=content.treks.find(t=>t.slug===params?.slug&&t.status==='completed');return trek?{props:{trek,preview}}:{notFound:true}}
