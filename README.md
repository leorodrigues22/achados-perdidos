# AchaIFSC com Firebase

## O que esta versão faz
- Login e cadastro por e-mail/senha
- Todos veem os mesmos anúncios
- Fotos ficam no Firebase Storage
- Publicações ficam no Firestore
- Só o dono do anúncio pode marcar como resolvido ou excluir

## Configuração
1. Crie um projeto no Firebase.
2. Adicione um aplicativo Web.
3. Copie a configuração para `js/firebase-config.js`.
4. Em Authentication, ative Email/Password.
5. Crie o Firestore Database.
6. Cole `firestore.rules` nas regras do Firestore e publique.
7. Ative o Storage.
8. Cole `storage.rules` nas regras do Storage e publique.
9. Suba os arquivos para o GitHub e importe o repositório na Vercel.

As chaves do firebaseConfig no site não são a proteção do banco. A proteção real está nas regras do Firestore e Storage.
