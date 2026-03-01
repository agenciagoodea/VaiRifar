import Database from 'better-sqlite3';
const db = new Database('rifapro.db');

const taxTable = [
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
];

const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
stmt.run('tax_table', JSON.stringify(taxTable), new Date().toISOString());

console.log('Tabela de taxas atualizada no banco de dados com as 16 faixas.');
db.close();
