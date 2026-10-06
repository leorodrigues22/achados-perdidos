// ============================================================
// AchaIFSC + Supabase
// Cole SOMENTE a sua Publishable key abaixo.
// Nunca coloque uma Secret key / service_role neste arquivo.
// ============================================================

const SUPABASE_URL = "https://smymcbltrxtcmiaiodqu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "SUA_CHAVE_PUBLICA_AQUI";

if (!window.supabase) {
  throw new Error("Biblioteca do Supabase não foi carregada.");
}

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
