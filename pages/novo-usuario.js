// pages/novo-usuario.js
import dynamic from 'next/dynamic';

// Carrega o componente apenas no cliente (sem SSR)
const NovoUsuarioPage = dynamic(() => import('../components/NovoUsuario'), {
  ssr: false
});

export default NovoUsuarioPage;
