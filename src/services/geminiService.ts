import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface NLPDiagnosisResult {
  prediction: string;
  probability: number;
  urgency: 'RED' | 'ORANGE' | 'GREEN';
  reasoning: string;
}

export interface MalnutritionResult {
  markers: string[];
  severity: 'NORMAL' | 'MODERATE' | 'SEVERE';
  recommendation: string;
}

export const analyzeSymptoms = async (symptoms: string): Promise<NLPDiagnosisResult> => {
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following patient symptoms for a rural health context in Africa: "${symptoms}". 
    Focus on Malaria vs Pneumonia detection. Return a structured JSON response.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prediction: { type: Type.STRING, description: "Condition predicted (e.g., Malaria, Pneumonia)" },
          probability: { type: Type.NUMBER, description: "Score from 0 to 1" },
          urgency: { type: Type.STRING, enum: ["RED", "ORANGE", "GREEN"], description: "Urgency level" },
          reasoning: { type: Type.STRING, description: "Short clinical reasoning" }
        },
        required: ["prediction", "probability", "urgency", "reasoning"]
      }
    }
  });

  return JSON.parse(result.text);
};

export const analyzeMalnutritionImage = async (base64Image: string): Promise<MalnutritionResult> => {
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: `Analyze this image of a child for biometric markers of malnutrition (muscle atrophy, dermatitis, swelling). Return a structured JSON response.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          markers: { type: Type.ARRAY, items: { type: Type.STRING } },
          severity: { type: Type.STRING, enum: ["NORMAL", "MODERATE", "SEVERE"] },
          recommendation: { type: Type.STRING }
        },
        required: ["markers", "severity", "recommendation"]
      }
    }
  });

  return JSON.parse(result.text);
};
