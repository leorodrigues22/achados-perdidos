import {auth,db,storage} from "./firebase.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {addDoc,collection,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
const form=document.querySelector("#postForm"),msg=document.querySelector("#msg"),foto=document.querySelector("#foto"),preview=document.querySelector("#preview");
let user=null,file=null;data.value=new Date().toISOString().split("T")[0];
const tp=new URLSearchParams(location.search).get("tipo");if(tp==="perdido"||tp==="encontrado"){const r=document.querySelector(`input[value="${tp}"]`);if(r)r.checked=true}
onAuthStateChanged(auth,u=>{user=u;if(!u)location.href="login.html"});
foto.onchange=()=>{file=foto.files[0]||null;if(file){preview.style.backgroundImage=`url('${URL.createObjectURL(file)}')`;preview.classList.remove("hidden")}};
form.onsubmit=async e=>{e.preventDefault();if(!user)return;msg.textContent="Publicando...";try{let fotoUrl="";if(file){const r=ref(storage,`anuncios/${user.uid}/${Date.now()}-${file.name}`);await uploadBytes(r,file);fotoUrl=await getDownloadURL(r)}const f=new FormData(form);await addDoc(collection(db,"anuncios"),{uid:user.uid,email:user.email,tipo:f.get("tipo"),titulo:f.get("titulo").trim(),categoria:f.get("categoria"),local:f.get("local").trim(),data:f.get("data"),descricao:f.get("descricao").trim(),contato:f.get("contato").trim(),fotoUrl,resolvido:false,criadoEm:serverTimestamp()});location.href="meus-anuncios.html"}catch(err){console.error(err);msg.textContent="Não foi possível publicar. Confira o Firebase."}};