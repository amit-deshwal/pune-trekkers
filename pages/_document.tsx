import { Html, Head, Main, NextScript } from 'next/document'
import { phaseBootScript } from '../lib/phase'
export default function Document(){return <Html lang="en-IN"><Head><script dangerouslySetInnerHTML={{__html:phaseBootScript}}/></Head><body><Main/><NextScript/></body></Html>}
