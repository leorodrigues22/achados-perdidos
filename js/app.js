function getOwnerId() {
  let ownerId = localStorage.getItem("achaifsc_owner_id");

  if (!ownerId) {
    ownerId = "user_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("achaifsc_owner_id", ownerId);
  }

  return ownerId;
}

function getPosts() {
  return JSON.parse(localStorage.getItem("achaifsc_posts_v2") || "[]");
}

function savePosts(posts) {
  localStorage.setItem("achaifsc_posts_v2", JSON.stringify(posts));
}

function formatDate(dateString) {
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("pt-BR");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardHtml(post, showOwnerActions = false) {
  const type = post.resolvido ? "resolvido" : post.tipo;
  const imageStyle = post.foto ? `style="background-image:url('${post.foto}')"` : "";

  return `
    <article class="cartao">
      <div class="foto" ${imageStyle}>${post.foto ? "" : "📦"}</div>

      <div class="corpo-cartao">
        <div class="linha-topo">
          <span class="status ${type}">${type.toUpperCase()}</span>
          <span class="categoria">${escapeHtml(post.categoria)}</span>
        </div>

        <h3>${escapeHtml(post.titulo)}</h3>
        <p>${escapeHtml(post.descricao)}</p>

        <div class="meta">
          <span>📍 ${escapeHtml(post.local)}</span>
          <span>📅 ${formatDate(post.data)}</span>
          <span>💬 ${escapeHtml(post.contato)}</span>
        </div>

        ${showOwnerActions ? `
          <div class="acoes-cartao">
            ${post.resolvido ? "" : `<button class="botao secundario" onclick="resolverAnuncio(${post.id})">Marcar como resolvido</button>`}
            <button class="botao perigo" onclick="excluirAnuncio(${post.id})">Excluir</button>
          </div>
        ` : ""}
      </div>
    </article>
  `;
}

const lista = document.querySelector("#listaAnuncios");
const busca = document.querySelector("#busca");
const vazio = document.querySelector("#vazio");
const filtros = document.querySelectorAll(".filtro");

let filtroAtual = "todos";

function render() {
  const posts = getPosts();
  const termo = busca.value.toLowerCase().trim();

  const filtrados = posts.filter(post => {
    const tipoAtual = post.resolvido ? "resolvido" : post.tipo;
    const texto = `${post.titulo} ${post.local} ${post.descricao} ${post.categoria}`.toLowerCase();

    const bateBusca = texto.includes(termo);
    const bateFiltro = filtroAtual === "todos" || tipoAtual === filtroAtual;

    return bateBusca && bateFiltro;
  });

  lista.innerHTML = filtrados.map(post => cardHtml(post, false)).join("");
  vazio.classList.toggle("escondido", filtrados.length > 0);
}

busca.addEventListener("input", render);

filtros.forEach(botao => {
  botao.addEventListener("click", () => {
    filtros.forEach(item => item.classList.remove("ativo"));
    botao.classList.add("ativo");
    filtroAtual = botao.dataset.filtro;
    render();
  });
});

render();
