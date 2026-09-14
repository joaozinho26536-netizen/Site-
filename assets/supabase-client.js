/* ============================================================
   RAMOS DE OLIVEIRA — cliente Supabase + utilitários compartilhados
   ============================================================ */
(function(){
"use strict";

const SUPABASE_URL = 'https://bkownolaktcsxlvewijz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7deO-WmQN6JkJwlsUcPS_A_6swgrhrE';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/* ---------------- formatação ---------------- */
const fmtBRL = (n) => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmtDate = (s) => {
  if(!s) return '';
  const d = (s instanceof Date) ? s : new Date(String(s).slice(0,10)+'T00:00:00');
  if(isNaN(d)) return '';
  return d.toLocaleDateString('pt-BR');
};
const todayISO = () => new Date().toISOString().slice(0,10);
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function onlyDigits(s){ return String(s||'').replace(/\D/g,''); }
function normName(s){ return String(s||'').trim().toUpperCase().replace(/\s+/g,' '); }
function fmtNumBR(n){ return (Number(n)||0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function parseNumBR(str){
  if(!str) return 0;
  const cleaned = String(str).trim().replace(/\./g,'').replace(',', '.').replace(/[^0-9.\-]/g,'');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
function maskMoneyInput(el){
  el.addEventListener('input', ()=>{
    let digits = el.value.replace(/\D/g,'');
    if(!digits){ el.value=''; return; }
    digits = digits.replace(/^0+(?=\d)/,'');
    while(digits.length<3) digits = '0'+digits;
    const intPart = (digits.slice(0,-2).replace(/^0+(?=\d)/,'') || '0');
    const decPart = digits.slice(-2);
    el.value = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart;
  });
}

/* ---------------- confirmação (substitui o confirm() nativo do navegador,
   que não pode ser estilizado e mostra a URL do site) ---------------- */
function confirmar(mensagem, opts){
  opts = opts || {};
  return new Promise((resolve)=>{
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-head"><h3>${esc(opts.titulo || 'Confirmar ação')}</h3><button class="iconbtn" id="cf-close" type="button">&times;</button></div>
        <div class="modal-body"><p style="font-size:13.5px; line-height:1.5; margin:0;">${esc(mensagem)}</p></div>
        <div class="modal-foot">
          <button class="btn" id="cf-cancel" type="button">${esc(opts.cancelar || 'Cancelar')}</button>
          <button class="btn ${opts.perigo===false ? 'primary' : 'danger'}" id="cf-ok" type="button">${esc(opts.confirmar || 'Confirmar')}</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    function onKey(e){ if(e.key==='Escape') finish(false); }
    function finish(v){
      document.removeEventListener('keydown', onKey);
      back.remove();
      resolve(v);
    }
    back.querySelector('#cf-close').onclick = ()=> finish(false);
    back.querySelector('#cf-cancel').onclick = ()=> finish(false);
    back.querySelector('#cf-ok').onclick = ()=> finish(true);
    back.onclick = (e)=>{ if(e.target===back) finish(false); };
    document.addEventListener('keydown', onKey);
    back.querySelector('#cf-ok').focus();
  });
}

/* ---------------- toasts ---------------- */
function toast(msg, kind){
  let wrap = document.getElementById('toasts');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'toasts';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' '+kind : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 8000);
}

/* ---------------- ordenação de tabelas ---------------- */
function sortRows(list, ui, getter, numericKeys, defaultSortFn){
  if(!ui.sortKey) return defaultSortFn ? list.slice().sort(defaultSortFn) : list;
  const key = ui.sortKey, mul = ui.sortDir==='asc' ? 1 : -1;
  const numeric = numericKeys.has(key);
  return list.slice().sort((a,b)=>{
    let va = getter(a,key), vb = getter(b,key);
    if(numeric){ va = Number(va)||0; vb = Number(vb)||0; return (va-vb)*mul; }
    va = String(va==null?'':va).toLowerCase(); vb = String(vb==null?'':vb).toLowerCase();
    return va.localeCompare(vb,'pt-BR')*mul;
  });
}
const SORT_ICON = '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="1.6" y="3.8" width="16.8" height="2.3" rx="1.15"/><rect x="1.6" y="8.85" width="11.4" height="2.3" rx="1.15"/><rect x="1.6" y="13.9" width="6" height="2.3" rx="1.15"/></svg>';
function thSort(label, key, ui, numericKeys, extraClass){
  const active = ui.sortKey===key;
  const numeric = numericKeys.has(key);
  const dir = active ? ui.sortDir : null;
  const icon = `<span class="sort-icon${active?' active':''}${dir==='asc'?' asc':''}">${SORT_ICON}</span>`;
  const title = numeric
    ? (dir==='asc' ? 'Ordenado crescente — clique para decrescente' : dir==='desc' ? 'Ordenado decrescente — clique para crescente' : 'Ordenar (crescente/decrescente)')
    : (dir==='asc' ? 'Ordenado A-Z — clique para Z-A' : dir==='desc' ? 'Ordenado Z-A — clique para A-Z' : 'Ordenar (A-Z/Z-A)');
  return `<th class="sortable${extraClass?(' '+extraClass):''}${active?' active':''}" data-sortkey="${esc(key)}" title="${esc(title)}">${esc(label)}${icon}</th>`;
}
function wireSortHeaders(container, ui, numericKeys, rerenderFn){
  container.querySelectorAll('th.sortable').forEach(th=>{
    th.onclick = ()=>{
      const key = th.dataset.sortkey;
      if(ui.sortKey===key){ ui.sortDir = ui.sortDir==='asc' ? 'desc' : 'asc'; }
      else{ ui.sortKey = key; ui.sortDir = numericKeys.has(key) ? 'desc' : 'asc'; }
      if('page' in ui) ui.page = 1;
      if('listaPage' in ui) ui.listaPage = 1;
      rerenderFn();
    };
  });
}
function rerenderKeepingFocus(renderFn){
  const active = document.activeElement;
  const id = active && active.id;
  const hasSelection = active && typeof active.selectionStart === 'number';
  const selStart = hasSelection ? active.selectionStart : null;
  const selEnd = hasSelection ? active.selectionEnd : null;
  renderFn();
  if(id){
    const restored = document.getElementById(id);
    if(restored){
      restored.focus();
      if(selStart!=null && restored.setSelectionRange){
        try{ restored.setSelectionRange(selStart, selEnd); }catch(e){}
      }
    }
  }
}

/* ---------------- carregamento de dados (tabelas completas em memória) ---------------- */
// Busca todas as linhas de uma tabela, paginando com .range() (o PostgREST limita
// a 1000 linhas por resposta) — equivalente ao loadCollectionAll do Artifact antigo.
async function loadAllRows(table, select, orderCol){
  const pageSize = 1000;
  let from = 0;
  const all = [];
  while(true){
    const { data, error } = await sb.from(table).select(select||'*').order(orderCol||'codigo').range(from, from+pageSize-1);
    if(error) throw error;
    all.push(...data);
    if(data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
async function loadClientes(){ return loadAllRows('clientes', '*', 'codigo'); }
async function loadClientesMap(){
  const map = new Map();
  (await loadClientes()).forEach(c=> map.set(c.codigo, c));
  return map;
}
async function loadProdutos(){ return loadAllRows('produtos', '*', 'codigo'); }
async function loadProdutosMap(){
  const map = new Map();
  (await loadProdutos()).forEach(p=> map.set(p.codigo, p));
  return map;
}
// Pedidos com itens/parcelas/pagamentos aninhados via embedding do PostgREST — a
// mesma forma de documento aninhado que o Artifact antigo guardava no Firestore
// (pedido.itens[].parcelas[].pagamentos[]), só que remontada a partir de 4 tabelas
// normalizadas. `numero` fica sempre até 496 registros no topo (dentro do limite
// de 1000 por página do PostgREST), então não precisa paginar aqui.
const PEDIDO_SELECT = 'numero,data_compra,codigo_cliente,cliente_nome,forma_pagamento,condicao_pgto,proximo_pagamento_override,valor_entrada,'+
  'itens:pedido_itens(id,codigo_produto,descricao,uni,valor_venda,valor_compra,parcelas_qtd,valor_parcela,'+
  'parcelas(id,n,data_pgto,recebimento,desconto,recibo,pagamentos(id,data,valor)))';
async function loadPedidos(){
  const { data, error } = await sb.from('pedidos').select(PEDIDO_SELECT).order('numero', { ascending:false });
  if(error) throw error;
  // ordena itens e parcelas (o PostgREST não garante ordem dentro do embed)
  data.forEach(p=>{
    (p.itens||[]).sort((a,b)=>a.id-b.id);
    (p.itens||[]).forEach(it=> (it.parcelas||[]).sort((a,b)=>a.n-b.n));
  });
  return data;
}
async function loadPedidosMap(){
  const map = new Map();
  (await loadPedidos()).forEach(p=> map.set(String(p.numero), p));
  return map;
}
async function loadPedidoByNumero(numero){
  const { data, error } = await sb.from('pedidos').select(PEDIDO_SELECT).eq('numero', numero).maybeSingle();
  if(error) throw error;
  if(data){
    (data.itens||[]).sort((a,b)=>a.id-b.id);
    (data.itens||[]).forEach(it=> (it.parcelas||[]).sort((a,b)=>a.n-b.n));
  }
  return data;
}

/* ---------------- regras de negócio (portadas do Artifact) ---------------- */
function nextCodigo(map){
  let max = 0;
  map.forEach((v,k)=>{ const n = parseInt(k,10); if(!isNaN(n) && /^\d+$/.test(String(k)) && n>max) max=n; });
  return String(max+1);
}
function nextPedidoNumero(pedidosMap){
  let max = 0;
  pedidosMap.forEach((v,k)=>{ const n = parseInt(k,10); if(!isNaN(n) && n>max) max=n; });
  return max+1;
}
function estoqueControlado(p){ return p && p.estoque!==null && p.estoque!==undefined && p.estoque!==''; }
function estoqueBaixo(p){ return estoqueControlado(p) && Number(p.estoque) <= Number(p.estoque_min ?? 5); }
// Vencimento estimado de uma parcela (data da compra + N meses, N = nº da parcela)
// — o sistema não guarda vencimento real, só a data em que foi paga; é usado só
// para estimar atraso e agrupar pedidos em pastas por mês/dia.
function parcelaVencimentoEstimado(pedido, n){
  const base = pedido && pedido.data_compra ? new Date(pedido.data_compra+'T00:00:00') : null;
  if(!base || isNaN(base.getTime())) return null;
  const d = new Date(base);
  d.setMonth(d.getMonth() + n);
  return d;
}
function proximoPagamentoPedido(pedido){
  if(pedido && pedido.proximo_pagamento_override){
    const d = new Date(pedido.proximo_pagamento_override+'T00:00:00');
    if(!isNaN(d.getTime())) return d;
  }
  let proximo = null;
  (pedido.itens||[]).forEach(it=>{
    (it.parcelas||[]).forEach(parc=>{
      if(parc.data_pgto) return;
      const venc = parcelaVencimentoEstimado(pedido, parc.n);
      if(venc && (!proximo || venc < proximo)) proximo = venc;
    });
  });
  return proximo;
}
function pagamentosDaParcela(p){
  if(Array.isArray(p.pagamentos) && p.pagamentos.length) return p.pagamentos;
  if((Number(p.recebimento)||0) > 0) return [{ data: p.data_pgto || null, valor: Number(p.recebimento)||0 }];
  return [];
}
function remanescenteParcela(valorParcela, p){
  return Math.max(0, (Number(valorParcela)||0) - (Number(p.recebimento)||0) - (Number(p.desconto)||0));
}
function pedidoTotais(pedido){
  const totalGeral = (pedido.itens||[]).reduce((s,it)=> s + (Number(it.valor_venda)||0)*(Number(it.uni)||1), 0);
  const totalRecebidoParcelas = (pedido.itens||[]).reduce((s,it)=> s + (it.parcelas||[]).reduce((s2,p)=>s2+(Number(p.recebimento)||0),0), 0);
  const totalDesconto = (pedido.itens||[]).reduce((s,it)=> s + (it.parcelas||[]).reduce((s2,p)=>s2+(Number(p.desconto)||0),0), 0);
  const totalRecebido = totalRecebidoParcelas + (Number(pedido.valor_entrada)||0);
  const quitado = (totalRecebido+totalDesconto) >= totalGeral - 0.005;
  return { totalGeral, totalRecebido, totalDesconto, quitado };
}
// Lista achatada de todas as parcelas com saldo pendente, em todos os pedidos —
// alimenta o KPI "a receber" do painel e a tabela de contas a receber do Financeiro.
function listaContasAReceber(pedidos, clientesMap){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const linhas = [];
  pedidos.forEach(p=>{
    (p.itens||[]).forEach(it=>{
      (it.parcelas||[]).forEach(parc=>{
        const parcelaValor = Number(it.valor_parcela) || ((Number(it.valor_venda)||0) / (it.parcelas_qtd||1));
        const valor = remanescenteParcela(parcelaValor, parc);
        if(valor <= 0.005) return;
        const venc = parcelaVencimentoEstimado(p, parc.n);
        const vencida = venc ? venc < hoje : false;
        linhas.push({
          numero: p.numero,
          cliente: (clientesMap.get(p.codigo_cliente)||{}).nome || p.cliente_nome || '',
          n: parc.n, totalParcelas: it.parcelas_qtd,
          valor, vencimento: venc, vencida,
          diasAtraso: venc && vencida ? Math.max(0, Math.round((hoje-venc)/86400000)) : 0,
        });
      });
    });
  });
  return linhas;
}

/* ---------------- gravação de pedidos (itens/parcelas/pagamentos) ---------------- */
function blankParcela(n){ return { n, data_pgto:null, recebimento:0, desconto:0, recibo:null, pagamentos:[] }; }
async function excluirItensPedido(numero){
  const { error } = await sb.from('pedido_itens').delete().eq('pedido_numero', numero);
  if(error) throw error;
}
// Regrava os itens/parcelas/pagamentos de um pedido a partir de um array de itens
// no mesmo formato aninhado usado em toda a interface (it.parcelas[].pagamentos[]).
// Usado tanto ao emitir um pedido novo quanto ao salvar edições (nesse caso,
// sempre chamado depois de excluirItensPedido para o mesmo número).
// Grava tudo em no máximo 3 requisições (itens, depois parcelas, depois
// pagamentos), em vez de uma sequência de idas-e-vindas por item — um pedido
// com vários produtos/parcelas levava dezenas de requisições sequenciais
// antes disso, e cada uma paga o tempo de ida-e-volta até o Supabase.
async function salvarItensPedido(numero, itens){
  if(!itens.length) return;
  const itensInput = itens.map(it=>({
    pedido_numero: numero, codigo_produto: it.codigo_produto || null, descricao: it.descricao || '',
    uni: it.uni||1, valor_venda: it.valor_venda||0, valor_compra: it.valor_compra||0,
    parcelas_qtd: it.parcelas_qtd||1, valor_parcela: it.valor_parcela||0,
  }));
  const { data: itemRows, error: e1 } = await sb.from('pedido_itens').insert(itensInput).select('id');
  if(e1) throw e1;

  const parcelasInput = [], parcelasOriginais = [];
  itens.forEach((it, idx)=>{
    const itemId = itemRows[idx].id;
    (it.parcelas||[]).forEach(p=>{
      parcelasInput.push({
        item_id: itemId, n: p.n, data_pgto: p.data_pgto||null,
        recebimento: Number(p.recebimento)||0, desconto: Number(p.desconto)||0, recibo: p.recibo||null,
      });
      parcelasOriginais.push(p);
    });
  });
  if(!parcelasInput.length) return;
  const { data: parcRows, error: e2 } = await sb.from('parcelas').insert(parcelasInput).select('id');
  if(e2) throw e2;

  const pagamentosInput = [];
  parcelasOriginais.forEach((p, idx)=>{
    const parcelaId = parcRows[idx].id;
    pagamentosDaParcela(p).forEach(pg=>{
      if((Number(pg.valor)||0) > 0) pagamentosInput.push({ parcela_id: parcelaId, data: pg.data || p.data_pgto || todayISO(), valor: pg.valor });
    });
  });
  if(pagamentosInput.length){
    const { error: e3 } = await sb.from('pagamentos').insert(pagamentosInput);
    if(e3) throw e3;
  }
}
// Regrava um pedido inteiro (cabeçalho + itens/parcelas/pagamentos) — usado para
// editar a ficha, registrar um pagamento avulso e restaurar backups, já que todos
// partem de uma cópia completa do pedido com o trecho alterado.
async function salvarPedidoCompleto(numeroAntigo, draft){
  const numeroMudou = String(draft.numero) !== String(numeroAntigo);
  const header = {
    numero: draft.numero, data_compra: draft.data_compra, codigo_cliente: draft.codigo_cliente || null,
    cliente_nome: draft.cliente_nome || null, forma_pagamento: draft.forma_pagamento || null,
    condicao_pgto: draft.condicao_pgto || 1, proximo_pagamento_override: draft.proximo_pagamento_override || null,
    valor_entrada: Number(draft.valor_entrada)||0,
  };
  if(numeroMudou){
    const { error: eIns } = await sb.from('pedidos').insert(header);
    if(eIns) throw eIns;
    await salvarItensPedido(draft.numero, draft.itens);
    // Não precisa apagar os itens antigos manualmente antes: excluir o pedido
    // abaixo já cascateia (ON DELETE CASCADE) para pedido_itens -> parcelas ->
    // pagamentos do número antigo.
    const { error: eDel } = await sb.from('pedidos').delete().eq('numero', numeroAntigo);
    if(eDel) throw eDel;
  }else{
    const { error: eUpd } = await sb.from('pedidos').update(header).eq('numero', draft.numero);
    if(eUpd) throw eUpd;
    await excluirItensPedido(draft.numero);
    await salvarItensPedido(draft.numero, draft.itens);
  }
  return loadPedidoByNumero(draft.numero);
}

/* ---------------- autenticação ---------------- */
// Garante que só usuários autenticados — e que já completaram o desafio de dois
// fatores, se tiverem 2FA ativado — vejam as telas do sistema. Chame no topo de
// cada página (exceto login.html e mfa.html). Redireciona para login.html sem
// sessão, ou para mfa.html se a sessão ainda não atingiu o nível aal2 exigido.
// Isso é só a camada de UX: a garantia de verdade é a policy "restrictive" no
// banco (require_aal2_if_mfa_enrolled), que nega a leitura/escrita mesmo que
// alguém pule esta tela.
async function requireAuth(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session){
    window.location.href = 'login.html';
    return null;
  }
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aal && aal.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel){
    const next = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    window.location.href = 'mfa.html?next=' + next;
    return null;
  }
  return session;
}
async function logout(){
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

/* ---------------- hierarquia de usuários (admin_chefe / editor) ---------------- */
// Busca o papel do usuário logado uma vez por sessão de página e guarda em
// cache — todas as páginas chamam isso logo após requireAuth() para decidir
// o que mostrar no menu. A garantia de verdade continua sendo a RLS no
// banco; isto é só a camada de UX (esconder abas, redirecionar).
let _perfilCache = null;
async function getMeuPerfil(){
  if(_perfilCache) return _perfilCache;
  const { data: { user } } = await sb.auth.getUser();
  if(!user) return null;
  const { data, error } = await sb.from('perfis').select('user_id,email,nome,role').eq('user_id', user.id).maybeSingle();
  if(error){ console.error('Erro ao carregar perfil:', error); return null; }
  _perfilCache = data;
  return data;
}
// Usado no topo de financeiro.html, backup.html e seguranca.html — só o
// admin_chefe pode ver essas telas.
async function requireAdmin(){
  const perfil = await getMeuPerfil();
  if(!perfil || perfil.role !== 'admin_chefe'){
    toast('Acesso restrito ao Administrador chefe.', 'err');
    window.location.href = 'index.html';
    return null;
  }
  return perfil;
}

window.RO = {
  sb, fmtBRL, fmtDate, todayISO, esc, onlyDigits, normName, fmtNumBR, parseNumBR, maskMoneyInput,
  toast, confirmar, sortRows, thSort, wireSortHeaders, rerenderKeepingFocus, requireAuth, logout,
  getMeuPerfil, requireAdmin,
  loadAllRows, loadClientes, loadClientesMap, loadProdutos, loadProdutosMap,
  loadPedidos, loadPedidosMap, loadPedidoByNumero,
  nextCodigo, nextPedidoNumero, estoqueControlado, estoqueBaixo,
  parcelaVencimentoEstimado, proximoPagamentoPedido, pagamentosDaParcela, remanescenteParcela,
  pedidoTotais, listaContasAReceber,
  blankParcela, excluirItensPedido, salvarItensPedido, salvarPedidoCompleto,
};
})();
