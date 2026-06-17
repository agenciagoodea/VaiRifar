import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SUPABASE CLIENT CONFIG ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emdwY3RmaWpmemhobWJyYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTcyODgsImV4cCI6MjA4NzQ5MzI4OH0.rDFa9vbK_N8MzCbWxUPY6cMbSo3dx5_LgID-VHZlKHM';
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      "x-bypass-rls": "vairifar-secret-key-2026"
    }
  }
});

if (!hasServiceRoleKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY ausente. Rotas server-side podem falhar em tabelas protegidas por RLS.");
}

type AdminLogStatus = "success" | "error" | "warning" | "info";

function adminLog(module: string, action: string, status: AdminLogStatus, message: string, error?: unknown) {
  const technicalError = error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
  const entry = {
    timestamp: new Date().toISOString(),
    module,
    action,
    status,
    message,
    technicalError
  };

  const logger = status === "error" ? console.error : status === "warning" ? console.warn : console.log;
  logger(`[ADMIN_LOG] ${JSON.stringify(entry)}`);
  return entry;
}

function getRequiredEnvStatus() {
  const names = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "MP_ENCRYPTION_KEY",
    "APP_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "SMTP_SECURE"
  ];

  return names.reduce((acc, name) => {
    acc[name] = Boolean(process.env[name]);
    return acc;
  }, {} as Record<string, boolean>);
}

// --- CRYPTO HELPERS ---
const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.MP_ENCRYPTION_KEY 
  ? crypto.createHash('sha256').update(process.env.MP_ENCRYPTION_KEY).digest()
  : crypto.createHash('sha256').update('vairifar-secret-key-2026').digest();

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift() || '', 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const secure = process.env.SMTP_SECURE;

  if (host && port && user && pass && from) {
    return {
      host,
      port: Number(port),
      secure: String(secure).toLowerCase() === "true" || String(secure).toLowerCase() === "sim" || port === "465",
      auth: { user, pass },
      from
    };
  }

  // Fallback to settings table
  const { data: dbSettings, error } = await supabase
    .from("settings")
    .select("*");

  if (error || !dbSettings) {
    throw new Error("Configurações SMTP não encontradas no ambiente e falha ao ler do banco de dados.");
  }

  const settingsMap: Record<string, string> = dbSettings.reduce((acc: any, row: any) => {
    if (row.key) acc[row.key] = row.value;
    return acc;
  }, {});

  const dbHost = settingsMap.smtp_host;
  const dbPort = settingsMap.smtp_port;
  const dbUser = settingsMap.smtp_user;
  const dbPass = settingsMap.smtp_pass;
  const dbFromName = settingsMap.smtp_from_name || "";
  const dbFromEmail = settingsMap.smtp_from_email || dbUser;
  const dbFrom = dbFromName ? `${dbFromName} <${dbFromEmail}>` : dbFromEmail;
  const dbSecure = settingsMap.smtp_secure || "false";

  if (!dbHost || !dbPort || !dbUser || !dbPass || !dbFromEmail) {
    const missing = [];
    if (!dbHost) missing.push("SMTP_HOST");
    if (!dbPort) missing.push("SMTP_PORT");
    if (!dbUser) missing.push("SMTP_USER");
    if (!dbPass) missing.push("SMTP_PASS");
    if (!dbFromEmail) missing.push("SMTP_FROM");
    throw new Error(`Configurações SMTP ausentes no ambiente e no banco de dados (tabela settings). Faltando: ${missing.join(", ")}`);
  }

  return {
    host: dbHost,
    port: Number(dbPort),
    secure: String(dbSecure).toLowerCase() === "true" || String(dbSecure).toLowerCase() === "sim" || dbPort === "465",
    auth: { user: dbUser, pass: dbPass },
    from: dbFrom
  };
}

// --- MIDDLEWARES ---
// Cache para validação de sessões e prevenção de latência de rede no Supabase
interface CachedAuth {
  user: any;
  role: string;
  expiry: number;
}
const authCache = new Map<string, CachedAuth>();
const AUTH_CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache

async function validateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token de autorização ausente ou inválido." });
    }
    const token = authHeader.split(" ")[1];
    
    // Verificar cache em memória
    const now = Date.now();
    const cached = authCache.get(token);
    if (cached && cached.expiry > now) {
      if (cached.role === "super_admin") {
        (req as any).user = cached.user;
        return next();
      } else {
        return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores podem realizar esta ação." });
      }
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: "Sessão inválida ou expirada." });
    }
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (profileError || !profile) {
      return res.status(403).json({ success: false, message: "Acesso negado. Perfil não encontrado." });
    }

    // Armazenar no cache
    authCache.set(token, {
      user,
      role: profile.role,
      expiry: now + AUTH_CACHE_TTL_MS
    });
      
    if (profile.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }
    
    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error("Erro na validação do admin:", error);
    res.status(500).json({ success: false, message: "Erro ao validar permissões de administrador." });
  }
}

async function validateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token de autorização ausente." });
    }
    const token = authHeader.split(" ")[1];

    // Verificar cache em memória
    const now = Date.now();
    const cached = authCache.get(token);
    if (cached && cached.expiry > now) {
      (req as any).user = cached.user;
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: "Sessão inválida." });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Armazenar no cache (mesmo para usuários comuns para evitar múltiplas chamadas à API de Auth)
    authCache.set(token, {
      user,
      role: profile?.role || "user",
      expiry: now + AUTH_CACHE_TTL_MS
    });

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Erro de autenticação." });
  }
}

type AppOptions = {
  includeFrontend?: boolean;
};

