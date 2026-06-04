import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY is not defined in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    headers: {
      "x-bypass-rls": "vairifar-secret-key-2026"
    }
  }
});

async function run() {
  console.log("Testing Supabase connection...");
  const userId = 'ab8a5aa5-78d2-4214-a916-d278a80f56df'; // Adriano's user id

  // 1. Select existing
  console.log("Selecting existing config for user...");
  const { data: existing, error: existingError } = await supabase
    .from("payment_configs")
    .select("id")
    .eq("user_id", userId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Select error:", existingError);
    return;
  }
  console.log("Existing config:", existing);

  // 2. Try to update
  if (existing) {
    console.log("Testing update...");
    const payload = {
      user_id: userId,
      updated_at: new Date().toISOString(),
      mp_access_token: 'TEST_ACCESS_TOKEN',
      mp_public_key: 'TEST_PUBLIC_KEY'
    };
    const { data, error } = await supabase
      .from("payment_configs")
      .update(payload)
      .eq("id", existing.id)
      .select();

    if (error) {
      console.error("Update error:", error);
    } else {
      console.log("Update success! Result:", data);
    }
  }
}

run();
