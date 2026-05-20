// pages/_app.js
import '../styles/globals.css';
import '../styles/style.css';
import '../styles/base.css';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const noLayoutRoutes = ['/login', '/signup'];

  const isNoLayout = noLayoutRoutes.includes(router.pathname);

  // 🔥 ROTAS QUE NÃO DEVEM TER LAYOUT (pode adicionar outras depois)
  if (isNoLayout) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
