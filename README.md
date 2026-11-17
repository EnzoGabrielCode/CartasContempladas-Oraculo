# Cartas Contempladas — Oráculo

Site público com a lista de cartas, mais um painel `/admin.html` onde só o administrador cadastra, edita e exclui.
É HTML e JS puro, sem build. O banco e o login ficam no Supabase. **Custo: R$ 0** (só o domínio, se quiser um próprio).

## Arquivos
| Arquivo | O que é |
|---|---|
| `index.html` | Página pública: filtro Imóvel/Veículo, busca, ordenação e botão de WhatsApp |
| `admin.html` | Login + CRUD das cartas |
| `config.js` | **Único arquivo que você edita** (chaves do Supabase, WhatsApp, nome) |
| `db.js` | Acesso ao banco (com modo demo se o Supabase não estiver configurado) |
| `supabase.sql` | Cria a tabela e as regras de segurança |

## Testar agora (modo demo)
Abra o `index.html` no navegador. Sem Supabase configurado, ele usa dados de exemplo salvos no próprio navegador.
No `admin.html`, a senha é `demo`.

## Colocar no ar (≈ 15 min)

### 1. Supabase (banco + login)
1. Crie uma conta em https://supabase.com e depois **New project** (região: South America – São Paulo).
2. **SQL Editor > New query**: cole o conteúdo de `supabase.sql` e clique em **Run**.
3. **Authentication > Users > Add user > Create new user**: coloque o e-mail e a senha do chefe e marque *Auto Confirm User*.
4. **Authentication > Sign In / Providers**: **desligue "Allow new users to sign up"**. Isso garante que ninguém mais consiga criar conta.
5. **Project Settings > API**: copie a *Project URL* e a *anon public key*.

### 2. Configurar
No `config.js`, preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `WHATSAPP` (ex.: `5512991234567`).
> A anon key pode ficar pública: quem garante a segurança são as regras (RLS) do `supabase.sql`.

### 3. Publicar (Netlify — grátis)
1. Acesse https://app.netlify.com/drop.
2. Arraste a pasta inteira do projeto. Em segundos você recebe um link `algo.netlify.app`.
3. (Opcional) Em **Site settings > Domain**, troque o nome ou ligue um domínio próprio (registro.br, ~R$ 40/ano).

Também funciona no Vercel, GitHub Pages ou Cloudflare Pages, porque é só um site estático.

## Uso
- Site: `seudominio/` (aceita `?segmento=imovel` ou `?segmento=veiculo`)
- Admin: `seudominio/admin.html`
- Status **Vendida** esconde a carta do site, mas ela continua no admin. **Reservada** aparece com o botão desativado.
- Se o saldo devedor ficar em branco, o sistema calcula parcelas × valor da parcela.

## Observação
No plano grátis, o Supabase pausa o projeto se ficar 7 dias sem nenhum acesso. Com visitas no site isso não deve acontecer. Se acontecer, é só clicar em *Restore* no painel.
"# CartasContempladas-Oraculo" 
"# CartasContempladas-Oraculo" 
"# CartasContempladas-Oraculo" 
"# CartasContempladas-Oraculo" 
