import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faBars } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/router'

function AboutUs() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-4xl lg:max-w-screen-lg lg:px-32 lg:pt-16">
      <a
        className="text-md flex items-center px-3 py-2 font-bold uppercase leading-snug"
        onClick={() => router.push('/')}
      >
        <FontAwesomeIcon
          icon={faArrowLeft}
          className="mb-4 lg:mb-8 scale-100 cursor-pointer text-2xl duration-200 ease-in hover:scale-90 hover:opacity-80"
        />
      </a>
      <h1 className="mb-4 px-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-3xl lg:text-5xl">
        <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
          About Us
        </span>
      </h1>
      <p className="px-4 text-md lg:text-lg text-gray-900">
        🌄 Welcome to Pune Trekkers! 🏞️ We are a vibrant community of outdoor
        enthusiasts passionate about exploring the breathtaking landscapes
        surrounding Pune. 🏔️
        <br></br> <br></br>
        At Pune Trekkers, we believe in immersing ourselves in nature to truly
        experience its beauty. Join us on our regular treks to serene mountains,
        dense forests, picturesque valleys, and cascading waterfalls. 🌳🌊 Our
        treks cater to all levels of experience, ensuring everyone can
        participate and enjoy the journey.
        <br></br>
        <br></br>
        What sets Pune Trekkers apart is our strong sense of community. 🤝 We
        foster an inclusive and supportive environment, where members from all
        walks of life come together as a close-knit family. Our treks not only
        connect you with nature but also forge lasting friendships, where you
        can share stories and create cherished memories. 😊
        <br></br> <br></br>
        Whether you're an avid hiker or a beginner, Pune Trekkers welcomes you
        to join us on our exciting journeys! 🎉 Come, let's explore breathtaking
        trails, conquer new heights, and create unforgettable moments together.
        🥾🌟
      </p>
      <p className="mt-8 px-4 text-md lg:text-lg text-black truncate">
        Group link -{' '}
        <a
          href="https://chat.whatsapp.com/LhZRnE30sWG5uTGEvGRghH"
          target="_blank"
        >
          <span className="font-semibold ">
            https://chat.whatsapp.com/LhZRnE30sWG5uTGEvGRghH
          </span>
        </a>
      </p>
    </div>
  )
}

export default AboutUs
