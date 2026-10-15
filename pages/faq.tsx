import Seo from '../components/Seo'
import { PageIntro, FAQList, JoinBanner, faqs } from '../components/Shared'
import { faqJsonLd } from '../lib/seo'
export default function FAQ(){return <><Seo title="FAQ: cost, beginners, women & solo trekkers" description="Is Pune Trekkers free? How much does a trek cost, can beginners, women and solo trekkers join, and how do you get into the WhatsApp group? Honest answers." jsonLd={faqJsonLd(faqs)}/><PageIntro eyebrow="A LITTLE CLARITY BEFORE YOU GO" title="Good questions. Honest answers.">From your first introduction to your first trek—here are a few things to know.</PageIntro><section className="container prose"><FAQList/></section><JoinBanner/></>}
