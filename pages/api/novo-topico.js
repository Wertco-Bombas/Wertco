import { audit } from '../lib/audit';

await audit({
  acao: 'CREATE_TOPICO',
  entidade: 'topicos',
  usuario: user,
  status: 'success',
  payload: {
    titulo: titulo || null
  }
});
