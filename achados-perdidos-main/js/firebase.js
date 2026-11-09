// ============================================================
// AchaIFSC + Firebase Realtime Database
//
// Configuração pronta para o projeto "AchaIFSC".
//
// IMPORTANTE:
// - A configuração Web do Firebase pode ficar no front-end.
// - A segurança real fica nas REGRAS do Realtime Database.
// - Nunca coloque service account, private key ou chave administrativa aqui.
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDBbfDh2_xOD6n0o091Sx6YXmfpK_WoklM",
  authDomain: "achaifsc.firebaseapp.com",
  databaseURL: "https://achaifsc-default-rtdb.firebaseio.com",
  projectId: "achaifsc",
  storageBucket: "achaifsc.firebasestorage.app",
  messagingSenderId: "395011609130",
  appId: "1:395011609130:web:98931c0c1802dbf88ce953"
};

function configPreenchida() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey !== "COLE_AQUI" &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.projectId !== "SEU-PROJETO" &&
    FIREBASE_CONFIG.databaseURL &&
    !FIREBASE_CONFIG.databaseURL.includes("SEU-PROJETO")
  );
}

if (!window.firebase) {
  throw new Error(
    "Biblioteca do Firebase não foi carregada. Confira os scripts do Firebase no HTML."
  );
}

let app = null;
let auth = null;
let database = null;
let authPromise = Promise.resolve(null);

if (configPreenchida()) {
  app = window.firebase.apps?.length
    ? window.firebase.app()
    : window.firebase.initializeApp(FIREBASE_CONFIG);

  auth = window.firebase.auth();
  database = window.firebase.database();

  authPromise = new Promise(resolve => {
    let resolved = false;

    const finish = user => {
      if (resolved) return;
      resolved = true;
      resolve(user || null);
    };

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        unsubscribe();
        finish(user);
        return;
      }

      try {
        const credential = await auth.signInAnonymously();
        unsubscribe();
        finish(credential.user);
      } catch (error) {
        console.error(
          "Não foi possível iniciar a autenticação anônima:",
          error
        );

        unsubscribe();
        finish(null);
      }
    });
  });
}

async function requireAuth() {
  if (!configPreenchida() || !auth || !database) {
    throw new Error("Firebase ainda não configurado.");
  }

  const user = auth.currentUser || await authPromise;

  if (!user) {
    throw new Error(
      "A autenticação anônima do Firebase não está funcionando."
    );
  }

  return user;
}

function snapshotToRows(snapshot) {
  const rows = [];

  snapshot.forEach(child => {
    rows.push({
      id: child.key,
      ...child.val()
    });
  });

  return rows.sort((a, b) => {
    const dateA =
      new Date(a.created_at || 0).getTime() || 0;

    const dateB =
      new Date(b.created_at || 0).getTime() || 0;

    return dateB - dateA;
  });
}

async function listItems() {
  if (!configPreenchida() || !database) {
    throw new Error("Firebase ainda não configurado.");
  }

  const snapshot =
    await database
      .ref("itens")
      .once("value");

  return snapshotToRows(snapshot);
}

async function getItem(id) {
  if (!configPreenchida() || !database) {
    throw new Error("Firebase ainda não configurado.");
  }

  const snapshot =
    await database
      .ref(`itens/${id}`)
      .once("value");

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.key,
    ...snapshot.val()
  };
}

async function getItemsByIds(ids) {
  const unique =
    [...new Set((ids || []).map(String))];

  const rows =
    await Promise.all(
      unique.map(getItem)
    );

  return rows
    .filter(Boolean)
    .sort((a, b) => {
      const dateA =
        new Date(a.created_at || 0).getTime() || 0;

      const dateB =
        new Date(b.created_at || 0).getTime() || 0;

      return dateB - dateA;
    });
}

async function addItem(item) {
  const user =
    await requireAuth();

  const ref =
    database
      .ref("itens")
      .push();

  const row = {
    ...item,
    owner_uid: user.uid,
    created_at: new Date().toISOString()
  };

  await ref.set(row);

  return {
    id: ref.key,
    ...row
  };
}

async function updateItemStatus(id, status) {
  await requireAuth();

  if (!["ativo", "resolvido"].includes(status)) {
    throw new Error("Status inválido.");
  }

  await database
    .ref(`itens/${id}`)
    .update({
      status
    });
}

async function deleteItem(id) {
  await requireAuth();

  await database
    .ref(`itens/${id}`)
    .remove();
}

window.AchaIFSC_DB = {
  isConfigured: configPreenchida,

  ready: () =>
    authPromise,

  currentUser: () =>
    auth?.currentUser || null,

  listItems,
  getItem,
  getItemsByIds,
  addItem,
  updateItemStatus,
  deleteItem
};
