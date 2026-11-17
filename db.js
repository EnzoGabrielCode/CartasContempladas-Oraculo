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
  const ADM_KEY = "demo_adms";
  const seedAdms = ["Caixa", "Itaú", "Bradesco", "CNP Embracon", "Santander", "Porto Seguro"].map((nome, i) => ({ id: i + 1, nome, logo_url: "" }));
  const loadAdms = () => { try { return JSON.parse(localStorage.getItem(ADM_KEY)) || seedAdms; } catch { return seedAdms; } };
  const storeAdms = (d) => { try { localStorage.setItem(ADM_KEY, JSON.stringify(d)); } catch {} };

  // Reduz a imagem (máx. 400x160) para o site carregar rápido. SVG passa direto.
  function redimensionar(file) {
    if (file.type === "image/svg+xml") return Promise.resolve(file);
    return new Promise((ok, erro) => {
      const img = new Image();
      img.onload = () => {
        const fator = Math.min(1, 400 / img.width, 160 / img.height);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * fator); c.height = Math.round(img.height * fator);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => b ? ok(b) : erro(new Error("Imagem inválida")), "image/webp", 0.9);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => erro(new Error("Não foi possível ler a imagem"));
      img.src = URL.createObjectURL(file);
    });
  }
  const paraDataURL = (blob) => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });

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

    // ---------- Administradoras ----------
    async listarAdms() {
      if (DEMO) return loadAdms().slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      const { data, error } = await sb.from("administradoras").select("*").order("nome");
      if (error) throw error;
      return data;
    },

    async salvarAdm(adm) {
      if (DEMO) {
        const d = loadAdms();
        if (adm.id) d[d.findIndex(a => a.id === adm.id)] = adm;
        else { adm.id = Math.max(0, ...d.map(a => a.id)) + 1; d.push(adm); }
        storeAdms(d);
        return;
      }
      const { id, ...campos } = adm;
      const { error } = id
        ? await sb.from("administradoras").update(campos).eq("id", id)
        : await sb.from("administradoras").insert(campos);
      if (error) throw new Error(error.code === "23505" ? "Já existe uma administradora com esse nome" : error.message);
    },

    async excluirAdm(id) {
      if (DEMO) { storeAdms(loadAdms().filter(a => a.id !== id)); return; }
      const { error } = await sb.from("administradoras").delete().eq("id", id);
      if (error) throw error;
    },

    async enviarLogo(file) {
      const blob = await redimensionar(file);
      if (DEMO) return paraDataURL(blob);
      const ext = blob.type === "image/svg+xml" ? "svg" : "webp";
      const caminho = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from("logos").upload(caminho, blob, { contentType: blob.type, cacheControl: "31536000" });
      if (error) throw error;
      return sb.storage.from("logos").getPublicUrl(caminho).data.publicUrl;
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
  // Mostra logo + nome da administradora (ou as iniciais, se não tiver logo)
  window.admHTML = (nome, mapa, { soLogo = false } = {}) => {
    const a = mapa && mapa[String(nome || "").toLowerCase()];
    const iniciais = String(nome || "?").split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
    const marca = a && a.logo_url
      ? `<img class="logo-adm" src="${esc(a.logo_url)}" alt="${esc(nome)}" loading="lazy">`
      : `<span class="logo-adm sem-logo">${esc(iniciais)}</span>`;
    return soLogo ? marca : `<span class="adm">${marca}<span>${esc(nome)}</span></span>`;
  };
  window.mapaAdms = (lista) => Object.fromEntries(lista.map(a => [a.nome.toLowerCase(), a]));
  window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
})();
