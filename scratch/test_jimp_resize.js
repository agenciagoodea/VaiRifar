import { Jimp } from "jimp";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

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
  const settingsMap = (dbSettings || []).reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  const logoUrl = settingsMap.site_logo_url;
  if (!logoUrl) {
    console.log("No logo found in database.");
    return;
  }

  const matches = logoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) {
    console.log("Logo is not data URL.");
    return;
  }

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  console.log("Original logo buffer size:", buffer.length);

  // Read the original image
  const original = await Jimp.read(buffer);
  console.log("Original dimensions:", original.width, "x", original.height);

  // We want to fit this logo into a 1200x630 target size.
  // Standard aspect ratio is 1200x630.
  // First, we scale the original logo so that it fits inside 1200x630 without cropping or distortion,
  // leaving some margin (e.g. 50px) around it.
  const targetWidth = 1200;
  const targetHeight = 630;
  const margin = 80; // Margin around the logo
  
  const maxInnerWidth = targetWidth - (margin * 2);
  const maxInnerHeight = targetHeight - (margin * 2);
  
  // Calculate scale factor
  const scaleX = maxInnerWidth / original.width;
  const scaleY = maxInnerHeight / original.height;
  const scale = Math.min(scaleX, scaleY, 1.0); // Don't upscale, only downscale if needed
  
  const newWidth = Math.round(original.width * scale);
  const newHeight = Math.round(original.height * scale);
  
  console.log("Scaled dimensions:", newWidth, "x", newHeight);
  
  // Resize original to fitted size
  const resized = original.resize({ w: newWidth, h: newHeight });
  
  // Create transparent background image
  // Note: in Jimp v1, transparent color is 0x00000000 (black with alpha 0) or we can use white.
  // Let's create a white background (0xffffffff) since white is cleaner for general OG previews,
  // or a transparent background if desired. Let's make it white so it doesn't look black on dark platforms.
  const background = new Jimp({ width: targetWidth, height: targetHeight, color: 0xffffffff });
  
  // Calculate center position
  const x = Math.round((targetWidth - newWidth) / 2);
  const y = Math.round((targetHeight - newHeight) / 2);
  
  // Composite original onto background
  background.composite(resized, x, y);
  
  // Write to a test file
  const outBuffer = await background.getBuffer("image/png");
  fs.writeFileSync("scratch/test_logo_resized.png", outBuffer);
  console.log("Resized logo saved to scratch/test_logo_resized.png");
}

main().catch(console.error);
