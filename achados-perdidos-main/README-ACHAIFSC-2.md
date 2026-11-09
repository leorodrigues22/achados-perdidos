# AchaIFSC 2.0 (protótipo funcional)

A página inicial agora é um chat de busca guiada nos anúncios do Firebase Realtime Database. O mural original está em `mural.html`; as páginas de publicação foram preservadas.

**Importante:** o chat atual NÃO é IA generativa: faz busca por palavras e mostra anúncios reais. Para implementar conversas livres com um modelo de IA, será necessária uma API no servidor (por exemplo, função da Vercel), com chave protegida, controle de custos e validação.

Para publicar: habilite autenticação anônima no Firebase, confira `js/firebase.js`, configure o Realtime Database e aplique `firebase-realtime-database-rules.json`. Depois publique na Vercel. Não é necessário manter o computador ligado.
