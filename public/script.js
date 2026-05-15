function $(id){
  return document.getElementById(id);
}

/* SESSION */
const KEY_SESSION = "don_session_full";

function setSession(s){
  localStorage.setItem(KEY_SESSION, JSON.stringify(s));
}

function getSession(){
  return JSON.parse(localStorage.getItem(KEY_SESSION) || "null");
}

function clearSession(){
  localStorage.removeItem(KEY_SESSION);
}

/* UI */
function showLogin(){
  $("loginScreen").style.display = "block";
  $("dashboard").style.display = "none";
  $("headerUser").style.display = "none";
}

function showDashboard(){
  $("loginScreen").style.display = "none";
  $("dashboard").style.display = "block";
  $("headerUser").style.display = "flex";
}

/* =========================
   LOGIN CORRIGIDO
========================= */
async function doLogin(e){

  if(e) e.preventDefault(); // 🔥 ESSENCIAL

  const u = $("loginUser")?.value?.trim();
  const p = $("loginPass")?.value;

  if(!u || !p){
    alert("Preencha usuário e senha.");
    return;
  }

  try {

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: u,
        password: p
      })
    });

    const data = await res.json();

    if(!res.ok){
      alert(data.error || "Usuário ou senha inválidos");
      return;
    }

    setSession({
      username: data.user.username,
      role: data.user.role,
      name: data.user.username,
      ts: Date.now()
    });

    showDashboard();

  } catch (err) {
    console.error("Erro login:", err);
    alert("Erro de conexão com servidor (/api/login não encontrada ou falhou)");
  }
}

/* LOGOUT */
function doLogout(){
  clearSession();
  showLogin();
}

/* =========================
   INIT SEGURO
========================= */
window.addEventListener('DOMContentLoaded', () => {

  const btn = $("btnLogin");
  const logout = $("btnLogout");
  const form = $("loginForm");

  // clique botão
  if(btn) btn.addEventListener('click', doLogin);

  // submit form (ENTER FUNCIONA AQUI AGORA)
  if(form) form.addEventListener('submit', doLogin);

  if(logout) logout.addEventListener('click', doLogout);

  const sess = getSession();
  if(sess) showDashboard();
  else showLogin();

  console.log("LOGIN OK - SISTEMA CARREGADO");
});
