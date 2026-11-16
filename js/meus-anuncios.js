const box = document.querySelector("#meus");
const vazio = document.querySelector("#vazio");

let meusPosts = [];

async function carregarMeusPosts() {
  if (!firebaseConfigured()) {
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

  try {
    const data = await window.AchaIFSC_DB.getItemsByIds(ids);

    const returnedIds = new Set((data || []).map(row => String(row.id)));
    ids.forEach(id => {
      if (!returnedIds.has(String(id))) forgetMyPost(id);
    });

    meusPosts = (data || []).map(dbToPost);
    render();
  } catch (error) {
    console.error(error);
    vazio.textContent = "Não foi possível carregar seus anúncios.";
  }
}

function render() {
  box.innerHTML = meusPosts.map(post => cardHtml(post, true)).join("");
  vazio.textContent = "Você ainda não publicou nada neste navegador.";
  vazio.classList.toggle("hidden", meusPosts.length > 0);

  document.querySelectorAll("[data-resolver]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Salvando...";

      try {
        await window.AchaIFSC_DB.updateItemStatus(btn.dataset.resolver, "resolvido");

        const post = meusPosts.find(item => String(item.id) === btn.dataset.resolver);
        if (post) post.resolvido = true;
        render();
      } catch (error) {
        console.error(error);
        alert("Não foi possível marcar como resolvido. Verifique se a autenticação anônima e as regras do Firebase estão configuradas.");
        btn.disabled = false;
        btn.textContent = "Marcar resolvido";
      }
    });
  });

  document.querySelectorAll("[data-excluir]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir este anúncio?")) return;

      btn.disabled = true;
      btn.textContent = "Excluindo...";

      try {
        await window.AchaIFSC_DB.deleteItem(btn.dataset.excluir);

        forgetMyPost(btn.dataset.excluir);
        meusPosts = meusPosts.filter(post => String(post.id) !== btn.dataset.excluir);
        render();
      } catch (error) {
        console.error(error);
        alert("Não foi possível excluir. Apenas o usuário anônimo que publicou o anúncio pode excluí-lo.");
        btn.disabled = false;
        btn.textContent = "Excluir";
      }
    });
  });
}

carregarMeusPosts();
