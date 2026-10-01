# AchaIFSC v2

Versão com visual mais simples e controle de autoria no navegador.

## O que mudou

- Só o navegador que criou o anúncio vê os botões de resolver/excluir.
- Criada a página `meus-anuncios.html`.
- O mural público não mostra botões de edição.
- Visual mais simples, direto e com cara de projeto acadêmico.

## Importante

Esta versão ainda usa `localStorage`.

Isso significa que a proteção de autoria funciona apenas como demonstração no navegador.
Ela não é uma autenticação real e pode ser burlada por alguém com conhecimento técnico.

Para garantir de verdade que somente o autor edite o anúncio, a próxima etapa deve usar:

- Firebase Authentication
- Firestore Security Rules
- Firebase Storage

Com Firebase, cada anúncio terá o UID do usuário logado e as regras do banco impedirão qualquer outro usuário de alterar o registro.
