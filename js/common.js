const OWNER_POSTS_KEY = "achaifsc_meus_posts";

function getMyPostIds() {
  try {
    return JSON.parse(localStorage.getItem(OWNER_POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function rememberMyPost(id) {
  const ids = getMyPostIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem(OWNER_POSTS_KEY, JSON.stringify(ids));
  }
}

function forgetMyPost(id) {
  const ids = getMyPostIds().filter(item => String(item) !== String(id));
  localStorage.setItem(OWNER_POSTS_KEY, JSON.stringify(ids));
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

function dbToPost(row) {
  return {
    id: row.id,
    tipo: row.tipo || "encontrado",
    titulo: row.nome || "Sem nome",
    categoria: row.categoria || "Outros",
    local: row.local || "",
    data: row.data || "",
    descricao: row.descricao || "",
    contato: row.contato || "",
    foto: row.foto_url || "",
    resolvido: row.status === "resolvido",
    createdAt: row.created_at || ""
  };
}

function safeBackgroundImage(data) {
  if (!data) return "";
  const value = String(data);
  if (value.startsWith("data:image/") || value.startsWith("https://") || value.startsWith("http://")) {
    return value.replaceAll("'", "%27");
  }
  return "";
}

function cardHtml(post, ownerMode) {
  const status = post.resolvido ? "resolvido" : post.tipo;
  const fotoSegura = safeBackgroundImage(post.foto);
  const foto = fotoSegura
    ? `<div class="photo" style="background-image:url('${fotoSegura}')"></div>`
    : `<div class="photo">📦</div>`;

  return `
    <article class="card">
      ${foto}
      <div class="body">
        <div class="topline">
          <span class="status ${escapeHtml(status)}">${escapeHtml(status).toUpperCase()}</span>
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

function supabaseConfigured() {
  return typeof SUPABASE_PUBLISHABLE_KEY === "string" &&
    SUPABASE_PUBLISHABLE_KEY !== "COLE_SUA_PUBLISHABLE_KEY_AQUI" &&
    SUPABASE_PUBLISHABLE_KEY.trim().length > 20;
}

function configurationMessage(element) {
  if (!element) return;
  element.classList.remove("hidden");
  element.innerHTML = `
    <strong>Falta conectar o Supabase.</strong><br>
    Abra <code>js/supabase.js</code> e cole sua <strong>Publishable key</strong>.
  `;
}
