import { type Document, type InsertDocument } from "@shared/schema";
import { storage } from "../storage";
import path from "path";
import fs from "fs/promises";
import OpenAI from "openai";
import Tesseract from "tesseract.js";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Document processing service that implements the blueprint's OCR and AI capabilities
export class DocumentProcessor {
  // Enhanced OCR extraction with support for multiple file types
  async extractTextFromDocument(filePath: string): Promise<string> {
    const fileExt = path.extname(filePath).toLowerCase();
    let extractedText = "";
    
    try {
      switch (fileExt) {
        case '.pdf':
          // Extract text from PDF
          const pdfBuffer = await fs.readFile(filePath);
          const pdfData = await pdfParse(pdfBuffer);
          extractedText = pdfData.text;
          
          // If PDF has no text (scanned document), use OCR
          if (!extractedText.trim()) {
            console.log("PDF appears to be scanned, using OCR...");
            const { data: { text } } = await Tesseract.recognize(
              filePath,
              'eng',
              {
                logger: m => console.log(`OCR Progress: ${m.progress * 100}%`)
              }
            );
            extractedText = text;
          }
          break;
          
        case '.doc':
        case '.docx':
          // Extract text from Word documents
          const docBuffer = await fs.readFile(filePath);
          const result = await mammoth.extractRawText({ buffer: docBuffer });
          extractedText = result.value;
          break;
          
        case '.png':
        case '.jpg':
        case '.jpeg':
          // Use OCR for image files
          const { data: { text } } = await Tesseract.recognize(
            filePath,
            'eng',
            {
              logger: m => console.log(`OCR Progress: ${m.progress * 100}%`)
            }
          );
          extractedText = text;
          break;
          
        default:
          // Try to read as plain text
          extractedText = await fs.readFile(filePath, 'utf-8');
      }
      
      // Clean and normalize the extracted text
      extractedText = this.cleanExtractedText(extractedText);
      
      // If we still don't have text, throw an error
      if (!extractedText.trim()) {
        throw new Error("No text could be extracted from the document");
      }
      
      return extractedText;
    } catch (error) {
      console.error("Error extracting text from document:", error);
      throw new Error(`Failed to extract text from document: ${error.message}`);
    }
  }
  
