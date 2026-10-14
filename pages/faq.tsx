import Seo from '../components/Seo'
import { PageIntro, FAQList, JoinBanner } from '../components/Shared'
export default function FAQ(){return <><Seo title="Frequently asked questions"/><PageIntro eyebrow="A LITTLE CLARITY BEFORE YOU GO" title="Good questions. Honest answers.">From your first introduction to your first trek—here are a few things to know.</PageIntro><section className="container prose"><FAQList/></section><JoinBanner/></>}
