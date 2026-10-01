

function getOwnerId() {
  let id = localStorage.getItem("achaifsc_owner_id");
  if (!id) {
    id = "owner_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("achaifsc_owner_id", id);
  }
  return id;
}

function getPosts() {
  return JSON.parse(localStorage.getItem("achaifsc_posts") || "[]");
}

function savePosts(posts) {
  localStorage.setItem("achaifsc_posts", JSON.stringify(posts));
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString + "T12:00:00").toLocaleDateString("pt-BR");
}

function cardHtml(post, ownerMode) {
  const status = post.resolvido ? "resolvido" : post.tipo;
  const foto = post.foto
    ? `<div class="photo" style="background-image:url('${post.foto}')"></div>`
    : `<div class="photo">📦</div>`;

  return `
    <article class="card">
      ${foto}
      <div class="body">
        <div class="topline">
          <span class="status ${status}">${status.toUpperCase()}</span>
          <small>${escapeHtml(post.categoria)}</small>
        </div>

        <h3>${escapeHtml(post.titulo)}</h3>
        <p>${escapeHtml(post.descricao)}</p>

        <div class="meta">
          <span>📍 ${escapeHtml(post.local)}</span>
          <span>📅 ${formatDate(post.data)}</span>
          <span>💬 ${escapeHtml(post.contato)}</span>
        </div>

        ${ownerMode ? `
          <div class="cardActions">
            ${post.resolvido ? "" : `<button class="btn secondary" data-resolver="${post.id}">Marcar resolvido</button>`}
            <button class="btn danger" data-excluir="${post.id}">Excluir</button>
          </div>
        ` : ""}
      </div>
    </article>
  `;
}

const lista = document.querySelector("#lista");
const busca = document.querySelector("#busca");
const vazio = document.querySelector("#vazio");
const filters = document.querySelectorAll(".filter");

let filtro = "todos";

function render() {
  const posts = getPosts();
  const termo = busca.value.trim().toLowerCase();

  const encontrados = posts.filter(post => {
    const status = post.resolvido ? "resolvido" : post.tipo;
    const texto = `${post.titulo} ${post.local} ${post.descricao} ${post.categoria}`.toLowerCase();

    return texto.includes(termo) &&
      (filtro === "todos" || status === filtro);
  });

  lista.innerHTML = encontrados.map(post => cardHtml(post, false)).join("");
  vazio.classList.toggle("hidden", encontrados.length > 0);
}

busca.addEventListener("input", render);

filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(item => item.classList.remove("active"));
    btn.classList.add("active");
    filtro = btn.dataset.filter;
    render();
  });
});

render();
