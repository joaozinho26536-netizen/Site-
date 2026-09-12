/* ============================================================
   RAMOS DE OLIVEIRA — menu lateral e estrutura de página compartilhada
   ============================================================ */
(function(){
"use strict";

const ICONS = {
  home:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.2 1.6 9.4h2.3V18h4.6v-5.6h3V18h4.6V9.4h2.3L10 2.2Z"/></svg>',
  users:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 3.2a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Z"/><path d="M1.2 17.2c.3-4 2.9-6.6 5.8-6.6s5.5 2.6 5.8 6.6H1.2Z"/><path d="M14.6 4.6a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Z" opacity=".7"/><path d="M11.6 11.1c.9-.5 1.9-.8 2.6-.8 2.5 0 4.6 2.3 4.8 6.9h-4.9c-.1-2.5-1-4.7-2.5-6.1Z" opacity=".7"/></svg>',
  box:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.6 18 5.4 10 9.2 2 5.4 10 1.6Z"/><path d="M2.6 6.8 9.3 10v8.2L2.6 15V6.8Z" opacity=".85"/><path d="M17.4 6.8 10.7 10v8.2l6.7-3.2V6.8Z" opacity=".6"/></svg>',
  file:'<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.4 1.8h6.7l4.5 4.5V18.2H4.4V1.8Zm1.8 7.6h7.6v1.4H6.2V9.4Zm0 3h7.6v1.4H6.2v-1.4Z"/><path d="M11.1 1.8v4.5h4.5L11.1 1.8Z" opacity=".55"/></svg>',
  coins:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.4c3.6 0 6.4 1.3 6.4 3s-2.8 3-6.4 3-6.4-1.3-6.4-3 2.8-3 6.4-3Z"/><path d="M3.6 6.6v3.6c0 1.7 2.8 3 6.4 3s6.4-1.3 6.4-3V6.6c0 1.7-2.8 3-6.4 3s-6.4-1.3-6.4-3Z" opacity=".85"/><path d="M3.6 11.4V15c0 1.7 2.8 3 6.4 3s6.4-1.3 6.4-3v-3.6c0 1.7-2.8 3-6.4 3s-6.4-1.3-6.4-3Z" opacity=".65"/></svg>',
  search:'<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 2.6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-8 6a8 8 0 1 1 14.3 4.9l4.6 4.6-1.4 1.4-4.6-4.6A8 8 0 0 1 .6 8.6Z"/></svg>',
  plus:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M8.8 1.2h2.4v7.6h7.6v2.4h-7.6v7.6H8.8v-7.6H1.2V8.8h7.6V1.2Z"/></svg>',
  edit:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="m13.9 1.6 4.5 4.5-2.1 2.1-4.5-4.5 2.1-2.1Z"/><path d="M10.9 4.6 2.4 13.1 1 19l5.9-1.4 8.5-8.5-4.5-4.5Z"/></svg>',
  trash:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.4 3.8h15.2v2H2.4v-2Z"/><path d="M7.4 1h5.2c.7 0 1.2.6 1.2 1.3v1.5H6.2V2.3C6.2 1.6 6.7 1 7.4 1Z"/><path d="M4.2 6.6h11.6L14.9 18a1.3 1.3 0 0 1-1.3 1.2H6.4A1.3 1.3 0 0 1 5.1 18L4.2 6.6Z"/></svg>',
  back:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.7 2.3 2.3 9.7 9.7 17.1l1.5-1.5-4.9-4.9H18v-2H6.3l4.9-4.9-1.5-1.5Z"/></svg>',
  warn:'<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 2 18.6 17H1.4L10 2Zm-.65 5.6h1.3l-.3 5.2H9.65l-.3-5.2ZM10 14.9a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1Z"/></svg>',
  check:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M7.4 14.6 2.8 10l1.5-1.5 3.1 3.1L15.7 3.3l1.5 1.5-9.8 9.8Z"/></svg>',
  down:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 7.4 10 13.4 16 7.4 14.6 6 10 10.6 5.4 6 4 7.4Z"/></svg>',
  upload:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.6 4.8 8.4h3.1V14h4.2V8.4h3.1L10 2.6Z"/><path d="M2.8 16h14.4v1.6H2.8V16Z"/></svg>',
  external:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M8 3H3v14h14v-5h-2v3H5V5h3V3Z"/><path d="M11 3h6v6h-2V6.4l-7.3 7.3-1.4-1.4L13.6 5H11V3Z"/></svg>',
  shield:'<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.4 17.6 4v5.6c0 4.9-3.2 8.7-7.6 9-4.4-.3-7.6-4.1-7.6-9V4L10 1.4Z" opacity=".18"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10 1.4 17.6 4v5.6c0 4.9-3.2 8.7-7.6 9-4.4-.3-7.6-4.1-7.6-9V4L10 1.4Zm0 2.1L4.4 5.4v4.2c0 3.9 2.4 6.8 5.6 7.1 3.2-.3 5.6-3.2 5.6-7.1V5.4L10 3.5Z"/><path d="M9 13.4 5.9 10.3l1.4-1.4L9 10.6l3.7-3.7 1.4 1.4L9 13.4Z"/></svg>',
};

// adminOnly: só aparece para quem tem perfil.role === 'admin_chefe' — o
// Editor só enxerga Início, Clientes, Produtos e Vendas.
const NAV = [
  {id:'home', label:'Início', icon:'home', href:'index.html'},
  {id:'clientes', label:'Clientes', icon:'users', href:'clientes.html'},
  {id:'produtos', label:'Produtos', icon:'box', href:'produtos.html'},
  {id:'vendas', label:'Vendas', icon:'file', href:'vendas.html'},
  {id:'financeiro', label:'Financeiro', icon:'coins', href:'financeiro.html', adminOnly:true},
  {id:'backup', label:'Backup', icon:'upload', href:'backup.html', adminOnly:true},
  {id:'seguranca', label:'Segurança', icon:'shield', href:'seguranca.html', adminOnly:true},
];

function renderNavHTML(active, isAdmin){
  return NAV.filter(item=> !item.adminOnly || isAdmin).map(item=>
    '<a class="navlink menu-label'+(item.id===active?' active':'')+'" href="'+item.href+'">'+ICONS[item.icon]+'<span>'+item.label+'</span></a>'
  ).join('');
}

function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
  const btn = document.getElementById('navburger');
  if(btn) btn.setAttribute('aria-expanded','true');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  const btn = document.getElementById('navburger');
  if(btn) btn.setAttribute('aria-expanded','false');
}
function toggleSidebar(){
  const isOpen = document.getElementById('sidebar').classList.contains('open');
  if(isOpen) closeSidebar(); else openSidebar();
}

// Monta a casca da página (menu lateral + topbar + área de conteúdo) no início do
// <body> e devolve os elementos que a própria página vai preencher.
// `perfil` (opcional): { role: 'admin_chefe'|'editor' } — controla quais abas
// aparecem no menu (ver adminOnly em NAV).
// Idempotente: se a casca já existe (chegamos aqui via navegação sem recarregar
// a página, ver navegarPara mais abaixo), só atualiza o item ativo do menu e o
// rótulo do papel — não recria sidebar/topbar do zero.
function mount(active, perfil){
  const isAdmin = !!(perfil && perfil.role === 'admin_chefe');
  const papelLabel = perfil ? (isAdmin ? 'Administrador chefe' : 'Editor') : 'v2.0 &middot; Supabase';
  if(!document.getElementById('shell')){
    document.body.insertAdjacentHTML('afterbegin', `
      <div id="shell">
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <aside id="sidebar">
          <div class="brand">
            <div class="brand-name">Ramos de Oliveira</div>
            <div class="brand-sub">Enxovais &middot; Sistema</div>
          </div>
          <nav class="mainnav" id="mainnav"></nav>
          <div class="sidebar-foot"><span></span><button id="nav-logout" type="button">Sair</button></div>
        </aside>
        <div id="main">
          <header class="topbar">
            <div class="topbar-left">
              <button type="button" class="iconbtn navburger" id="navburger" aria-label="Abrir menu" aria-expanded="false"><svg viewBox="0 0 20 20" fill="currentColor"><rect x="1.6" y="3.8" width="16.8" height="2.3" rx="1.15"/><rect x="1.6" y="8.85" width="16.8" height="2.3" rx="1.15"/><rect x="1.6" y="13.9" width="16.8" height="2.3" rx="1.15"/></svg></button>
              <div>
                <h1 id="pagetitle"></h1>
                <div class="crumb" id="pagecrumb"></div>
              </div>
            </div>
            <div id="topbar-actions"></div>
          </header>
          <main class="content" id="content"></main>
        </div>
      </div>
      <div class="toast-wrap" id="toasts"></div>
    `);
    const burger = document.getElementById('navburger');
    if(burger) burger.onclick = toggleSidebar;
    const overlay = document.getElementById('sidebar-overlay');
    if(overlay) overlay.onclick = closeSidebar;
    const mainnav = document.getElementById('mainnav');
    if(mainnav) mainnav.addEventListener('click', (e)=>{ if(e.target.closest('a')) closeSidebar(); });
    const logoutBtn = document.getElementById('nav-logout');
    if(logoutBtn) logoutBtn.onclick = ()=> window.RO.logout();
    initRouter();
  }
  document.getElementById('mainnav').innerHTML = renderNavHTML(active, isAdmin);
  const footSpan = document.querySelector('#shell .sidebar-foot span');
  if(footSpan) footSpan.innerHTML = papelLabel;
}

function setTitle(title, crumb, actionsHTML){
  document.getElementById('pagetitle').textContent = title;
  document.getElementById('pagecrumb').textContent = crumb || '';
  document.getElementById('topbar-actions').innerHTML = actionsHTML || '';
}
function backHomeBtn(){
  return '<a class="btn backhome" href="index.html">'+ICONS.back+' Início</a>';
}

/* ============================================================
   Navegação sem recarregar a página inteira (SPA leve)
   ------------------------------------------------------------
   Ao clicar num link para outra tela do sistema (menu lateral, botão
   "Início", atalhos do painel), em vez do navegador descartar tudo e
   recarregar HTML/CSS/fontes/JS do zero, buscamos só o HTML da página de
   destino, executamos o script dela e trocamos apenas o conteúdo — o menu
   lateral e o topo continuam montados. Um clique direto na URL ou um F5
   continua fazendo o carregamento normal (nada muda nesse caso).
   ============================================================ */
const PAGE_FILES = new Set(NAV.map(n=>n.href));
const injectedPageStyles = new Set();

function resolvePageFile(href){
  try{
    const url = new URL(href, location.href);
    if(url.origin !== location.origin) return null;
    const file = url.pathname.split('/').pop() || 'index.html';
    return PAGE_FILES.has(file) ? file : null;
  }catch(e){ return null; }
}

async function navegarPara(href, push){
  const file = resolvePageFile(href);
  if(!file){ window.location.href = href; return; }
  closeSidebar();
  // remove elementos que uma página anterior tenha inserido fora do próprio
  // #content (ex.: a barra de sub-abas de vendas.html)
  document.querySelectorAll('[data-pjax-extra]').forEach(n=> n.remove());
  const contentEl = document.getElementById('content');
  if(contentEl) contentEl.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto;"></div></div>';
  const topActions = document.getElementById('topbar-actions');
  if(topActions) topActions.innerHTML = '';
  let html;
  try{
    const resp = await fetch(file, { cache: 'no-store' });
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    html = await resp.text();
  }catch(e){
    // falhou a busca (ex.: sem rede) — cai para a navegação normal do navegador
    window.location.href = href;
    return;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // injeta um <style> próprio da página (ex.: o CSS das sub-abas de vendas.html)
  // uma única vez — as páginas compartilham assets/style.css, mas algumas têm
  // um bloquinho de CSS extra no próprio <head>.
  if(!injectedPageStyles.has(file)){
    doc.querySelectorAll('head style').forEach(styleEl=>{
      const tag = document.createElement('style');
      tag.setAttribute('data-pjax-style', file);
      tag.textContent = styleEl.textContent;
      document.head.appendChild(tag);
    });
    injectedPageStyles.add(file);
  }
  if(doc.title) document.title = doc.title;
  if(push) history.pushState({ pjax:true, file }, '', file);
  // executa só o(s) <script> inline da página (RO/RO_NAV/supabase-js já estão
  // carregados globalmente — não precisa recarregar os <script src="...">)
  const scriptCode = Array.from(doc.querySelectorAll('script:not([src])')).map(s=>s.textContent).join('\n;\n');
  try{
    (0, eval)(scriptCode);
  }catch(e){
    console.error('Erro ao executar script da página '+file+':', e);
    window.location.href = href;
  }
}

let routerPronto = false;
function initRouter(){
  if(routerPronto) return;
  routerPronto = true;
  document.addEventListener('click', (e)=>{
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if(!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const file = resolvePageFile(a.getAttribute('href'));
    if(!file) return;
    e.preventDefault();
    if(file !== location.pathname.split('/').pop()) navegarPara(a.getAttribute('href'), true);
  });
  window.addEventListener('popstate', ()=> navegarPara(location.href, false));
}

window.RO_NAV = { ICONS, NAV, mount, setTitle, backHomeBtn, openSidebar, closeSidebar, toggleSidebar };
})();
