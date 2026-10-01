export const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
export const date=s=>s?new Date(s+"T12:00:00").toLocaleDateString("pt-BR"):"";
export function card(p,owner=false){
 const t=p.resolvido?"resolvido":p.tipo;
 return `<article class="card">
 <div class="photo" ${p.fotoUrl?`style="background-image:url('${p.fotoUrl}')"`:""}>${p.fotoUrl?"":"📦"}</div>
 <div class="body">
 <div class="topline"><span class="status ${t}">${t.toUpperCase()}</span><small>${esc(p.categoria)}</small></div>
 <h3>${esc(p.titulo)}</h3><p>${esc(p.descricao)}</p>
 <div class="meta"><span>📍 ${esc(p.local)}</span><span>📅 ${date(p.data)}</span><span>💬 ${esc(p.contato)}</span></div>
 ${owner?`<div class="cardActions">${p.resolvido?"":`<button class="btn secondary" data-resolver="${p.id}">Marcar resolvido</button>`}<button class="btn danger" data-excluir="${p.id}">Excluir</button></div>`:""}
 </div></article>`;
}