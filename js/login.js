import {auth} from "./firebase.js";
import {signInWithEmailAndPassword,createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const msg=document.querySelector("#msg");
loginForm.onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,email.value,senha.value);location.href="index.html"}catch{msg.textContent="Não foi possível entrar. Confira e-mail e senha."}};
registerForm.onsubmit=async e=>{e.preventDefault();try{await createUserWithEmailAndPassword(auth,regEmail.value,regSenha.value);location.href="index.html"}catch{msg.textContent="Não foi possível criar a conta. Use uma senha com pelo menos 6 caracteres."}};