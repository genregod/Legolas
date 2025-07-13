import OpenAI from "openai";
import { storage } from "../storage";
import { db } from "../db";
import { affirmativeDefenses } from "@shared/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface LegalResearchResult {
  topic: string;
  analysis: string;
  relevantLaws: string[];
  caseReferences: string[];
  recommendations: string[];
  confidence: number;
}

interface DefenseRecommendation {
  defenseType: string;
  defenseTitle: string;
  description: string;
  strength: 'high' | 'medium' | 'low';
  legalBasis: string;
  applicability: string;
  requiredEvidence: string[];
}

export class LegalResearchService {
  // Research affirmative defenses based on case facts
  async recommendAffirmativeDefenses(
    caseId: number,
    allegations: any[],
    jurisdiction: string
  ): Promise<DefenseRecommendation[]> {
    try {
      const prompt = `Based on the following case details, recommend appropriate affirmative defenses:
      
      Jurisdiction: ${jurisdiction}
      Number of Allegations: ${allegations.length}
      Sample Allegations: ${allegations.slice(0, 3).map(a => a.allegationText).join('; ')}
      
      Provide detailed recommendations for affirmative defenses including:
      1. Defense type and title
      2. Why it applies to this case
      3. Strength assessment (high/medium/low)
      4. Legal basis and citations
      5. Required evidence to support the defense
      
      Focus on defenses commonly used in ${jurisdiction} courts.
      Return as JSON array.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert litigation attorney specializing in affirmative defenses. Provide practical, jurisdiction-specific defense recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.defenses || [];
    } catch (error) {
      console.error("Error recommending affirmative defenses:", error);
      // Fallback to common defenses
      return this.getCommonDefenses(jurisdiction);
    }
  }
  
  // Get common defenses for a jurisdiction
  private getCommonDefenses(jurisdiction: string): DefenseRecommendation[] {
    const isCaliforniaCase = jurisdiction.toLowerCase().includes('california');
    
    return [
      {
        defenseType: "statute_of_limitations",
        defenseTitle: "Statute of Limitations",
        description: "The plaintiff's claims may be barred by the applicable statute of limitations",
        strength: "medium",
        legalBasis: isCaliforniaCase ? "Cal. Code Civ. Proc. § 337-339" : "State statute of limitations",
        applicability: "Applies if the complaint was filed after the statutory deadline",
        requiredEvidence: ["Date of alleged breach", "Date complaint was filed", "Applicable limitations period"]
      },
      {
        defenseType: "failure_to_state_claim",
        defenseTitle: "Failure to State a Claim",
        description: "The complaint fails to allege facts sufficient to constitute a valid legal claim",
        strength: "low",
        legalBasis: isCaliforniaCase ? "Cal. Code Civ. Proc. § 430.10(e)" : "Rule 12(b)(6) or equivalent",
        applicability: "Applies when complaint lacks essential elements of the cause of action",
        requiredEvidence: ["Legal analysis of complaint", "Missing elements identification"]
      },
      {
        defenseType: "accord_satisfaction",
        defenseTitle: "Accord and Satisfaction",
        description: "The parties previously settled this dispute",
        strength: "high",
        legalBasis: "Common law and state statutes",
        applicability: "Applies if there was a prior settlement agreement",
        requiredEvidence: ["Settlement agreement", "Evidence of payment", "Release documents"]
      }
    ];
  }
  
  // Research specific legal topics
  async researchLegalTopic(
    topic: string,
    jurisdiction: string,
    context?: string
  ): Promise<LegalResearchResult> {
    try {
      const prompt = `Research the following legal topic for ${jurisdiction}:
      
      Topic: ${topic}
      ${context ? `Context: ${context}` : ''}
      
      Provide:
      1. Comprehensive analysis of the topic
      2. Relevant statutes and regulations
      3. Key case law and precedents
      4. Practical recommendations
      5. Confidence level in the analysis
      
      Format as JSON with these fields.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a legal research expert. Provide thorough, accurate legal analysis with proper citations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        topic,
        analysis: result.analysis || "No analysis available",
        relevantLaws: result.relevantLaws || [],
        caseReferences: result.caseReferences || [],
        recommendations: result.recommendations || [],
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error("Error researching legal topic:", error);
      throw new Error("Failed to complete legal research");
    }
  }
  
  // Generate legal strategy recommendations
  async generateCaseStrategy(
    caseId: number,
    caseData: any,
    allegations: any[],
    defenses: any[]
  ): Promise<any> {
    try {
      const prompt = `Develop a comprehensive legal strategy for this case:
      
      Case: ${caseData.plaintiff} v. ${caseData.defendant}
      Court: ${caseData.court}
      Response Deadline: ${caseData.responseDeadline}
      
      Allegations Count: ${allegations.length}
      Defenses Count: ${defenses.length}
      
      Key Issues:
      ${allegations.slice(0, 5).map((a, i) => `${i + 1}. ${a.allegationText}`).join('\n')}
      
      Provide a detailed strategy including:
      1. Immediate actions required
      2. Discovery plan
      3. Motion practice recommendations
      4. Settlement considerations
      5. Trial preparation timeline
      6. Risk assessment
      7. Budget estimate ranges
      
      Format as comprehensive JSON strategy document.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior litigation strategist. Provide practical, actionable legal strategy recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2500
      });

      const strategy = JSON.parse(response.choices[0].message.content || "{}");
      
      // Add timeline events based on strategy
      const deadlineDate = new Date(caseData.responseDeadline);
      const today = new Date();
      
      // Calculate key dates
      const answerDeadline = new Date(deadlineDate);
      const discoveryDeadline = new Date(deadlineDate);
      discoveryDeadline.setDate(discoveryDeadline.getDate() + 180); // 6 months for discovery
      
      const motionDeadline = new Date(deadlineDate);
      motionDeadline.setDate(motionDeadline.getDate() + 90); // 3 months for initial motions
      
      return {
        ...strategy,
        timeline: {
          immediate: {
            deadline: answerDeadline.toISOString(),
            tasks: strategy.immediateActions || []
          },
          discovery: {
            deadline: discoveryDeadline.toISOString(),
            tasks: strategy.discoveryPlan || []
          },
          motions: {
            deadline: motionDeadline.toISOString(),
            tasks: strategy.motionPractice || []
          }
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error generating case strategy:", error);
      throw new Error("Failed to generate case strategy");
    }
  }
  
  // Research jurisdiction-specific procedural requirements
  async getProceduralRequirements(
    documentType: string,
    jurisdiction: string
  ): Promise<any> {
    try {
      const prompt = `Provide procedural requirements for filing a ${documentType} in ${jurisdiction}:
      
      Include:
      1. Filing deadlines and time limits
      2. Required format and content
      3. Service requirements
      4. Filing fees
      5. Local rules and standing orders
      6. Common mistakes to avoid
      
      Format as structured JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a civil procedure expert. Provide accurate, practical procedural guidance."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error getting procedural requirements:", error);
      return {
        error: "Unable to retrieve procedural requirements",
        generalGuidance: "Consult local court rules and civil procedure codes"
      };
    }
  }
}

export const legalResearch = new LegalResearchService();