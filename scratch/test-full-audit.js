import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emdwY3RmaWpmemhobWJyYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTcyODgsImV4cCI6MjA4NzQ5MzI4OH0.rDFa9vbK_N8MzCbWxUPY6cMbSo3dx5_LgID-VHZlKHM';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

const baseUrl = 'https://vairifar.vercel.app';
let token = '';
let passed = 0;
let failed = 0;

async function test(name, fn) {
  process.stdout.write(`  ⏳ ${name}... `);
  try {
    const result = await fn();
    if (result.ok) {
      console.log(`✅ PASSOU (${result.status}) ${result.note || ''}`);
      passed++;
    } else {
      console.log(`❌ FALHOU (${result.status}) ${result.note || ''}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERRO: ${err.message}`);
    failed++;
  }
}

async function req(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { headers, ...options });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('\n🔍 Iniciando Auditoria Completa de Produção\n');
  console.log(`📡 Base URL: ${baseUrl}\n`);

  // --- LOGIN ---
  console.log('📋 1. Autenticação\n');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'agenciagoodea@gmail.com',
    password: '04039866@AAs'
  });

  if (authError || !authData.session) {
    console.log('❌ Login falhou:', authError?.message);
    process.exit(1);
  }

  token = authData.session.access_token;
  console.log('  ✅ Login bem-sucedido! Token adquirido.\n');

  // --- ROTAS PÚBLICAS ---
  console.log('📋 2. Rotas Públicas\n');
  await test('GET /api/health', async () => {
    const r = await req('/api/health');
    return { ...r, note: r.data?.status === 'ok' ? `(supabaseServiceRole: ${r.data.supabaseServiceRoleConfigured})` : r.data?.message };
  });

  await test('GET /api/mercado-pago/public-key', async () => {
    const r = await req('/api/mercado-pago/public-key');
    return { ...r, note: r.data?.success ? '(public_key retornada)' : JSON.stringify(r.data) };
  });

  // --- ROTAS ADMINISTRATIVAS ---
  console.log('\n📋 3. Rotas Administrativas\n');

  await test('GET /api/admin/env-check', async () => {
    const r = await req('/api/admin/env-check');
    const missing = r.data?.missing || [];
    return { ...r, note: missing.length ? `⚠️ Vars ausentes: ${missing.join(', ')}` : '(vars OK)' };
  });

  await test('GET /api/admin/settings', async () => {
    const r = await req('/api/admin/settings');
    const count = r.data?.settings?.length ?? '?';
    return { ...r, note: `(${count} settings carregadas)` };
  });

  await test('POST /api/admin/settings (salvar config)', async () => {
    const r = await req('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ settings: { site_name: 'Vai Rifar? Auditoria OK', _audit_test: new Date().toISOString() } })
    });
    return { ...r, note: r.data?.message };
  });

  await test('GET /api/admin/mercado-pago/settings', async () => {
    const r = await req('/api/admin/mercado-pago/settings');
    return { ...r, note: r.data?.success ? `(env: ${r.data.settings?.active_environment})` : r.data?.message };
  });

  await test('POST /api/admin/mercado-pago/settings (salvar credenciais)', async () => {
    const r = await req('/api/admin/mercado-pago/settings', {
      method: 'POST',
      body: JSON.stringify({
        active_environment: 'sandbox',
        public_key_test: 'TEST-PUB-AUDITORIA-2026',
        access_token_test: 'TEST-ACCESS-AUDITORIA-2026',
        public_key_production: '',
        access_token_production: ''
      })
    });
    return { ...r, note: r.data?.message };
  });

  await test('POST /api/admin/mercado-pago/test-connection', async () => {
    const r = await req('/api/admin/mercado-pago/test-connection', { method: 'POST' });
    return { ...r, note: r.data?.message };
  });

  await test('GET /api/admin/mercado-pago/webhooks/logs', async () => {
    const r = await req('/api/admin/mercado-pago/webhooks/logs');
    const count = r.data?.logs?.length ?? '?';
    return { ...r, note: `(${count} logs)` };
  });

  await test('GET /api/admin/email/logs', async () => {
    const r = await req('/api/admin/email/logs');
    const count = r.data?.logs?.length ?? '?';
    return { ...r, note: `(${count} logs)` };
  });

  // --- ROTAS DE USUÁRIO (payment_configs) ---
  console.log('\n📋 4. Rotas de Usuário (Payment Configs)\n');
  await test('GET /api/payment-configs/me', async () => {
    const r = await req('/api/payment-configs/me');
    return { ...r, note: r.data?.success !== false ? '(config retornada)' : r.data?.message };
  });

  // --- RESULTADO FINAL ---
  const total = passed + failed;
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Resultado: ${passed}/${total} testes passaram\n`);
  if (failed > 0) {
    console.log(`❌ ${failed} falha(s) detectada(s) - verificar logs acima`);
  } else {
    console.log('✅ Todos os endpoints responderam corretamente!');
  }
  console.log();
}

run().catch(console.error);
