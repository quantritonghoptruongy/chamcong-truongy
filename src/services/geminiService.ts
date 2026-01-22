// src/services/geminiService.ts
// Hybrid Service: Tự động chọn Server-side (tốt cho Prod) hoặc Client-side (tốt cho Local)

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface FaceVerificationResponse {
  isMatch: boolean;
  confidence: number;
  reasoning: string;
}

export async function verifyFace(
  referenceImageBase64: string,
  currentImageBase64: string
): Promise<FaceVerificationResponse> {
  // 1. Thử gọi API Backend (Ưu tiên cho môi trường Prod/Vercel)
  try {
    const res = await fetch('/api/verify', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceImage: referenceImageBase64,
        currentImage: currentImageBase64
      })
    });

    // Nếu API trả về 200 OK -> Dùng kết quả từ Server
    if (res.ok) {
      const data = await res.json();
      return {
        isMatch: data.isMatch,
        confidence: data.confidence,
        reasoning: data.reasoning || "Không có giải thích (Server)"
      };
    }

    // Nếu API trả về 404 (Localhost thường không chạy server api) -> Fallback sang Client Mode
    if (res.status === 404) {
      console.warn("⚠️ API Backend không tìm thấy (404). Chuyển sang chế độ Client-side Direct Call.");
      return verifyFaceClientSide(referenceImageBase64, currentImageBase64);
    }

    // Các lỗi khác (500, etc) -> Ném lỗi
    const errorData = await res.json();
    throw new Error(errorData.error || `Server Error: ${res.status}`);

  } catch (error) {
    console.warn("⚠️ Lỗi gọi API Backend, thử fallback Client-side...", error);
    // Nếu fetch lỗi (network error, offline...) -> Fallback sang Client Mode
    return verifyFaceClientSide(referenceImageBase64, currentImageBase64);
  }
}

// ==========================================
// CLIENT-SIDE FALLBACK (Updated to match Legacy Code)
// ==========================================

async function verifyFaceClientSide(
  refImg: string,
  currImg: string
): Promise<FaceVerificationResponse> {
  try {
    // @ts-ignore
    const apiKey = process.env.API_KEY || "";
    if (!apiKey) throw new Error("API Key not found");

    // ✨ Use Gemini 2.0 Flash Exp (as per legacy success)
    const modelId = "gemini-2.0-flash-exp";
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const cleanRef = refImg.replace(/^data:image\/\w+;base64,/, "");
    const cleanCurr = currImg.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      You are a strict biometric verification system.
      Compare the face in the FIRST image (Reference)
      with the face in the SECOND image (Live Capture).
      Respond with a SINGLE JSON object ONLY:
      { "isMatch": boolean, "confidence": number, "reasoning": "string" }
    `;

    const body = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: cleanRef } },
          { inlineData: { mimeType: "image/jpeg", data: cleanCurr } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    console.log(`📡 Client-side sending to ${modelId}...`);

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const jsonStr = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      isMatch: !!parsed.isMatch,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      reasoning: parsed.reasoning || "Gemini Client-side Check"
    };

  } catch (err: any) {
    console.error("❌ Client-side Verify Error:", err);
    return {
      isMatch: false,
      confidence: 0,
      reasoning: `Lỗi: ${err.message || String(err)}`
    };
  }
}
