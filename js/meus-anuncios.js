const box = document.querySelector("#meus");
const vazio = document.querySelector("#vazio");

let meusPosts = [];

async function carregarMeusPosts() {
  if (!supabaseConfigured()) {
    configurationMessage(vazio);
    return;
  }

  const ids = getMyPostIds();

  if (!ids.length) {
    box.innerHTML = "";
    vazio.textContent = "Você ainda não publicou nada neste navegador.";
    vazio.classList.remove("hidden");
    return;
  }

  vazio.textContent = "Carregando seus anúncios...";
  vazio.classList.remove("hidden");

  const { data, error } = await window.supabaseClient
    .from("itens")
    .select("id,nome,descricao,categoria,tipo,local,data,contato,foto_url,status,created_at")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    vazio.textContent = "Não foi possível carregar seus anúncios.";
    return;
  }

  const returnedIds = new Set((data || []).map(row => String(row.id)));
  ids.forEach(id => {
    if (!returnedIds.has(String(id))) forgetMyPost(id);
  });

  meusPosts = (data || []).map(dbToPost);
  render();
}

function render() {
  box.innerHTML = meusPosts.map(post => cardHtml(post, true)).join("");
  vazio.textContent = "Você ainda não publicou nada neste navegador.";
  vazio.classList.toggle("hidden", meusPosts.length > 0);

  document.querySelectorAll("[data-resolver]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Salvando...";

      const { error } = await window.supabaseClient
        .from("itens")
        .update({ status: "resolvido" })
        .eq("id", btn.dataset.resolver);

      if (error) {
        console.error(error);
        alert("Não foi possível marcar como resolvido. Rode o arquivo CONFIGURAR_BANCO.sql no Supabase.");
        btn.disabled = false;
        btn.textContent = "Marcar resolvido";
        return;
      }

      const post = meusPosts.find(item => String(item.id) === btn.dataset.resolver);
      if (post) post.resolvido = true;
      render();
    });
  });

  document.querySelectorAll("[data-excluir]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir este anúncio?")) return;

      btn.disabled = true;
      btn.textContent = "Excluindo...";

      const { error } = await window.supabaseClient
        .from("itens")
        .delete()
        .eq("id", btn.dataset.excluir);

      if (error) {
        console.error(error);
        alert("Não foi possível excluir. Rode o arquivo CONFIGURAR_BANCO.sql no Supabase.");
        btn.disabled = false;
        btn.textContent = "Excluir";
        return;
      }

      forgetMyPost(btn.dataset.excluir);
      meusPosts = meusPosts.filter(post => String(post.id) !== btn.dataset.excluir);
      render();
    });
  });
}

carregarMeusPosts();
