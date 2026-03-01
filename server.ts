import express from "express";
import { createServer as createViteServer } from "vite";
import { initDb } from "./src/database";
import db from "./src/database";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  initDb();

  // Log startup info
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  console.log(`Servidor iniciado. Usuários no banco: ${userCount.count}`);
  const mockUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@rifapro.com');
  console.log(`Usuário admin@rifapro.com existe? ${!!mockUser}`);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API ROUTES ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth (Mock)
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`Tentativa de login: ${email}`);
    
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
      
      if (user) {
        console.log(`Login bem-sucedido: ${email}`);
        res.json({ 
          success: true, 
          user: { 
            id: (user as any).id, 
            name: (user as any).name, 
            email: (user as any).email,
            role: (user as any).role
          } 
        });
      } else {
        console.log(`Credenciais inválidas para: ${email}`);
        res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
      }
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ success: false, message: "Erro interno no servidor." });
    }
  });

  // Campaigns
  app.get("/api/campaigns", (req, res) => {
    try {
      const { organizer_id } = req.query;
      let query = `
        SELECT c.*, 
        (SELECT COUNT(*) FROM tickets WHERE campaign_id = c.id AND status = 'paid') as sold_count
        FROM campaigns c
        WHERE status = 'active'
      `;
      const params: any[] = [];

      if (organizer_id && organizer_id !== 'undefined') {
        query += ` AND organizer_id = ?`;
        params.push(organizer_id);
      }

      query += ` ORDER BY created_at DESC`;
      
      const campaigns = db.prepare(query).all(...params);
      res.json(campaigns);
    } catch (error: any) {
      console.error("Erro em GET /api/campaigns:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/campaigns/:slug", (req, res) => {
    try {
      const campaign = db.prepare(`
        SELECT c.*, 
        (SELECT COUNT(*) FROM tickets WHERE campaign_id = c.id AND status = 'paid') as sold_count
        FROM campaigns c
        WHERE slug = ?
      `).get(req.params.slug);
      
      if (!campaign) return res.status(404).json({ success: false, message: "Campanha não encontrada" });
      res.json(campaign);
    } catch (error: any) {
      console.error("Erro em GET /api/campaigns/:slug:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/campaigns", (req, res) => {
    const { organizer_id, title, description, slug, image_url, ticket_price, total_tickets, draw_date, draw_type } = req.body;
    console.log(`Criando campanha: ${title} para organizador ${organizer_id}`);
    
    try {
      // Verify organizer exists
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(organizer_id);
      if (!user) {
        return res.status(400).json({ success: false, message: "Organizador não encontrado. Faça login novamente." });
      }

      const result = db.prepare(`
        INSERT INTO campaigns (organizer_id, title, description, slug, image_url, ticket_price, total_tickets, draw_date, draw_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(organizer_id, title, description, slug, image_url, ticket_price, total_tickets, draw_date, draw_type || 'internal');
      
      const campaignId = result.lastInsertRowid;
      console.log(`Campanha criada com ID: ${campaignId}. Gerando bilhetes...`);

      // Pre-generate tickets
      // Increased limit to 20,000 for better demo experience
      if (total_tickets <= 20000) {
        const insertTicket = db.prepare('INSERT INTO tickets (campaign_id, number) VALUES (?, ?)');
        const insertMany = db.transaction((id, count) => {
          for (let i = 1; i <= count; i++) insertTicket.run(id, i);
        });
        insertMany(campaignId, total_tickets);
        console.log(`${total_tickets} bilhetes gerados para campanha ${campaignId}`);
      } else {
        console.warn(`Total de bilhetes (${total_tickets}) excede o limite de geração síncrona.`);
      }

      res.json({ success: true, id: campaignId });
    } catch (e: any) {
      console.error("Erro ao criar campanha:", e);
      res.status(400).json({ success: false, message: e.message });
    }
  });

  // Orders & Tickets
  app.post("/api/orders", (req, res) => {
    const { campaign_id, customer_name, customer_email, customer_phone, ticket_count, payment_method } = req.body;
    
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign_id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const total_amount = campaign.ticket_price * ticket_count;

    // Transaction to reserve tickets
    const createOrder = db.transaction(() => {
      // Find available tickets
      const availableTickets = db.prepare(`
        SELECT id FROM tickets 
        WHERE campaign_id = ? AND status = 'available' 
        LIMIT ?
      `).all(campaign_id, ticket_count);

      if (availableTickets.length < ticket_count) {
        throw new Error("Not enough tickets available");
      }

      const orderResult = db.prepare(`
        INSERT INTO orders (campaign_id, customer_name, customer_email, customer_phone, total_amount, payment_method)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(campaign_id, customer_name, customer_email, customer_phone, total_amount, payment_method);

      const orderId = orderResult.lastInsertRowid;

      const updateTicket = db.prepare(`
        UPDATE tickets SET status = 'reserved', order_id = ?, reserved_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      for (const ticket of availableTickets) {
        updateTicket.run(orderId, ticket.id);
      }

      return orderId;
    });

    try {
      const orderId = createOrder();
      res.json({ success: true, orderId });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  // Admin Stats
  app.get("/api/admin/stats/:organizerId", (req, res) => {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.organizerId) as any;
    
    if (user?.role === 'super_admin') {
      const stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM campaigns) as total_campaigns,
          (SELECT COUNT(*) FROM users WHERE role = 'organizer') as total_organizers,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE((SELECT COUNT(*) FROM tickets WHERE status = 'paid'), 0) as tickets_sold
        FROM orders o
        WHERE o.status = 'paid'
      `).get();
      return res.json(stats || { total_campaigns: 0, total_organizers: 0, total_revenue: 0, tickets_sold: 0 });
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT c.id) as total_campaigns,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE((SELECT COUNT(*) FROM tickets t JOIN campaigns c2 ON t.campaign_id = c2.id WHERE c2.organizer_id = ? AND t.status = 'paid'), 0) as tickets_sold
      FROM campaigns c
      LEFT JOIN orders o ON c.id = o.campaign_id AND o.status = 'paid'
      WHERE c.organizer_id = ?
    `).get(req.params.organizerId, req.params.organizerId);
    res.json(stats || { total_campaigns: 0, total_revenue: 0, tickets_sold: 0 });
  });

  // Super Admin: Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = (settings as any[]).reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post("/api/settings", (req, res) => {
    const updates = req.body;
    const updateStmt = db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?');
    
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        updateStmt.run(value, key);
      }
    });

    try {
      transaction(updates);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  // Super Admin: User Management
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE role != "super_admin"').all();
    res.json(users);
  });

  app.post("/api/admin/users/:id/status", (req, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  // Catch-all for API routes to prevent HTML fallback
  app.all("/api/*", (req, res) => {
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
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
