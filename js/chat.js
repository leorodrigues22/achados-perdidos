// AchaIFSC: conversa com contexto, consulta real ao Firebase e Gemini quando disponível.
const box = document.querySelector('#messages');
const form = document.querySelector('#chatForm');
const input = document.querySelector('#prompt');
const submit = form.querySelector('button[type="submit"]');
const state = {intent:'', object:'', color:'', place:'', description:'', asked:'', messages:[], lastSignature:''};
let busy = false;
const normalize = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const objectGroups = [
 ['bola','bolas'],['camiseta','camisetas','camisa','camisas'],['tenis','sapato','calcado'],
 ['celular','telefone','smartphone'],['fone','fones','headset'],['mochila','mochilas'],
 ['garrafa','squeeze'],['chave','chaves'],['carteira'],['oculos'],['relogio'],
 ['caderno'],['livro'],['estojo'],['casaco','jaqueta','blusa'],['guarda chuva','sombrinha'],
 ['cartao'],['documento'],['bolsa'],['notebook','laptop'],['mouse'],['carregador'],
 ['caneta'],['pendrive','pen drive'],['uniforme'],['bone'],['guarda po'],['guarda sol'],
 ['brinco'],['anel','alianca'],['pulseira'],['colar'],['chuteira'],['fone de ouvido'],
 ['calculadora'],['chapeu'],['guarda chuva']
];
const objectMap = new Map(objectGroups.flatMap(group=>group.map(word=>[word,group[0]])));
const colors = ['preto','preta','branco','branca','azul','vermelho','vermelha','verde','amarelo','amarela','rosa','roxo','roxa','cinza','marrom','laranja','bege','dourado','dourada','prata'];
const colorRoot = color => ({preta:'preto',branca:'branco',vermelha:'vermelho',amarela:'amarelo',roxa:'roxo',dourada:'dourado'})[color]||color;
function detectObject(text){const t=' '+normalize(text)+' ';return [...objectMap.keys()].sort((a,b)=>b.length-a.length).map(k=>t.includes(' '+k+' ')?objectMap.get(k):'').find(Boolean)||''}
function detectColor(text){const t=' '+normalize(text)+' ';return colors.map(c=>t.includes(' '+c+' ')?colorRoot(c):'').find(Boolean)||''}
function detectPlace(text){
 const t=normalize(text);
 const match=t.match(/(?:perto (?:da|do|de|dos|das)?|na|no|pela|pelo|em frente (?:a|ao)?|proximo (?:da|do|de)?|atr[aá]s (?:da|do)?)\s+(cantina|biblioteca|quadra|sala(?: de aula)?(?: \d+)?|laboratorio|banheiro|refeitorio|patio|corredor|entrada|portaria|gin[aá]sio|estacionamento|bloco(?: \w+)?|ef|auditorio|secretaria|escada|elevador)/);
 if(match)return match[1];
 const simple=['cantina','biblioteca','quadra','laboratorio','banheiro','refeitorio','patio','corredor','entrada','portaria','ginasio','estacionamento','auditorio','secretaria','escada','elevador'];
 return simple.find(p=>(' '+t+' ').includes(' '+p+' '))||'';
}
function say(text,who='bot') {const el=document.createElement('div');el.className='bubble '+who;el.textContent=text;box.append(el);box.scrollTop=box.scrollHeight;return el}
function imageUrl(value){const s=String(value||'');return /^(https:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(s)?s:''}
function showCards(items){
 const list=document.createElement('div');list.className='results';
 for(const item of items){
  const a=document.createElement('a');a.className='result-card';a.href='mural.html?item='+encodeURIComponent(item.id);
  const photo=imageUrl(item.foto_url);if(photo){const img=document.createElement('img');img.src=photo;img.alt='Foto do objeto';img.loading='lazy';a.append(img)}
  const content=document.createElement('div');const title=document.createElement('strong');title.textContent=item.nome||'Objeto sem nome';content.append(title);
  const meta=document.createElement('small');meta.textContent=(item.tipo==='encontrado'?'Encontrado':'Perdido')+' · '+(item.local||'Local não informado');content.append(meta);
  const link=document.createElement('span');link.className='result-link';link.textContent='Ver anúncio no mural →';content.append(link);a.append(content);list.append(a);
 }
 box.append(list);box.scrollTop=box.scrollHeight;
}
function matches(posts){
 const group=objectGroups.find(g=>g[0]===state.object)||[state.object];
 const opposite='encontrado';
 return posts.filter(item=>item.status!=='resolvido'&&!item.resolvido&&item.tipo===opposite).map(item=>{
  const title=normalize(item.nome||item.titulo);const description=normalize(item.descricao);const category=normalize(item.categoria);
  const objectMatch=group.some(alias=>(' '+title+' '+category+' '+description+' ').includes(' '+alias+' '));
  if(!objectMatch)return null;
  let score=10;
  if(group.some(alias=>(' '+title+' ').includes(' '+alias+' ')))score+=6;
  const all=normalize([item.nome,item.titulo,item.cor,item.local,item.descricao,item.categoria].join(' '));
  if(state.color&&(' '+all+' ').includes(' '+state.color+' '))score+=5;
  if(state.place&&(' '+all+' ').includes(' '+state.place+' '))score+=5;
  for(const word of normalize(state.description).split(' ').filter(w=>w.length>3))if((' '+all+' ').includes(' '+word+' '))score++;
  return {item,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.item);
}
async function geminiReply(posts, found){
 // Apenas candidatos já filtrados são enviados, reduzindo custo e evitando falsos anúncios.
 const items=found.map(item=>({id:String(item.id),nome:item.nome||item.titulo||'',tipo:item.tipo,cor:item.cor||'',local:item.local||'',categoria:item.categoria||'',descricao:item.descricao||''}));
 const summary=`Contexto da busca: ${state.intent}; objeto: ${state.object}; cor: ${state.color||'não informada'}; local: ${state.place||'não informado'}. Existem ${items.length} possíveis anúncios do tipo oposto. Responda naturalmente e sem inventar correspondências.`;
 const messages=[{role:'user',content:summary},...state.messages.slice(-10)];
 const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,items})});
 if(!response.ok)throw new Error('IA indisponível: '+response.status);
 const data=await response.json();if(!data.reply)throw new Error('Resposta vazia');return data.reply;
}
function fallback(found){
 if(found.length)return `Encontrei ${found.length} anúncio${found.length===1?'':'s'} de ${state.object} entre os objetos encontrados. Veja as fotos e os locais abaixo. Algum parece ser o seu?`;
 return `Procurei ${state.object} entre os objetos encontrados, mas ainda não achei uma correspondência. Tente me contar outra característica ou consulte o mural. Se alguém encontrar, poderá publicar por lá.`;
}
function socialReply(text){
 const n=normalize(text);
 const hello=/\b(oi|ola|opa|e ai|bom dia|boa tarde|boa noite)\b/.test(n);
 const wellbeing=/\b(tudo bem|como voce esta|como vc esta|como vai|tudo certo|ta bem|ta tudo bem)\b/.test(n);
 const thanks=/\b(obrigad[oa]|valeu|agradeco|brigad[oa])\b/.test(n);
 const farewell=/\b(tchau|ate mais|ate logo|falou)\b/.test(n);
 // Só tratar mensagens sociais quando não há uma solicitação de busca junto.
 const searchIntent=/\b(perdi|perdeu|perdido|perdida|encontrei|achei|encontrado|encontrada|sumiu|esqueci|procurando|procura|pesquisa|busca)\b/.test(n);
 if(searchIntent||detectObject(text))return '';
 if(hello||wellbeing){
  const opening=hello&&wellbeing?'Oi! Tudo bem sim, e com você? 😊':wellbeing?'Tudo bem por aqui! E você, como está? 😊':'Oi! Que bom te ver por aqui! 😊';
  return opening+(state.object?` Se quiser, podemos continuar procurando ${state.object} no mural.`:' Posso procurar objetos que você perdeu nos anúncios de itens encontrados no IFSC.');
 }
 if(thanks)return 'Por nada! 💚 Se precisar procurar outro objeto ou conferir o mural, é só me chamar.';
 if(farewell)return 'Até mais! Espero que dê tudo certo com o objeto. 💚';
 if(/^(sim|estou bem|to bem|tudo otimo|tudo certo|beleza|legal|show|que bom)[ !?.]*$/.test(n))return 'Que bom! 😊 Me conta: você perdeu algum objeto no IFSC?';
 if(/^(quem e voce|qual seu nome|o que voce faz|como voce funciona)[ !?.]*$/.test(n))return 'Sou o assistente do AchaIFSC! 💚 Converso com você e consulto os anúncios cadastrados no Firebase para ajudar quem perdeu um objeto a procurar entre os anúncios de itens encontrados.';
 return '';
}
async function respond(message){
 if(busy||!message.trim())return;
 const text=message.trim();say(text,'user');state.messages.push({role:'user',content:text});
 const n=normalize(text);
 const social=socialReply(text);
 if(social){say(social);state.messages.push({role:'assistant',content:social});return}
 if(/\b(perdi|perdeu|perdido|perdida|sumiu|esqueci|procurando)\b/.test(n))state.intent='perdido';
 if(/\b(encontrei|achei|encontrado|encontrada)\b/.test(n)){const resposta='Que bom que você quer ajudar! 💚 Para registrar o objeto que encontrou, clique em “Encontrei” no menu e publique no mural.';say(resposta);state.messages.push({role:'assistant',content:resposta});return}
 const obj=detectObject(text);if(obj&&obj!==state.object){state.object=obj;state.color='';state.place='';state.description='';state.asked='';state.lastSignature=''}
 const color=detectColor(text);if(color)state.color=color;
 const place=detectPlace(text);if(place)state.place=place;
 const greetings=/^(oi|ola|bom dia|boa tarde|boa noite|tudo bem|opa)[ !?.]*$/.test(n);
 let reply='';
 if(greetings&&!state.object)reply='Olá! Tudo bem por aqui 😊 Você perdeu alguma coisa no IFSC?';
 else if(!state.intent){state.intent='perdido';reply='Qual objeto você perdeu? Vou procurar entre os itens encontrados no mural.';}
 else if(!state.object)reply=`Entendi, você ${state.intent==='perdido'?'perdeu':'encontrou'} um objeto. Qual era? Pode ser camiseta, bola, celular, mochila...`;
 else if(!state.color&&!state.place&&state.asked!=='details' && !/\b(nao sei|não sei|sem ideia|procura|pesquisa|busca)\b/.test(n)){
  state.asked='details';reply=`Entendi, ${state.intent==='perdido'?'você perdeu':'você encontrou'} ${state.object==='camiseta'?'uma':'um'} ${state.object}. Lembra a cor ou onde ${state.intent==='perdido'?'viu pela última vez':'encontrou'}? Vou conferir o mural também.`;
 }
 if(reply){say(reply);state.messages.push({role:'assistant',content:reply});return}
 const signature=[state.intent,state.object,state.color,state.place].join('|');
 // Uma mensagem como "não sei" ainda pode iniciar uma pesquisa.
 busy=true;submit.disabled=true;const loading=say('Consultando os anúncios do IFSC...');
 try{
  if(!window.AchaIFSC_DB)throw new Error('Firebase não carregado');
  const posts=await window.AchaIFSC_DB.listItems();const found=matches(posts||[]);
  loading.remove();
  // Gemini só é chamado quando há informação suficiente e a conversa avançou.
  // A consulta ao Firebase é sempre independente da API paga.
  try{reply=await geminiReply(posts,found)}catch(err){console.info('Usando resposta local:',err.message);reply=fallback(found)}
  say(reply);state.messages.push({role:'assistant',content:reply});
  if(found.length)showCards(found);
  state.lastSignature=signature;
 }catch(error){loading.remove();console.error(error);reply='Não consegui acessar o Firebase agora. Confira sua conexão e tente novamente. Os anúncios continuam disponíveis no mural quando o serviço voltar.';say(reply);state.messages.push({role:'assistant',content:reply})}
 finally{busy=false;submit.disabled=false;input.focus()}
}
form.addEventListener('submit',event=>{event.preventDefault();const message=input.value.trim();if(!message)return;input.value='';respond(message)});
document.querySelectorAll('[data-msg]').forEach(button=>button.addEventListener('click',()=>respond(button.dataset.msg)));
