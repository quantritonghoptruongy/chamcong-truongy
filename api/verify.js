
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
        const { referenceImage, currentImage } = await req.json();

        if (!referenceImage || !currentImage) {
            return new Response(JSON.stringify({ error: 'Missing images' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Server configuration error: API_KEY missing' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Use Gemini 2.0 Flash Exp as per user's legacy code success, or fallback
        const modelId = process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash-exp';
        const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        const cleanRef = referenceImage.replace(/^data:image\/\w+;base64,/, '');
        const cleanCurr = currentImage.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `
      You are a strict biometric verification system.
      Compare the face in the FIRST image (Reference)
      with the face in the SECOND image (Live Capture).

      Focus on stable facial features. Ignore minor differences like lighting.

      Respond with a SINGLE JSON object ONLY:
      {
        "isMatch": boolean,
        "confidence": number,
        "reasoning": "string"
      }
    `;

        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: cleanRef } },
                        { inlineData: { mimeType: 'image/jpeg', data: cleanCurr } },
                    ],
                },
            ],
            generationConfig: {
                responseMimeType: 'application/json',
            },
        };

        const apiResponse = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Important: Pass a Referer that matches the API Key restrictions
                // Since we are running on localhost or Vercel, this mimics the origin
                'Referer': req.headers.get('referer') || 'http://localhost:5173/',
            },
            body: JSON.stringify(body),
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            throw new Error(data.error?.message || `API Error: ${apiResponse.status}`);
        }

        // Extract text and parse JSON
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const jsonStr = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(jsonStr);

        return new Response(JSON.stringify(parsedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal Server Error',
                details: error.toString(),
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
