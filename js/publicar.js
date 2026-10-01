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

const form = document.querySelector("#formPublicar");
const descricao = document.querySelector("#descricao");
const contador = document.querySelector("#contador");
const foto = document.querySelector("#foto");
const preview = document.querySelector("#preview");
const dataInput = document.querySelector("#data");

let fotoBase64 = "";

dataInput.value = new Date().toISOString().split("T")[0];

const params = new URLSearchParams(location.search);
const tipo = params.get("tipo");

if (tipo === "perdido" || tipo === "encontrado") {
  const radio = document.querySelector(`input[name="tipo"][value="${tipo}"]`);
  if (radio) radio.checked = true;
}

descricao.addEventListener("input", () => {
  contador.textContent = descricao.value.length;
});

foto.addEventListener("change", () => {
  const arquivo = foto.files[0];
  if (!arquivo) return;

  const reader = new FileReader();

  reader.onload = e => {
    fotoBase64 = e.target.result;
    preview.style.backgroundImage = `url('${fotoBase64}')`;
    preview.classList.remove("escondido");
  };

  reader.readAsDataURL(arquivo);
});

form.addEventListener("submit", e => {
  e.preventDefault();

  const dados = new FormData(form);

  const novo = {
    id: Date.now(),
    ownerId: getOwnerId(),
    tipo: dados.get("tipo"),
    titulo: dados.get("titulo").trim(),
    categoria: dados.get("categoria"),
    local: dados.get("local").trim(),
    data: dados.get("data"),
    descricao: dados.get("descricao").trim(),
    contato: dados.get("contato").trim(),
    foto: fotoBase64,
    resolvido: false
  };

  const posts = getPosts();
  posts.unshift(novo);
  savePosts(posts);

  location.href = "meus-anuncios.html";
});
