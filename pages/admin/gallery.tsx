import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import Seo from '../../components/Seo'
import { Note, PageIntro } from '../../components/Shared'
import type { Photo, Video } from '../../lib/content-schema'
import { browserSupabase, supabasePublicKey, supabasePublicUrl } from '../../lib/supabase'

type GalleryTrip = {slug:string;name:string;destination:string;date:string|null;summary:string;photos:Photo[];videos:Video[]}
type PendingFile = {id:string;file:File;description:string;caption:string}
const empty = ():GalleryTrip => ({slug:'',name:'',destination:'',date:null,summary:'',photos:[],videos:[]})
const imageTypes = ['image/jpeg','image/png','image/webp','image/avif']
const videoTypes = ['video/mp4','video/webm']
const extensions:Record<string,string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','video/mp4':'mp4','video/webm':'webm'}

export default function GalleryAdmin(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [token,setToken]=useState('')
  const [checking,setChecking]=useState(true)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')
  const [trips,setTrips]=useState<GalleryTrip[]>([])
  const [trip,setTrip]=useState<GalleryTrip>(empty)
  const [pending,setPending]=useState<PendingFile[]>([])
  const configured=Boolean(supabasePublicUrl&&supabasePublicKey)

  async function load(accessToken:string){
    const response=await fetch('/api/admin/gallery',{headers:{Authorization:`Bearer ${accessToken}`}})
    const result=await response.json()
    if(!response.ok)throw new Error(result.error||'Could not load gallery trips.')
    setTrips(result.treks)
  }
  useEffect(()=>{
    if(!configured){setChecking(false);return}
    browserSupabase().auth.getSession().then(async({data})=>{
      if(data.session){setToken(data.session.access_token);await load(data.session.access_token)}
    }).catch(error=>setMessage(error instanceof Error?error.message:'Could not load gallery trips.')).finally(()=>setChecking(false))
  },[configured])
  async function login(event:FormEvent){
    event.preventDefault();setMessage('')
    try{const {data,error}=await browserSupabase().auth.signInWithPassword({email,password});if(error||!data.session)throw error||new Error('No session returned.');await load(data.session.access_token);setToken(data.session.access_token)}
    catch(error){setMessage(error instanceof Error?error.message:'Could not sign in.')}
  }
  function selectTrip(slug:string){setTrip(trips.find(item=>item.slug===slug)||empty());setPending([]);setMessage('')}
  function addFiles(files:FileList|null){
    if(!files)return
    const next=Array.from(files).map(file=>({id:crypto.randomUUID(),file,description:'',caption:''}))
    setPending(current=>[...current,...next])
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
        const {file}=item
        const image=imageTypes.includes(file.type),video=videoTypes.includes(file.type)
        if(!image&&!video)throw new Error(`${file.name}: use JPG, PNG, WebP, AVIF, MP4 or WebM.`)
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
      setTrip(result.trek);setPending([])
      setMessage('Gallery trip saved. Photos and videos are now visible in the public gallery.')
    }catch(error){setMessage(error instanceof Error?error.message:'Could not save gallery trip.')}
    finally{setSaving(false)}
  }
  return <><Seo title="Gallery admin" noindex/><PageIntro eyebrow="PRIVATE ADMIN AREA" title="Curate the trail gallery.">Create or update a past trip, then add photos and videos to its gallery.</PageIntro><section className="container admin-layout">
    {!configured?<Note>Supabase is not connected yet. Configure it as described in the Supabase setup guide.</Note>:checking?<p>Loading gallery editor…</p>:!token?<form className="interest-form admin-form" onSubmit={login}><h2>Admin sign in</h2><label>Email<input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)}/></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)}/></label><button className="button" type="submit">Sign in</button></form>:<form className="interest-form admin-form" onSubmit={save}>
      <div className="admin-heading"><div><span className="eyebrow">PAST TRIPS</span><h2>Trip details</h2></div><Link href="/admin">Trek admin →</Link></div>
      <label>Edit an existing trip or create a new one<select value={trip.slug} onChange={event=>selectTrip(event.target.value)}><option value="">New gallery trip</option>{trips.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <div className="form-row"><label>Trip name<input required value={trip.name} onChange={event=>setTrip(current=>({...current,name:event.target.value}))} placeholder="e.g. Rajgad monsoon trek"/></label><label>Destination (optional)<input value={trip.destination} onChange={event=>setTrip(current=>({...current,destination:event.target.value}))} placeholder="e.g. Rajgad Fort"/></label></div>
      <label>Trek date (optional; enter only if verified)<input type="date" value={trip.date||''} onChange={event=>setTrip(current=>({...current,date:event.target.value||null}))}/></label>
      <label>Short story (optional)<textarea value={trip.summary} onChange={event=>setTrip(current=>({...current,summary:event.target.value}))} placeholder="A few words about the trip"/></label>
      <fieldset className="admin-photos"><legend>Current photos and videos</legend>{!trip.photos.length&&!trip.videos.length&&<p>No media added yet.</p>}{trip.photos.map(item=><div className="gallery-admin-item" key={item.id}><strong>Photo</strong><label>Image description<input required minLength={8} value={item.alt} onChange={event=>editPhoto(item.id,{alt:event.target.value})}/></label><label>Caption<input value={item.caption} onChange={event=>editPhoto(item.id,{caption:event.target.value})}/></label><button type="button" onClick={()=>setTrip(current=>({...current,photos:current.photos.filter(photo=>photo.id!==item.id)}))}>Remove photo from gallery</button></div>)}{trip.videos.map(item=><div className="gallery-admin-item" key={item.id}><strong>Video</strong><label>Caption<input value={item.caption} onChange={event=>editVideo(item.id,{caption:event.target.value})}/></label><button type="button" onClick={()=>setTrip(current=>({...current,videos:current.videos.filter(video=>video.id!==item.id)}))}>Remove video from gallery</button></div>)}</fieldset>
      <fieldset className="admin-photos"><legend>Add media</legend><label>Choose photos or videos<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" multiple onChange={event=>{addFiles(event.target.files);event.target.value=''}}/></label><p>Photos: up to 10 MB each. Videos: MP4 or WebM, up to 50 MB each.</p>{pending.map(item=><div className="gallery-admin-item" key={item.id}><strong>{item.file.name}</strong>{imageTypes.includes(item.file.type)&&<label>Image description<input required minLength={8} value={item.description} onChange={event=>editPending(item.id,{description:event.target.value})} placeholder="What can be seen in this photo?"/></label>}<label>Caption (optional)<input value={item.caption} onChange={event=>editPending(item.id,{caption:event.target.value})}/></label><button type="button" onClick={()=>setPending(current=>current.filter(file=>file.id!==item.id))}>Remove from upload</button></div>)}</fieldset>
      <button className="button" type="submit" disabled={saving}>{saving?'Uploading and saving…':trip.slug?'Save gallery changes':'Create gallery trip'}</button>
    </form>}{message&&<p className="admin-message" role="status">{message}</p>}
  </section></>
}
