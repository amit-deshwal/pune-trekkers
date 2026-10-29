import { FormEvent, useEffect, useState } from 'react'
import AdminChrome from '../../components/AdminChrome'
import { useAdminSession } from '../../lib/admin-session'
import type { Photo, Video } from '../../lib/content-schema'
import { browserSupabase } from '../../lib/supabase'
import { mediaSrc } from '../../lib/media'
import { shrinkPhoto } from '../../lib/shrink-photo'
import { formatDate } from '../../lib/site'
import { realText } from '../../lib/places'

type GalleryTrip = {slug:string;name:string;kind:'trek'|'initiative';destination:string;date:string|null;summary:string;photos:Photo[];videos:Video[]}
type PendingFile = {id:string;file:File;preview:string;description:string;caption:string}
const empty = ():GalleryTrip => ({slug:'',name:'',kind:'trek',destination:'',date:null,summary:'',photos:[],videos:[]})
const imageTypes = ['image/jpeg','image/png','image/webp','image/avif']
const videoTypes = ['video/mp4','video/webm']
const extensions:Record<string,string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','video/mp4':'mp4','video/webm':'webm'}

export default function GalleryAdmin(){
  const session=useAdminSession()
  const {token}=session
  const [saving,setSaving]=useState(false)
  const [deleting,setDeleting]=useState(false)
  const [message,setMessage]=useState('')
  const [trips,setTrips]=useState<GalleryTrip[]>([])
  const [trip,setTrip]=useState<GalleryTrip>(empty)
  const [pending,setPending]=useState<PendingFile[]>([])
  // Same place can have many visits: label each by date and suggest existing place names.
  const sortedTrips=[...trips].sort((a,b)=>a.name.localeCompare(b.name)||(b.date||'').localeCompare(a.date||''))
  const places=Array.from(new Set(trips.map(item=>realText(item.destination)).filter(Boolean))).sort()
  const tripLabel=(item:GalleryTrip)=>`${item.name} — ${item.date?formatDate(item.date):'no date'}`

  async function load(accessToken:string){
    const response=await fetch('/api/admin/gallery',{headers:{Authorization:`Bearer ${accessToken}`}})
    const result=await response.json()
    if(!response.ok)throw new Error(result.error||'Could not load gallery trips.')
    setTrips(result.treks)
  }
  useEffect(()=>{
    if(token)load(token).catch(error=>setMessage(error instanceof Error?error.message:'Could not load gallery trips.'))
  },[token])
  function clearPending(){setPending(current=>{current.forEach(item=>URL.revokeObjectURL(item.preview));return []})}
  function selectTrip(slug:string){setTrip(trips.find(item=>item.slug===slug)||empty());clearPending();setMessage('')}
  function addFiles(files:FileList|null){
    if(!files)return
    const next=Array.from(files).map(file=>({id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),description:'',caption:''}))
    setPending(current=>[...current,...next])
  }
  function removePending(id:string){setPending(current=>current.filter(item=>{if(item.id===id)URL.revokeObjectURL(item.preview);return item.id!==id}))}
  async function deleteTrip(){
    if(!trip.slug||!confirm(`Delete "${trip.name}" and all its photos and videos? This cannot be undone.`))return
    setDeleting(true);setMessage('')
    try{
      const response=await fetch(`/api/admin/gallery?slug=${encodeURIComponent(trip.slug)}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}})
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||'Could not delete this trip.')
      setTrips(current=>current.filter(item=>item.slug!==trip.slug));setTrip(empty());clearPending()
      setMessage('Trip deleted from the public gallery.')
    }catch(error){setMessage(error instanceof Error?error.message:'Could not delete this trip.')}
    finally{setDeleting(false)}
  }
  function editPending(id:string,changes:Partial<PendingFile>){setPending(current=>current.map(item=>item.id===id?{...item,...changes}:item))}
  function editPhoto(id:string,changes:Partial<Photo>){setTrip(current=>({...current,photos:current.photos.map(item=>item.id===id?{...item,...changes}:item)}))}
  function editVideo(id:string,changes:Partial<Video>){setTrip(current=>({...current,videos:current.videos.map(item=>item.id===id?{...item,...changes}:item)}))}
  async function save(event:FormEvent){
    event.preventDefault();setSaving(true);setMessage('')
    try{
      if(!token)throw new Error('Sign in first.')
      const client=browserSupabase()
      const photos=[...trip.photos],videos=[...trip.videos]
      for(const item of pending){
        const image=imageTypes.includes(item.file.type),video=videoTypes.includes(item.file.type)
        if(!image&&!video)throw new Error(`${item.file.name}: use JPG, PNG, WebP, AVIF, MP4 or WebM.`)
        const file=image?await shrinkPhoto(item.file):item.file
        if(file.size>(video?50:10)*1024*1024)throw new Error(`${file.name} is too large (${video?'50':'10'} MB maximum).`)
        if(image&&item.description.trim().length<8)throw new Error(`Describe the photo ${file.name} for accessibility.`)
        const extension=extensions[file.type]
        const path=`trip-uploads/${crypto.randomUUID()}/${crypto.randomUUID()}.${extension}`
        const {error}=await client.storage.from('trip-uploads').upload(path,file,{contentType:file.type,upsert:false})
        if(error)throw error
        const src=`/api/media/${path}`
        if(image)photos.push({id:crypto.randomUUID(),src,alt:item.description.trim(),caption:item.caption.trim(),credit:''})
        else videos.push({id:crypto.randomUUID(),src,caption:item.caption.trim()})
      }
      const response=await fetch('/api/admin/gallery',{method:trip.slug?'PATCH':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...trip,photos,videos})})
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||'Could not save gallery trip.')
      setTrips(current=>[result.trek,...current.filter(item=>item.slug!==result.trek.slug)])
      setTrip(result.trek);clearPending()
      setMessage('Gallery trip saved. Removed photos and videos were deleted; new ones are visible in the public gallery.')
    }catch(error){setMessage(error instanceof Error?error.message:'Could not save gallery trip.')}
    finally{setSaving(false)}
  }
  return <AdminChrome session={session} active="gallery" seoTitle="Gallery admin" title="Curate the trail gallery." intro="Create or update a past trip, then add photos and videos to its gallery.">
    <form className="interest-form admin-form" onSubmit={save}>
      <div className="admin-heading"><div><span className="eyebrow">PAST TRIPS</span><h2>Trip details</h2></div></div>
      <label>Edit an existing trip or create a new one<select value={trip.slug} onChange={event=>selectTrip(event.target.value)}><option value="">New gallery trip</option>{sortedTrips.map(item=><option key={item.slug} value={item.slug}>{tripLabel(item)}</option>)}</select></label>
      <div className="form-row"><label>Trip name<input required value={trip.name} onChange={event=>setTrip(current=>({...current,name:event.target.value}))} placeholder="e.g. Rajgad monsoon trek"/></label><label>Place (optional; visits to the same place are grouped)<input list="gallery-places" value={realText(trip.destination)} onChange={event=>setTrip(current=>({...current,destination:event.target.value}))} placeholder="e.g. Rajgad Fort"/><datalist id="gallery-places">{places.map(place=><option key={place} value={place}/>)}</datalist></label></div>
      <label>Type<select value={trip.kind} onChange={event=>setTrip(current=>({...current,kind:event.target.value as GalleryTrip['kind']}))}><option value="trek">Trek or outing</option><option value="initiative">Community initiative (tree plantation, hill cleaning…)</option></select></label>
      <label>Trek date (optional; enter only if verified)<input type="date" value={trip.date||''} onChange={event=>setTrip(current=>({...current,date:event.target.value||null}))}/></label>
      <label>Short story (optional)<textarea value={trip.summary} onChange={event=>setTrip(current=>({...current,summary:event.target.value}))} placeholder="A few words about the trip"/></label>
      <fieldset className="admin-photos"><legend>Current photos and videos</legend>{!trip.photos.length&&!trip.videos.length&&<p>No media added yet.</p>}{trip.photos.map(item=><div className="gallery-admin-item" key={item.id}><img className="gallery-admin-thumb" src={mediaSrc(item.src,240)} alt="" loading="lazy"/><div className="gallery-admin-fields"><label>Image description<input required minLength={8} value={item.alt} onChange={event=>editPhoto(item.id,{alt:event.target.value})}/></label><label>Caption<input value={item.caption} onChange={event=>editPhoto(item.id,{caption:event.target.value})}/></label><button type="button" className="admin-remove" onClick={()=>setTrip(current=>({...current,photos:current.photos.filter(photo=>photo.id!==item.id)}))}>Remove photo</button></div></div>)}{trip.videos.map(item=><div className="gallery-admin-item" key={item.id}><video className="gallery-admin-thumb" src={item.src} muted preload="metadata"/><div className="gallery-admin-fields"><label>Caption<input value={item.caption} onChange={event=>editVideo(item.id,{caption:event.target.value})}/></label><button type="button" className="admin-remove" onClick={()=>setTrip(current=>({...current,videos:current.videos.filter(video=>video.id!==item.id)}))}>Remove video</button></div></div>)}{trip.slug&&<p className="subtle-note">Removed items are deleted for good when you save.</p>}</fieldset>
      <fieldset className="admin-photos"><legend>Add media</legend><label>Choose photos or videos<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" multiple onChange={event=>{addFiles(event.target.files);event.target.value=''}}/></label><p>Photos: up to 10 MB each. Videos: MP4 or WebM, up to 50 MB each.</p>{pending.map(item=><div className="gallery-admin-item" key={item.id}>{imageTypes.includes(item.file.type)?<img className="gallery-admin-thumb" src={item.preview} alt=""/>:<video className="gallery-admin-thumb" src={item.preview} muted preload="metadata"/>}<div className="gallery-admin-fields"><strong>{item.file.name}</strong>{imageTypes.includes(item.file.type)&&<label>Image description<input required minLength={8} value={item.description} onChange={event=>editPending(item.id,{description:event.target.value})} placeholder="What can be seen in this photo?"/></label>}<label>Caption (optional)<input value={item.caption} onChange={event=>editPending(item.id,{caption:event.target.value})}/></label><button type="button" className="admin-remove" onClick={()=>removePending(item.id)}>Remove from upload</button></div></div>)}</fieldset>
      <div className="admin-actions"><button className="button" type="submit" disabled={saving||deleting} aria-busy={saving}>{saving?'Uploading and saving…':trip.slug?'Save gallery changes':'Create gallery trip'}</button>{trip.slug&&<button className="button admin-danger" type="button" onClick={deleteTrip} disabled={saving||deleting} aria-busy={deleting}>{deleting?'Deleting…':'Delete trip'}</button>}</div>
    </form>{message&&<p className="admin-message" role="status">{message}</p>}
  </AdminChrome>
}
