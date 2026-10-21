import { Html, Head, Main, NextScript } from 'next/document'
import { phaseBootScript } from '../lib/phase'
import { themeBootScript } from '../lib/theme'
export default function Document(){return <Html lang="en-IN"><Head><script dangerouslySetInnerHTML={{__html:`${phaseBootScript};${themeBootScript}`}}/></Head><body><Main/><NextScript/></body></Html>}
