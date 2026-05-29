import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeadTemperature } from './schemas/lead.schema';

@Injectable()
export class LeadsAIService {
  private readonly logger = new Logger(LeadsAIService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        '⚠️ GEMINI_API_KEY is not defined in .env file! AI Lead Scoring will run in Fallback Mode.',
      );
    } else {
      this.logger.log('🚀 Gemini AI Engine successfully loaded for CRM Leads scoring.');
    }
  }

  /**
   * Automatically analyzes customer requirement and followup notes using Google Gemini AI.
   * Classifies lead temperature, calculates numerical value score, extracts property keywords, and drafts a next remark.
   * 
   * @param requirement Customer requirement description text
   * @param followupNote Followup details/conversation notes
   * @returns Predicted lead attributes to merge with creation payload
   */
  async analyzeLead(
    requirement: string,
    followupNote: string,
  ): Promise<{
    temperature: LeadTemperature;
    score: number;
    keywords: string;
    nextRemark: string;
  }> {
    // 1. Fallback check: If API Key is not set, instantly return default fallback values
    if (!this.apiKey) {
      return this.getFallbackValues();
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

      const prompt = `
        You are a highly efficient real-estate CRM assistant. Your job is to analyze a new client lead and return structured metadata.
        
        Analyze the following inputs:
        - Customer Requirement: "${requirement}"
        - Follow-up Note: "${followupNote}"

        Determine and return the following parameters:
        1. "temperature": Classification of urgency. Must be EXACTLY one of these three strings: "Cold", "Warm", or "Hot".
           - "Hot": Urgent requirement, high budget, immediate buyer, highly active engagement.
           - "Warm": Interested, has solid budget/timeline, but needs property matching or is planning within weeks.
           - "Cold": Just browsing, unresponsive, low interest, or long-term plan (months away).
        2. "score": Numerical score rating viability. Must be a decimal number between 1.00 and 5.00 (e.g. 4.25).
           - High scores (4.00-5.00) are given for high budget, clear specifications, and quick response.
        3. "keywords": 3 to 5 comma-separated keywords extracted from the requirement (e.g. "Dhantoli, 3 BHK, flat, sale"). Keep them short.
        4. "nextRemark": A brief, actionable next operational recommendation for the sales representative (e.g., "Schedule high-budget flat site visit"). Maximum 12 words.

        Return ONLY a clean JSON object matching this schema, without any markdown formatting or code blocks:
        {
          "temperature": "Cold" | "Warm" | "Hot",
          "score": number,
          "keywords": "string",
          "nextRemark": "string"
        }
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini API returned an empty response candidate');
      }

      // 2. Parse and clean JSON response safely
      const cleanJson = this.cleanJsonResponse(rawText);
      const parsed = JSON.parse(cleanJson);

      // 3. Validation and Sanitization of AI outputs
      let temperature = LeadTemperature.COLD;
      if (parsed.temperature === 'Hot') temperature = LeadTemperature.HOT;
      else if (parsed.temperature === 'Warm') temperature = LeadTemperature.WARM;

      const score = Math.max(1.0, Math.min(5.0, Number(parsed.score) || 1.0));
      const keywords = parsed.keywords ? String(parsed.keywords).trim() : '';
      const nextRemark = parsed.nextRemark ? String(parsed.nextRemark).trim() : 'Follow-up scheduled';

      return {
        temperature,
        score: parseFloat(score.toFixed(2)),
        keywords,
        nextRemark,
      };
    } catch (error) {
      this.logger.error(
        `❌ Gemini AI Analysis failed: ${error instanceof Error ? error.message : String(error)}. Falling back to defaults.`,
      );
      return this.getFallbackValues();
    }
  }

  /**
   * Helper utility to clean markdown JSON wrapper wrappers if present (e.g. ```json ... ```)
   */
  private cleanJsonResponse(rawText: string): string {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
  }

  /**
   * Standard fallback values if API key is missing or request fails
   */
  private getFallbackValues(): {
    temperature: LeadTemperature;
    score: number;
    keywords: string;
    nextRemark: string;
  } {
    return {
      temperature: LeadTemperature.COLD,
      score: 1.00,
      keywords: '',
      nextRemark: 'no response',
    };
  }
}
