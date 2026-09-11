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

/* ---------------- autenticação ---------------- */
// Garante que só usuários autenticados vejam as telas do sistema. Chame no topo
// de cada página (exceto login.html). Redireciona para login.html se não houver
// sessão válida. Retorna a sessão quando autenticado.
async function requireAuth(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session){
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
async function logout(){
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

window.RO = {
  sb, fmtBRL, fmtDate, todayISO, esc, onlyDigits, normName, fmtNumBR, parseNumBR, maskMoneyInput,
  toast, sortRows, thSort, wireSortHeaders, rerenderKeepingFocus, requireAuth, logout,
};
})();
