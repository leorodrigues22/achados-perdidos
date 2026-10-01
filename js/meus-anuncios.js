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

const container = document.querySelector("#meusAnuncios");
const vazio = document.querySelector("#semAnuncios");
const ownerId = getOwnerId();

function renderMeus() {
  const meus = getPosts().filter(post => post.ownerId === ownerId);

  container.innerHTML = meus.map(post => cardHtml(post, true)).join("");
  vazio.classList.toggle("escondido", meus.length > 0);
}

function resolverAnuncio(id) {
  const posts = getPosts();

  const atualizados = posts.map(post => {
    if (post.id === id && post.ownerId === ownerId) {
      return { ...post, resolvido: true };
    }
    return post;
  });

  savePosts(atualizados);
  renderMeus();
}

function excluirAnuncio(id) {
  const posts = getPosts();
  const anuncio = posts.find(post => post.id === id);

  if (!anuncio || anuncio.ownerId !== ownerId) {
    alert("Você não pode alterar este anúncio.");
    return;
  }

  if (!confirm("Tem certeza que deseja excluir este anúncio?")) {
    return;
  }

  const restantes = posts.filter(post => post.id !== id);
  savePosts(restantes);
  renderMeus();
}

renderMeus();
