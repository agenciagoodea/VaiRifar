
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emdwY3RmaWpmemhobWJyYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTcyODgsImV4cCI6MjA4NzQ5MzI4OH0.rDFa9vbK_N8MzCbWxUPY6cMbSo3dx5_LgID-VHZlKHM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrders() {
	const { data, error } = await supabase
		.from('orders')
		.select('id, customer_name, status, receipt_url, created_at')
		.eq('campaign_id', 4)
		.order('created_at', { ascending: false })
		.limit(10);

	if (error) {
		console.error('Error fetching orders:', error);
		return;
	}

	console.log('Recent Orders for Campaign 4:');
	data.forEach(o => {
		console.log(`ID: ${o.id} | Name: ${o.customer_name} | Status: ${o.status} | Receipt: ${o.receipt_url ? 'YES' : 'NO'}`);
		if (o.receipt_url) {
			console.log(`  URL: ${o.receipt_url.substring(0, 50)}...`);
		}
	});
}

checkOrders();
