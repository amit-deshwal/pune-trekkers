import Head from 'next/head'
import Navbar from '../NavBar'
import Footer from '../Footer'
interface Props {
  children: React.ReactElement
}

export default function BaseLayout({ children }: Props) {
  return (
    <>
      <Head>
        <title>Pune Trekkers</title>
        <meta name="author" content="Pune Trekkers" />
        <meta name="copyright" content="Pune Trekkers /" />
        <meta name="robots" content="ALL" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimal-ui"
        />
        <meta
          name="description"
          content="Welcome to Pune Trekkers! 🏞️ We are a vibrant community of outdoor
          enthusiasts passionate about exploring the breathtaking landscapes
          surrounding Pune."
        />

        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/android-chrome-512x512.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <div className="mx-auto max-w-4xl py-8 px-4 sm:py-24 sm:px-6 lg:max-w-screen-2xl lg:px-8 lg:pt-10">
        <Navbar />
        {children}
      </div>
      <Footer />
    </>
  )
}
