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
    ['#141916','#e3e9e5'],
    ['#3d4843','#e3e9e5'],
    ['#3d4843','#f2f6f3'],
    ['#536059','#e3e9e5'],
    ['#536059','#f2f6f3'],
    ['#17594c','#e3e9e5'],
    ['#17594c','#f2f6f3'],
    ['#ffffff','#141916'],
    ['#ffffff','#17594c'],
    ['#ffffff','#b84d14'],
    ['#141916','#f6e6b8'],
    ['#b84d14','#f2f6f3'],
  ]
  for(const [foreground,background] of normalText)assert.ok(contrast(foreground,background)>=4.5,`${foreground} on ${background}`)
  assert.ok(contrast('#7a3b1f','#e3e9e5')>=3,'keyboard focus indicator')
})
test('dark theme text and focus colours retain WCAG contrast targets',()=>{
  const normalText:[string,string][]=[
    ['#eef3ef','#0e1512'],
    ['#c3cec8','#0e1512'],
    ['#c3cec8','#17211d'],
    ['#9aa8a1','#0e1512'],
    ['#9aa8a1','#17211d'],
    ['#9aa8a1','#1e2b26'],
    ['#5cc4a6','#0e1512'],
    ['#5cc4a6','#17211d'],
    ['#5cc4a6','#1e2b26'],
    ['#0e1512','#5cc4a6'],
    ['#0e1512','#eef3ef'],
    ['#ffffff','#123a31'],
    ['#eef3ef','#3b3420'],
    ['#e8834a','#17211d'],
    ['#e8834a','#3a2618'],
    ['#ff8a7a','#17211d'],
    ['#f6e6b8','#0a1a15'],
  ]
  for(const [foreground,background] of normalText)assert.ok(contrast(foreground,background)>=4.5,`${foreground} on ${background}`)
  assert.ok(contrast('#f0a070','#0e1512')>=3,'keyboard focus indicator')
})
