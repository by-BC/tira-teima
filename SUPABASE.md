# Configuração do Supabase (auth, planos e admin)

Para destravar o login obrigatório, os planos (free/pro) e o painel
administrativo, é preciso um projeto Supabase. Siga os passos abaixo — leva
~5 minutos.

## 1. Criar o projeto
1. Acesse https://supabase.com e crie um projeto (plano gratuito serve).
2. Escolha uma região próxima (ex.: São Paulo) e defina a senha do banco.

## 2. Rodar o schema
1. No painel do projeto, abra **SQL Editor**.
2. Cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   Isso cria as tabelas `profiles` e `clip_events`, as funções de apoio
   (`is_admin`, `clips_today`), o gatilho que cria o perfil no cadastro e as
   políticas de RLS.

## 3. Configurar autenticação
1. Vá em **Authentication > Providers > Email** e habilite o login por email/senha.
2. Para testar rápido sem caixa de entrada, em **Authentication > Settings**
   você pode desativar temporariamente a confirmação de email
   ("Confirm email"). Reative em produção.

## 4. Pegar as chaves e configurar o app
1. Em **Project Settings > API**, copie:
   - **Project URL**
   - **anon public key**
2. No projeto, copie `.env.local.example` para `.env.local` e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Reinicie o `npm run dev`.

> A chave **service_role NÃO** deve ir para o `.env.local` do front nem para o
> navegador — ela ignora RLS. O app usa apenas a `anon` key.

## 5. Virar admin
Depois de criar sua conta no app, rode no SQL Editor (troque o email):
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'voce@exemplo.com');
```
Pronto: o painel `/admin` ficará acessível para você.

## Modelo de dados (resumo)
- `profiles` — `full_name`, `cpf` (único, só dígitos), `email`, `plan`
  (`free`/`pro`), `role` (`user`/`admin`).
- `clip_events` — um registro por clipe gerado, usado para o limite diário do
  plano gratuito (**10 clipes/dia**, fuso America/Sao_Paulo). Plano `pro` é
  ilimitado. Os vídeos seguem locais (IndexedDB) por enquanto.
- Sem ferramenta de pagamento agora: o plano é definido pelo admin no painel.
