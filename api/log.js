
export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json(); // Log data structure

        // Get GAS URL from env
        const gasUrl = process.env.ATTENDANCE_API_URL;
        if (!gasUrl) {
            return new Response(JSON.stringify({ error: 'Missing ATTENDANCE_API_URL' }), { status: 500 });
        }

        // Convert JSON body back to URLSearchParams for GAS (which expects x-www-form-urlencoded)
        const formData = new URLSearchParams();
        Object.entries(body).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const gasResponse = await fetch(gasUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                // No need for spoofed referer for GAS usually, but good practice if checking origin
            },
            body: formData.toString()
        });

        if (!gasResponse.ok) {
            // GAS often redirects (302) on success which fetch handles, but if it errors:
            const text = await gasResponse.text();
            throw new Error(`GAS Error ${gasResponse.status}: ${text}`);
        }

        const data = await gasResponse.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Log Proxy Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
