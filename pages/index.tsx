import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import Lightbox from 'react-awesome-lightbox'
// You need to import the CSS only once
import 'react-awesome-lightbox/build/style.css'

export async function getStaticProps() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data } = await supabaseAdmin.from('images').select('*').order('id')
  return {
    props: {
      images: data,
    },
  }
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

type Image = {
  id: number
  image_src: string
  name: string
  userName: string
  place: string
  profile_type: string
  profile_url: string
}

export default function Gallery({ images }: { images: Image[] }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-4">
        {images.map((image) => (
          <BlurImage key={image.id} image={image} />
        ))}
      </div>
    </>
  )
}

function BlurImage({ image }: { image: Image }) {
  const [isLoading, setLoading] = useState(true)
  const [showModal, showShowModal] = useState(false)
  const handleOnClick = () => {
    showShowModal(true)
  }

  return (
    <>
      <a className="group">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
          <Image
            onClick={() => handleOnClick()}
            alt={image.place}
            src={image.image_src}
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
        <h3 className="text-md mt-4 text-gray-900">
          Submitted by - {image.name}
        </h3>
        <h3 className="text-md mt-0 text-gray-900">Place - {image.place}</h3>
        <p className="mt-0 text-sm font-medium text-gray-700">
          <a href={image.profile_url} target="_blank">
            {image.profile_url}
          </a>
        </p>
      </a>
      {showModal && (
        <Lightbox
          image={image.image_src}
          title={image.place}
          onClose={() => showShowModal(false)}
        />
      )}
    </>
  )
}
