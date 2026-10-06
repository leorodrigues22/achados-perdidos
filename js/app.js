const lista = document.querySelector("#lista");
const busca = document.querySelector("#busca");
const vazio = document.querySelector("#vazio");
const filters = document.querySelectorAll(".filter");

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

carregarPosts();
