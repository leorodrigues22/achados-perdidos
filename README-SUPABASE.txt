ACHAIFSC + SUPABASE + IA
========================

PASSO 1 - COLOCAR SUA CHAVE DO SUPABASE
Abra:
  js/supabase.js

Troque:
  COLE_SUA_PUBLISHABLE_KEY_AQUI

pela Publishable key do seu projeto Supabase.
Use APENAS a chave que começa com sb_publishable_...
NUNCA coloque a sb_secret_... no site.

A URL do seu projeto já está configurada.

PASSO 2 - BANCO
Se você já rodou CONFIGURAR_BANCO.sql na versão anterior, não precisa rodar novamente.
Esse arquivo habilita os botões Marcar resolvido e Excluir.

PASSO 3 - IA
Não precisa de chave de IA.
A comparação usa Transformers.js no navegador e baixa o modelo na primeira análise.
É normal a primeira comparação demorar mais.

Ao publicar um item, o sistema:
  1. salva no Supabase;
  2. busca anúncios do tipo contrário;
  3. compara descrição, objeto, categoria, local e data;
  4. mostra "Possível correspondência" quando a semelhança for alta.

Na página inicial existe também o botão:
  Ver possíveis correspondências

IMPORTANTE
A porcentagem é uma estimativa e não confirma que seja o mesmo objeto.
