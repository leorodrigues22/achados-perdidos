// ============================================================
// AchaIFSC - comparação inteligente de publicações
//
// A análise principal usa Transformers.js no próprio navegador,
// sem chave de IA e sem servidor extra. O modelo é baixado do
// Hugging Face na primeira análise e depois pode ficar em cache.
// Se o modelo não carregar, o site usa uma comparação local de
// palavras/categoria/local/data como plano B para não travar.
// ============================================================

(() => {
  const TRANSFORMERS_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0";
  const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
  const MAX_CANDIDATES = 24;
  const MAX_HOME_POSTS = 40;
  const AI_TIMEOUT_MS = 45000;

  let extractorPromise = null;

  const STOPWORDS = new Set([
    "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "da", "do", "das", "dos",
    "e", "ou", "em", "no", "na", "nos", "nas", "com", "sem", "para", "por", "que", "foi",
    "esta", "está", "esse", "essa", "este", "esta", "meu", "minha", "meus", "minhas", "seu",
    "sua", "perdi", "perdido", "perdida", "encontrei", "encontrado", "encontrada", "objeto",
    "coisa", "ifsc"
  ]);

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(value) {
    return normalizeText(value)
      .split(" ")
      .filter(word => word.length > 2 && !STOPWORDS.has(word));
  }

  function levenshtein(a, b) {
    a = normalizeText(a);
    b = normalizeText(b);
    if (!a) return b.length;
    if (!b) return a.length;

    const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    const current = new Array(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
      current[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + cost
        );
      }
      for (let j = 0; j <= b.length; j++) previous[j] = current[j];
    }

    return previous[b.length];
  }

  function fuzzyWordSimilarity(a, b) {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    if (!maxLen) return 1;
    return Math.max(0, 1 - levenshtein(a, b) / maxLen);
  }

  function jaccardSimilarity(a, b) {
    const setA = new Set(tokens(a));
    const setB = new Set(tokens(b));
    if (!setA.size || !setB.size) return 0;

    let intersection = 0;
    setA.forEach(word => {
      if (setB.has(word)) intersection++;
    });
    const union = new Set([...setA, ...setB]).size;
    return union ? intersection / union : 0;
  }

  function bestTokenSimilarity(a, b) {
    const wordsA = tokens(a);
    const wordsB = tokens(b);
    if (!wordsA.length || !wordsB.length) return 0;

    let total = 0;
    let used = 0;

    for (const wordA of wordsA) {
      let best = 0;
      for (const wordB of wordsB) {
        if (Math.abs(wordA.length - wordB.length) > 3) continue;
        best = Math.max(best, fuzzyWordSimilarity(wordA, wordB));
      }
      if (best >= 0.68) {
        total += best;
        used++;
      }
    }

    return used ? total / Math.max(wordsA.length, wordsB.length) : 0;
  }

  function lexicalSimilarity(a, b) {
    return Math.max(jaccardSimilarity(a, b), bestTokenSimilarity(a, b));
  }

  function categorySimilarity(a, b) {
    const ca = normalizeText(a);
    const cb = normalizeText(b);
    if (!ca || !cb) return 0;
    if (ca === cb) return 1;
    if (ca === "outros" || cb === "outros") return 0.25;
    return lexicalSimilarity(ca, cb) * 0.6;
  }

  function dateSimilarity(a, b) {
    if (!a || !b) return 0.2;
    const da = new Date(`${a}T12:00:00`);
    const db = new Date(`${b}T12:00:00`);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 0.2;

    const days = Math.abs(da - db) / 86400000;
    if (days <= 1) return 1;
    if (days <= 3) return 0.92;
    if (days <= 7) return 0.78;
    if (days <= 14) return 0.58;
    if (days <= 30) return 0.35;
    if (days <= 60) return 0.15;
    return 0.05;
  }

  function normalizePost(post) {
    return {
      id: post.id,
      tipo: post.tipo || "",
      titulo: post.titulo ?? post.nome ?? "",
      descricao: post.descricao || "",
      categoria: post.categoria || "Outros",
      local: post.local || "",
      data: post.data || "",
      contato: post.contato || "",
      foto: post.foto ?? post.foto_url ?? "",
      resolvido: post.resolvido === true || post.status === "resolvido",
      createdAt: post.createdAt ?? post.created_at ?? ""
    };
  }

  function semanticText(post) {
    const p = normalizePost(post);
    return [
      `Objeto: ${p.titulo}.`,
      `Categoria: ${p.categoria}.`,
      `Descrição: ${p.descricao}.`,
      `Local: ${p.local}.`
    ].join(" ");
  }

  function heuristicParts(a, b) {
    const pa = normalizePost(a);
    const pb = normalizePost(b);
    const objectA = `${pa.titulo} ${pa.descricao}`;
    const objectB = `${pb.titulo} ${pb.descricao}`;

    return {
      lexical: lexicalSimilarity(objectA, objectB),
      category: categorySimilarity(pa.categoria, pb.categoria),
      local: lexicalSimilarity(pa.local, pb.local),
      date: dateSimilarity(pa.data, pb.data)
    };
  }

  function heuristicScore(a, b) {
    const parts = heuristicParts(a, b);
    return (
      parts.lexical * 0.58 +
      parts.category * 0.22 +
      parts.local * 0.10 +
      parts.date * 0.10
    );
  }

  function finalScore(a, b, semantic) {
    const parts = heuristicParts(a, b);
    return Math.max(0, Math.min(1,
      semantic * 0.62 +
      parts.lexical * 0.12 +
      parts.category * 0.13 +
      parts.local * 0.06 +
      parts.date * 0.07
    ));
  }

  function dotProduct(a, b) {
    const len = Math.min(a.length, b.length);
    let total = 0;
    for (let i = 0; i < len; i++) total += a[i] * b[i];
    return total;
  }

  function withTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Tempo limite ao carregar a IA.")), timeoutMs);
      Promise.resolve(promise).then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    });
  }

  async function getExtractor(onStatus = () => {}) {
    if (!extractorPromise) {
      onStatus("Carregando o modelo de IA pela primeira vez...");
      extractorPromise = import(TRANSFORMERS_CDN)
        .then(async ({ pipeline }) => {
          const extractor = await pipeline("feature-extraction", MODEL_ID, {
            progress_callback: info => {
              if (info?.status === "progress" && Number.isFinite(info.progress)) {
                const pct = Math.round(info.progress);
                if (pct === 25 || pct === 50 || pct === 75 || pct === 100) {
                  onStatus(`Baixando modelo de IA... ${pct}%`);
                }
              }
            }
          });
          onStatus("Modelo de IA pronto. Comparando publicações...");
          return extractor;
        })
        .catch(error => {
          extractorPromise = null;
          throw error;
        });
    } else {
      onStatus("Comparando publicações com IA...");
    }

    return extractorPromise;
  }

  async function embedTexts(texts, onStatus) {
    const extractor = await withTimeout(getExtractor(onStatus), AI_TIMEOUT_MS);
    const output = await withTimeout(
      extractor(texts, { pooling: "mean", normalize: true }),
      AI_TIMEOUT_MS
    );
    return output.tolist();
  }

  function minimumScore(a, b) {
    const parts = heuristicParts(a, b);
    // Mesma categoria dá um pouco mais de tolerância. Se a categoria for diferente,
    // exigimos mais confiança semântica para evitar falsos positivos.
    return parts.category >= 0.95 ? 0.66 : 0.73;
  }

  async function fetchOppositeCandidates(newPost) {
    const p = normalizePost(newPost);
    const opposite = p.tipo === "perdido" ? "encontrado" : "perdido";

    if (!window.supabaseClient || !opposite) return [];

    const { data, error } = await window.supabaseClient
      .from("itens")
      .select("id,nome,descricao,categoria,tipo,local,data,contato,foto_url,status,created_at")
      .eq("tipo", opposite)
      .neq("status", "resolvido")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) throw error;

    return (data || [])
      .filter(row => String(row.id) !== String(p.id))
      .map(normalizePost);
  }

  function prefilterCandidates(newPost, candidates) {
    return candidates
      .map(post => ({ post, quick: heuristicScore(newPost, post) }))
      .filter(item => {
        const parts = heuristicParts(newPost, item.post);
        return item.quick >= 0.13 || parts.category >= 0.95 || parts.lexical >= 0.18;
      })
      .sort((a, b) => b.quick - a.quick)
      .slice(0, MAX_CANDIDATES);
  }

  async function findMatchesForPost(newPost, options = {}) {
    const onStatus = typeof options.onStatus === "function" ? options.onStatus : () => {};
    const candidates = await fetchOppositeCandidates(newPost);

    if (!candidates.length) return { matches: [], usedAI: false, fallback: false };

    const filtered = prefilterCandidates(newPost, candidates);
    if (!filtered.length) return { matches: [], usedAI: false, fallback: false };

    try {
      const texts = [semanticText(newPost), ...filtered.map(item => semanticText(item.post))];
      const embeddings = await embedTexts(texts, onStatus);
      const base = embeddings[0];

      const matches = filtered
        .map((item, index) => {
          const semantic = Math.max(0, Math.min(1, dotProduct(base, embeddings[index + 1])));
          const score = finalScore(newPost, item.post, semantic);
          return {
            post: item.post,
            score,
            semantic,
            source: "ia"
          };
        })
        .filter(match => match.score >= minimumScore(newPost, match.post))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return { matches, usedAI: true, fallback: false };
    } catch (error) {
      console.warn("A IA não pôde ser carregada; usando comparação local.", error);
      onStatus("A IA não carregou neste dispositivo. Fazendo uma comparação local...");

      const matches = filtered
        .map(item => ({
          post: item.post,
          score: item.quick,
          semantic: null,
          source: "local"
        }))
        .filter(match => match.score >= 0.52)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return { matches, usedAI: false, fallback: true, error };
    }
  }

  function pairKey(a, b) {
    return [String(a.id), String(b.id)].sort().join("::");
  }

  async function analyzeAll(posts, options = {}) {
    const onStatus = typeof options.onStatus === "function" ? options.onStatus : () => {};
    const active = posts
      .map(normalizePost)
      .filter(post => !post.resolvido && (post.tipo === "perdido" || post.tipo === "encontrado"))
      .slice(0, MAX_HOME_POSTS);

    const lost = active.filter(post => post.tipo === "perdido");
    const found = active.filter(post => post.tipo === "encontrado");
    if (!lost.length || !found.length) return { matches: [], usedAI: false, fallback: false };

    const candidatePairs = [];
    const seen = new Set();

    for (const a of lost) {
      for (const b of found) {
        const key = pairKey(a, b);
        if (seen.has(key)) continue;
        seen.add(key);

        const quick = heuristicScore(a, b);
        const parts = heuristicParts(a, b);
        if (quick >= 0.12 || parts.category >= 0.95 || parts.lexical >= 0.16) {
          candidatePairs.push({ a, b, quick });
        }
      }
    }

    if (!candidatePairs.length) return { matches: [], usedAI: false, fallback: false };

    const unique = [];
    const byId = new Map();
    for (const pair of candidatePairs) {
      for (const post of [pair.a, pair.b]) {
        const id = String(post.id);
        if (!byId.has(id)) {
          byId.set(id, unique.length);
          unique.push(post);
        }
      }
    }

    try {
      onStatus("Preparando as publicações para a IA...");
      const embeddings = await embedTexts(unique.map(semanticText), onStatus);

      const matches = candidatePairs
        .map(pair => {
          const embA = embeddings[byId.get(String(pair.a.id))];
          const embB = embeddings[byId.get(String(pair.b.id))];
          const semantic = Math.max(0, Math.min(1, dotProduct(embA, embB)));
          const score = finalScore(pair.a, pair.b, semantic);
          return { lost: pair.a, found: pair.b, score, semantic, source: "ia" };
        })
        .filter(match => match.score >= minimumScore(match.lost, match.found))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      return { matches, usedAI: true, fallback: false };
    } catch (error) {
      console.warn("A IA não pôde ser carregada; usando comparação local.", error);
      onStatus("A IA não carregou neste dispositivo. Fazendo uma comparação local...");

      const matches = candidatePairs
        .filter(pair => pair.quick >= 0.52)
        .sort((a, b) => b.quick - a.quick)
        .slice(0, 8)
        .map(pair => ({ lost: pair.a, found: pair.b, score: pair.quick, semantic: null, source: "local" }));

      return { matches, usedAI: false, fallback: true, error };
    }
  }

  window.AchaIFSC_AI = {
    findMatchesForPost,
    analyzeAll,
    normalizePost
  };
})();
