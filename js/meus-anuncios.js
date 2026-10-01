import {auth,db} from "./firebase.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {collection,deleteDoc,doc,getDocs,query,updateDoc,where} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {card} from "./common.js";
const box=document.querySelector("#meus"),vazio=document.querySelector("#vazio");let user=null,posts=[];
onAuthStateChanged(auth,async u=>{user=u;if(!u){location.href="login.html";return}await load()});
async function load(){const s=await getDocs(query(collection(db,"anuncios"),where("uid","==",user.uid)));posts=s.docs.map(d=>({id:d.id,...d.data()}));render()}
function render(){box.innerHTML=posts.map(p=>card(p,true)).join("");vazio.classList.toggle("hidden",posts.length>0);document.querySelectorAll("[data-resolver]").forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,"anuncios",b.dataset.resolver),{resolvido:true});load()});document.querySelectorAll("[data-excluir]").forEach(b=>b.onclick=async()=>{if(confirm("Excluir este anúncio?")){await deleteDoc(doc(db,"anuncios",b.dataset.excluir));load()}})}
