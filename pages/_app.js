// pages/_app.js
import '../styles/base.css';
import '../styles/style.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
