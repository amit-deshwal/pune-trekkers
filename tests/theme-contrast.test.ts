import { test } from 'node:test'
import assert from 'node:assert/strict'

function luminance(hex:string){
  const rgb=hex.slice(1).match(/.{2}/g)!.map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4)
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]
}
function contrast(foreground:string,background:string){
  const [light,dark]=[luminance(foreground),luminance(background)].sort((a,b)=>b-a)
  return (light+.05)/(dark+.05)
}
test('theme text and focus colours retain WCAG contrast targets',()=>{
  const normalText:[string,string][]=[
    ['#465346','#f8f7f2'],
    ['#456045','#f8f7f2'],
    ['#4b554d','#f0f0e8'],
    ['#7a4628','#fffaf3'],
    ['#873e21','#f3e7d9'],
    ['#ffffff','#173222'],
    ['#f1f4ea','#173222'],
    ['#253c2e','#f3c48f'],
  ]
  for(const [foreground,background] of normalText)assert.ok(contrast(foreground,background)>=4.5,`${foreground} on ${background}`)
  assert.ok(contrast('#7a3b1f','#f8f7f2')>=3,'keyboard focus indicator')
})
