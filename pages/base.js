export default function Base() {
  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>
      <input type="text" placeholder="Buscar..." className="search-bar" />
      <div className="actions">
        <button>+ Nova Categoria</button>
        <button>+ Novo Tópico</button>
        <button>- Excluir Categoria</button>
        <button>- Excluir Tópico</button>
      </div>
      <button onClick={() => window.location.href='/dashboard'}>Voltar ao Dashboard</button>
    </div>
  );
}
