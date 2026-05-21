import '../styles/globals.css';
import '../styles/style.css';
import '../styles/base.css';

import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // rotas sem layout (auth pages)
  const noLayoutRoutes = ['/login', '/signup'];

  const isNoLayout = noLayoutRoutes.includes(router.pathname);

  // evita flicker de layout em rotas protegidas
  if (typeof window !== 'undefined' && router.isReady === false) {
    return null;
  }

  if (isNoLayout) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
