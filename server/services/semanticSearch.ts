import OpenAI from "openai";
import { db } from "../db";
import { documents, cases, allegations, affirmativeDefenses } from "@shared/schema";
import { eq, ilike, or, and, sql } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SearchResult {
  type: 'case' | 'document' | 'allegation' | 'defense';
  id: number;
  title: string;
  excerpt: string;
  relevanceScore: number;
  metadata: any;
}

export class SemanticSearchService {
  // Generate embeddings for text using OpenAI
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }
  
  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  // Perform semantic search across all content
  async search(query: string, userId: string, limit: number = 10): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search in cases
      const userCases = await db.select().from(cases).where(eq(cases.userId, userId));
      for (const caseItem of userCases) {
        const caseText = `${caseItem.title} ${caseItem.court} ${caseItem.plaintiff} vs ${caseItem.defendant}`;
        const caseEmbedding = await this.generateEmbedding(caseText);
        const similarity = this.cosineSimilarity(queryEmbedding, caseEmbedding);
        
        if (similarity > 0.7) {
          results.push({
            type: 'case',
            id: caseItem.id,
            title: caseItem.title,
            excerpt: `${caseItem.plaintiff} v. ${caseItem.defendant} - ${caseItem.court}`,
            relevanceScore: similarity,
            metadata: {
              caseNumber: caseItem.caseNumber,
              filingDate: caseItem.filingDate,
              responseDeadline: caseItem.responseDeadline
            }
          });
        }
      }
      
      // Search in documents (using extracted text)
      const allDocuments = await db.select().from(documents).where(eq(documents.userId, userId));
      for (const doc of allDocuments) {
        if (doc.ocrText) {
          const docEmbedding = await this.generateEmbedding(doc.ocrText.substring(0, 1000));
          const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
          
          if (similarity > 0.7) {
            results.push({
              type: 'document',
              id: doc.id,
              title: doc.fileName,
              excerpt: doc.ocrText.substring(0, 200) + '...',
              relevanceScore: similarity,
              metadata: {
                documentType: doc.documentType,
                uploadedAt: doc.uploadedAt,
                caseId: doc.caseId
              }
            });
          }
        }
      }
      
      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return results.slice(0, limit);
    } catch (error) {
      console.error("Error performing semantic search:", error);
      
      // Fallback to keyword search
      return this.keywordSearch(query, userId, limit);
    }
  }
  
  // Fallback keyword search
  private async keywordSearch(query: string, userId: string, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchPattern = `%${query}%`;
    
    // Search cases
    const matchingCases = await db.select()
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          or(
            ilike(cases.title, searchPattern),
            ilike(cases.plaintiff, searchPattern),
            ilike(cases.defendant, searchPattern),
            ilike(cases.court, searchPattern)
          )
        )
      )
      .limit(limit);
    
    for (const caseItem of matchingCases) {
      results.push({
        type: 'case',
        id: caseItem.id,
        title: caseItem.title,
        excerpt: `${caseItem.plaintiff} v. ${caseItem.defendant}`,
        relevanceScore: 0.5,
        metadata: {
          caseNumber: caseItem.caseNumber,
          court: caseItem.court
        }
      });
    }
    
    // Search documents
    const matchingDocs = await db.select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          or(
            ilike(documents.fileName, searchPattern),
            ilike(documents.ocrText, searchPattern)
          )
        )
      )
      .limit(limit);
    
    for (const doc of matchingDocs) {
      results.push({
        type: 'document',
        id: doc.id,
        title: doc.fileName,
        excerpt: doc.ocrText?.substring(0, 200) + '...' || 'No content available',
        relevanceScore: 0.5,
        metadata: {
          documentType: doc.documentType,
          uploadedAt: doc.uploadedAt
        }
      });
    }
    
    return results.slice(0, limit);
  }
  
  // Find similar cases based on case content
  async findSimilarCases(caseId: number, userId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // Get the source case
      const [sourceCase] = await db.select().from(cases).where(
        and(
          eq(cases.id, caseId),
          eq(cases.userId, userId)
        )
      );
      
      if (!sourceCase) {
        throw new Error("Case not found");
      }
      
      // Get allegations for the source case
      const sourceAllegations = await db.select().from(allegations).where(eq(allegations.caseId, caseId));
      
      // Create a comprehensive text representation of the case
      const caseText = `${sourceCase.title} ${sourceCase.court} ${sourceCase.plaintiff} vs ${sourceCase.defendant} ${sourceAllegations.map(a => a.allegationText).join(' ')}`;
      
      // Generate embedding
      const caseEmbedding = await this.generateEmbedding(caseText);
      
      // Compare with other cases
      const allCases = await db.select().from(cases).where(
        and(
          eq(cases.userId, userId),
          sql`${cases.id} != ${caseId}`
        )
      );
      
      const similarCases: SearchResult[] = [];
      
      for (const otherCase of allCases) {
        const otherCaseText = `${otherCase.title} ${otherCase.court} ${otherCase.plaintiff} vs ${otherCase.defendant}`;
        const otherEmbedding = await this.generateEmbedding(otherCaseText);
        const similarity = this.cosineSimilarity(caseEmbedding, otherEmbedding);
        
        if (similarity > 0.6) {
          similarCases.push({
            type: 'case',
            id: otherCase.id,
            title: otherCase.title,
            excerpt: `${otherCase.plaintiff} v. ${otherCase.defendant}`,
            relevanceScore: similarity,
            metadata: {
              caseNumber: otherCase.caseNumber,
              court: otherCase.court,
              similarity: `${Math.round(similarity * 100)}% similar`
            }
          });
        }
      }
      
      // Sort by similarity
      similarCases.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return similarCases.slice(0, limit);
    } catch (error) {
      console.error("Error finding similar cases:", error);
      return [];
    }
  }
  
  // Search for relevant legal precedents and defenses
  async searchLegalPrecedents(query: string, jurisdiction: string): Promise<any[]> {
    try {
      const prompt = `Find relevant legal precedents and case law for the following legal issue in ${jurisdiction}:
      
      Issue: ${query}
      
      Provide:
      1. Relevant case citations
      2. Key legal principles
      3. How they apply to this issue
      4. Potential arguments based on precedent
      
      Format as JSON array of precedents.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a legal research expert. Provide accurate case law and precedents."
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

      const precedents = JSON.parse(response.choices[0].message.content || "{}");
      return precedents.precedents || [];
    } catch (error) {
      console.error("Error searching legal precedents:", error);
      return [];
    }
  }
}

export const semanticSearch = new SemanticSearchService();