const box = document.getElementById('messages');
const form = document.getElementById('chatForm');
const input = document.getElementById('prompt');
const submit = form.querySelector('button[type="submit"]');
const KEY = 'achaifsc_chat_history';
let history = [];
let busy = false;

function say(text, who = 'bot') {
  const el = document.createElement('div');
  el.className = 'bubble ' + who;
  el.textContent = text;
  box.append(el);
  box.scrollTop = box.scrollHeight;
}
function persist() {
  try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-20))); } catch (_) {}
}
try {
  const saved = JSON.parse(sessionStorage.getItem(KEY) || '[]');
  if (Array.isArray(saved) && saved.length) {
    history = saved.filter(x => ['user', 'assistant'].includes(x.role) && typeof x.content === 'string').slice(-20);
    box.querySelectorAll('.bubble').forEach(el => el.remove());
    history.forEach(x => say(x.content, x.role === 'user' ? 'user' : 'bot'));
  }
} catch (_) {}

async function send(message) {
  const text = String(message || '').trim();
  if (!text || busy) return;
  busy = true;
  submit.disabled = true;
  say(text, 'user');
  history.push({ role: 'user', content: text });
  persist();
  const waiting = document.createElement('div');
  waiting.className = 'bubble bot';
  waiting.textContent = 'Digitando...';
  box.append(waiting);
  box.scrollTop = box.scrollHeight;
  try {
    let items = [];
    try {
      if (window.AchaIFSC_DB) {
        const all = await window.AchaIFSC_DB.listItems();
        items = all.filter(x => x.status !== 'resolvido').slice(0, 100).map(x => ({
          id: String(x.id || '').slice(0, 80),
          nome: String(x.nome || '').slice(0, 100),
          tipo: String(x.tipo || '').slice(0, 30),
          cor: String(x.cor || '').slice(0, 40),
          local: String(x.local || '').slice(0, 100),
          categoria: String(x.categoria || '').slice(0, 70),
          descricao: String(x.descricao || '').slice(0, 250)
        }));
      }
    } catch (error) { console.warn('Mural indisponível:', error); }
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-12), items })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Não consegui conversar agora.');
    const reply = String(payload.reply || '').trim();
    if (!reply) throw new Error('Resposta vazia da IA.');
    waiting.remove();
    say(reply);
    history.push({ role: 'assistant', content: reply });
    history = history.slice(-20);
    persist();
  } catch (error) {
    waiting.remove();
    say('Não consegui responder agora. ' + (error.message || 'Tente novamente mais tarde.') + ' Se o site estiver aberto como arquivo local, publique-o na Vercel para ativar a IA.');
    // Remove failed user turn so retry won't repeat it in the model context.
    history.pop();
    persist();
  } finally {
    busy = false;
    submit.disabled = false;
    input.focus();
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  input.value = '';
  send(text);
});
document.querySelectorAll('[data-msg]').forEach(button => button.addEventListener('click', () => send(button.dataset.msg)));
