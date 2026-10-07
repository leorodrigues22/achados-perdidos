# AchaIFSC + Supabase + comparação por IA

Projeto acadêmico de achados e perdidos.

## O que esta versão faz

- Salva os anúncios online no Supabase.
- Funciona com o computador do dono do site desligado.
- Mostra as publicações para outros celulares e computadores.
- Permite marcar anúncio como resolvido e excluir os anúncios criados no navegador.
- Depois de uma nova publicação, compara automaticamente com anúncios do tipo oposto.
- Usa IA de linguagem no navegador para comparar título, descrição, categoria, local e data.
- Exibe uma mensagem de "Possível correspondência" e uma porcentagem estimada quando houver semelhança forte.
- Na tela inicial existe o botão "Ver possíveis correspondências" para analisar as publicações ativas.

## Banco de dados

A tabela usada é `public.itens` no Supabase.

A Publishable key deve ser colocada em:

`js/supabase.js`

Use apenas a chave pública `sb_publishable_...`. Nunca coloque uma Secret key no site.

## IA

A comparação usa Transformers.js e o modelo multilíngue:

`Xenova/paraphrase-multilingual-MiniLM-L12-v2`

O modelo roda no navegador. Não é necessário criar uma chave de API de IA.
Na primeira análise, o navegador precisa baixar os arquivos do modelo, então ela pode demorar mais. Depois o navegador pode reaproveitar o cache.

Se o modelo não carregar, o site usa uma comparação local de palavras, categoria, local e data como plano B. O anúncio continua sendo salvo normalmente.

A porcentagem mostrada é apenas uma estimativa. Ela não confirma que os dois anúncios representam o mesmo objeto.

## Teste sugerido

1. Publique um item como perdido: `Garrafa preta`, categoria `Garrafas e copos`.
2. Publique outro como encontrado: `Garrafa de água preta`, mesma categoria, local/data próximos.
3. Depois da segunda publicação, aguarde a análise.
4. O site deve mostrar uma possível correspondência se a pontuação ultrapassar o limite configurado.
