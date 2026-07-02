const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!;

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();

    // Re-formatted to clean HTML tags so random characters never cause 400 errors again
    const textMessage = `
🐛 <b>NEW LAUNDRY APP EVENT REPORTED</b>

👤 <b>Profile ID:</b> <code>${record.profile_id || 'N/A'}</code>
🏠 <b>Apartment ID:</b> <code>${record.apartment_id || 'N/A'}</code>
🏘️ <b>Household ID:</b> <code>${record.household_id || 'N/A'}</code>
📁 <b>Type:</b> ${record.ticket_type ? record.ticket_type.toUpperCase() : 'UNKNOWN'}
📱 <b>Version:</b> v${record.app_version || 'Unknown'}

📝 <b>Message:</b>
"${record.message}"

🌐 <b>Device Profile:</b>
<code>${record.user_agent || 'N/A'}</code>
    `.trim();

    const telegramUrl = `https://api.telegram.org/bot${String(BOT_TOKEN).trim()}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Force chat_id conversion to a clean string format to protect against casting glitches
        chat_id: String(CHAT_ID).trim(), 
        text: textMessage,
        parse_mode: 'HTML' // FIXED: Switched from Markdown to HTML for safety
      })
    });

    const result = await response.json();

    // If Telegram rejects the code, capture its exact explicit reason in your dashboard logs
    if (!result.ok) {
      throw new Error(`Telegram server error log description: ${result.description}`);
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    // This console error log will print the precise reason directly in your Supabase logs tab if it fails again
    console.error("Function Execution Failed:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }
})
