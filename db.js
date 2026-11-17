// Camada de dados: usa Supabase se configurado; senão, modo demo (localStorage).
(function () {
  const cfg = window.APP_CONFIG;
  const DEMO = !cfg.SUPABASE_URL;
  const sb = DEMO ? null : window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  const KEY = "demo_cartas";
  const SESSION_KEY = "demo_session";
  const seed = [
    { id: 1, codigo: "1021", cota: "045", categoria: "imovel", credito: 250000, entrada: 62000, parcelas: 140, valor_parcela: 2150, saldo_devedor: 301000, administradora: "Caixa", grupo: "1180", status: "disponivel" },
    { id: 2, codigo: "1022", cota: "312", categoria: "imovel", credito: 400000, entrada: 98000, parcelas: 170, valor_parcela: 3280, saldo_devedor: 557600, administradora: "Itaú", grupo: "20044", status: "reservada" },
    { id: 3, codigo: "2010", cota: "078", categoria: "veiculo", credito: 80000, entrada: 21000, parcelas: 60, valor_parcela: 1590, saldo_devedor: 95400, administradora: "Bradesco", grupo: "5521", status: "disponivel" },
    { id: 4, codigo: "2011", cota: "190", categoria: "veiculo", credito: 120000, entrada: 33500, parcelas: 72, valor_parcela: 1980, saldo_devedor: 142560, administradora: "CNP Embracon", grupo: "3307", status: "disponivel" }
  ];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed; } catch { return seed; } };
  const store = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} };

  window.DB = {
    demo: DEMO,

    async listar({ publico = false } = {}) {
      if (DEMO) {
        const d = load();
        return publico ? d.filter(c => c.status !== "vendida") : d;
      }
      let q = sb.from("cartas").select("*").order("categoria").order("credito");
      if (publico) q = q.neq("status", "vendida");
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },

    async salvar(carta) {
      if (DEMO) {
        const d = load();
        if (carta.id) {
          const i = d.findIndex(c => c.id === carta.id);
          d[i] = carta;
        } else {
          carta.id = Math.max(0, ...d.map(c => c.id)) + 1;
          d.push(carta);
        }
        store(d);
        return;
      }
      const { id, ...campos } = carta;
      const { error } = id
        ? await sb.from("cartas").update(campos).eq("id", id)
        : await sb.from("cartas").insert(campos);
      if (error) throw error;
    },

    async excluir(id) {
      if (DEMO) { store(load().filter(c => c.id !== id)); return; }
      const { error } = await sb.from("cartas").delete().eq("id", id);
      if (error) throw error;
    },

    async login(email, senha) {
      if (DEMO) {
        if (senha !== "demo") throw new Error("Modo demonstração: use a senha demo");
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
        window.__demoLogged = true;
        return;
      }
      const { error } = await sb.auth.signInWithPassword({ email, password: senha });
      if (error) throw new Error("E-mail ou senha inválidos");
    },

    async logout() {
      if (DEMO) { try { sessionStorage.removeItem(SESSION_KEY); } catch {} window.__demoLogged = false; return; }
      await sb.auth.signOut();
    },

    async logado() {
      if (DEMO) { try { return !!sessionStorage.getItem(SESSION_KEY) || !!window.__demoLogged; } catch { return !!window.__demoLogged; } }
      const { data } = await sb.auth.getSession();
      return !!data.session;
    }
  };

  // Utilidades
  window.fmtBRL = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  window.CATEGORIAS = { imovel: "Imóvel", veiculo: "Veículo" };
  window.STATUS = { disponivel: "Disponível", reservada: "Reservada", vendida: "Vendida" };
  window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
})();
