import Seo from '../components/Seo'
import { ButtonLink } from '../components/Shared'
import Icon from '../components/Icon'
export default function NotFound(){return <><Seo title="Page not found"/><section className="container section-space"><div className="empty-state"><Icon name="compass" size={70}/><span className="eyebrow">A SMALL DETOUR</span><h1>This trail doesn’t lead anywhere.</h1><p style={{marginTop:20}}>The page may have moved, or this trek isn’t published yet.</p><ButtonLink href="/">Head back home</ButtonLink></div></section></>}
