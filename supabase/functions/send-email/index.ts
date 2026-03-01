import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.1"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
	}

	try {
		// Inicializa o cliente Supabase usando o token da function
		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
		)

		// O request virá como Webhook do Supabase sempre que a tabela email_logs receber um INSERT
		const body = await req.json()
		const record = body.record // Captura a linha de email_logs recém-inserida

		if (!record || !record.recipient) {
			if (body.recipient) {
				// Fallback caso a requisição venha diretamente via API do frontend (não via webhook)
				Object.assign(record, body);
			} else {
				return new Response(JSON.stringify({ error: 'Nenhum destinatário informado.' }), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					status: 400,
				});
			}
		}

		// Busca configurações SMTP da tabela `settings` do mesmo projeto
		const { data: settingsData, error: settingsError } = await supabaseClient
			.from('settings')
			.select('key, value')

		if (settingsError || !settingsData) throw new Error('Falha ao buscar configurações SMTP')

		const settings = settingsData.reduce((acc, obj) => {
			acc[obj.key] = obj.value
			return acc
		}, {} as Record<string, string>)

		const isSecure = settings.smtp_secure === 'sim'

		// Configura o nodemailer com os dados puxados da tabela
		let transporter = nodemailer.createTransport({
			host: settings.smtp_host,
			port: parseInt(settings.smtp_port),
			secure: isSecure,
			auth: {
				user: settings.smtp_user,
				pass: settings.smtp_pass,
			},
			tls: {
				rejectUnauthorized: false
			}
		})

		const fromAddress = `"${settings.smtp_from_name || settings.site_name || 'Sistema'}" <${settings.smtp_from_email || settings.smtp_user}>`

		// Dispara o e-mail real via SMTP
		const info = await transporter.sendMail({
			from: fromAddress,
			to: record.recipient,
			subject: record.subject,
			html: record.template,
		})

		console.log(`E-mail enviado via SMTP: ${info.messageId}`)

		// Se houver DNI do log gravado, atualiza o status de volta pra sent
		if (record.id) {
			await supabaseClient
				.from('email_logs')
				.update({ status: 'sent', error: null })
				.eq('id', record.id)
		}

		return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 200,
		})
	} catch (error: any) {
		console.error("Erro no envio SMTP:", error)

		// Atualiza o log do e-mail com a falha ocorrida se ele existir
		try {
			const body = await req.clone().json()
			if (body?.record?.id) {
				const supabaseClient = createClient(
					Deno.env.get('SUPABASE_URL') ?? '',
					Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
				)
				await supabaseClient.from('email_logs').update({ status: 'failed', error: error.message }).eq('id', body.record.id)
			}
		} catch (e) { }

		return new Response(JSON.stringify({ error: error.message }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 400,
		})
	}
})
