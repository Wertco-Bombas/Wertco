import '../styles/globals.css'
import '../styles/globals.css';
import '../styles/base.css';   // aqui você importa o tema escuro/amarelo
import '../styles/style.css'   // ou '../styles/globals.css' conforme seu projeto


export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