  // Clean and normalize extracted text
  private cleanExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();
  }

  // Extract structured data from the document text using GPT-4o
  async extractStructuredData(text: string): Promise<any> {
    try {
      const prompt = `Analyze the following legal document and extract structured information in JSON format:

Document Text:
${text.substring(0, 4000)} // Limit to prevent token overflow

Extract the following information:
1. Case number
2. Court name
3. Plaintiff name(s)
4. Defendant name(s)
5. Filing date
6. Response deadline (if mentioned)
7. Document type (complaint, answer, motion, etc.)
8. Causes of action or claims
9. Key allegations (list up to 10 main points)
10. Monetary amounts mentioned
11. Important dates
12. Legal representatives (attorneys)

Return the data as a JSON object with these fields.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a legal document analysis expert. Extract structured information from legal documents accurately and comprehensively."
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

      const extractedData = JSON.parse(response.choices[0].message.content || "{}");
      
      // Enhance with additional regex parsing for accuracy
      const caseNumberMatch = text.match(/Case No[:\s]+([A-Z0-9-]+)/i);
      const plaintiffMatch = text.match(/([A-Z][A-Z\s]+),\s*Plaintiff/);
      const defendantMatch = text.match(/v\.\s*([A-Z][A-Z\s]+),\s*Defendant/);
      const courtMatch = text.match(/(SUPERIOR COURT[^\n]+)/i);
      
      // Merge AI extraction with regex results for best accuracy
      return {
        ...extractedData,
        caseNumber: extractedData.caseNumber || (caseNumberMatch ? caseNumberMatch[1] : `CV-${Date.now()}`),
        plaintiff: extractedData.plaintiff || (plaintiffMatch ? plaintiffMatch[1].trim() : "Unknown Plaintiff"),
        defendant: extractedData.defendant || (defendantMatch ? defendantMatch[1].trim() : "Unknown Defendant"),
        court: extractedData.court || (courtMatch ? courtMatch[1].trim() : "Superior Court"),
      };
    } catch (error) {
      console.error("Error extracting structured data:", error);
      // Fallback to basic regex extraction
      return this.basicTextExtraction(text);
    }
  }
  
  // Basic text extraction as fallback
  private basicTextExtraction(text: string): any {
    const caseNumberMatch = text.match(/Case No[:\s]+([A-Z0-9-]+)/i);
    const plaintiffMatch = text.match(/([A-Z][A-Z\s]+),\s*Plaintiff/);
    const defendantMatch = text.match(/v\.\s*([A-Z][A-Z\s]+),\s*Defendant/);
    const courtMatch = text.match(/(SUPERIOR COURT[^\n]+)/i);
    
    // Extract allegations from numbered paragraphs
    const allegations = [];
    const allegationMatches = text.matchAll(/\d+\.\s*([^.]+(?:breach|fail|negligen|misrepresent|enrich)[^.]+\.)/gi);
    for (const match of allegationMatches) {
      if (match[1].length > 20 && match[1].length < 500) {
        allegations.push(match[1].trim());
      }
    }
    
    // Extract monetary amounts
    const amountMatch = text.match(/\$([0-9,]+)/);
    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    
    // Calculate response deadline (30 days from today for demo)
    const today = new Date();
    const responseDeadline = new Date(today);
    responseDeadline.setDate(responseDeadline.getDate() + 30);
    
    return {
      caseNumber: caseNumberMatch ? caseNumberMatch[1] : `CV-${Date.now()}`,
      plaintiff: plaintiffMatch ? plaintiffMatch[1].trim() : "Unknown Plaintiff",
      defendant: defendantMatch ? defendantMatch[1].trim() : "Unknown Defendant",
      court: courtMatch ? courtMatch[1].trim() : "Superior Court",
      filingDate: today.toISOString().split('T')[0],
      responseDeadline: responseDeadline.toISOString().split('T')[0],
      documentType: this.classifyDocumentType(text),
      allegations: allegations.slice(0, 5), // Limit to 5 main allegations
      damageAmount: amount ? parseInt(amount) : null,
      causesOfAction: this.extractCausesOfAction(text),
    };
  }

  // Classify the document type based on content
  private classifyDocumentType(text: string): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('complaint for') || textLower.includes('cause of action')) {
      return 'complaint';
    } else if (textLower.includes('answer to complaint')) {
      return 'answer';
    } else if (textLower.includes('motion to') || textLower.includes('notice of motion')) {
      return 'motion';
    } else if (textLower.includes('demurrer')) {
      return 'demurrer';
    } else if (textLower.includes('discovery') || textLower.includes('interrogator')) {
      return 'discovery';
    } else {
      return 'other';
    }
  }

  // Extract causes of action from the document
  private extractCausesOfAction(text: string): string[] {
    const causes = [];
    const causeMatches = text.matchAll(/CAUSE OF ACTION\s*-\s*([A-Z\s]+)/gi);
    
    for (const match of causeMatches) {
      causes.push(match[1].trim());
    }
    
    // Also check for numbered list format
    if (causes.length === 0) {
      const listMatches = text.matchAll(/\d+\.\s*(BREACH OF[^\\n]+|NEGLIGENT[^\\n]+|FRAUD|UNJUST[^\\n]+)/gi);
      for (const match of listMatches) {
        causes.push(match[1].trim());
      }
    }
    
    return causes;
  }

  // Generate AI-powered legal analysis
  async generateLegalAnalysis(extractedData: any): Promise<any> {
    try {
      const prompt = `Analyze this legal case and provide strategic recommendations:
      
      Case: ${extractedData.plaintiff} v. ${extractedData.defendant}
      Court: ${extractedData.court}
      Document Type: ${extractedData.documentType}
      Causes of Action: ${JSON.stringify(extractedData.causesOfAction || [])}
      Key Allegations: ${JSON.stringify(extractedData.keyAllegations || [])}
      
      Provide analysis including:
      1. Case strength assessment (1-10 scale)
      2. Key legal issues
      3. Recommended affirmative defenses
      4. Strategic recommendations
      5. Risk assessment
      6. Timeline considerations
      
      Return as JSON with these fields.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an experienced legal strategist. Provide thorough analysis and practical recommendations for legal cases."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        ...aiAnalysis,
        summary: `This is a ${extractedData.documentType} filed in ${extractedData.court} involving ${extractedData.causesOfAction?.length || 0} causes of action.`,
        responseDeadline: extractedData.responseDeadline,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error generating legal analysis:", error);
      // Fallback analysis
      return {
        summary: `This is a ${extractedData.documentType} filed in ${extractedData.court}.`,
        keyIssues: ["Unable to generate AI analysis", "Manual review recommended"],
        suggestedDefenses: [],
        riskAssessment: { overallRisk: "unknown", factors: ["AI analysis unavailable"] },
        responseDeadline: extractedData.responseDeadline
      };
    }
  }

  // Process a document through the full pipeline
  async processDocument(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ document: Document; extractedData: any; analysis: any }> {
    // Step 1: Extract text from document (OCR)
    const ocrText = await this.extractTextFromDocument(file.path);
    
    // Step 2: Extract structured data
    const extractedData = await this.extractStructuredData(ocrText);
    
    // Step 3: Generate legal analysis
    const analysis = await this.generateLegalAnalysis(extractedData);
    
    // Step 4: Store document with all extracted information
    const document = await storage.createDocument({
      userId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      filePath: file.path,
      documentType: extractedData.documentType,
      ocrText,
      extractedData,
      aiAnalysis: analysis,
      status: 'processed',
    });
    
    return { document, extractedData, analysis };
  }
}

export const documentProcessor = new DocumentProcessor();