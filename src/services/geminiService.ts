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
  severity: 'NORMAL' | 'MODÉRÉ' | 'SÉVÈRE';
  recommendation: string;
}

export const analyzeSymptoms = async (symptoms: string): Promise<NLPDiagnosisResult> => {
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following patient symptoms for a rural health context in Africa: "${symptoms}". 
    Focus on Malaria vs Pneumonia detection. Return a structured JSON response. 
    IMPORTANT: The response fields "prediction" and "reasoning" MUST be in FRENCH.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prediction: { type: Type.STRING, description: "Condition prédite (ex: Malaria, Pneumonie)" },
          probability: { type: Type.NUMBER, description: "Score de 0 à 1" },
          urgency: { type: Type.STRING, enum: ["RED", "ORANGE", "GREEN"], description: "Niveau d'urgence" },
          reasoning: { type: Type.STRING, description: "Raisonnement clinique court en FRANÇAIS" }
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
        { text: `Analyze this image of a child for biometric markers of malnutrition (muscle atrophy, dermatitis, swelling). 
        Return a structured JSON response. 
        IMPORTANT: The response fields "markers" and "recommendation" MUST be in FRENCH.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          markers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Marqueurs cliniques détectés (en FRANÇAIS)" },
          severity: { type: Type.STRING, enum: ["NORMAL", "MODÉRÉ", "SÉVÈRE"] },
          recommendation: { type: Type.STRING, description: "Action recommandée (en FRANÇAIS)" }
        },
        required: ["markers", "severity", "recommendation"]
      }
    }
  });

  return JSON.parse(result.text);
};
