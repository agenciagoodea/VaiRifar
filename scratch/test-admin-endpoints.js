import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emdwY3RmaWpmemhobWJyYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTcyODgsImV4cCI6MjA4NzQ5MzI4OH0.rDFa9vbK_N8MzCbWxUPY6cMbSo3dx5_LgID-VHZlKHM';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

const baseUrl = 'https://vairifar.vercel.app';

async function run() {
  console.log("Logging in...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'agenciagoodea@gmail.com',
    password: '04039866@AAs'
  });

  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  const token = data.session.access_token;
  console.log("Login successful! Token acquired.");

  // Test saving settings
  console.log("Testing POST /api/admin/mercado-pago/settings...");
  try {
    const res = await fetch(`${baseUrl}/api/admin/mercado-pago/settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        active_environment: 'sandbox',
        public_key_test: 'TEST_PUB_KEY_UPDATED',
        access_token_test: 'TEST_ACCESS_TOKEN_UPDATED',
        public_key_production: 'PROD_PUB_KEY_UPDATED',
        access_token_production: 'PROD_ACCESS_TOKEN_UPDATED'
      })
    });

    console.log(`POST status=${res.status}`);
    const json = await res.json();
    console.log("Response:", json);
  } catch (err) {
    console.error("POST failed:", err.message);
  }
}

run();
