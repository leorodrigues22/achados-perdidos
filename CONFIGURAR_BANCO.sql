-- AchaIFSC - configuração complementar do Supabase
-- Sua tabela e as regras de SELECT/INSERT já foram criadas.
-- Rode este arquivo UMA VEZ no SQL Editor para habilitar
-- os botões "Marcar resolvido" e "Excluir".
--
-- Observação: estas regras são simples e apropriadas para um projeto acadêmico.
-- Em um sistema real, o ideal é usar autenticação de usuários e regras por proprietário.

create policy "Qualquer pessoa pode atualizar itens"
on public.itens
for update
to anon, authenticated
using (true)
with check (true);

create policy "Qualquer pessoa pode excluir itens"
on public.itens
for delete
to anon, authenticated
using (true);
