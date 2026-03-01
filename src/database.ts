import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('rifapro.db');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export function initDb() {
  // Users (Organizers and Super Admins)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'organizer', -- super_admin, organizer, customer
      status TEXT DEFAULT 'active', -- active, suspended
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Global Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize default settings
  const defaultSettings = [
    { key: 'site_name', value: 'RifaPro SaaS' },
    { key: 'site_description', value: 'Plataforma avançada de rifas online.' },
    { key: 'mercadopago_public_key', value: '' },
    { key: 'mercadopago_access_token', value: '' },
    { key: 'platform_fee_percent', value: '5' },
    { key: 'primary_color', value: '#059669' },
    {
      key: 'tax_table', value: JSON.stringify([
        { id: '1', max: 100, fee: 7 },
        { id: '2', max: 250, fee: 17 },
        { id: '3', max: 450, fee: 27 },
        { id: '4', max: 750, fee: 37 },
        { id: '5', max: 1000, fee: 47 },
        { id: '6', max: 2000, fee: 67 },
        { id: '7', max: 4000, fee: 77 },
        { id: '8', max: 7000, fee: 97 },
        { id: '9', max: 10000, fee: 147 },
        { id: '10', max: 15000, fee: 197 },
        { id: '11', max: 20000, fee: 247 },
        { id: '12', max: 30000, fee: 347 },
        { id: '13', max: 50000, fee: 697 },
        { id: '14', max: 70000, fee: 797 },
        { id: '15', max: 100000, fee: 997 },
        { id: '16', max: 999999999, fee: 1497 }
      ])
    }
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }

  // Campaigns (Raffles)
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      slug TEXT UNIQUE NOT NULL,
      image_url TEXT,
      ticket_price DECIMAL(10,2) NOT NULL,
      total_tickets INTEGER NOT NULL,
      draw_date DATETIME,
      status TEXT DEFAULT 'active', -- active, paused, finished
      draw_type TEXT DEFAULT 'internal', -- internal, federal
      display_mode TEXT DEFAULT 'random',
      min_tickets INTEGER DEFAULT 1,
      max_tickets INTEGER,
      reservation_expiry TEXT DEFAULT '24',
      regulation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
  `);

  // Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, paid, expired, cancelled
      payment_method TEXT, -- pix, credit_card
      payment_id TEXT, -- External reference
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `);

  // Tickets
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      order_id INTEGER,
      number INTEGER NOT NULL,
      status TEXT DEFAULT 'available', -- available, reserved, paid
      reserved_at DATETIME,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      UNIQUE(campaign_id, number)
    )
  `);

  // Insert a mock user if not exists
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@rifapro.com');
  let organizerId: number | bigint;
  if (!user) {
    console.log('Criando usuário mock admin@rifapro.com...');
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Admin RifaPro',
      'admin@rifapro.com',
      'password123',
      'super_admin'
    );
    organizerId = result.lastInsertRowid;
    console.log(`Usuário criado com ID: ${organizerId}`);
  } else {
    organizerId = (user as any).id;
    console.log(`Usuário mock já existe com ID: ${organizerId}`);
  }

  // Insert a mock customer
  const customer = db.prepare('SELECT * FROM users WHERE email = ?').get('user@demo.com');
  if (!customer) {
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Comprador Demo',
      'user@demo.com',
      'password123',
      'customer'
    );
  }

  // Insert mock campaigns if organizer exists
  if (organizerId) {
    const campaigns = [
      {
        title: 'iPhone 15 Pro Max + Apple Watch',
        description: 'Participe do sorteio do ano! Um iPhone 15 Pro Max novinho mais um Apple Watch Series 9. Sorteio pela Loteria Federal.',
        slug: 'iphone-15-pro-max',
        ticket_price: 0.50,
        total_tickets: 10000,
        draw_date: '2024-12-31',
        draw_type: 'federal',
        image_url: 'https://picsum.photos/seed/iphone/800/450'
      },
      {
        title: 'BMW 320i M Sport 2024',
        description: 'A chance de ter uma BMW na sua garagem por menos de 1 real. Carro zero km, documento pago e tanque cheio.',
        slug: 'bmw-320i-2024',
        ticket_price: 0.99,
        total_tickets: 100000,
        draw_date: '2025-01-15',
        draw_type: 'federal',
        image_url: 'https://picsum.photos/seed/bmw/800/450'
      },
      {
        title: 'Viagem para Maldivas (All Inclusive)',
        description: '7 dias no paraíso com tudo pago para você e um acompanhante. Resort 5 estrelas, passagens aéreas e passeios inclusos.',
        slug: 'viagem-maldivas',
        ticket_price: 0.25,
        total_tickets: 50000,
        draw_date: '2025-02-20',
        draw_type: 'internal',
        image_url: 'https://picsum.photos/seed/maldives/800/450'
      }
    ];

    const insertCampaign = db.prepare(`
      INSERT OR IGNORE INTO campaigns (organizer_id, title, description, slug, ticket_price, total_tickets, draw_date, draw_type, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of campaigns) {
      insertCampaign.run(organizerId, c.title, c.description, c.slug, c.ticket_price, c.total_tickets, c.draw_date, c.draw_type, c.image_url);
    }
  }
}

export default db;
