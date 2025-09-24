// Cloudflare Functions version of the serverless function.
// Uses a slightly different handler format.
// Cache is not implemented here as Cloudflare has its own caching mechanisms.
// Version 4.0: Cloudflare Pages compatible.

export async function onRequest(context) {
    console.log("--- Running Cloudflare Function v4.0 ---");

    // Environment variables are accessed via context.env
    const API_TOKEN = context.env.THRILL_API_TOKEN;
    
    // Automatic Date Logic (UTC)
    const currentDate = new Date();
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    const day = currentDate.getUTCDate();
    
    let fromDate, toDate;

    if (day >= 1 && day <= 14) {
        fromDate = new Date(Date.UTC(year, month, 1));
        toDate = new Date(Date.UTC(year, month, 15)); 
    } else {
        fromDate = new Date(Date.UTC(year, month, 15));
        toDate = new Date(Date.UTC(year, month + 1, 1));
    }
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    const API_ENDPOINT = `https://api.thrill.com/referral/v1/referral-links/streamers?fromDate=${formatDate(fromDate)}&toDate=${formatDate(toDate)}`;
    
    console.log(`DIAGNOSTIC: Fetching URL: ${API_ENDPOINT}`);
    console.log(`DIAGNOSTIC: Is API Token present? ${!!API_TOKEN}`);
    
    if (!API_TOKEN) {
        console.error("FATAL ERROR: API token is missing from environment variables.");
        const errorResponse = { error: "API token is missing. Check Cloudflare environment variables." };
        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const response = await fetch(API_ENDPOINT, {
            headers: { 'Cookie': `token=${API_TOKEN}` }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API ERROR: Status ${response.status}. Body: ${errorBody}`);
            throw new Error(`API server returned an error: ${response.status}`);
        }

        const data = await response.json();
        console.log("DIAGNOSTIC: Successfully fetched data from API.");

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("FATAL ERROR in function execution:", error);
        const errorResponse = { error: 'Failed to fetch data from the Thrill API.', details: error.message };
        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

