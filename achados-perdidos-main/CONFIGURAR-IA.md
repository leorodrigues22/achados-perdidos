# Ativar conversa real com IA no AchaIFSC

O chat agora conversa com um modelo de IA pela rota segura `/api/chat` hospedada na Vercel. **A API não funciona abrindo `index.html` diretamente do ZIP**. É necessário publicar o projeto na Vercel.

1. Crie uma chave de API no painel da OpenAI (a API pode ser cobrada separadamente do ChatGPT).
2. No projeto da Vercel, abra **Settings → Environment Variables** e adicione `OPENAI_API_KEY` com o valor da chave. Nunca coloque a chave no JavaScript ou HTML público.
3. Opcional: adicione `OPENAI_MODEL` com o nome do modelo compatível, por padrão `gpt-4o-mini`.
4. Publique novamente na Vercel e abra a página inicial. Teste primeiro com “oi”, depois “perdi uma garrafa”.
5. Para buscar anúncios reais, mantenha o Firebase configurado e com leitura permitida pelas regras adequadas. O chat consulta o mural e manda ao servidor apenas nome, tipo, cor, local, categoria e descrição dos anúncios, sem dados de contato.

## Limites e segurança

- A versão enviada tem validação de tamanho e limite de histórico, mas **não inclui proteção de produção contra abuso ou gastos inesperados**. Antes de divulgar o site, configure limites de orçamento/uso na conta da API e proteção de taxa no endpoint (por exemplo, rate limiting por IP com infraestrutura apropriada).
- A lista de anúncios enviada ao modelo é limitada a 100 itens. Para um mural grande, o ideal é implementar busca no servidor antes de chamar a IA.
- A IA pode errar; nunca trate sugestão como prova de propriedade do objeto.
- O chat é sem login para visitantes. Não compartilhe dados pessoais sensíveis na conversa.
