import Layout from '../components/Layout'

export default function Dashboard() {

  return (
    <Layout>

      <div className="topbar">

        <div className="logo">
          <div className="logoBox">◉</div>
          <div className="logoText">Don</div>
        </div>

        <div>
          Administrador <span style={{color:'#ffd600'}}>(Admin)</span>
        </div>

      </div>

      <div className="nav">
        <button className="navBtn">Base de conhecimento</button>
        <button className="navBtn">Usuário</button>
        <button className="navBtn">Treinamento</button>
        <button className="navBtn">Auditoria</button>
      </div>

      <div className="card">

        <div className="searchBar">

          <input
            className="input"
            placeholder="Pesquisar títulos, descrições..."
          />

          <select className="select">
            <option>Todas as categorias</option>
          </select>

          <button className="btn btnYellow">
            + Novo Tópico
          </button>

          <button className="btn btnYellow">
            + Nova Categoria
          </button>

          <button className="btn btnDanger">
            Excluir Categoria
          </button>

        </div>

      </div>

      <div className="card">

        <div className="topicHeader">

          <div>
            <h1 className="topicTitle">HTML Básico</h1>
            <p className="description">
              Estrutura de páginas web.
            </p>
          </div>

          <div className="badge">
            HTML
          </div>

        </div>

        <div className="sectionTitle">
          Comentários
        </div>

        <div className="comment">

          <div className="commentTop">
            <span className="user">Usuário Comum</span>
            <span>04/05/2026, 17:54:51</span>
            <span className="pending">Pendente</span>
          </div>

          <div className="commentText">
            Comentário pendente
          </div>

          <div className="actions">
            <button className="smallBtn approve">
              Aprovar
            </button>

            <button className="smallBtn reject">
              Rejeitar
            </button>
          </div>

        </div>

        <div className="commentForm">

          <input
            className="commentInput"
            placeholder="Adicionar comentário"
          />

          <button className="btn btnYellow">
            Enviar
          </button>

        </div>

      </div>

    </Layout>
  )
}
