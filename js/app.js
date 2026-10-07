const lista = document.querySelector("#lista");
const busca = document.querySelector("#busca");
const vazio = document.querySelector("#vazio");
const filters = document.querySelectorAll(".filter");
const analisarIABtn = document.querySelector("#analisarIA");
const iaHomeBox = document.querySelector("#iaHomeBox");

let filtro = "todos";
let posts = [];

function render() {
  const termo = busca.value.trim().toLowerCase();

  const encontrados = posts.filter(post => {
    const status = post.resolvido ? "resolvido" : post.tipo;
    const texto = `${post.titulo} ${post.local} ${post.descricao} ${post.categoria}`.toLowerCase();

    return texto.includes(termo) &&
      (filtro === "todos" || status === filtro);
  });

  lista.innerHTML = encontrados.map(post => cardHtml(post, false)).join("");
  vazio.textContent = "Nenhum anúncio encontrado.";
  vazio.classList.toggle("hidden", encontrados.length > 0);
}

function renderHomeMatches(result) {
  const matches = result?.matches || [];

  if (!matches.length) {
    iaHomeBox.innerHTML = `
      <div class="ai-match-title">🤖 Análise concluída</div>
      <p>Não encontrei nenhuma correspondência forte entre os anúncios ativos agora.</p>
      <small class="ai-disclaimer">Isso não significa que não exista uma combinação. A análise usa texto, categoria, local e data.</small>
    `;
    iaHomeBox.classList.remove("hidden");
    return;
  }

  const mode = result.usedAI ? "IA" : "comparação local";

  iaHomeBox.innerHTML = `
    <div class="ai-match-title">🤖 Possíveis correspondências</div>
    <p>Encontrei ${matches.length} par${matches.length === 1 ? "" : "es"} parecido${matches.length === 1 ? "" : "s"} usando ${mode}. Confira antes de assumir que é o mesmo objeto.</p>
    <div class="ai-pair-list">
      ${matches.map(match => {
        const pct = Math.round(match.score * 100);
        return `
          <div class="ai-pair-item">
            <div class="ai-match-score">${pct}%</div>
            <div class="ai-pair-content">
              <div><span class="status perdido">PERDIDO</span> <strong>${escapeHtml(match.lost.titulo)}</strong></div>
              <div class="ai-pair-arrow">↕ pode corresponder a</div>
              <div><span class="status encontrado">ENCONTRADO</span> <strong>${escapeHtml(match.found.titulo)}</strong></div>
              <div class="ai-match-meta">
                ${escapeHtml(match.lost.categoria)} • ${escapeHtml(match.lost.local)} / ${escapeHtml(match.found.local)}
              </div>
              <div class="ai-pair-contacts">
                Contatos: ${escapeHtml(match.lost.contato)} • ${escapeHtml(match.found.contato)}
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
    <small class="ai-disclaimer">A porcentagem é uma estimativa. A IA não confirma propriedade nem identidade do objeto.</small>
  `;
  iaHomeBox.classList.remove("hidden");
}

async function carregarPosts() {
  if (!supabaseConfigured()) {
    configurationMessage(vazio);
    return;
  }

  vazio.textContent = "Carregando publicações...";
  vazio.classList.remove("hidden");

  const { data, error } = await window.supabaseClient
    .from("itens")
    .select("id,nome,descricao,categoria,tipo,local,data,contato,foto_url,status,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    vazio.textContent = "Não foi possível carregar as publicações. Confira a chave do Supabase.";
    return;
  }

  posts = (data || []).map(dbToPost);
  render();
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

if (analisarIABtn) {
  analisarIABtn.addEventListener("click", async () => {
    if (!posts.length) {
      iaHomeBox.innerHTML = `<div class="ai-match-title">🤖 Análise</div><p>Cadastre pelo menos um item perdido e um encontrado para comparar.</p>`;
      iaHomeBox.classList.remove("hidden");
      return;
    }

    analisarIABtn.disabled = true;
    analisarIABtn.textContent = "🤖 Analisando...";
    iaHomeBox.innerHTML = `<div class="ai-match-title">🤖 IA trabalhando</div><p id="iaHomeStatus">Preparando as publicações...</p>`;
    iaHomeBox.classList.remove("hidden");

    try {
      const result = await window.AchaIFSC_AI.analyzeAll(posts, {
        onStatus: text => {
          const status = document.querySelector("#iaHomeStatus");
          if (status) status.textContent = text;
        }
      });
      renderHomeMatches(result);
    } catch (error) {
      console.error(error);
      iaHomeBox.innerHTML = `
        <div class="ai-match-title">🤖 Não consegui analisar agora</div>
        <p>As publicações continuam salvas normalmente. Tente novamente com internet ativa.</p>
      `;
      iaHomeBox.classList.remove("hidden");
    } finally {
      analisarIABtn.disabled = false;
      analisarIABtn.textContent = "🤖 Ver possíveis correspondências";
    }
  });
}

carregarPosts();
