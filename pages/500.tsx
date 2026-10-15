import Seo from '../components/Seo'
import { ButtonLink } from '../components/Shared'
export default function ErrorPage(){return <><Seo title="Something went wrong" noindex/><section className="container section-space"><div className="empty-state"><h1>A pause on the trail.</h1><p style={{marginTop:20}}>We couldn’t load this page. Please try again in a little while.</p><ButtonLink href="/">Back to home</ButtonLink></div></section></>}
