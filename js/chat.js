/* AchaIFSC: assistente conversacional com busca real no Firebase.
   A IA do Gemini é opcional. Nenhum resultado é inventado quando a API falha. */
const messagesBox = document.querySelector('#messages');
const chatForm = document.querySelector('#chatForm');
const chatInput = document.querySelector('#prompt');
const chatSubmit = chatForm.querySelector('button[type="submit"]');
const chatState = {item:'',intent:'perdido',color:'',place:'',history:[]};
let chatBusy = false;
const normalize = v => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const aliases = [
 ['lapis','lapiseira','lapis de cor'],['caneta','canetas'],['borracha'],['caderno','cadernos'],
 ['livro','livros'],['estojo'],['garrafa','squeeze'],['bola','bolas'],['fone','fones','fone de ouvido','headset'],
 ['celular','smartphone','telefone'],['carteira'],['chave','chaves','chaveiro'],['cartao'],
 ['documento','identidade','rg','cpf'],['mochila','mochilas'],['casaco','blusa','jaqueta'],
 ['camiseta','camisa','uniforme'],['oculos'],['relogio'],['tenis','sapato','chuteira'],
 ['bolsa','bolsas'],['mouse'],['teclado'],['notebook','computador','laptop'],['carregador'],
 ['pendrive','pen drive'],['guarda chuva','sombrinha'],['brinco'],['anel','alianca'],['pulseira'],
 ['colar'],['calculadora'],['boné','bone'],['regua'],['fone bluetooth']
].map(group=>group.map(normalize));
const simpleColors = ['preto','preta','branco','branca','azul','verde','vermelho','vermelha','amarelo','amarela','rosa','roxo','roxa','cinza','marrom','laranja','bege','dourado','dourada','prata'];
function canonicalColor(c){return ({preta:'preto',branca:'branco',vermelha:'vermelho',amarela:'amarelo',roxa:'roxo',dourada:'dourado'})[c] || c;}
function bubble(value, kind='bot'){
 const el=document.createElement('div');el.className='bubble '+kind;el.textContent=value;
 messagesBox.appendChild(el);messagesBox.scrollTop=messagesBox.scrollHeight;return el;
}
function detectItem(text){
 const n=' '+normalize(text)+' ';
 for(const group of aliases){
   for(const alias of [...group].sort((a,b)=>b.length-a.length))if(n.includes(' '+alias+' '))return group[0];
 }
 // Recebe também objetos que não estão na lista, como "estojo neon" ou "adaptador".
 const match=normalize(text).match(/\b(?:perdi|perdeu|perdido|perdida|sumiu|esqueci|procuro|procurar|busca|buscar|achei|encontrei|encontrou)\s+(?:(?:o|a|um|uma|meu|minha|meus|minhas|uns|umas|aquele|aquela)\s+){0,3}([a-z0-9]+(?:\s+[a-z0-9]+){0,2})/);
 if(!match)return '';
 const words=match[1].split(' '), result=[];
 const ignore=new Set(['algo','alguma','algum','objeto','coisa','no','na','uma','um','meu','minha','o','a','de']);
 for(const word of words){if(['de','do','da','com','em','no','na','perto','hoje','ontem','que'].includes(word))break;if(!ignore.has(word))result.push(word);}
 return result.slice(0,2).join(' ');
}
function searchTerms(word){
 const normalized=normalize(word);const group=aliases.find(g=>g.includes(normalized));
 return group || [normalized];
}
function detectPlace(text){
 const n=normalize(text);
 const places=['biblioteca','cantina','quadra','sala','laboratorio','banheiro','refeitorio','patio','corredor','entrada','portaria','ginasio','estacionamento','auditorio','secretaria','bloco','escada','elevador'];
 return places.find(p=>(' '+n+' ').includes(' '+p+' '))||'';
}
function updateState(message){
 const n=normalize(message);
 if(/\b(encontrei|achei|encontrou|achei um|encontrado|encontrada)\b/.test(n)&&!/\b(perdi|perdeu|perdido|perdida)\b/.test(n))chatState.intent='encontrado';
 if(/\b(perdi|perdeu|perdido|perdida|sumiu|esqueci)\b/.test(n))chatState.intent='perdido';
 const obj=detectItem(message);
 if(obj){if(chatState.item!==obj){chatState.color='';chatState.place='';} chatState.item=obj;}
 const c=simpleColors.find(color=>(' '+n+' ').includes(' '+color+' '));if(c)chatState.color=canonicalColor(c);
 const place=detectPlace(message);if(place)chatState.place=place;
}
function findMatches(posts){
 const terms=searchTerms(chatState.item);
 return posts.filter(item=>item.status!=='resolvido'&&!item.resolvido).map(item=>{
   const title=normalize(item.nome||item.titulo),description=normalize(item.descricao),category=normalize(item.categoria);
   const searchable=' '+[title,description,category].join(' ')+' ';
   const hasObject=terms.some(w=>searchable.includes(' '+w+' ') || (w.length>3&&searchable.includes(' '+w+'s ')));
   if(!hasObject)return null;
   const combined=normalize([title,description,category,item.local,item.cor].join(' '));
   let score=item.tipo===(chatState.intent==='perdido'?'encontrado':'perdido')?30:10;
   if(terms.some(w=>(' '+title+' ').includes(' '+w+' ')))score+=8;
   if(chatState.color&&combined.includes(chatState.color))score+=5;
   if(chatState.place&&combined.includes(chatState.place))score+=5;
   return {item,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.item);
}

function showResults(items){
 const results=document.createElement('div');results.className='results';
 for(const item of items){
   const a=document.createElement('a');a.className='result-card';a.href='mural.html?item='+encodeURIComponent(item.id);
   const imageValue=String(item.foto_url||'');
   if(/^https:\/\//i.test(imageValue)||/^data:image\/(png|jpeg|gif|webp);base64,/i.test(imageValue)){
      const img=document.createElement('img');img.src=imageValue;img.alt='Foto do anúncio';img.loading='lazy';a.append(img);
   }
   const body=document.createElement('div');const title=document.createElement('strong');title.textContent=item.nome||'Objeto';body.append(title);
   const meta=document.createElement('small');meta.textContent=(item.tipo==='perdido'?'Perdido':'Encontrado')+' · '+(item.local||'Local não informado');body.append(meta);
   const call=document.createElement('span');call.className='result-link';call.textContent='Abrir no mural →';body.append(call);a.append(body);results.append(a);
 }
 messagesBox.append(results);messagesBox.scrollTop=messagesBox.scrollHeight;
}
async function geminiConversation(text,items){
 const list=items.map(i=>({nome:String(i.nome||'').slice(0,120),tipo:i.tipo,local:String(i.local||'').slice(0,120),descricao:String(i.descricao||'').slice(0,250)}));
 const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...chatState.history.slice(-9)],items:list})});
 if(!response.ok)throw new Error('Gemini: HTTP '+response.status);
 const data=await response.json();if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('Gemini não respondeu');
 return data.reply.trim();
}
function friendlyReply(text){
 const n=normalize(text);
 if(/\b(obrigado|obrigada|valeu|brigado|brigada)\b/.test(n))return 'Por nada! 💚 Se precisar procurar algo ou publicar um anúncio, estou por aqui.';
 if(/\b(tchau|ate mais|ate logo)\b/.test(n))return 'Até mais! Espero que o objeto apareça. 💚';
 if(/\b(oi|ola|opa|bom dia|boa tarde|boa noite|tudo bem|como vai)\b/.test(n))return 'Oi! Tudo bem? 😊 Me conta o que você perdeu ou encontrou que eu procuro os anúncios no Firebase.';
 if(/\b(quem e voce|o que voce faz|como funciona)\b/.test(n))return 'Sou o assistente do AchaIFSC. Procuro nos anúncios cadastrados no Firebase e ajudo você a publicar objetos perdidos ou encontrados.';
 return '';
}
async function replyTo(message){
 if(chatBusy||!message.trim())return;
 chatBusy=true;chatSubmit.disabled=true;chatInput.value='';
 bubble(message,'user');chatState.history.push({role:'user',content:message});
 try{
   const n=normalize(message);
   const hasIntent=/\b(perdi|perdeu|perdido|perdida|esqueci|sumiu|procuro|procurar|busca|buscar|encontrei|achei|encontrado|encontrada|encontrou)\b/.test(n);
   const simpleSocial=friendlyReply(message);
   const previousItem=chatState.item;
   updateState(message);
   let response='';
   if(simpleSocial&&!hasIntent&&!detectItem(message)){
      try{response=await geminiConversation(message,[]);}catch{response=simpleSocial;}
      bubble(response);chatState.history.push({role:'assistant',content:response});return;
   }
   if(!chatState.item){
      response='Qual objeto você quer procurar? Por exemplo: “perdi um lápis azul na cantina”.';
      bubble(response);chatState.history.push({role:'assistant',content:response});return;
   }
   const loading=bubble('Consultando os anúncios cadastrados no Firebase...');
   try{
      if(!window.AchaIFSC_DB?.listItems)throw new Error('O arquivo js/firebase.js não foi carregado.');
      const posts=await window.AchaIFSC_DB.listItems();
      const found=findMatches(posts||[]);
      loading.remove();
      if(found.length){
        const desired=chatState.intent==='perdido'?'encontrado':'perdido';
        const opposite=found.filter(item=>item.tipo===desired);
        const same=found.filter(item=>item.tipo!==desired);
        if(opposite.length){
          response=`Encontrei ${opposite.length} anúncio${opposite.length===1?'':'s'} de ${chatState.item} como ${desired}. Confira os anúncios abaixo: pode ser o objeto que você procura, mas só as informações do responsável podem confirmar.`;
        }else{
          response=`Encontrei ${found.length} anúncio${found.length===1?'':'s'} sobre ${chatState.item} no Firebase, mas ${chatState.intent==='perdido'?'todos são de outras pessoas que também perderam esse objeto':'não há publicação de alguém procurando esse objeto'}. Ainda não encontrei uma publicação que confirme ${chatState.intent==='perdido'?'que alguém encontrou o seu':'quem é o dono'}. Veja os anúncios abaixo.`;
        }
        if(opposite.length&&same.length)response+=` Também há ${same.length} anúncio${same.length===1?'':'s'} do mesmo tipo de situação que a sua.`;
        bubble(response);showResults(found);
      }else{
        const action=chatState.intent==='perdido'?'perdido.html':'encontrado.html';
        response=`Consultei o Firebase, mas não encontrei publicações de ${chatState.item} no mural neste momento. Você pode publicar em “${chatState.intent==='perdido'?'Perdi':'Encontrei'}” ou me dizer mais características.`;
        bubble(response);
        const link=document.createElement('a');link.href=action;link.textContent=chatState.intent==='perdido'?'Publicar objeto perdido →':'Publicar objeto encontrado →';link.className='result-card';messagesBox.append(link);
      }
      chatState.history.push({role:'assistant',content:response});
   }catch(error){
      console.error('AchaIFSC Firebase:',error);loading.remove();
      response='Não consegui consultar o Firebase neste momento. Confira a conexão e as permissões do banco. Não posso afirmar se há ou não anúncios sem consultar os dados.';
      bubble(response);chatState.history.push({role:'assistant',content:response});
   }
 }finally{chatBusy=false;chatSubmit.disabled=false;chatInput.focus();}
}
chatForm.addEventListener('submit',event=>{event.preventDefault();replyTo(chatInput.value.trim());});
document.querySelectorAll('[data-msg]').forEach(button=>button.addEventListener('click',()=>replyTo(button.dataset.msg)));
