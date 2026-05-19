// pages/_app.js
import '../styles/globals.css';
import '../styles/style.css';
import '../styles/base.css';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
