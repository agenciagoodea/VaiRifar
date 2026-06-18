import fetch from "node-fetch";

async function main() {
  const response = await fetch("https://www.vairifar.com.br", {
    headers: {
      "User-Agent": "facebookexternalhit/1.1"
    }
  });
  const html = await response.text();
  console.log("HTML length:", html.length);
  
  const ogImageIndex = html.indexOf('property="og:image"');
  if (ogImageIndex !== -1) {
    console.log("OG Image section:", html.substring(ogImageIndex - 100, ogImageIndex + 200));
  } else {
    console.log("og:image string not found");
  }
}

main().catch(console.error);
