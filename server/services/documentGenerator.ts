import OpenAI from "openai";
import { db } from "../db";
import { documents, cases, allegations, affirmativeDefenses } from "@shared/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DocumentGenerationStep {
  step: string;
  description: string;
  content?: string;
  progress: number;
}

interface JurisdictionFormat {
  state?: string;
  federal?: boolean;
  rules: {
    fontSize: string;
    lineSpacing: string;
    margins: {
      top: string;
      bottom: string;
      left: string;
      right: string;
    };
    pageNumbering: string;
    citations: string;
  };
  sections: string[];
}

export class DocumentGenerator {
  private async getJurisdictionFormat(court: string): Promise<JurisdictionFormat> {
    const prompt = `Analyze this court name and provide the specific document formatting requirements:
    Court: ${court}
    
    Return a JSON object with:
    - state (if state court) or federal: true (if federal court)
    - rules: formatting requirements (fontSize, lineSpacing, margins, pageNumbering, citations format)
    - sections: required sections for an Answer document in order`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a legal document formatting expert. Provide accurate jurisdiction-specific formatting rules. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  async generateDocument(
    caseId: number,
    documentType: string,
    onProgress?: (step: DocumentGenerationStep) => void
  ): Promise<{ content: string; format: JurisdictionFormat }> {
    // Step 1: Gather case data
    onProgress?.({
      step: "Gathering Case Information",
      description: "Retrieving case details, allegations, and defenses from the database",
      progress: 10
    });

    const [caseData] = await db.select().from(cases).where(eq(cases.id, caseId));
    const allegs = await db.select().from(allegations).where(eq(allegations.caseId, caseId));
    const defenses = await db.select().from(affirmativeDefenses).where(eq(affirmativeDefenses.caseId, caseId));

    // Step 2: Determine jurisdiction format
    onProgress?.({
      step: "Analyzing Jurisdiction Requirements",
      description: `Determining formatting rules for ${caseData.court}`,
      progress: 20
    });

    const format = await this.getJurisdictionFormat(caseData.court);

    // Step 3: Generate document sections
    const sections: string[] = [];
    let currentProgress = 30;
    const progressIncrement = 60 / (format.sections.length || 5);

    for (const section of format.sections) {
      onProgress?.({
        step: `Drafting ${section}`,
        description: `Creating legally compliant content for the ${section} section`,
        progress: currentProgress
      });

      const sectionContent = await this.generateSection(section, caseData, allegs, defenses, format);
      sections.push(sectionContent);
      
      onProgress?.({
        step: `Completed ${section}`,
        description: `${section} has been drafted according to ${format.state || 'federal'} requirements`,
        content: sectionContent,
        progress: currentProgress + progressIncrement / 2
      });

      currentProgress += progressIncrement;
    }

    // Step 4: Assemble final document
    onProgress?.({
      step: "Assembling Final Document",
      description: "Combining all sections and applying formatting rules",
      progress: 90
    });

    const finalDocument = this.assembleDocument(sections, caseData, format);

    onProgress?.({
      step: "Document Generation Complete",
      description: "Your legal document has been successfully generated and is ready for download",
      progress: 100
    });

    return { content: finalDocument, format };
  }

  private async generateSection(
    sectionName: string,
    caseData: any,
    allegations: any[],
    defenses: any[],
    format: JurisdictionFormat
  ): Promise<string> {
    const prompt = `Generate the "${sectionName}" section for a legal Answer document.
    
    Case Information:
    - Case: ${caseData.title}
    - Court: ${caseData.court}
    - Case Number: ${caseData.caseNumber}
    - Plaintiff: ${caseData.plaintiff}
    - Defendant: ${caseData.defendant}
    
    Allegations to address: ${allegations.length}
    Affirmative defenses to include: ${defenses.length}
    
    Formatting requirements:
    - Font size: ${format.rules.fontSize}
    - Line spacing: ${format.rules.lineSpacing}
    - Citation format: ${format.rules.citations}
    
    Generate only the content for this section, following proper legal writing standards.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert legal document drafter. Generate professional, legally compliant content that follows jurisdiction-specific rules."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return response.choices[0].message.content || "";
  }

  private assembleDocument(
    sections: string[],
    caseData: any,
    format: JurisdictionFormat
  ): string {
    const header = `${caseData.court}

${caseData.plaintiff},
    Plaintiff,

v.                                      Case No. ${caseData.caseNumber}

${caseData.defendant},
    Defendant.
_______________________________/

DEFENDANT'S ANSWER TO COMPLAINT

`;

    const content = sections.join("\n\n");

    const footer = `

Respectfully submitted,

_______________________________
${caseData.defendant}
Defendant Pro Se
[Address]
[Phone]
[Email]

CERTIFICATE OF SERVICE

I HEREBY CERTIFY that a true and correct copy of the foregoing has been furnished to:

[Plaintiff's Attorney/Address]

on this _____ day of __________, 20__.

_______________________________
${caseData.defendant}`;

    return header + content + footer;
  }

  async exportToPDF(content: string, format: JurisdictionFormat): Promise<Buffer> {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Set document metadata
    pdfDoc.setTitle('Legal Answer Document');
    pdfDoc.setAuthor('ArnieAI Legal Assistant');
    pdfDoc.setSubject('Legal Response Document');
    pdfDoc.setCreator('ArnieAI');
    pdfDoc.setProducer('ArnieAI Legal Platform');
    pdfDoc.setCreationDate(new Date());
    
    // Embed fonts
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Parse formatting rules
    const fontSize = parseInt(format.rules?.fontSize || '12');
    const lineHeight = parseFloat(format.rules?.lineSpacing || '1.5') * fontSize;
    const margins = {
      top: parseFloat(format.rules?.margins?.top || '1') * 72, // Convert inches to points
      bottom: parseFloat(format.rules?.margins?.bottom || '1') * 72,
      left: parseFloat(format.rules?.margins?.left || '1') * 72,
      right: parseFloat(format.rules?.margins?.right || '1') * 72
    };
    
    // Split content into lines
    const lines = content.split('\n');
    let currentPage = pdfDoc.addPage();
    let yPosition = currentPage.getHeight() - margins.top;
    const pageWidth = currentPage.getWidth() - margins.left - margins.right;
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition < margins.bottom + lineHeight) {
        currentPage = pdfDoc.addPage();
        yPosition = currentPage.getHeight() - margins.top;
      }
      
      // Determine font style
      const isBold = line.includes('DEFENDANT\'S ANSWER') || 
                     line.includes('CERTIFICATE OF SERVICE') ||
                     line.trim().endsWith(':');
      const font = isBold ? timesRomanBoldFont : timesRomanFont;
      
      // Draw text
      if (line.trim()) {
        currentPage.drawText(line, {
          x: margins.left,
          y: yPosition,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: pageWidth,
        });
      }
      
      yPosition -= lineHeight;
    }
    
    // Add page numbers if required
    if (format.rules?.pageNumbering) {
      const pages = pdfDoc.getPages();
      pages.forEach((page, index) => {
        const pageNumber = `${index + 1}`;
        page.drawText(pageNumber, {
          x: page.getWidth() / 2 - 10,
          y: margins.bottom / 2,
          size: 10,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
      });
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async exportToDOCX(content: string, format: JurisdictionFormat): Promise<Buffer> {
    const { Document, Paragraph, TextRun, AlignmentType, Header, Footer, PageNumber } = await import('docx');
    
    // Parse formatting rules
    const fontSize = parseInt(format.rules?.fontSize || '12') * 2; // docx uses half-points
    const lineSpacing = parseFloat(format.rules?.lineSpacing || '1.5') * 240; // Convert to twips
    
    // Split content into paragraphs
    const paragraphs = content.split('\n').map(line => {
      const children: TextRun[] = [];
      
      // Determine if this line should be bold
      const isBold = line.includes('DEFENDANT\'S ANSWER') || 
                     line.includes('CERTIFICATE OF SERVICE') ||
                     line.trim().endsWith(':');
      
      if (line.trim()) {
        children.push(
          new TextRun({
            text: line,
            font: "Times New Roman",
            size: fontSize,
            bold: isBold,
          })
        );
      }
      
      // Center align case caption and title
      const alignment = line.includes('v.') || line.includes('DEFENDANT\'S ANSWER') 
        ? AlignmentType.CENTER 
        : AlignmentType.LEFT;
      
      return new Paragraph({
        children,
        alignment,
        spacing: {
          line: lineSpacing,
          after: 120, // 6pt after each paragraph
        },
      });
    });
    
    // Create the document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: parseInt(format.rules?.margins?.top || '1') * 1440, // Convert inches to twips
              right: parseInt(format.rules?.margins?.right || '1') * 1440,
              bottom: parseInt(format.rules?.margins?.bottom || '1') * 1440,
              left: parseInt(format.rules?.margins?.left || '1') * 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [],
          }),
        },
        footers: {
          default: new Footer({
            children: format.rules?.pageNumbering ? [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                  }),
                ],
              }),
            ] : [],
          }),
        },
        children: paragraphs,
      }],
    });
    
    // Generate the document buffer
    const buffer = await doc.save();
    return buffer as Buffer;
  }
}

export const documentGenerator = new DocumentGenerator();