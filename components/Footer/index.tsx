import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer className="sticky top-[100vh]">
      <div className="mx-auto w-full p-4 px-10 md:px-36 md:py-8 lg:px-72">
        <div className="flex flex-col items-baseline justify-between md:flex-row md:items-center">
          <a
            href="#"
            className="mb-4 flex items-baseline sm:mb-0 md:items-center"
          >
            <div className="flex items-center">
              <div>
                {' '}
                <img
                  src="./hiking.png"
                  className="mr-3 h-8"
                  alt="Pune Trekker Logo"
                />
              </div>
              <div>
                <span className="self-center whitespace-nowrap text-2xl font-semibold ">
                  Pune Trekkers
                </span>
              </div>
            </div>
          </a>
          <div className="md:mt-2">
            <span className="block text-sm text-gray-500 dark:text-gray-400 sm:text-center">
              © 2023{' '}
              <a href="#" className="hover:underline">
                Pune Trekkers™
              </a>
              . All Rights Reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
