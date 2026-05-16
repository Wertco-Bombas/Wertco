export default function Dashboard(){

  
  return(
    <div className="page">
    <div className="container">

      <div className="topbar">

        <div className="logoArea">
          <div className="logoIcon">◉</div>
          <div className="logoText">Don</div>
        </div>

        <div className="userInfo">
          Administrador <span className="admin">(Admin)</span>
        </div>

      </div>

      <div className="menu">
        <button className="menuBtn">Base de conhecimento</button>
        <button className="menuBtn">Usuário</button>
        <button className="menuBtn">Treinamento</button>
        <button className="menuBtn">Auditoria</button>
      </div>

      <div className="box">

        <div className="searchBar">

          <input
            className="searchInput"
            placeholder="Pesquisar títulos, descrições, categorias..."
          />

          <select className="select">
            <option>Todas as categorias</option>
          </select>

          <button className="btn yellow">
            + Novo Tópico
          </button>

          <button className="btn yellow">
            + Nova Categoria
          </button>

          <button className="btn red">
            Excluir Categoria
          </button>

        </div>

      </div>

      <div className="box">

        <div className="topicHeader">

          <div>
            <div className="topicTitle">
              HTML Básico
            </div>

            <div className="topicDesc">
              Estrutura de páginas web.
            </div>
          </div>

          <div className="tag">
            HTML
          </div>

        </div>

        <div className="commentsTitle">
          Comentários
        </div>

        <div className="comment">

          <div className="commentTop">
            <div className="commentUser">
              Usuário Comum
            </div>

            <div>
              04/05/2026, 17:54:51
            </div>

            <div className="pending">
              Pendente
            </div>
          </div>

          <div className="commentText">
            Comentário pendente
          </div>

          <div className="commentActions">

            <button className="smallBtn approve">
              Aprovar
            </button>

            <button className="smallBtn reject">
              Rejeitar
            </button>

          </div>

        </div>

        <div className="newComment">

          <input placeholder="Adicionar comentário" />

          <button className="btn yellow">
            Enviar
          </button>

        </div>

      </div>

    </div>
  )
}