export async function createApp(options: AppOptions = {}) {
  const includeFrontend = options.includeFrontend ?? true;
  const app = express();

  console.log("Servidor iniciado. Banco de dados local SQLite desativado, utilizando somente Supabase.");

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((req, res, next) => {
    const pathStr = req.url.split('?')[0];
    const isSeoPath = pathStr === '/api' || pathStr === '/api/' || pathStr.startsWith('/api/rifa/') || [
      '/api/politica-de-privacidade',
      '/api/termos-de-uso',
      '/api/politica-de-cookies',
      '/api/lgpd',
      '/api/resultados',
      '/api/ganhadores'
    ].includes(pathStr);

    if (isSeoPath) {
      const originalUrl = req.url;
      req.url = req.url.replace(/^\/api/, '');
      if (req.url === '') req.url = '/';
      console.log(`[SEO URL NORMALIZER] Normalized ${originalUrl} to ${req.url}`);
    }

    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });

  // Middleware global de Redirecionamentos SEO
  app.use(async (req, res, next) => {
    if (req.method !== "GET" || req.url.startsWith("/api") || req.url.includes(".")) {
      return next();
    }
    try {
      const { data: redirect, error } = await supabase
        .from("seo_redirects")
        .select("*")
        .eq("old_url", req.url)
        .eq("active", true)
        .maybeSingle();

      if (!error && redirect) {
        // Incrementa cliques de forma assíncrona
        supabase
          .from("seo_redirects")
          .update({ clicks: (redirect.clicks || 0) + 1 })
          .eq("id", redirect.id)
          .then();

        console.log(`[SEO REDIRECT] ${redirect.redirect_type} from ${req.url} to ${redirect.new_url}`);
        return res.redirect(redirect.redirect_type || 301, redirect.new_url);
      }
    } catch (e) {
      console.error("Erro no middleware de redirecionamentos:", e);
    }
    next();
  });

  // Função auxiliar para servir HTML com metadados SEO
  async function serveWithSeo(req: express.Request, res: express.Response, next: express.NextFunction, type: "home" | "rifa" | "page") {
    try {
      let htmlPath = "";
      if (process.env.NODE_ENV === "production") {
        htmlPath = path.join(__dirname, "dist", "index.html");
      } else {
        htmlPath = path.join(process.cwd(), "index.html");
      }

      let html = "";
      try {
        html = await fs.promises.readFile(htmlPath, "utf8");
      } catch (err) {
        console.error("Erro ao ler index.html:", err);
        return next();
      }

      // Buscar configurações globais
      const { data: dbSettings } = await supabase.from("settings").select("*");
      const settings: Record<string, string> = (dbSettings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      // Inicializar variáveis de SEO
      let title = settings.seo_title_default || settings.site_name || "VaiRifar - Sorteios Online";
      let description = settings.seo_description_default || settings.site_description || "Plataforma de rifas e sorteios online.";
      let keywords = settings.seo_keywords_default || "rifa, sorteio, online";
      let robots = "index, follow";
      const siteUrl = settings.seo_site_url || `${req.protocol}://${req.get('host')}`;
      let canonicalUrl = `${siteUrl}${req.path}`;
      let ogImage = settings.seo_share_image || settings.site_logo_url || "";
      let ogType = "website";
      let ogTitle = title;
      let ogDescription = description;
      
      let jsonLd: any = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": settings.seo_site_name || settings.site_name || "VaiRifar",
        "url": siteUrl
      };

      if (type === "home") {
        jsonLd.potentialAction = {
          "@type": "SearchAction",
          "target": `${siteUrl}/?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        };
      }

      if (type === "rifa") {
        const slug = req.params.slug;
        const { data: campaign, error: campErr } = await supabase
          .from("campaigns")
          .select("*, profiles:organizer_id(name)")
          .eq("slug", slug)
          .maybeSingle();

        if (campErr || !campaign) {
          const referrer = req.headers.referer || "";
          
          try {
            const { data: existing } = await supabase
              .from("seo_notfound_logs")
              .select("id, occurrences")
              .eq("url", req.url)
              .eq("referrer", referrer)
              .maybeSingle();
            if (existing) {
              await supabase
                .from("seo_notfound_logs")
                .update({ occurrences: (existing.occurrences || 1) + 1, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
            } else {
              await supabase
                .from("seo_notfound_logs")
                .insert([{ url: req.url, referrer, occurrences: 1 }]);
            }
          } catch (err2) {
            console.error("Erro ao gravar log 404:", err2);
          }

          title = `Página Não Encontrada | ${settings.site_name || "VaiRifar"}`;
          description = "A página que você tentou acessar não foi localizada.";
          robots = "noindex, nofollow";
          ogTitle = title;
          ogDescription = description;
          ogType = "website";
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": title,
            "description": description
          };
        } else {
          const seo = campaign.seo_settings || {};
          title = seo.title_seo || `${campaign.title} - Rifas Online`;
          description = seo.description_seo || campaign.description || "Participe da nossa campanha online!";
          keywords = seo.keyword_main ? `${seo.keyword_main}, ${seo.keywords_related || ""}` : keywords;
          robots = seo.index_status === "noindex" ? "noindex, follow" : "index, follow";
          canonicalUrl = seo.canonical_url || `${siteUrl}/rifa/${campaign.slug}`;
          ogImage = seo.image_seo || campaign.image_url || ogImage;
          ogType = "product";
          ogTitle = title;
          ogDescription = description;

          jsonLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": campaign.title,
            "image": campaign.image_url || "",
            "description": campaign.description || "",
            "sku": `RIFA-${campaign.id}`,
            "offers": {
              "@type": "Offer",
              "price": campaign.ticket_price || 0,
              "priceCurrency": "BRL",
              "availability": campaign.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "url": canonicalUrl,
              "seller": {
                "@type": "Person",
                "name": campaign.profiles?.name || "Organizador"
              }
            }
          };
        }
      } else if (type === "page") {
        const pageSlug = req.path.replace("/", "");
        title = `${pageSlug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} | ${settings.site_name || "VaiRifar"}`;
        ogTitle = title;
        
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "url": canonicalUrl
        };
      }

      let googleVerification = "";
      if (settings.google_search_console_tag) {
        if (settings.google_search_console_tag.includes("<meta")) {
          googleVerification = settings.google_search_console_tag;
        } else {
          googleVerification = `<meta name="google-site-verification" content="${settings.google_search_console_tag}" />`;
        }
      }

      const faviconUrl = settings.site_favicon_url || settings.seo_favicon_url || "";
      const faviconTags = faviconUrl ? `
    <link rel="icon" href="${faviconUrl}" />
    <link rel="shortcut icon" href="${faviconUrl}" />` : "";

      const seoTags = `
    <title>${title}</title>
    <meta name="description" content="${description.substring(0, 160)}" />
    <meta name="keywords" content="${keywords}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonicalUrl}" />${faviconTags}
    ${googleVerification}
    <!-- Open Graph -->
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDescription.substring(0, 160)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="${settings.seo_site_name || settings.site_name || "VaiRifar"}" />
    <meta property="og:locale" content="pt_BR" />
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDescription.substring(0, 160)}" />
    <meta name="twitter:image" content="${ogImage}" />
    <!-- JSON-LD -->
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
      `;

      html = html.replace(/<title>.*?<\/title>/, seoTags);

      res.type("text/html");
      res.send(html);
    } catch (err) {
      console.error("Erro na renderização de SEO:", err);
      next();
    }
  }

  // --- ROBOTS AND SITEMAP ROUTES ---

  app.get("/robots.txt", async (req, res) => {
    try {
      const { data: dbSettings } = await supabase.from("settings").select("*");
      const settingsMap = (dbSettings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      const customRobots = settingsMap.seo_robots_txt;
      if (customRobots) {
        res.type("text/plain");
        return res.send(customRobots);
      }

      const siteUrl = settingsMap.seo_site_url || `${req.protocol}://${req.get('host')}`;
      const defaultRobots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api
Disallow: /checkout
Sitemap: ${siteUrl}/sitemap.xml`;

      res.type("text/plain");
      res.send(defaultRobots);
    } catch (err) {
      res.status(500).send("Error generating robots.txt");
    }
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { data: dbSettings } = await supabase.from("settings").select("*");
      const settingsMap = (dbSettings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      const siteUrl = settingsMap.seo_site_url || `${req.protocol}://${req.get('host')}`;
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-rifas.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-categorias.xml</loc>
  </sitemap>
</sitemapindex>`;

      res.type("application/xml");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Error generating sitemap index");
    }
  });

  app.get("/sitemap-pages.xml", async (req, res) => {
    try {
      const { data: dbSettings } = await supabase.from("settings").select("*");
      const settingsMap = (dbSettings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      const siteUrl = settingsMap.seo_site_url || `${req.protocol}://${req.get('host')}`;
      
      const pages = [
        { path: "/", priority: "1.0", freq: "daily" },
        { path: "/politica-de-privacidade", priority: "0.5", freq: "monthly" },
        { path: "/termos-de-uso", priority: "0.5", freq: "monthly" },
        { path: "/politica-de-cookies", priority: "0.5", freq: "monthly" },
        { path: "/lgpd", priority: "0.5", freq: "monthly" },
        { path: "/resultados", priority: "0.8", freq: "daily" },
        { path: "/ganhadores", priority: "0.8", freq: "daily" }
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(p => `
  <url>
    <loc>${siteUrl}${p.path}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("")}
</urlset>`;

      res.type("application/xml");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Error generating pages sitemap");
    }
  });

  app.get("/sitemap-rifas.xml", async (req, res) => {
    try {
      const { data: dbSettings } = await supabase.from("settings").select("*");
      const settingsMap = (dbSettings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      const siteUrl = settingsMap.seo_site_url || `${req.protocol}://${req.get('host')}`;

      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("slug, updated_at")
        .in("status", ["active", "closed", "drawn"]);

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(campaigns || []).map(c => `
  <url>
    <loc>${siteUrl}/rifa/${c.slug}</loc>
    <lastmod>${new Date(c.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join("")}
</urlset>`;

      res.type("application/xml");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Error generating campaigns sitemap");
    }
  });

  app.get("/sitemap-categorias.xml", async (req, res) => {
    try {
      const { data: dbSettings } = await supabase.from("settings").select("*");
      const settingsMap = (dbSettings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      const siteUrl = settingsMap.seo_site_url || `${req.protocol}://${req.get('host')}`;

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/categoria/geral</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

      res.type("application/xml");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Error generating categories sitemap");
    }
  });

  // --- PRERENDERING SEO ROUTING ---

  app.get("/", async (req, res, next) => {
    if (req.url.startsWith("/api") || req.url.includes(".")) return next();
    return serveWithSeo(req, res, next, "home");
  });

  app.get("/rifa/:slug", async (req, res, next) => {
    return serveWithSeo(req, res, next, "rifa");
  });

  const staticSeoPages = [
    "/politica-de-privacidade",
    "/termos-de-uso",
    "/politica-de-cookies",
    "/lgpd",
    "/resultados",
    "/ganhadores"
  ];
  staticSeoPages.forEach(route => {
    app.get(route, async (req, res, next) => {
      return serveWithSeo(req, res, next, "page");
    });
  });

  // --- API ROUTES ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", supabaseServiceRoleConfigured: hasServiceRoleKey });
  });

  app.get("/api/admin/env-check", validateAdmin, (req, res) => {
    const env = getRequiredEnvStatus();
    const missing = Object.entries(env).filter(([, configured]) => !configured).map(([name]) => name);
    adminLog("environment", "env-check", missing.length ? "warning" : "success", missing.length ? `Variaveis ausentes: ${missing.join(", ")}` : "Variaveis obrigatorias configuradas.");
    res.json({ success: true, env, missing });
  });

  app.get("/api/admin/settings", validateAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*");

      if (error) {
        adminLog("settings", "load", "error", "Falha ao carregar configuracoes globais.", error);
        return res.status(400).json({ success: false, message: error.message });
      }

      adminLog("settings", "load", "success", "Configuracoes globais carregadas.");
      res.json({ success: true, settings: data || [] });
    } catch (err: any) {
      adminLog("settings", "load", "error", "Erro inesperado ao carregar configuracoes globais.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/settings", validateAdmin, async (req, res) => {
    try {
      const settings = req.body?.settings;
      if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
        return res.status(400).json({ success: false, message: "Payload de configuracoes invalido." });
      }

      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value ?? ""),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("settings")
        .upsert(updates, { onConflict: "key" });

      if (error) {
        adminLog("settings", "save", "error", "Falha ao salvar configuracoes globais.", error);
        return res.status(400).json({
          success: false,
          message: error.message,
          hint: hasServiceRoleKey ? undefined : "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor."
        });
      }

      adminLog("settings", "save", "success", `${updates.length} configuracoes globais salvas.`);
      res.json({ success: true, message: "Configuracoes atualizadas com sucesso." });
    } catch (err: any) {
      adminLog("settings", "save", "error", "Erro inesperado ao salvar configuracoes globais.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- SEO ADMIN ENDPOINTS ---

  app.get("/api/admin/seo/redirects", validateAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("seo_redirects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        adminLog("seo", "load-redirects", "error", "Falha ao carregar redirecionamentos.", error);
        return res.status(400).json({ success: false, message: error.message });
      }

      res.json({ success: true, redirects: data || [] });
    } catch (err: any) {
      adminLog("seo", "load-redirects", "error", "Erro inesperado ao carregar redirecionamentos.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/seo/redirects", validateAdmin, async (req, res) => {
    try {
      const { id, old_url, new_url, redirect_type, active } = req.body;

      if (!old_url || !new_url) {
        return res.status(400).json({ success: false, message: "URL antiga e nova são obrigatórias." });
      }

      const payload = {
        old_url,
        new_url,
        redirect_type: Number(redirect_type) === 302 ? 302 : 301,
        active: active ?? true,
        updated_at: new Date().toISOString()
      };

      let result;
      if (id) {
        result = await supabase
          .from("seo_redirects")
          .update(payload)
          .eq("id", id);
      } else {
        result = await supabase
          .from("seo_redirects")
          .insert([{ ...payload, clicks: 0, created_at: new Date().toISOString() }]);
      }

      if (result.error) {
        adminLog("seo", "save-redirect", "error", "Falha ao salvar redirecionamento.", result.error);
        return res.status(400).json({ success: false, message: result.error.message });
      }

      adminLog("seo", "save-redirect", "success", `Redirecionamento salvo: ${old_url} -> ${new_url}`);
      res.json({ success: true, message: "Redirecionamento salvo com sucesso." });
    } catch (err: any) {
      adminLog("seo", "save-redirect", "error", "Erro inesperado ao salvar redirecionamento.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/admin/seo/redirects/:id", validateAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { error } = await supabase
        .from("seo_redirects")
        .delete()
        .eq("id", id);

      if (error) {
        adminLog("seo", "delete-redirect", "error", `Falha ao excluir redirecionamento ${id}`, error);
        return res.status(400).json({ success: false, message: error.message });
      }

      adminLog("seo", "delete-redirect", "success", `Redirecionamento ${id} excluído.`);
      res.json({ success: true, message: "Redirecionamento excluído com sucesso." });
    } catch (err: any) {
      adminLog("seo", "delete-redirect", "error", `Erro inesperado ao excluir redirecionamento ${req.params.id}`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/seo/notfound-logs", validateAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("seo_notfound_logs")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        adminLog("seo", "load-notfound-logs", "error", "Falha ao carregar logs de 404.", error);
        return res.status(400).json({ success: false, message: error.message });
      }

      res.json({ success: true, logs: data || [] });
    } catch (err: any) {
      adminLog("seo", "load-notfound-logs", "error", "Erro inesperado ao carregar logs de 404.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/admin/seo/notfound-logs/:id", validateAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const { error } = await supabase
        .from("seo_notfound_logs")
        .delete()
        .eq("id", id);

      if (error) {
        adminLog("seo", "delete-notfound-log", "error", `Falha ao excluir log 404 ${id}`, error);
        return res.status(400).json({ success: false, message: error.message });
      }

      adminLog("seo", "delete-notfound-log", "success", `Log 404 ${id} excluído.`);
      res.json({ success: true, message: "Log 404 excluído com sucesso." });
    } catch (err: any) {
      adminLog("seo", "delete-notfound-log", "error", `Erro inesperado ao excluir log 404 ${req.params.id}`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/admin/seo/notfound-logs", validateAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from("seo_notfound_logs")
        .delete()
        .neq("id", 0); // Deleta todos

      if (error) {
        adminLog("seo", "clear-notfound-logs", "error", "Falha ao limpar logs de 404.", error);
        return res.status(400).json({ success: false, message: error.message });
      }

      adminLog("seo", "clear-notfound-logs", "success", "Todos os logs de 404 foram limpos.");
      res.json({ success: true, message: "Todos os logs foram limpos com sucesso." });
    } catch (err: any) {
      adminLog("seo", "clear-notfound-logs", "error", "Erro inesperado ao limpar logs de 404.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/email/logs", validateAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(50);

      if (error) {
        adminLog("email", "logs", "error", "Falha ao carregar logs de e-mail.", error);
        return res.status(400).json({ success: false, message: error.message });
      }

      adminLog("email", "logs", "success", "Logs de e-mail carregados.");
      res.json({ success: true, logs: data || [] });
    } catch (err: any) {
      adminLog("email", "logs", "error", "Erro inesperado ao carregar logs de e-mail.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/email/test", validateAdmin, async (req, res) => {
    const startedAt = new Date().toISOString();
    const adminUser = (req as any).user;
    const recipient = req.body?.recipient || adminUser.email;
    const subject = req.body?.subject || "Teste de envio - Vai Rifar?";
    const html = req.body?.html || "<p>Este e-mail confirma que o SMTP do Vai Rifar? esta funcionando em producao.</p>";
    let logId: string | number | null = null;

    try {
      // Obter configuração SMTP via fallback inteligente
      const smtpConfig = await getSmtpConfig();

      const { data: insertedLog, error: insertError } = await supabase
        .from("email_logs")
        .insert([{
          recipient,
          subject,
          template: html,
          status: "pending",
          sent_at: startedAt,
          error: null
        }])
        .select("id")
        .single();

      if (insertError) throw insertError;
      logId = insertedLog?.id || null;

      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: smtpConfig.auth
      });

      const info = await transporter.sendMail({
        from: smtpConfig.from,
        to: recipient,
        subject,
        html
      });

      await supabase
        .from("email_logs")
        .update({
          status: "sent",
          error: null,
          sent_at: new Date().toISOString()
        })
        .eq("id", logId);

      adminLog("email", "test-send", "success", `E-mail de teste enviado para ${recipient}.`);
      res.json({
        success: true,
        message: "E-mail de teste enviado com sucesso.",
        log_id: logId,
        message_id: info.messageId
      });
    } catch (err: any) {
      const technicalError = err?.message || "Erro desconhecido no envio de e-mail.";

      if (logId) {
        await supabase
          .from("email_logs")
          .update({
            status: "failed",
            error: technicalError,
            sent_at: new Date().toISOString()
          })
          .eq("id", logId);
      } else {
        await supabase
          .from("email_logs")
          .insert([{
            recipient,
            subject,
            template: html,
            status: "failed",
            sent_at: new Date().toISOString(),
            error: technicalError
          }]);
      }

      adminLog("email", "test-send", "error", "Falha no envio de e-mail de teste.", err);
      res.status(400).json({
        success: false,
        message: "Falha no envio de e-mail de teste.",
        technical_error: technicalError
      });
    }
  });

  // --- MERCADO PAGO INTEGRATION ENDPOINTS ---

  app.get("/api/payment-configs/me", validateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { data, error } = await supabase
        .from("payment_configs")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.json({ success: true, config: data || null });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/payment-configs/me", validateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const allowedFields = [
        "pix_key_type",
        "pix_key",
        "pix_holder_name",
        "mp_access_token",
        "mp_public_key"
      ];

      const payload: Record<string, any> = {
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          payload[field] = req.body[field] ?? "";
        }
      }

      const { data: existing, error: existingError } = await supabase
        .from("payment_configs")
        .select("id")
        .eq("user_id", userId)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        return res.status(400).json({ success: false, message: existingError.message });
      }

      const result = existing
        ? await supabase.from("payment_configs").update(payload).eq("id", existing.id)
        : await supabase.from("payment_configs").insert([payload]);

      if (result.error) {
        return res.status(400).json({
          success: false,
          message: result.error.message,
          hint: hasServiceRoleKey ? undefined : "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor."
        });
      }

      res.json({ success: true, message: "Configuracao salva com sucesso." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get active public key
  app.get("/api/mercado-pago/public-key", async (req, res) => {
    try {
      const { data: settings, error } = await supabase
        .from("mercado_pago_settings")
        .select("active_environment, public_key_test, public_key_production")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !settings) {
        return res.json({ success: true, publicKey: null, environment: "sandbox" });
      }

      const publicKey = settings.active_environment === "production"
        ? settings.public_key_production
        : settings.public_key_test;

      res.json({
        success: true,
        publicKey,
        environment: settings.active_environment
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get admin settings (masked tokens)
  app.get("/api/admin/mercado-pago/settings", validateAdmin, async (req, res) => {
    try {
      const { data: settings, error } = await supabase
        .from("mercado_pago_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !settings) {
        if (error) adminLog("mercado_pago", "load-settings", "warning", "Configuracoes Mercado Pago nao encontradas ou erro na leitura.", error);
        return res.json({
          success: true,
          settings: {
            environment: "sandbox",
            active_environment: "sandbox",
            public_key_test: "",
            access_token_test_masked: "",
            public_key_production: "",
            access_token_production_masked: ""
          }
        });
      }

      const maskToken = (encrypted: string | null) => {
        if (!encrypted) return "";
        try {
          const decrypted = decrypt(encrypted);
          if (!decrypted) return "";
          const prefix = decrypted.substring(0, Math.min(8, decrypted.length));
          const suffix = decrypted.length > 4 ? decrypted.substring(decrypted.length - 4) : "";
          return `${prefix}************${suffix}`;
        } catch {
          return "APP_USR-************ERR";
        }
      };

      adminLog("mercado_pago", "load-settings", "success", "Configuracoes Mercado Pago carregadas com tokens mascarados.");
      res.json({
        success: true,
        settings: {
          id: settings.id,
          environment: settings.environment,
          active_environment: settings.active_environment,
          public_key_test: settings.public_key_test || "",
          access_token_test_masked: settings.access_token_test_encrypted ? maskToken(settings.access_token_test_encrypted) : "",
          public_key_production: settings.public_key_production || "",
          access_token_production_masked: settings.access_token_production_encrypted ? maskToken(settings.access_token_production_encrypted) : ""
        }
      });
    } catch (err: any) {
      adminLog("mercado_pago", "load-settings", "error", "Erro inesperado ao carregar Mercado Pago.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Save admin settings
  app.post("/api/admin/mercado-pago/settings", validateAdmin, async (req, res) => {
    try {
      const {
        active_environment,
        public_key_test,
        access_token_test,
        public_key_production,
        access_token_production
      } = req.body;

      if (!["sandbox", "production"].includes(active_environment || "sandbox")) {
        adminLog("mercado_pago", "save-settings", "warning", "Ambiente ativo invalido informado.");
        return res.status(400).json({ success: false, message: "Ambiente ativo invalido. Use sandbox ou production." });
      }

      if (!process.env.MP_ENCRYPTION_KEY) {
        adminLog("mercado_pago", "save-settings", "warning", "MP_ENCRYPTION_KEY ausente no backend. Utilizando chave padrao.");
      }

      const { data: currentSettings } = await supabase
        .from("mercado_pago_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      let encrypted_test = currentSettings?.access_token_test_encrypted || null;
      if (access_token_test && !access_token_test.includes("*")) {
        encrypted_test = encrypt(access_token_test);
      }

      let encrypted_prod = currentSettings?.access_token_production_encrypted || null;
      if (access_token_production && !access_token_production.includes("*")) {
        encrypted_prod = encrypt(access_token_production);
      }

      const updateData = {
        environment: active_environment || "sandbox",
        active_environment: active_environment || "sandbox",
        public_key_test: public_key_test || "",
        access_token_test_encrypted: encrypted_test,
        public_key_production: public_key_production || "",
        access_token_production_encrypted: encrypted_prod,
        updated_at: new Date().toISOString()
      };

      let resultError = null;
      if (currentSettings) {
        const { error } = await supabase
          .from("mercado_pago_settings")
          .update(updateData)
          .eq("id", currentSettings.id);
        resultError = error;
      } else {
        const { error } = await supabase
          .from("mercado_pago_settings")
          .insert([updateData]);
        resultError = error;
      }

      if (resultError) {
        adminLog("mercado_pago", "save-settings", "error", "Falha ao gravar credenciais Mercado Pago no Supabase.", resultError);
        return res.status(400).json({ success: false, message: resultError.message });
      }

      adminLog("mercado_pago", "save-settings", "success", `Credenciais Mercado Pago salvas para ambiente ${active_environment || "sandbox"}.`);
      res.json({ success: true, message: "Configura??es salvas com sucesso!" });
    } catch (err: any) {
      adminLog("mercado_pago", "save-settings", "error", "Erro inesperado ao salvar credenciais Mercado Pago.", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Test admin settings connection
  app.post("/api/admin/mercado-pago/test-connection", validateAdmin, async (req, res) => {
    try {
      const { data: settings, error } = await supabase
        .from("mercado_pago_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !settings) {
        return res.status(400).json({ success: false, message: "Configurações do Mercado Pago não encontradas." });
      }

      const env = settings.active_environment === "production" ? "production" : "sandbox";
      const encryptedToken = env === "production" ? settings.access_token_production_encrypted : settings.access_token_test_encrypted;

      if (!encryptedToken) {
        return res.status(400).json({ success: false, message: `Access Token para o ambiente de ${env} não configurado.` });
      }

      const accessToken = decrypt(encryptedToken);

      const response = await fetch("https://api.mercadopago.com/v1/payment_methods", {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        return res.json({ success: true, message: `Conexão bem-sucedida no ambiente de ${env}!` });
      } else {
        const errData = await response.json();
        return res.status(400).json({ 
          success: false, 
          message: `Erro ao conectar com Mercado Pago (${env}): ${errData.message || response.statusText}`,
          details: errData
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Create payment (PIX or Card)
  app.post("/api/payments/create", validateUser, async (req, res) => {
    try {
      const {
        payment_method,
        campaign_id,
        email,
        name,
        cpf,
        token,
        payment_method_id,
        installments
      } = req.body;

      if (!payment_method || !campaign_id || !email || !name || !cpf) {
        return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes." });
      }

      const { data: campaign, error: campErr } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaign_id)
        .single();

      if (campErr || !campaign) {
        return res.status(404).json({ success: false, message: "Campanha não encontrada." });
      }

      // Calculate fee using tax table
      const { data: globalSettingsData, error: settingsErr } = await supabase
        .from("settings")
        .select("*");

      if (settingsErr) {
        return res.status(500).json({ success: false, message: "Erro ao carregar as configurações globais de taxas." });
      }

      const settingsMap = (globalSettingsData || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      const taxTable = JSON.parse(settingsMap.tax_table || '[]');
      const potentialRevenue = (campaign.total_tickets || 0) * (campaign.ticket_price || 0);
      let fee = 47.00;
      if (Array.isArray(taxTable) && taxTable.length > 0) {
        const sorted = [...taxTable].sort((a: any, b: any) => a.max - b.max);
        const match = sorted.find((t: any) => potentialRevenue <= t.max) || sorted[sorted.length - 1];
        if (match) {
          fee = Number(match.fee);
        }
      }

      // Get MP settings
      const { data: mpSettings, error: mpErr } = await supabase
        .from("mercado_pago_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (mpErr || !mpSettings) {
        return res.status(400).json({ success: false, message: "Configurações do Mercado Pago não encontradas no sistema." });
      }

      const isProd = mpSettings.active_environment === "production";
      const encryptedToken = isProd ? mpSettings.access_token_production_encrypted : mpSettings.access_token_test_encrypted;

      if (!encryptedToken) {
        return res.status(400).json({ success: false, message: "O gateway Mercado Pago não está configurado." });
      }

      const accessToken = decrypt(encryptedToken);
      const nameParts = name.trim().split(" ");
      const first_name = nameParts[0] || "Payer";
      const last_name = nameParts.slice(1).join(" ") || "Name";

      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const idempotencyKey = `${Date.now()}-${Math.random()}`;

      // Obter o perfil do organizador para coletar CPF e Endereço
      const { data: organizerProfile } = await supabase
        .from("profiles")
        .select("document, cep, address_street, address_number, address_complement, address_district, address_city, address_state")
        .eq("id", (req as any).user.id)
        .maybeSingle();

      const mpBody: any = {
        transaction_amount: fee,
        description: `Taxa de Ativação - Campanha: ${campaign.title}`,
        payer: {
          email: email,
          first_name: first_name,
          last_name: last_name,
          identification: {
            type: "CPF",
            number: (organizerProfile?.document || cpf).replace(/\D/g, '')
          }
        },
        external_reference: campaign_id.toString()
      };

      const zipCode = (organizerProfile?.cep || "").replace(/\D/g, '');
      if (zipCode) {
        mpBody.payer.address = {
          zip_code: zipCode,
          street_name: organizerProfile?.address_street || "",
          street_number: organizerProfile?.address_number ? parseInt(organizerProfile.address_number.replace(/\D/g, '')) || 0 : 0,
          neighborhood: organizerProfile?.address_district || "",
          city: organizerProfile?.address_city || "",
          federal_unit: organizerProfile?.address_state || ""
        };
      }

      // Mercado Pago não aceita URLs de localhost/127.0.0.1 para 'notification_url'.
      // Portanto, omitimos essa chave no ambiente local para evitar erro 400 Bad Request.
      const isLocal = appUrl.includes("localhost") || appUrl.includes("127.0.0.1") || appUrl.includes("::1");
      if (!isLocal) {
        mpBody.notification_url = `${appUrl}/api/webhooks/mercado-pago`;
      }

      if (payment_method === "pix") {
        mpBody.payment_method_id = "pix";
      } else if (payment_method === "credit_card") {
        mpBody.token = token;
        mpBody.payment_method_id = payment_method_id;
        mpBody.installments = installments || 1;
      } else {
        return res.status(400).json({ success: false, message: "Método de pagamento inválido." });
      }

      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(mpBody)
      });

      const mpResult = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("Erro no Mercado Pago:", mpResult);
        return res.status(400).json({
          success: false,
          message: mpResult.message || "Erro ao gerar pagamento no Mercado Pago.",
          details: mpResult
        });
      }

      const expiry = mpResult.date_of_expiration || new Date(Date.now() + 72 * 3600000).toISOString();
      const insertData = {
        campaign_id: campaign_id,
        user_id: (req as any).user.id,
        amount: fee,
        status: mpResult.status || "pending",
        provider: "mercado_pago",
        payment_id: mpResult.id.toString(),
        external_reference: campaign_id.toString(),
        payment_method: payment_method,
        qr_code: mpResult.point_of_interaction?.transaction_data?.qr_code || null,
        qr_code_base64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        expires_at: expiry,
        paid_at: mpResult.status === "approved" ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: existingPayment } = await supabase
        .from("campaign_payments")
        .select("id")
        .eq("campaign_id", campaign_id)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      let dbPaymentError = null;
      if (existingPayment) {
        const { error } = await supabase
          .from("campaign_payments")
          .update(insertData)
          .eq("id", existingPayment.id);
        dbPaymentError = error;
      } else {
        const { error } = await supabase
          .from("campaign_payments")
          .insert([insertData]);
        dbPaymentError = error;
      }

      if (dbPaymentError) {
        console.error("Erro ao salvar no banco:", dbPaymentError);
        return res.status(500).json({ success: false, message: "Erro ao registrar o pagamento localmente." });
      }

      if (mpResult.status === "approved") {
        await supabase
          .from("campaigns")
          .update({ status: "active", payment_status: "paid" })
          .eq("id", campaign_id);
      }

      res.json({
        success: true,
        payment: {
          id: mpResult.id.toString(),
          status: mpResult.status,
          status_detail: mpResult.status_detail,
          qr_code: insertData.qr_code,
          qr_code_base64: insertData.qr_code_base64,
          amount: fee,
          expires_at: expiry,
          campaign_id: campaign_id
        }
      });
    } catch (err: any) {
      console.error("Erro em /api/payments/create:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Check payment status (used for manual verification and polling)
  app.get("/api/payments/status/:payment_id", validateUser, async (req, res) => {
    try {
      const { payment_id } = req.params;

      const { data: payment, error: payErr } = await supabase
        .from("campaign_payments")
        .select("*")
        .eq("payment_id", payment_id)
        .maybeSingle();

      if (payErr || !payment) {
        return res.status(404).json({ success: false, message: "Pagamento não encontrado." });
      }

      const { data: mpSettings } = await supabase
        .from("mercado_pago_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (mpSettings) {
        const isProd = mpSettings.active_environment === "production";
        const encryptedToken = isProd ? mpSettings.access_token_production_encrypted : mpSettings.access_token_test_encrypted;
        if (encryptedToken) {
          const accessToken = decrypt(encryptedToken);
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (mpResponse.ok) {
            const mpResult = await mpResponse.json();
            const newStatus = mpResult.status;

            if (newStatus !== payment.status) {
              const updatedStatus = newStatus === "approved" ? "paid" : newStatus;
              await supabase
                .from("campaign_payments")
                .update({ 
                  status: updatedStatus, 
                  paid_at: newStatus === "approved" ? new Date().toISOString() : payment.paid_at,
                  updated_at: new Date().toISOString()
                })
                .eq("id", payment.id);

              if (newStatus === "approved") {
                await supabase
                  .from("campaigns")
                  .update({ status: "active", payment_status: "paid" })
                  .eq("id", payment.campaign_id);
              }
              payment.status = updatedStatus;
            }
          }
        }
      }

      res.json({
        success: true,
        status: payment.status,
        campaign_id: payment.campaign_id
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Webhook Receiver
  app.post("/api/webhooks/mercado-pago", async (req, res) => {
    res.status(200).send("OK");

    const payload = req.body;
    console.log("Recebido Webhook do Mercado Pago:", JSON.stringify(payload));

    try {
      const paymentId = payload.data?.id || payload.id || (payload.resource && payload.resource.split('/').pop());

      if (!paymentId) {
        console.log("Webhook sem ID de pagamento.");
        return;
      }

      const eventId = payload.id ? payload.id.toString() : `evt-${paymentId}-${Date.now()}`;
      const { data: existingLog } = await supabase
        .from("mercado_pago_webhook_logs")
        .select("id, processed")
        .eq("event_id", eventId)
        .maybeSingle();

      if (existingLog && existingLog.processed) {
        console.log(`Evento ${eventId} já processado anteriormente.`);
        return;
      }

      const { data: mpSettings } = await supabase
        .from("mercado_pago_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!mpSettings) {
        throw new Error("Configurações do Mercado Pago não encontradas no webhook.");
      }

      const isProd = mpSettings.active_environment === "production";
      const encryptedToken = isProd ? mpSettings.access_token_production_encrypted : mpSettings.access_token_test_encrypted;

      if (!encryptedToken) {
        throw new Error("Token do Mercado Pago não configurado no webhook.");
      }

      const accessToken = decrypt(encryptedToken);

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!mpResponse.ok) {
        throw new Error(`Erro ao consultar pagamento no Mercado Pago API: ${mpResponse.statusText}`);
      }

      const mpResult = await mpResponse.json();
      const statusReal = mpResult.status;
      const campaignId = mpResult.external_reference;

      const { data: localPayment } = await supabase
        .from("campaign_payments")
        .select("*")
        .eq("payment_id", paymentId.toString())
        .maybeSingle();

      const statusBefore = localPayment ? localPayment.status : "unknown";
      const statusAfter = statusReal === "approved" ? "paid" : statusReal;

      if (statusReal === "approved") {
        if (localPayment) {
          await supabase
            .from("campaign_payments")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", localPayment.id);
        }

        if (campaignId) {
          await supabase
            .from("campaigns")
            .update({
              status: "active",
              payment_status: "paid"
            })
            .eq("id", parseInt(campaignId));
        }
      } else if (localPayment && statusAfter !== statusBefore) {
        await supabase
          .from("campaign_payments")
          .update({
            status: statusAfter,
            updated_at: new Date().toISOString()
          })
          .eq("id", localPayment.id);
      }

      const logData = {
        event_id: eventId,
        type: payload.type || payload.action || "payment",
        payment_id: paymentId.toString(),
        payload: payload,
        status_before: statusBefore,
        status_after: statusAfter,
        processed: true,
        created_at: new Date().toISOString()
      };

      if (existingLog) {
        await supabase
          .from("mercado_pago_webhook_logs")
          .update(logData)
          .eq("id", existingLog.id);
      } else {
        await supabase
          .from("mercado_pago_webhook_logs")
          .insert([logData]);
      }

      console.log(`Webhook processado. Pagamento: ${paymentId}, Status: ${statusReal}`);
    } catch (webhookErr: any) {
      console.error("Erro no processamento de webhook:", webhookErr);
      try {
        const paymentId = payload.data?.id || payload.id || "unknown";
        const eventId = payload.id ? payload.id.toString() : `evt-err-${Date.now()}`;
        await supabase
          .from("mercado_pago_webhook_logs")
          .insert([{
            event_id: eventId,
            type: payload.type || payload.action || "error",
            payment_id: paymentId.toString(),
            payload: payload,
            processed: false,
            error_message: webhookErr.message,
            created_at: new Date().toISOString()
          }]);
      } catch (logErr) {
        console.error("Erro ao registrar log de erro do webhook:", logErr);
      }
    }
  });

  // Get Webhook Logs for Admin
  app.get("/api/admin/mercado-pago/webhooks/logs", validateAdmin, async (req, res) => {
    try {
      const { data: logs, error } = await supabase
        .from("mercado_pago_webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Simulate Webhook Event
  app.post("/api/admin/mercado-pago/simulate-webhook", validateAdmin, async (req, res) => {
    try {
      const { payment_id, status } = req.body;

      if (!payment_id || !status) {
        return res.status(400).json({ success: false, message: "Campos payment_id e status são obrigatórios." });
      }

      const { data: payment, error: payErr } = await supabase
        .from("campaign_payments")
        .select("*")
        .eq("payment_id", payment_id)
        .maybeSingle();

      if (payErr || !payment) {
        return res.status(404).json({ success: false, message: "Pagamento de campanha não encontrado localmente para simulação." });
      }

      const statusBefore = payment.status;
      const updatedStatus = status === "approved" ? "paid" : status;

      const { error: updatePayErr } = await supabase
        .from("campaign_payments")
        .update({
          status: updatedStatus,
          paid_at: status === "approved" ? new Date().toISOString() : payment.paid_at,
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.id);

      if (updatePayErr) {
        return res.status(400).json({ success: false, message: "Erro ao atualizar status do pagamento simulado." });
      }

      if (status === "approved") {
        await supabase
          .from("campaigns")
          .update({
            status: "active",
            payment_status: "paid"
          })
          .eq("id", payment.campaign_id);
      }

      const eventId = `sim-${Date.now()}`;
      await supabase
        .from("mercado_pago_webhook_logs")
        .insert([{
          event_id: eventId,
          type: "payment.updated",
          payment_id: payment_id,
          payload: { simulation: true, payment_id, status, triggered_by_admin: true },
          status_before: statusBefore,
          status_after: updatedStatus,
          processed: true,
          created_at: new Date().toISOString()
        }]);

      res.json({
        success: true,
        message: `Webhook simulado com sucesso! Status do pagamento atualizado para: ${updatedStatus}.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Fallback Manual Confirm
  app.post("/api/admin/mercado-pago/manual-confirm", validateAdmin, async (req, res) => {
    try {
      const { payment_id, notes } = req.body;

      if (!payment_id) {
        return res.status(400).json({ success: false, message: "Campo payment_id é obrigatório." });
      }

      const { data: payment, error: payErr } = await supabase
        .from("campaign_payments")
        .select("*")
        .eq("payment_id", payment_id)
        .maybeSingle();

      if (payErr || !payment) {
        return res.status(404).json({ success: false, message: "Pagamento não encontrado." });
      }

      const statusBefore = payment.status;

      await supabase
        .from("campaign_payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.id);

      await supabase
        .from("campaigns")
        .update({
          status: "active",
          payment_status: "paid"
        })
        .eq("id", payment.campaign_id);

      const eventId = `audit-${Date.now()}`;
      await supabase
        .from("mercado_pago_webhook_logs")
        .insert([{
          event_id: eventId,
          type: "manual.audit_confirm",
          payment_id: payment_id,
          payload: { 
            manual_confirmation: true, 
            notes: notes || "Confirmação manual pelo administrador", 
            admin_user: (req as any).user.email 
          },
          status_before: statusBefore,
          status_after: "paid",
          processed: true,
          created_at: new Date().toISOString()
        }]);

      res.json({
        success: true,
        message: "Pagamento confirmado e campanha ativada com sucesso! Log de auditoria gerado."
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- LGPD ROUTES ---

  // 1. Register user consent (IP, Date, Time, User Agent, Version)
  app.post("/api/lgpd/consent", async (req, res) => {
    try {
      const { user_id, consent_type, version, accepted } = req.body;
      const ip_address = (req.headers['x-forwarded-for'] as string || req.ip || req.socket.remoteAddress || '').split(',')[0].trim();
      const user_agent = req.headers['user-agent'] || '';

      const { error } = await supabase
        .from("user_consents")
        .insert([{
          user_id: user_id || null,
          consent_type,
          version,
          accepted: Boolean(accepted),
          ip_address,
          user_agent,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.json({ success: true, message: "Consentimento registrado com sucesso." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Submit LGPD Request (Access, Correction, Deletion, Revocation)
  app.post("/api/lgpd/request", async (req, res) => {
    try {
      const { name, email, request_type, details } = req.body;

      if (!name || !email || !request_type) {
        return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes." });
      }

      const { error } = await supabase
        .from("lgpd_requests")
        .insert([{
          name,
          email,
          request_type,
          details: details || "",
          status: "pending",
          created_at: new Date().toISOString()
        }]);

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Registrar log da solicitação
      const ip_address = (req.headers['x-forwarded-for'] as string || req.ip || req.socket.remoteAddress || '').split(',')[0].trim();
      const user_agent = req.headers['user-agent'] || '';
      await supabase.from("lgpd_logs").insert([{
        action: `request_${request_type}`,
        details: `Solicitação de ${request_type} registrada para o e-mail ${email}.`,
        ip_address,
        user_agent,
        created_at: new Date().toISOString()
      }]);

      res.json({ success: true, message: "Solicitação LGPD registrada com sucesso." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Excluir Minha Conta (Anonymize & Delete)
  app.post("/api/users/delete-me", validateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        return res.status(401).json({ success: false, message: "Não autorizado." });
      }

      const userId = user.id;
      const email = user.email;
      const ip_address = (req.headers['x-forwarded-for'] as string || req.ip || req.socket.remoteAddress || '').split(',')[0].trim();
      const user_agent = req.headers['user-agent'] || '';

      // 1. Anonimizar perfil do usuário
      const anonymizedEmail = `anon-${userId.substring(0, 8)}@vairifar.com.br`;
      const anonymizedProfile = {
        name: "Usuário Anonimizado LGPD",
        email: anonymizedEmail,
        phone: "",
        document: "",
        cep: "",
        address_street: "",
        address_number: "",
        address_complement: "",
        address_district: "",
        address_city: "",
        address_state: "",
        logo_url: "",
        social_whatsapp_group: "",
        social_telegram: "",
        social_instagram: "",
        social_tiktok: "",
        social_youtube: "",
        social_facebook: "",
        pixel_facebook: "",
        pixel_google: ""
      };

      const { error: profileErr } = await supabase
        .from("profiles")
        .update(anonymizedProfile)
        .eq("id", userId);

      if (profileErr) {
        console.error("Erro ao anonimizar perfil:", profileErr);
        return res.status(500).json({ success: false, message: "Erro ao anonimizar os dados pessoais." });
      }

      // 2. Registrar log da exclusão
      await supabase.from("lgpd_logs").insert([{
        user_id: userId,
        action: "delete_account",
        details: `Conta ${email} excluída e dados pessoais anonimizados.`,
        ip_address,
        user_agent,
        created_at: new Date().toISOString()
      }]);

      // 3. Excluir login do Supabase Auth (se Service Role Key estiver configurado)
      if (hasServiceRoleKey) {
        const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
        if (authErr) {
          console.error("Erro ao deletar login do auth.users:", authErr);
        }
      }

      res.json({ success: true, message: "Sua conta foi excluída e seus dados foram anonimizados com sucesso." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Catch-all for API routes to prevent HTML fallback
  app.use("/api", (req, res) => {
    console.log(`API 404: ${req.method} ${req.url}`);
    res.status(404).json({ 
      success: false, 
      message: `API route ${req.method} ${req.url} not found` 
    });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global Error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Erro interno no servidor",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // --- VITE MIDDLEWARE ---
  if (!includeFrontend) {
    return app;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  return app;
}

export async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const app = await createApp({ includeFrontend: true });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
