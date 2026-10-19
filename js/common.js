const OWNER_POSTS_KEY = "achaifsc_meus_posts";

function getMyPostIds() {
  try {
    return JSON.parse(
      localStorage.getItem(OWNER_POSTS_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function rememberMyPost(id) {
  const ids = getMyPostIds();
  const value = String(id);

  if (!ids.some(item => String(item) === value)) {
    ids.unshift(value);

    localStorage.setItem(
      OWNER_POSTS_KEY,
      JSON.stringify(ids)
    );
  }
}

function forgetMyPost(id) {
  const ids = getMyPostIds().filter(
    item => String(item) !== String(id)
  );

  localStorage.setItem(
    OWNER_POSTS_KEY,
    JSON.stringify(ids)
  );
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

  return new Date(
    dateString + "T12:00:00"
  ).toLocaleDateString("pt-BR");
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

  if (
    value.startsWith("data:image/") ||
    value.startsWith("https://") ||
    value.startsWith("http://")
  ) {
    return value.replaceAll("'", "%27");
  }

  return "";
}


/* =========================================
   CONTATO
   SOMENTE E-MAIL É CLICÁVEL
========================================= */

function contactLink(contato, label = "") {
  const value = String(contato || "").trim();

  if (!value) {
    return `
      <span class="contact-text">
        Contato não informado
      </span>
    `;
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // E-mail vira link
  if (emailRegex.test(value)) {
    return `
      <a
        class="contact-link email-link"
        href="mailto:${encodeURIComponent(value)}"
      >
        ✉ ${label || escapeHtml(value)}
      </a>
    `;
  }

  // Instagram, telefone ou qualquer outro contato:
  // apenas mostra como texto
  return `
    <span class="contact-text">
      💬 ${escapeHtml(value)}
    </span>
  `;
}


/* =========================================
   CARD
========================================= */

function cardHtml(post, ownerMode) {
  const status =
    post.resolvido
      ? "resolvido"
      : post.tipo;

  const fotoSegura =
    safeBackgroundImage(post.foto);

  const foto =
    fotoSegura
      ? `
        <div
          class="photo"
          style="background-image:url('${fotoSegura}')"
        ></div>
      `
      : `
        <div class="photo">
          📦
        </div>
      `;

  return `
    <article class="card">

      ${foto}

      <div class="body">

        <div class="topline">

          <span
            class="status ${escapeHtml(status)}"
          >
            ${escapeHtml(status).toUpperCase()}
          </span>

          <small>
            ${escapeHtml(post.categoria)}
          </small>

        </div>

        <h3>
          ${escapeHtml(post.titulo)}
        </h3>

        <p>
          ${escapeHtml(post.descricao)}
        </p>

        <div class="meta">

          <span>
            📍 ${escapeHtml(post.local)}
          </span>

          <span>
            📅 ${formatDate(post.data)}
          </span>

          <div class="card-contact">
            ${contactLink(post.contato)}
          </div>

        </div>

        ${
          ownerMode
            ? `
              <div class="cardActions">

                ${
                  post.resolvido
                    ? ""
                    : `
                      <button
                        class="btn secondary"
                        data-resolver="${escapeHtml(post.id)}"
                      >
                        Marcar resolvido
                      </button>
                    `
                }

                <button
                  class="btn danger"
                  data-excluir="${escapeHtml(post.id)}"
                >
                  Excluir
                </button>

              </div>
            `
            : ""
        }

      </div>

    </article>
  `;
}


/* =========================================
   FIREBASE
========================================= */

function firebaseConfigured() {
  return Boolean(
    window.AchaIFSC_DB?.isConfigured?.()
  );
}

function configurationMessage(element) {
  if (!element) return;

  element.classList.remove("hidden");

  element.innerHTML = `
    <strong>
      Falta conectar o Firebase.
    </strong>

    <br>

    Abra
    <code>js/firebase.js</code>
    e cole a configuração do seu
    aplicativo Web do Firebase.
  `;
}