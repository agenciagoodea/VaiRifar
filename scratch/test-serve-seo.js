import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emdwY3RmaWpmemhobWJyYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTcyODgsImV4cCI6MjA4NzQ5MzI4OH0.rDFa9vbK_N8MzCbWxUPY6cMbSo3dx5_LgID-VHZlKHM';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { headers: { "x-bypass-rls": "vairifar-secret-key-2026" } }
});

async function main() {
  const { data: dbSettings } = await supabase.from("settings").select("*");
  const settings = (dbSettings || []).reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  console.log("DB keys:");
  console.log("seo_share_image:", JSON.stringify(settings.seo_share_image));
  console.log("seo_og_image:", JSON.stringify(settings.seo_og_image));
  console.log("site_logo_url start:", settings.site_logo_url ? settings.site_logo_url.substring(0, 50) : "null");

  let ogImage = settings.seo_share_image || settings.seo_og_image || settings.site_logo_url || "";
  console.log("Initial ogImage:", ogImage ? ogImage.substring(0, 100) : "empty");

  if (ogImage && ogImage.startsWith("data:")) {
    ogImage = "/logo.png";
  }
  console.log("After data check:", ogImage);
}

main().catch(console.error);
