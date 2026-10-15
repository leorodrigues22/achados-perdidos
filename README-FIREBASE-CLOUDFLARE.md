# AchaIFSC — Firebase + Cloudflare Pages

Esta versão NÃO usa mais Supabase.

## O que foi mantido

- mesmo visual do projeto
- páginas Mural, Perdi, Encontrei e Meus anúncios
- pesquisa e filtros
- IA local com Transformers.js + MiniLM
- comparação local como plano B
- imagens comprimidas no navegador
- contato clicável para WhatsApp, Instagram e e-mail

## O que mudou

- Supabase foi removido
- anúncios agora usam Firebase Realtime Database
- autoria usa Firebase Anonymous Authentication
- projeto está pronto para hospedagem estática no Cloudflare Pages

---

## 1. Criar o projeto no Firebase

Entre no Firebase Console e crie um projeto chamado, por exemplo, `achaifsc`.

### Criar aplicativo Web

No projeto:

1. Adicione um aplicativo Web (`</>`).
2. Dê o nome `AchaIFSC`.
3. O Firebase mostrará um objeto `firebaseConfig`.
4. Copie os valores para `js/firebase.js`.

O arquivo tem este bloco:

```js
const FIREBASE_CONFIG = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  databaseURL: "https://SEU-PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};
```

Se `databaseURL` não vier no objeto do app, copie a URL exibida na tela do Realtime Database.

---

## 2. Ativar Realtime Database

No Firebase Console:

1. Build > Realtime Database.
2. Clique em criar banco.
3. Escolha uma região disponível.
4. Pode criar em modo bloqueado, porque vamos substituir as regras.
5. Abra a aba **Rules**.
6. Copie TODO o conteúdo de `firebase-realtime-database-rules.json`.
7. Cole nas regras e publique.

As regras deixam o mural público para leitura, mas somente o usuário anônimo que criou um anúncio pode alterá-lo ou excluí-lo.

---

## 3. Ativar autenticação anônima

No Firebase Console:

1. Build > Authentication.
2. Get started.
3. Sign-in method.
4. Ative **Anonymous**.

Não aparece tela de login no site. O Firebase cria uma identificação silenciosa no navegador.

---

## 4. Testar

Você pode abrir com Live Server ou outro servidor estático.

Ao publicar:

- o anúncio vai para `/itens` no Realtime Database
- a foto fica como imagem Base64 comprimida no próprio registro
- o navegador guarda o ID do anúncio em `localStorage`
- Firebase Auth garante que só o autor anônimo pode resolver/excluir

---

## 5. Publicar no Cloudflare Pages

A pasta é totalmente estática. Não precisa Node, npm ou servidor próprio.

### Pelo GitHub

1. Suba esta pasta para um repositório GitHub.
2. No Cloudflare Dashboard, abra **Workers & Pages**.
3. Crie uma aplicação Pages e conecte o GitHub.
4. Selecione o repositório.
5. Framework preset: `None`.
6. Build command: deixe vazio.
7. Build output directory: `/` ou a raiz do projeto, conforme a tela solicitar.
8. Faça o deploy.

O resultado será um endereço parecido com:

```text
https://achaifsc.pages.dev
```

O site continuará disponível mesmo com seu computador desligado.

---

## Limites e observações

Esta versão guarda fotos comprimidas no Realtime Database para evitar depender do Firebase Storage e de faturamento. Isso é adequado para um MVP escolar com volume pequeno.

O projeto reduz a imagem antes do envio. Evite fotos enormes ou muitas milhares de publicações.

Planos gratuitos podem mudar no futuro. Nenhum provedor consegue garantir condições gratuitas literalmente para sempre.
