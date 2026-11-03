# AchaIFSC

Plataforma web de achados e perdidos para a comunidade do IFSC.

## Esta versão usa

- HTML, CSS e JavaScript
- Firebase Realtime Database para os anúncios
- Firebase Anonymous Authentication para proteger edição/exclusão
- Transformers.js + MiniLM para comparação semântica no navegador
- Cloudflare Pages para hospedagem estática

## Para configurar

Leia:

`README-FIREBASE-CLOUDFLARE.md`

## Arquivos importantes

- `js/firebase.js` — configuração do seu projeto Firebase
- `firebase-realtime-database-rules.json` — regras para colar no Firebase
- `js/ai-match.js` — módulo de IA
- `js/app.js` — mural
- `js/publicar.js` — publicação
- `js/meus-anuncios.js` — gerenciamento dos próprios anúncios
