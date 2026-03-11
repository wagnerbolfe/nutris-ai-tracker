import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('EXPO_PUBLIC_GEMINI_API_KEY is not set in the environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

export interface UserMetrics {
  gender: string;
  goal: string;
  workoutDays: string;
  birthdate: string;
  heightFeet: string;
  weightKg: string;
}

export interface GeneratedPlan {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterIntake: string;
  planSummary: string;
  fitnessTips: string[];
}

export const generateUserPlan = async (metrics: UserMetrics): Promise<GeneratedPlan> => {
  if (!apiKey) {
    throw new Error('API Key is missing for Gemini.');
  }

  const prompt = `
    Based on the following user metrics, calculate their daily nutritional requirements and provide 2-3 short, actionable fitness tips.
    
    User Metrics:
    - Gender: ${metrics.gender}
    - Primary Goal: ${metrics.goal}
    - Workout Frequency: ${metrics.workoutDays}
    - Birthdate: ${metrics.birthdate} (Use this to calculate age if needed)
    - Height: ${metrics.heightFeet} feet
    - Weight: ${metrics.weightKg} kg

    Return the response ONLY as a raw JSON object with the following exact keys and types:
    {
      "dailyCalories": number (e.g. 2500),
      "protein": number (grams, e.g. 150),
      "carbs": number (grams, e.g. 250),
      "fats": number (grams, e.g. 80),
      "waterIntake": string (e.g. "3.5L" or "120oz"),
      "planSummary": string (A brief 1-2 sentence encouraging summary of their custom plan),
      "fitnessTips": array of 2-3 short string tips
    }
    
    Ensure the output is pure JSON without any markdown formatting like \`\`\`json or \`\`\`.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting if the model still returns it
    const cleanedText = responseText.replace(/```json\n?|\n?```/gi, '').trim();
    
    const parsedData = JSON.parse(cleanedText) as GeneratedPlan;
    return parsedData;
  } catch (error) {
    console.error('Error generating plan from Gemini:', error);
    throw new Error('Failed to generate fitness plan.');
  }
};
