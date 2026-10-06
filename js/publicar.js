const form = document.querySelector("#postForm");
const dataInput = document.querySelector("#data");
const fotoInput = document.querySelector("#foto");
const preview = document.querySelector("#preview");
const msg = document.querySelector("#msg");
const submitButton = form.querySelector('button[type="submit"]');

let fotoBase64 = "";

dataInput.value = new Date().toISOString().split("T")[0];

const tipoUrl = new URLSearchParams(location.search).get("tipo");
if (tipoUrl === "perdido" || tipoUrl === "encontrado") {
  const radio = document.querySelector(`input[name="tipo"][value="${tipoUrl}"]`);
  if (radio) radio.checked = true;
}

function comprimirImagem(file, maxSize = 1000, quality = 0.78) {
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
    preview.style.backgroundImage = `url('${fotoBase64}')`;
    preview.classList.remove("hidden");
    msg.textContent = "";
  } catch (error) {
    console.error(error);
    msg.textContent = "Não foi possível processar essa foto.";
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!supabaseConfigured()) {
    msg.style.color = "#b73b3b";
    msg.textContent = "Cole sua Publishable key em js/supabase.js antes de publicar.";
    return;
  }

  const dados = new FormData(form);

  const novoItem = {
    nome: dados.get("titulo").trim(),
    descricao: dados.get("descricao").trim(),
    categoria: dados.get("categoria"),
    tipo: dados.get("tipo"),
    local: dados.get("local").trim(),
    data: dados.get("data"),
    contato: dados.get("contato").trim(),
    foto_url: fotoBase64 || null,
    status: "ativo"
  };

  submitButton.disabled = true;
  submitButton.textContent = "Publicando...";
  msg.textContent = "";

  const { data, error } = await window.supabaseClient
    .from("itens")
    .insert(novoItem)
    .select("id")
    .single();

  if (error) {
    console.error(error);
    msg.style.color = "#b73b3b";
    msg.textContent = "Não foi possível publicar. Confira a chave e as políticas do Supabase.";
    submitButton.disabled = false;
    submitButton.textContent = "Publicar";
    return;
  }

  rememberMyPost(data.id);

  msg.style.color = "#178447";
  msg.textContent = "Publicado no banco online com sucesso ✅";

  setTimeout(() => {
    location.href = "index.html";
  }, 700);
});
