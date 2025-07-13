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
      // Image extensions that should use AI vision
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff'];
      
      // Use AI vision for images
      if (imageExtensions.includes(fileExt)) {
        console.log(`Processing image file ${fileExt} with AI Vision...`);
        return await this.processImageWithVision(filePath);
      }
      
      switch (fileExt) {
        case '.pdf':
          // Extract text from PDF
          const pdfBuffer = await fs.readFile(filePath);
          const pdfData = await pdfParse(pdfBuffer);
          extractedText = pdfData.text;
          
          // If PDF has no text (scanned document), use AI vision
          if (!extractedText.trim() || extractedText.length < 50) {
            console.log("PDF appears to be scanned or has minimal text, using AI Vision...");
            return await this.processImageWithVision(filePath);
          }
          break;
          
        case '.doc':
        case '.docx':
          // Extract text from Word documents
          const docBuffer = await fs.readFile(filePath);
          const result = await mammoth.extractRawText({ buffer: docBuffer });
          extractedText = result.value;
          break;
          
        case '.txt':
        case '.rtf':
          // Read as plain text
          extractedText = await fs.readFile(filePath, 'utf-8');
          break;
          
        default:
          // For unknown file types, try AI vision to determine content
          console.log(`Unknown file type ${fileExt}, using AI Vision to analyze...`);
          return await this.processImageWithVision(filePath);
      }
      
      // Clean and normalize the extracted text
      extractedText = this.cleanExtractedText(extractedText);
      
      // If we still don't have text, try AI vision as last resort
      if (!extractedText.trim()) {
        console.log("No text extracted, attempting AI Vision as fallback...");
        return await this.processImageWithVision(filePath);
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

  // Process images using OpenAI Vision API
  private async processImageWithVision(filePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      
      console.log(`Processing image: ${filePath}, Size: ${imageBuffer.length} bytes`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a legal document OCR specialist. Your job is to extract every single character, word, line, and detail from legal documents. Never summarize - always provide the complete text."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `This image contains a legal document. Your task is to:

1. Extract ALL visible text from the image - every word, number, date, name, address, case number, etc.
2. Preserve the exact formatting including:
   - Line breaks and paragraphs
   - Headers and titles
   - Lists and bullet points
   - Table structures
   - All dates and numbers
   - ALL names of parties, attorneys, judges
   - Court information and case numbers
   - Filing dates and deadlines
   - Legal claims and allegations
   - Prayer for relief sections
   - Signature blocks

3. Include EVERYTHING visible - do not skip or summarize ANY content
4. If the image quality is poor, still extract whatever you can see
5. If there are multiple pages, extract all pages

Start extracting now and provide the COMPLETE text:`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });

      const extractedText = response.choices[0]?.message?.content || "";
      
      if (!extractedText.trim() || extractedText.length < 50) {
        console.error("Insufficient text extracted:", extractedText);
        throw new Error("Failed to extract meaningful text from the image");
      }
      
      console.log(`Successfully extracted ${extractedText.length} characters from image using Vision API`);
      console.log("First 200 chars:", extractedText.substring(0, 200));
      
      return extractedText;
    } catch (error) {
      console.error("Error processing image with Vision API:", error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Extract structured data from the document text using GPT-4o
  async extractStructuredData(text: string): Promise<any> {
    try {
      // If text is too short, it's likely the extraction failed
      if (text.length < 100) {
        console.error("Text too short for analysis:", text);
        return this.basicTextExtraction(text);
      }

      const prompt = `Analyze the following legal document and extract comprehensive structured information in JSON format:

Document Text:
${text.substring(0, 8000)} // Increased limit for better analysis

Extract ALL of the following information:
1. Case number
2. Court name (full name including district/division)
3. Jurisdiction (federal/state/local)
4. Venue (geographic location/county/district)
5. Document type (be specific: complaint, motion to dismiss, search warrant, etc.)
6. Subject matter (what the case/document is about)
7. Plaintiff/Petitioner name(s) (if applicable)
8. Defendant/Respondent name(s) (if applicable)
9. Other parties (intervenors, third-parties, witnesses, etc.)
10. Filing date
11. Response deadline (if mentioned)
12. Judge/Magistrate name
13. Causes of action or claims (list all)
14. Key allegations or facts (list up to 10 main points)
15. Relief sought (what the filing party wants)
16. Monetary amounts mentioned
17. Important dates and deadlines
18. Legal representatives (attorneys for each party)
19. Case status (if mentioned)
20. Special requirements or orders

For warrants specifically, also extract:
- Target person/location/property
- Items to be searched/seized
- Probable cause summary
- Issuing judge/magistrate
- Execution deadline

Important: Extract as much information as possible. If you cannot find specific information, set the field to null. Always return valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a legal document analysis expert. Extract structured information from legal documents accurately and comprehensively. Always return valid JSON even if some fields are missing."
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
      
      // Classify document type using our comprehensive system
      const documentType = this.classifyDocumentType(text);
      
      // Merge AI extraction with regex results for best accuracy
      return {
        ...extractedData,
        documentType: documentType, // Use our classification instead of AI's generic type
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
    const documentType = this.classifyDocumentType(text);
    
    // Handle warrants and writs
    if (documentType.includes('warrant') || documentType.includes('writ')) {
      const caseNumberMatch = text.match(/Case\s*(?:No\.?|Number)[\s:]*([A-Z0-9-]+)/i);
      const courtMatch = text.match(/(?:IN THE|DISTRICT COURT|SUPERIOR COURT|STATE OF|COURT OF)[\s]*([^\n]+)/i);
      const countyMatch = text.match(/(?:COUNTY OF|County of)\s*([^\n,)]+)/i);
      const stateMatch = text.match(/(?:STATE OF|State of)\s*([^\n,)]+)/i);
      const addressMatch = text.match(/(?:residence|located|property|premises).*?(?:at|located at)\s*([^\n]+)/i);
      const judgeMatch = text.match(/(?:Judge|Magistrate|Hon\.|Honorable)\s*([^\n,]+)/i);
      const targetMatch = text.match(/(?:against|for|to search)\s*([^\n]+)/i);
      
      // Determine jurisdiction
      let jurisdiction = 'state';
      if (text.toLowerCase().includes('united states') || text.toLowerCase().includes('federal')) {
        jurisdiction = 'federal';
      } else if (text.toLowerCase().includes('municipal') || text.toLowerCase().includes('city of')) {
        jurisdiction = 'local';
      }
      
      return {
        documentType: documentType,
        caseNumber: caseNumberMatch ? caseNumberMatch[1] : "Not specified",
        court: courtMatch ? courtMatch[1].trim() : "Unknown Court",
        jurisdiction: jurisdiction,
        venue: countyMatch ? countyMatch[1].trim() : (stateMatch ? stateMatch[1].trim() : null),
        subjectMatter: `${documentType.replace(/_/g, ' ')} - ${targetMatch ? targetMatch[1].trim() : 'Law enforcement action'}`,
        targetPerson: targetMatch ? targetMatch[1].trim() : null,
        targetAddress: addressMatch ? addressMatch[1].trim() : null,
        searchItems: documentType === 'search_warrant' ? this.extractSearchItems(text) : null,
        issuedDate: new Date().toISOString().split('T')[0],
        issuingJudge: judgeMatch ? judgeMatch[1].trim() : null,
        plaintiff: null,
        defendant: null,
        otherParties: null,
        responseDeadline: null,
        reliefSought: documentType === 'search_warrant' ? 'Authority to search premises and seize evidence' : 'Court-ordered action',
      };
    }
    
    // Handle depositions and discovery documents
    if (documentType === 'deposition' || documentType.includes('discover') || documentType.includes('interrogator')) {
      const caseNumberMatch = text.match(/Case\s*(?:No\.?|Number)[\s:]*([A-Z0-9-]+)/i);
      const deponentMatch = text.match(/(?:Deposition of|Deponent:)\s*([^\n]+)/i);
      const dateMatch = text.match(/(?:Date:|Taken on)\s*([^\n]+)/i);
      const plaintiffMatch = text.match(/(?:Plaintiff|Petitioner)[s]?[\s:]*([^v\n]+?)(?:\s*v\.?|\n)/i);
      const defendantMatch = text.match(/(?:v\.?\s+|Defendant|Respondent)[s]?[\s:]*([^\n]+)/i);
      const courtMatch = text.match(/(?:IN THE|COURT:|Court of)[\s]*([^\n]+)/i);
      const attorneyMatches = text.matchAll(/(?:Taken by|Attorney|Counsel)[:\s]*([^\n]+)/gi);
      
      // Extract attorneys
      const attorneys = [];
      for (const match of attorneyMatches) {
        attorneys.push(match[1].trim());
      }
      
      return {
        documentType: documentType,
        caseNumber: caseNumberMatch ? caseNumberMatch[1] : null,
        court: courtMatch ? courtMatch[1].trim() : "Discovery Document",
        jurisdiction: 'state', // Most discovery is state-level
        venue: null,
        subjectMatter: `Discovery document - ${documentType.replace(/_/g, ' ')}`,
        
        // Parties
        plaintiff: plaintiffMatch ? plaintiffMatch[1].trim() : null,
        defendant: defendantMatch ? defendantMatch[1].trim() : null,
        deponent: deponentMatch ? deponentMatch[1].trim() : null,
        otherParties: deponentMatch ? deponentMatch[1].trim() : null,
        
        // Discovery details
        depositionDate: dateMatch ? dateMatch[1].trim() : null,
        filingDate: new Date().toISOString().split('T')[0],
        responseDeadline: null,
        legalRepresentatives: attorneys,
      };
    }
    
    // Handle judgments and court orders
    if (documentType.includes('judgment') || documentType === 'court_order') {
      const caseNumberMatch = text.match(/Case\s*(?:No\.?|Number)[\s:]*([A-Z0-9-]+)/i);
      const plaintiffMatch = text.match(/(?:Plaintiff|Petitioner)[s]?[\s:]*([^v\n]+?)(?:\s*v\.?|\n)/i);
      const defendantMatch = text.match(/(?:v\.?\s+|Defendant|Respondent)[s]?[\s:]*([^\n]+)/i);
      const courtMatch = text.match(/(?:IN THE|COURT:|Court of)[\s]*([^\n]+)/i);
      const rulingMatch = text.match(/(?:ORDERED|ADJUDGED|DECREED)[\s:]*([^\n]+)/i);
      
      return {
        documentType: documentType,
        caseNumber: caseNumberMatch ? caseNumberMatch[1] : null,
        plaintiff: plaintiffMatch ? plaintiffMatch[1].trim() : null,
        defendant: defendantMatch ? defendantMatch[1].trim() : null,
        court: courtMatch ? courtMatch[1].trim() : "Unknown Court",
        ruling: rulingMatch ? rulingMatch[1].trim() : null,
        filingDate: new Date().toISOString().split('T')[0],
        responseDeadline: null,
      };
    }
    
    // For civil cases (default behavior)
    const caseNumberMatch = text.match(/Case No[:\s]+([A-Z0-9-]+)/i);
    const plaintiffMatch = text.match(/([A-Z][A-Z\s]+),\s*Plaintiff/);
    const defendantMatch = text.match(/v\.\s*([A-Z][A-Z\s]+),\s*Defendant/);
    const courtMatch = text.match(/(SUPERIOR COURT[^\n]+|DISTRICT COURT[^\n]+|CIRCUIT COURT[^\n]+)/i);
    const countyMatch = text.match(/(?:COUNTY OF|County of|for the County of)\s*([^\n,)]+)/i);
    const stateMatch = text.match(/(?:STATE OF|State of)\s*([^\n,)]+)/i);
    const judgeMatch = text.match(/(?:Judge|Hon\.|Honorable)\s*([^\n,]+)/i);
    const attorneyMatches = text.matchAll(/(?:Attorney for|Counsel for|Representing)\s*(?:Plaintiff|Defendant)[:\s]*([^\n]+)/gi);
    
    // Determine jurisdiction
    let jurisdiction = 'state';
    if (text.toLowerCase().includes('united states') || text.toLowerCase().includes('federal')) {
      jurisdiction = 'federal';
    } else if (text.toLowerCase().includes('municipal') || text.toLowerCase().includes('city of')) {
      jurisdiction = 'local';
    }
    
    // Extract allegations from numbered paragraphs
    const allegations = [];
    const allegationMatches = text.matchAll(/\d+\.\s*([^.]+(?:breach|fail|negligen|misrepresent|enrich|violat|damage|harm|injur)[^.]+\.)/gi);
    for (const match of allegationMatches) {
      if (match[1].length > 20 && match[1].length < 500) {
        allegations.push(match[1].trim());
      }
    }
    
    // Extract monetary amounts
    const amountMatch = text.match(/\$([0-9,]+)/);
    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    
    // Extract attorneys
    const attorneys = {};
    for (const match of attorneyMatches) {
      if (match[0].toLowerCase().includes('plaintiff')) {
        attorneys.plaintiffAttorney = match[1].trim();
      } else if (match[0].toLowerCase().includes('defendant')) {
        attorneys.defendantAttorney = match[1].trim();
      }
    }
    
    // Extract relief sought
    const reliefMatch = text.match(/(?:WHEREFORE|PRAYER FOR RELIEF|seeks|requests)[:\s]*([^.]+\.)/i);
    const reliefSought = reliefMatch ? reliefMatch[1].trim() : 'Damages and other relief as the court deems proper';
    
    // Extract subject matter
    const causesOfAction = this.extractCausesOfAction(text);
    const subjectMatter = causesOfAction.length > 0 
      ? `Civil action involving ${causesOfAction.join(', ')}`
      : `Civil litigation - ${documentType}`;
    
    // Calculate response deadline (30 days from today for demo)
    const today = new Date();
    const responseDeadline = new Date(today);
    responseDeadline.setDate(responseDeadline.getDate() + 30);
    
    return {
      // Core document info
      documentType: documentType,
      caseNumber: caseNumberMatch ? caseNumberMatch[1] : null,
      court: courtMatch ? courtMatch[1].trim() : "Unknown Court",
      jurisdiction: jurisdiction,
      venue: countyMatch ? countyMatch[1].trim() : (stateMatch ? stateMatch[1].trim() : null),
      subjectMatter: subjectMatter,
      
      // Parties
      plaintiff: plaintiffMatch ? plaintiffMatch[1].trim() : null,
      defendant: defendantMatch ? defendantMatch[1].trim() : null,
      otherParties: null,
      judge: judgeMatch ? judgeMatch[1].trim() : null,
      
      // Case details
      filingDate: today.toISOString().split('T')[0],
      responseDeadline: responseDeadline.toISOString().split('T')[0],
      allegations: allegations.slice(0, 10), // Up to 10 key allegations
      damageAmount: amount ? parseInt(amount) : null,
      causesOfAction: causesOfAction,
      keyAllegations: allegations,
      reliefSought: reliefSought,
      
      // Additional info
      legalRepresentatives: attorneys,
      caseStatus: 'Active - Response pending',
      monetaryAmounts: amount,
    };
  }
  
  // Extract search items from warrant
  private extractSearchItems(text: string): string[] {
    const items = [];
    const itemsSection = text.match(/PROPERTY[\s\/]*EVIDENCE[\s]+TO[\s]+BE[\s]+SEIZED[\s:]*([^]+?)(?:Proof|Your Affiant|You are|$)/i);
    
    if (itemsSection) {
      const itemMatches = itemsSection[1].matchAll(/\d+\.\s*([^\n]+)/g);
      for (const match of itemMatches) {
        items.push(match[1].trim());
      }
    }
    
    return items;
  }

  // Classify the document type based on content
  private classifyDocumentType(text: string): string {
    const textLower = text.toLowerCase();
    
    // PLEADINGS (Initial Case Documents)
    if (textLower.includes('complaint for') || textLower.includes('cause of action') || textLower.includes('plaintiff complains')) {
      return 'complaint';
    } else if (textLower.includes('answer to complaint') || textLower.includes('defendant answers')) {
      return 'answer';
    } else if (textLower.includes('counterclaim')) {
      return 'counterclaim';
    } else if (textLower.includes('cross-claim') || textLower.includes('crossclaim')) {
      return 'cross_claim';
    } else if (textLower.includes('third-party complaint') || textLower.includes('third party complaint')) {
      return 'third_party_complaint';
    } else if (textLower.includes('reply to counterclaim')) {
      return 'reply';
    } else if (textLower.includes('amended complaint') || textLower.includes('amended answer')) {
      return 'amended_pleading';
    } else if (textLower.includes('demurrer')) {
      return 'demurrer';
    }
    
    // MOTIONS (Requests for Court Action)
    else if (textLower.includes('motion for summary judgment')) {
      return 'motion_summary_judgment';
    } else if (textLower.includes('motion to dismiss')) {
      return 'motion_dismiss';
    } else if (textLower.includes('motion for preliminary injunction')) {
      return 'motion_preliminary_injunction';
    } else if (textLower.includes('motion to compel')) {
      return 'motion_compel';
    } else if (textLower.includes('motion for protective order')) {
      return 'motion_protective_order';
    } else if (textLower.includes('motion in limine')) {
      return 'motion_in_limine';
    } else if (textLower.includes('motion for sanctions')) {
      return 'motion_sanctions';
    } else if (textLower.includes('motion to seal')) {
      return 'motion_seal';
    } else if (textLower.includes('motion for directed verdict')) {
      return 'motion_directed_verdict';
    } else if (textLower.includes('motion for judgment as a matter of law')) {
      return 'motion_jmol';
    } else if (textLower.includes('motion to') || textLower.includes('notice of motion')) {
      return 'motion';
    }
    
    // DISCOVERY DOCUMENTS
    else if (textLower.includes('interrogator')) {
      return 'interrogatories';
    } else if (textLower.includes('request for production') || textLower.includes('requests for production')) {
      return 'request_production';
    } else if (textLower.includes('request for admission') || textLower.includes('requests for admission')) {
      return 'request_admission';
    } else if (textLower.includes('deposition notice')) {
      return 'deposition_notice';
    } else if (textLower.includes('deposition of') || textLower.includes('deposition transcript')) {
      return 'deposition_transcript';
    } else if (textLower.includes('subpoena duces tecum')) {
      return 'subpoena_duces_tecum';
    } else if (textLower.includes('subpoena')) {
      return 'subpoena';
    }
    
    // AFFIDAVITS & DECLARATIONS
    else if (textLower.includes('affidavit')) {
      return 'affidavit';
    } else if (textLower.includes('declaration under penalty of perjury')) {
      return 'declaration_perjury';
    } else if (textLower.includes('declaration')) {
      return 'declaration';
    } else if (textLower.includes('expert witness affidavit') || textLower.includes('expert report')) {
      return 'expert_affidavit';
    } else if (textLower.includes('witness statement')) {
      return 'witness_statement';
    }
    
    // BRIEFS (Legal Arguments)
    else if (textLower.includes('trial brief')) {
      return 'trial_brief';
    } else if (textLower.includes('appellate brief')) {
      return 'appellate_brief';
    } else if (textLower.includes('memorandum of points and authorities')) {
      return 'points_authorities';
    } else if (textLower.includes('memorandum of law') || textLower.includes('memoranda of law')) {
      return 'memorandum_law';
    } else if (textLower.includes('reply brief')) {
      return 'reply_brief';
    } else if (textLower.includes('amicus curiae') || textLower.includes('amicus brief')) {
      return 'amicus_brief';
    } else if (textLower.includes('brief in support') || textLower.includes('opening brief')) {
      return 'brief';
    }
    
    // COURT ORDERS & JUDGMENTS
    else if (textLower.includes('temporary restraining order') || textLower.includes('tro')) {
      return 'tro';
    } else if (textLower.includes('permanent injunction')) {
      return 'permanent_injunction';
    } else if (textLower.includes('scheduling order')) {
      return 'scheduling_order';
    } else if (textLower.includes('protective order')) {
      return 'protective_order';
    } else if (textLower.includes('summary judgment')) {
      return 'summary_judgment';
    } else if (textLower.includes('declaratory judgment')) {
      return 'declaratory_judgment';
    } else if (textLower.includes('default judgment')) {
      return 'default_judgment';
    } else if (textLower.includes('judgment') || textLower.includes('order granting')) {
      return 'judgment';
    } else if (textLower.includes('court order') || textLower.includes('order denying')) {
      return 'court_order';
    }
    
    // CRIMINAL-SPECIFIC DOCUMENTS
    else if (textLower.includes('indictment')) {
      return 'indictment';
    } else if (textLower.includes('search warrant')) {
      return 'search_warrant';
    } else if (textLower.includes('arrest warrant')) {
      return 'arrest_warrant';
    } else if (textLower.includes('bench warrant')) {
      return 'bench_warrant';
    } else if (textLower.includes('bail') && (textLower.includes('agreement') || textLower.includes('bond'))) {
      return 'bail_document';
    } else if (textLower.includes('plea agreement')) {
      return 'plea_agreement';
    } else if (textLower.includes('sentencing') && (textLower.includes('order') || textLower.includes('judgment'))) {
      return 'sentencing_document';
    } else if (textLower.includes('presentence report')) {
      return 'presentence_report';
    }
    
    // APPELLATE DOCUMENTS
    else if (textLower.includes('notice of appeal')) {
      return 'notice_appeal';
    } else if (textLower.includes('record on appeal')) {
      return 'record_appeal';
    } else if (textLower.includes('petition for certiorari')) {
      return 'petition_certiorari';
    } else if (textLower.includes('writ of')) {
      if (textLower.includes('habeas corpus')) return 'writ_habeas_corpus';
      if (textLower.includes('mandamus')) return 'writ_mandamus';
      if (textLower.includes('certiorari')) return 'writ_certiorari';
      if (textLower.includes('execution')) return 'writ_execution';
      if (textLower.includes('attachment')) return 'writ_attachment';
      if (textLower.includes('prohibition')) return 'writ_prohibition';
      return 'writ';
    }
    
    // TRIAL DOCUMENTS
    else if (textLower.includes('jury instruction')) {
      return 'jury_instructions';
    } else if (textLower.includes('jury verdict')) {
      return 'jury_verdict';
    } else if (textLower.includes('voir dire')) {
      return 'voir_dire';
    } else if (textLower.includes('witness list')) {
      return 'witness_list';
    } else if (textLower.includes('exhibit list')) {
      return 'exhibit_list';
    } else if (textLower.includes('pretrial order')) {
      return 'pretrial_order';
    }
    
    // ADMINISTRATIVE DOCUMENTS
    else if (textLower.includes('summons')) {
      return 'summons';
    } else if (textLower.includes('service of process')) {
      return 'service_process';
    } else if (textLower.includes('certificate of service')) {
      return 'certificate_service';
    } else if (textLower.includes('notice of')) {
      if (textLower.includes('hearing')) return 'notice_hearing';
      if (textLower.includes('deposition')) return 'notice_deposition';
      if (textLower.includes('motion')) return 'notice_motion';
      return 'notice';
    } else if (textLower.includes('stipulation')) {
      return 'stipulation';
    } else if (textLower.includes('settlement agreement')) {
      return 'settlement_agreement';
    } else if (textLower.includes('docket')) {
      return 'docket';
    }
    
    // SPECIALIZED DOCUMENTS
    else if (textLower.includes('petition')) {
      if (textLower.includes('divorce')) return 'divorce_petition';
      if (textLower.includes('bankruptcy')) return 'bankruptcy_petition';
      if (textLower.includes('custody')) return 'custody_petition';
      return 'petition';
    } else if (textLower.includes('patent') && (textLower.includes('application') || textLower.includes('filing'))) {
      return 'patent_filing';
    } else if (textLower.includes('trademark') && (textLower.includes('application') || textLower.includes('filing'))) {
      return 'trademark_filing';
    } else if (textLower.includes('class action')) {
      return 'class_action';
    } else if (textLower.includes('corporate') && (textLower.includes('filing') || textLower.includes('document'))) {
      return 'corporate_document';
    } else if (textLower.includes('memorandum')) {
      return 'memorandum';
    } else if (textLower.includes('contract') || textLower.includes('agreement')) {
      return 'contract';
    } else if (textLower.includes('medical record')) {
      return 'medical_records';
    } else if (textLower.includes('financial record') || textLower.includes('bank statement')) {
      return 'financial_records';
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