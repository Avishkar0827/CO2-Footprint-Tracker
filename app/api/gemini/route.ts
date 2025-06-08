import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize with explicit API version
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const { prompt, context } = await req.json();
    
   

    // Solution 2: If you must use v1beta, use this model name instead:
     const model = genAI.getGenerativeModel({
       model: "gemini-1.5-pro-latest" // v1beta-only model
     });

    const result = await model.generateContent(
      context ? `${context}\n\n${prompt}` : prompt
    );
    
    const response = await result.response;
    const text = response.text();

    // Handle tips response
    if (prompt.toLowerCase().includes("eco-friendly tips")) {
      try {
        return NextResponse.json({ tips: JSON.parse(text) });
      } catch {
        return NextResponse.json({ tips: [text] });
      }
    }

    return NextResponse.json({ response: text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error.message.includes("404") 
          ? "Model not found. Please use 'gemini-pro' with v1 API or 'gemini-1.5-pro-latest' with v1beta"
          : error.message,
        solution: "Update your model name or API version"
      },
      { status: error.message.includes("404") ? 400 : 500 }
    );
  }
}