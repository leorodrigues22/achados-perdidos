# AchaIFSC | Vercel + Firebase

## Falha identificada
O ZIP recebido tinha uma segunda cópia antiga do projeto dentro de `achados-perdidos-main/achados-perdidos-main/`, enquanto a raiz não continha `js/firebase.js`, `js/app.js` e `js/chat.js`. Isso causava erros HTTP 404, deixava o mural vazio e impedia a publicação. Nesta versão há **uma única raiz**, com os arquivos completos.

## Publicação
1. Faça backup da branch main do GitHub, se quiser preservar a versão anterior.
2. Extraia o ZIP. Coloque o **conteúdo** da pasta `AchaIFSC_Vercel_Corrigido` na raiz do repositório (não a pasta inteira).
3. Confirme que `index.html`, `mural.html`, `encontrado.html`, `perdido.html`, `vercel.json` e as pastas `js/`, `css/`, `api/` estão na mesma raiz.
4. No painel Vercel confirme Project > Settings > Build and Deployment > Root Directory = raiz do repo; Framework Preset = Other. Não configure um Output Directory personalizado.
5. Confirme que o Git conectado é o repositório certo e a Production Branch é `main`; faça um commit e abra o domínio de produção na implantação mais recente.
6. Em Vercel > Settings > Environment Variables configure `GEMINI_API_KEY` para a IA opcional. **Não coloque a chave no GitHub**. Confirme se o modelo `GEMINI_MODEL` definido na sua Vercel está disponível para sua conta, ou retire a variável para usar o padrão do código. Após mudanças nas variáveis, faça Redeploy.

## Firebase
O `js/firebase.js` foi restaurado com a configuração Web já fornecida do projeto `achaifsc` e o endereço `https://achaifsc-default-rtdb.firebaseio.com`. Isso **não** cria nem muda o Firebase no painel.

Em console.firebase.google.com, escolha o projeto `achaifsc`:
- Authentication > Sign-in method > **Anonymous = Enabled**. Necessário para novas publicações.
- Realtime Database > Data: o código consulta/salva em **`itens/`**. Não apague registros antigos.
- Realtime Database > Rules: compare com `firebase-realtime-database-rules.json` deste pacote. O arquivo JSON no GitHub **não aplica regras automaticamente**; copie as regras pelo console se necessário, após revisar. Nunca habilite escrita pública (`.write: true`).
- Se aparecer `auth/unauthorized-domain`, avalie adicionar o domínio da Vercel em Authentication > Settings > Authorized domains.

### Validação
Abra `https://SEU-DOMINIO-DA-VERCEL.vercel.app/js/firebase.js` e `/js/app.js` (deve mostrar JavaScript e não 404). Abra `/mural.html` para ver anúncios antigos, `/encontrado.html` e `/perdido.html` para publicar anúncios de teste. Confira registros na aba `itens` do Firebase e depois retire anúncios de teste pelo próprio site.

## Observações
- GitHub é **repositório de código**, Vercel é **hospedagem**, Firebase é **banco de dados**. Commit no GitHub dispara um novo deploy na Vercel se integrado, **não muda diretamente os dados ou regras do Firebase**.
- O mural lê todos os anúncios existentes, independentemente de serem `perdido` ou `encontrado`.
- O cadastro utiliza autenticação anônima Firebase e valida `owner_uid` com as regras do banco. Um anúncio antigo não é apagado ao atualizar o código.
- Não foi possível executar um teste real autenticado no Firebase a partir deste ambiente. Se continuar havendo erro de permissão, ele precisa ser diagnosticado no console do navegador/Firebase.
