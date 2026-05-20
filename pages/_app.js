// pages/_app.js
import '../styles/globals.css';
import '../styles/style.css';
import '../styles/base.css';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Rotas que não devem usar o Layout
  const noLayoutRoutes = ['/login', '/signup'];

  const isNoLayout = noLayoutRoutes.includes(router.pathname);

  return isNoLayout ? (
    // Renderiza sem Layout (login e signup)
    <Component {...pageProps} />
  ) : (
    // Renderiza com Layout (páginas internas)
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
