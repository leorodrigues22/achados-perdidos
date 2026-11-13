const form = document.querySelector("#postForm");
const dataInput = document.querySelector("#data");
const fotoInput = document.querySelector("#foto");
const preview = document.querySelector("#preview");
const msg = document.querySelector("#msg");
const aiStatus = document.querySelector("#aiStatus");
const matchBox = document.querySelector("#matchBox");
const submitButton = form.querySelector('button[type="submit"]');
const submitOriginalText = submitButton.textContent;

let fotoBase64 = "";

dataInput.value = new Date().toISOString().split("T")[0];

const tipoUrl = new URLSearchParams(location.search).get("tipo");
if (tipoUrl === "encontrado") {
  const radio = document.querySelector(`input[name="tipo"][value="${tipoUrl}"]`);
  if (radio) radio.checked = true;
}

function comprimirImagem(file, maxSize = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

fotoInput.addEventListener("change", async () => {
  const arquivo = fotoInput.files[0];
  if (!arquivo) {
    fotoBase64 = "";
    preview.classList.add("hidden");
    return;
  }

  if (!arquivo.type.startsWith("image/")) {
    msg.textContent = "Selecione uma imagem válida.";
    fotoInput.value = "";
    return;
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    msg.textContent = "A imagem é muito grande. Escolha uma foto de até 10 MB.";
    fotoInput.value = "";
    return;
  }

  try {
    fotoBase64 = await comprimirImagem(arquivo);

    if (fotoBase64.length > 850000) {
      fotoBase64 = "";
      fotoInput.value = "";
      preview.classList.add("hidden");
      msg.textContent = "A foto ainda ficou muito grande após a compressão. Escolha outra imagem.";
      return;
    }

    preview.style.backgroundImage = `url('${fotoBase64}')`;
    preview.classList.remove("hidden");
    msg.textContent = "";
  } catch (error) {
    console.error(error);
    msg.textContent = "Não foi possível processar essa foto.";
  }
});

function updateAiStatus(text) {
  aiStatus.textContent = text;
  aiStatus.classList.toggle("hidden", !text);
}

function renderPossibleMatches(result) {
  const matches = result?.matches || [];
  if (!matches.length) {
    matchBox.classList.add("hidden");
    matchBox.innerHTML = "";
    return;
  }

  const modeText = result.usedAI
    ? "A IA encontrou publicações que podem ser do mesmo objeto."
    : "A comparação local encontrou publicações parecidas.";

  matchBox.innerHTML = `
    <div class="ai-match-title">🤖 Possível correspondência encontrada</div>
    <p>${escapeHtml(modeText)} Confira os detalhes antes de entrar em contato.</p>
    <div class="ai-match-list">
      ${matches.map(match => {
        const post = match.post;
        const pct = Math.round(match.score * 100);
        return `
          <div class="ai-match-item">
            <div class="ai-match-score">${pct}%</div>
            <div>
              <strong>${escapeHtml(post.titulo)}</strong>
              <div class="ai-match-meta">
                ${escapeHtml(post.categoria)} • ${escapeHtml(post.local)} • ${formatDate(post.data)}
              </div>
              <div>${escapeHtml(post.descricao)}</div>
              <div class="ai-match-contact">${contactLink(post.contato)}</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
    <div class="ai-match-actions">
      <a class="btn" href="index.html">Ir para o mural</a>
    </div>
    <small class="ai-disclaimer">A porcentagem é uma estimativa. A IA não confirma que seja o mesmo objeto.</small>
  `;
  matchBox.classList.remove("hidden");
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!firebaseConfigured()) {
    msg.style.color = "#b73b3b";
    msg.textContent = "Configure o Firebase em js/firebase.js antes de publicar.";
    return;
  }

  const dados = new FormData(form);

  const novoItem = {
    nome: dados.get("titulo").trim(),
    descricao: dados.get("descricao").trim(),
    categoria: dados.get("categoria"),
    tipo: "encontrado",
    local: dados.get("local").trim(),
    data: dados.get("data"),
    contato: dados.get("contato").trim(),
    foto_url: fotoBase64 || null,
    status: "ativo"
  };

  submitButton.disabled = true;
  submitButton.textContent = "Publicando...";
  msg.textContent = "";
  updateAiStatus("");
  matchBox.classList.add("hidden");

  let data;

  try {
    data = await window.AchaIFSC_DB.addItem(novoItem);
  } catch (error) {
    console.error(error);
    msg.style.color = "#b73b3b";
    msg.textContent = `Não foi possível publicar. ${error.message || "Confira o Firebase."}`;
    submitButton.disabled = false;
    submitButton.textContent = submitOriginalText;
    return;
  }

  // Publicação já foi gravada no Firebase. A busca acontece pelo chat.
  rememberMyPost(data.id);
  msg.style.color = "#178447";
  msg.textContent = "Objeto publicado com sucesso! Abrindo o mural...";
  submitButton.textContent = "Publicado ✓";
  form.reset();
  fotoBase64 = "";
  preview.classList.add("hidden");
  window.setTimeout(() => {
    location.href = "mural.html?item=" + encodeURIComponent(data.id);
  }, 1000);
});
