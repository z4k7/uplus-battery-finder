import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI('AIzaSyCXYvy0TsMvMXs6iX1MXdj82USNjuvm9IM');
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json" 
      }
    });
  }

  async generateBatterySuggestions(vehicleName: string, brand?: string): Promise<any[]> {
    const prompt = `Provide 2-4 exact battery specifications for ${brand ? brand + ' ' : ''}${vehicleName} 
    from Uplus brand only. Respond STRICTLY with a VALID JSON ARRAY following this EXACT format:
    
    [
      {
        "battery_model": "exact model number",
        "battery_capacity": "capacity in Ah",
        "warranty_months": "number",
        "notes": "specific compatibility notes"
      }
    ]
    
    Include ONLY the JSON array with no additional text, explanations, or markdown formatting.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      
      // Parse and validate the response
      const parsed = this.safeJsonParse(text);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response was not a JSON array');
      }
      
      // Validate each item in the array
      const validatedResults = parsed.map(item => ({
        battery_model: item.battery_model || 'Unknown model',
        battery_capacity: item.battery_capacity || 'Unknown',
        warranty_months: item.warranty_months || '0',
        notes: item.notes || 'No additional notes',
      }));
      
      return validatedResults;
      
    } catch (error) {
      console.error('Gemini API error:', error);
      return [{
        battery_model: '',
        battery_capacity: '',
        warranty_months: '',
        notes: "Couldn't fetch battery details. Please try different search terms."
      }];
    }
  }

  private safeJsonParse(text: string): any {
    // First try parsing directly
    try {
      return JSON.parse(text.trim());
    } catch (e) {
      // If direct parse fails, try extracting JSON
      const jsonMatch = text.match(/\[.*\]/s) || text.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('JSON extraction failed:', innerError);
        }
      }
      throw new Error('No valid JSON found in response');
    }
  }



}