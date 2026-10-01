import {auth,db} from "./firebase.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {collection,getDocs,orderBy,query} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {card} from "./common.js";
const lista=document.querySelector("#lista"),busca=document.querySelector("#busca"),vazio=document.querySelector("#vazio"),filters=document.querySelectorAll(".filter");
let posts=[],filtro="todos";
onAuthStateChanged(auth,u=>{loginLink.classList.toggle("hidden",!!u);logoutBtn.classList.toggle("hidden",!u)});
logoutBtn.onclick=async()=>{await signOut(auth);location.reload()};
async function load(){const s=await getDocs(query(collection(db,"anuncios"),orderBy("criadoEm","desc")));posts=s.docs.map(d=>({id:d.id,...d.data()}));render()}
function render(){const term=busca.value.toLowerCase().trim();const arr=posts.filter(p=>{const t=p.resolvido?"resolvido":p.tipo;const txt=`${p.titulo} ${p.local} ${p.descricao} ${p.categoria}`.toLowerCase();return txt.includes(term)&&(filtro==="todos"||t===filtro)});lista.innerHTML=arr.map(p=>card(p)).join("");vazio.classList.toggle("hidden",arr.length>0)}
busca.oninput=render;filters.forEach(b=>b.onclick=()=>{filters.forEach(x=>x.classList.remove("active"));b.classList.add("active");filtro=b.dataset.filter;render()});load();