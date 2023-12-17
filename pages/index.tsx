import TrekData from 'next/image'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import Lightbox from 'react-awesome-lightbox'
import 'react-awesome-lightbox/build/style.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobeAsia } from '@fortawesome/free-solid-svg-icons'
import {
  faSquareTwitter,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons'

export async function getServerSideProps() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data } = await supabaseAdmin.from('images').select('*').order('id')
  return {
    props: {
      trekData: data,
    },
  }
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

type TrekData = {
  id: number
  image_src: string
  name: string
  userName: string
  place: string
  profile_type: string
  profile_url: string
  created_at: any
  date: string
}

export default function Gallery({ trekData }: { trekData: TrekData[] }) {
  trekData.sort((a: any, b: any) => b.id - a.id)
  const data = trekData.map((el: TrekData) => {
    el.created_at = new Date(el.created_at)
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    } as Intl.DateTimeFormatOptions
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(
      el.created_at
    )
    el.date = formattedDate
    return el
  })
  return (
    <>
      <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-4">
        {data.map((el: TrekData) => (
          <BlurImage key={el.id} trek={el} />
        ))}
      </div>
    </>
  )
}

function BlurImage({ trek }: { trek: TrekData }) {
  const [isLoading, setLoading] = useState(true)
  const [showModal, showShowModal] = useState(false)
  const handleOnClick = () => {
    showShowModal(true)
  }

  const getUserHandleIcon = () => {
    return (
      <>
        {trek.profile_type === 'website' && (
          <FontAwesomeIcon icon={faGlobeAsia} className="mr-1 text-xl" />
        )}
        {trek.profile_type === 'twitter' && (
          <FontAwesomeIcon icon={faSquareTwitter} className="mr-1 text-xl" />
        )}
        {trek.profile_type === 'instagram' && (
          <FontAwesomeIcon icon={faInstagram} className="mr-1 text-xl" />
        )}
      </>
    )
  }

  return (
    <>
      {trek.image_src && (
        <>
          <div className="group rounded-md px-4 pb-8 shadow">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
              <TrekData
                onClick={() => handleOnClick()}
                alt={trek.place}
                src={trek.image_src}
                layout="fill"
                objectFit="cover"
                className={cn(
                  'cursor-pointer duration-700 ease-in-out group-hover:opacity-75',
                  isLoading
                    ? 'scale-110 blur-2xl grayscale'
                    : 'scale-100 blur-0 grayscale-0'
                )}
                onLoadingComplete={() => setLoading(false)}
              />
            </div>
            {trek.name && (
              <h3 className="text-md mt-4 text-gray-900">
                Submitted by - {trek.name}
              </h3>
            )}

            {trek.place && (
              <h3 className="text-md mt-2 text-gray-900">
                Place - {trek.place}
              </h3>
            )}
            {trek.profile_url && (
              <div className="mt-2 mr-4 truncate text-sm font-medium text-gray-800">
                <span>Profile - </span>
                <a href={trek.profile_url} target="_blank">
                  {getUserHandleIcon()}
                  {trek.profile_url}
                </a>
              </div>
            )}
            {trek.created_at && (
              <h3 className="text-md mt-4 text-gray-900">{trek.date}</h3>
            )}
          </div>
          {showModal && (
            <Lightbox
              image={trek.image_src}
              title={trek.place}
              onClose={() => showShowModal(false)}
            />
          )}
        </>
      )}
    </>
  )
}
