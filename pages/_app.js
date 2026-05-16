import '../styles/globals.css'
import '../public/style.css'   // importa seu CSS customizado

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}
