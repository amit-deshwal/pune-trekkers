import { useEffect, useRef, useState, type ReactNode } from 'react'
import Icon from './Icon'
import { formatDate } from '../lib/site'
import { realText, type Place } from '../lib/places'
import type { Trek } from '../lib/content-schema'
import { mediaSrc, mediaSrcSet } from '../lib/media'

type Media = {id:string;kind:'photo'|'video';src:string;alt:string;caption:string;credit:string}

export function tripMedia(trek:Trek):Media[] {
  return [
    ...trek.photos.map(p=>({id:p.id,kind:'photo' as const,src:p.src,alt:p.alt,caption:p.caption,credit:p.credit})),
    ...trek.videos.map(v=>({id:v.id,kind:'video' as const,src:v.src,alt:v.caption||`Video from ${trek.name}`,caption:v.caption,credit:''})),
  ]
}

export default function TripModal({place,open,onClose,fallback}: {place:Place;open:boolean;onClose:()=>void;fallback?:(trek:Trek)=>ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null)
  const [visitIndex,setVisitIndex]=useState(0)
  const [index,setIndex]=useState(0)
  const visit=place.visits[visitIndex]||place.visits[0]
  const media=tripMedia(visit),item=media[index]
  const location=realText(visit.destination),summary=realText(visit.summary)
  const showLocation=location&&location.toLowerCase()!==visit.name.toLowerCase()
  const go=(step:number)=>setIndex(i=>(i+step+media.length)%media.length)
  const selectVisit=(i:number)=>{setVisitIndex(i);setIndex(0)}

  useEffect(()=>{
    const dialog=ref.current;if(!dialog)return
    if(open&&!dialog.open){selectVisit(0);dialog.showModal()}
    if(!open&&dialog.open)dialog.close()
  },[open])

  return <dialog ref={ref} className="trip-modal" aria-labelledby={`trip-${place.visits[0].slug}`} onClose={onClose}
    onClick={event=>{if(event.target===ref.current)onClose()}}
    onKeyDown={event=>{if(media.length>1&&event.key==='ArrowRight')go(1);if(media.length>1&&event.key==='ArrowLeft')go(-1)}}>
    {open&&<div className="trip-modal-inner">
      <button className="trip-modal-close" type="button" onClick={onClose} aria-label="Close"><Icon name="close" size={20}/></button>
      {place.visits.length>1&&<div className="trip-visits" role="tablist" aria-label={`Visits to ${place.name}`}>{place.visits.map((v,i)=><button key={v.slug} type="button" role="tab" aria-selected={i===visitIndex} className={i===visitIndex?'active':''} onClick={()=>selectVisit(i)}>{v.date?formatDate(v.date):'Earlier visit'}</button>)}</div>}
      <div className="trip-stage">
        {!item?fallback?.(visit):item.kind==='photo'?<img key={item.id} src={mediaSrc(item.src,1200)} srcSet={mediaSrcSet(item.src)} sizes="(max-width: 700px) 100vw, 960px" alt={item.alt}/>:<video key={item.id} src={item.src} controls playsInline preload="metadata" aria-label={item.alt}/>}
        {media.length>1&&<>
          <button className="trip-nav prev" type="button" onClick={()=>go(-1)} aria-label="Previous"><Icon name="arrow" size={20}/></button>
          <button className="trip-nav next" type="button" onClick={()=>go(1)} aria-label="Next"><Icon name="arrow" size={20}/></button>
          <span className="trip-counter">{index+1} / {media.length}</span>
        </>}
      </div>
      {media.length>1&&<div className="trip-thumbs">{media.map((m,i)=><button key={m.id} type="button" className={i===index?'active':''} onClick={()=>setIndex(i)} aria-label={`Show ${m.kind} ${i+1}`} aria-current={i===index}>
        {m.kind==='photo'?<img src={mediaSrc(m.src,240)} alt="" width={72} height={54} loading="lazy"/>:<span className="thumb-video">▶</span>}
      </button>)}</div>}
      <div className="trip-info">
        <h2 id={`trip-${place.visits[0].slug}`}>{visit.name}</h2>
        {(visit.date||showLocation)&&<p className="trip-meta">
          {visit.date&&<span><Icon name="calendar" size={14}/>{formatDate(visit.date)}</span>}
          {showLocation&&<span><Icon name="pin" size={14}/>{location}</span>}
        </p>}
        {(item?.caption||item?.credit)&&<p className="trip-caption">{item.caption}{item.caption&&item.credit&&' · '}{item.credit&&<span>Photo: {item.credit}</span>}</p>}
        {summary&&<p>{summary}</p>}
      </div>
    </div>}
  </dialog>
}
