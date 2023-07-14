import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/router'

const Navbar: React.FC = () => {
  const router = useRouter()
  const [navbarOpen, setNavbarOpen] = useState(false)
  return (
    <>
      {router.pathname !== '/about' && (
        <nav className="relative mb-3 flex flex-wrap items-center justify-between px-2 py-3">
          <div className="container mx-auto flex flex-wrap items-center justify-between px-4">
            <div className="relative flex w-full justify-between lg:static lg:block lg:w-auto lg:justify-start">
              <div className="flex justify-center">
                <div className="inline-flex">
                  <img
                    src="./hiking.png"
                    className="mr-4 inline-block h-8"
                    alt="Pune Trekker Logo"
                  />
                  <h1 className="inline-block text-3xl font-extrabold text-gray-900 dark:text-white md:text-3xl lg:text-4xl">
                    <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
                      Pune Trekkers
                    </span>
                  </h1>
                </div>
                <div className="ml-8 flex flex-row items-center">
                    <a className="inline-block animate-border rounded-md bg-white bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-[length:400%_400%] p-1" target='_blank' href='https://pune-trekkers.notion.site/pune-trekkers/Pune-Trekkers-Events-ac0739549832414a8d59a3dca62417d1'>
                      <span className="block rounded-md bg-slate-900 font-bold text-white px-3 py-1">
                        Upcoming Treks
                        <span className="inline-block">
                          <svg
                            className="ml-2 pt-1 h-4 w-6"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 10"
                          >
                            <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M1 5h12m0 0L9 1m4 4L9 9"
                            />
                          </svg>
                        </span>
                      </span>
                    </a>
                  </div>
              </div>

              {/* <p className="mt-4 text-lg text-black">
                Group link -{' '}
                <a
                  href="https://chat.whatsapp.com/LhZRnE30sWG5uTGEvGRghH"
                  target="_blank"
                >
                  <span className="font-semibold">
                    https://chat.whatsapp.com/LhZRnE30sWG5uTGEvGRghH
                  </span>
                </a>
              </p> */}

              <button
                className="block cursor-pointer rounded border border-solid border-transparent bg-transparent px-3 py-1 text-xl leading-none  outline-none focus:outline-none lg:hidden"
                type="button"
                onClick={() => setNavbarOpen(!navbarOpen)}
              >
                <FontAwesomeIcon icon={faBars} style={{ fontSize: 18 }} />
              </button>
            </div>
            <div
              className={
                'flex-grow items-center lg:flex' +
                (navbarOpen ? ' flex' : ' hidden')
              }
              id="example-navbar-danger"
            >
              <ul className="flex list-none flex-col lg:ml-auto lg:flex-row">
                <li className="nav-item">
                  <a
                    className="flex scale-100 cursor-pointer items-center px-3 py-2 text-lg font-bold uppercase leading-snug duration-200 ease-in hover:scale-90 hover:opacity-80"
                    onClick={() => router.push('/about')}
                  >
                    <span className="ml-2">About</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      )}
    </>
  )
}

export default Navbar
