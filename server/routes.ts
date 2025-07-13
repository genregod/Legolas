import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCaseSchema, insertDocumentSchema, insertAllegationSchema, insertAffirmativeDefenseSchema } from "@shared/schema";
import { z } from "zod";
import { documentProcessor } from "./services/documentProcessor";
import { documentGenerator } from "./services/documentGenerator";
import { WebSocketServer } from "ws";

// Initialize Stripe only if keys are available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil" as any,
  });
  console.log('Stripe initialized successfully');
} else {
  console.log('Stripe not initialized - missing STRIPE_SECRET_KEY. Payment features will be disabled.');
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile update
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, phone } = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
        phone,
        email: req.user.claims.email,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Stripe subscription management
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      // Check if Stripe is initialized
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment service is not configured. Please contact support to enable subscriptions." 
        });
      }

      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (invoice.payment_intent as any)?.client_secret,
        });
        return;
      }

      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Replace with actual price ID
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Case management routes
  app.get('/api/cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cases = await storage.getCases(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.get('/api/cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const caseId = parseInt(req.params.id);
      const case_data = await storage.getCase(caseId, userId);
      
      if (!case_data) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      res.json(case_data);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  app.post('/api/cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCaseSchema.parse(req.body);
      
      const case_data = await storage.createCase({
        ...validatedData,
        userId,
      });
      
      // Add timeline event
      await storage.addTimelineEvent({
        caseId: case_data.id,
        event: "Case Created",
        description: "Case was created and document uploaded",
      });
      
      res.json(case_data);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).json({ message: "Failed to create case" });
    }
  });

  // Document upload and processing
  app.post('/api/documents/upload', isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Process document through AI pipeline
      const { document, extractedData, analysis } = await documentProcessor.processDocument(userId, file);

      res.json({
        document,
        extractedData,
        analysis,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Process document and create case
  app.post('/api/documents/:id/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }

      const extractedData = document.extractedData as any;
      
      // Create case from extracted data
      const case_data = await storage.createCase({
        userId,
        title: `${extractedData.plaintiff} vs. ${extractedData.defendant}`,
        caseNumber: extractedData.caseNumber,
        court: extractedData.court,
        plaintiff: extractedData.plaintiff,
        defendant: extractedData.defendant,
        caseType: "Civil Complaint",
        filingDate: extractedData.filingDate,
        responseDeadline: extractedData.responseDeadline,
        summary: `This civil complaint alleges breach of contract and seeks damages. The plaintiff claims that the defendant failed to deliver goods as specified in a purchase agreement.`,
      });

      // Update document with case ID
      await storage.updateDocument(documentId, { caseId: case_data.id });

      // Create allegations
      if (extractedData.allegations) {
        for (let i = 0; i < extractedData.allegations.length; i++) {
          await storage.createAllegation({
            caseId: case_data.id,
            allegationNumber: i + 1,
            allegationText: extractedData.allegations[i],
          });
        }
      }

      // Create suggested affirmative defenses
      const suggestedDefenses = [
        {
          defenseType: "statute_of_limitations",
          defenseTitle: "Statute of Limitations",
          defenseDescription: "The plaintiff's claims are barred by the applicable statute of limitations",
        },
        {
          defenseType: "failure_to_state_claim",
          defenseTitle: "Failure to State a Claim",
          defenseDescription: "The complaint fails to state facts sufficient to constitute a valid legal claim",
        },
        {
          defenseType: "waiver",
          defenseTitle: "Waiver",
          defenseDescription: "Plaintiff has waived their right to bring this claim",
        },
      ];

      for (const defense of suggestedDefenses) {
        await storage.createAffirmativeDefense({
          caseId: case_data.id,
          ...defense,
        });
      }

      // Add timeline events
      await storage.addTimelineEvent({
        caseId: case_data.id,
        event: "AI Analysis Complete",
        description: "Document processed and key information extracted",
      });

      res.json(case_data);
    } catch (error) {
      console.error("Error processing document:", error);
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  // Allegation management
  app.get('/api/cases/:id/allegations', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const allegations = await storage.getAllegations(caseId);
      res.json(allegations);
    } catch (error) {
      console.error("Error fetching allegations:", error);
      res.status(500).json({ message: "Failed to fetch allegations" });
    }
  });

  app.put('/api/allegations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { response, responseNotes } = req.body;
      
      const allegation = await storage.updateAllegation(id, {
        response,
        responseNotes,
      });
      
      res.json(allegation);
    } catch (error) {
      console.error("Error updating allegation:", error);
      res.status(500).json({ message: "Failed to update allegation" });
    }
  });

  // Affirmative defense management
  app.get('/api/cases/:id/defenses', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const defenses = await storage.getAffirmativeDefenses(caseId);
      res.json(defenses);
    } catch (error) {
      console.error("Error fetching defenses:", error);
      res.status(500).json({ message: "Failed to fetch defenses" });
    }
  });

  app.put('/api/defenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { selected } = req.body;
      
      const defense = await storage.updateAffirmativeDefense(id, { selected });
      res.json(defense);
    } catch (error) {
      console.error("Error updating defense:", error);
      res.status(500).json({ message: "Failed to update defense" });
    }
  });

  // Generate answer document
  app.post('/api/cases/:id/generate-answer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const caseId = parseInt(req.params.id);
      
      const case_data = await storage.getCase(caseId, userId);
      if (!case_data) {
        return res.status(404).json({ message: "Case not found" });
      }

      const allegations = await storage.getAllegations(caseId);
      const defenses = await storage.getAffirmativeDefenses(caseId);
      const selectedDefenses = defenses.filter(d => d.selected);

      // Generate answer document content
      const answerContent = {
        court: case_data.court,
        plaintiff: case_data.plaintiff,
        defendant: case_data.defendant,
        caseNumber: case_data.caseNumber,
        allegations,
        defenses: selectedDefenses,
        generatedAt: new Date().toISOString(),
      };

      // Add timeline event
      await storage.addTimelineEvent({
        caseId: case_data.id,
        event: "Answer Generated",
        description: "Legal answer document generated and ready for review",
      });

      res.json(answerContent);
    } catch (error) {
      console.error("Error generating answer:", error);
      res.status(500).json({ message: "Failed to generate answer" });
    }
  });

  // Case timeline
  app.get('/api/cases/:id/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const timeline = await storage.getCaseTimeline(caseId);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  // Document generation endpoint
  app.post('/api/cases/:id/generate-document', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const { documentType, realtime } = req.body;
      
      // Verify case access
      const case_data = await storage.getCase(caseId, req.user.claims.sub);
      if (!case_data) {
        return res.status(404).json({ message: "Case not found" });
      }

      // Generate document with progress updates
      const { content, format } = await documentGenerator.generateDocument(
        caseId,
        documentType,
        realtime ? (step) => {
          // Send progress updates via WebSocket if realtime is enabled
          const wsClients = (req.app as any).wsClients;
          if (wsClients && wsClients.has(req.user.claims.sub)) {
            wsClients.get(req.user.claims.sub).send(JSON.stringify({
              type: 'generation-step',
              step
            }));
          }
        } : undefined
      );

      res.json({ content, format });
    } catch (error) {
      console.error("Error generating document:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  // Document export endpoint
  app.post('/api/cases/:id/export-document', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const { format, content } = req.body;
      
      // Verify case access
      const case_data = await storage.getCase(caseId, req.user.claims.sub);
      if (!case_data) {
        return res.status(404).json({ message: "Case not found" });
      }

      let buffer: Buffer;
      if (format === 'pdf') {
        buffer = await documentGenerator.exportToPDF(content, req.body.formatRules || {});
      } else if (format === 'docx') {
        buffer = await documentGenerator.exportToDOCX(content, req.body.formatRules || {});
      } else {
        return res.status(400).json({ message: "Invalid format" });
      }

      res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${case_data.caseNumber}-answer.${format}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting document:", error);
      res.status(500).json({ message: "Failed to export document" });
    }
  });

  // Case export endpoint
  app.get('/api/cases/:id/export', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const case_data = await storage.getCase(caseId, req.user.claims.sub);
      
      if (!case_data) {
        return res.status(404).json({ message: "Case not found" });
      }

      // Generate a comprehensive case report
      const report = {
        case: case_data,
        documents: await storage.getDocuments(caseId),
        allegations: await storage.getAllegations(caseId),
        defenses: await storage.getAffirmativeDefenses(caseId),
        timeline: await storage.getCaseTimeline(caseId),
        generatedAt: new Date().toISOString()
      };

      // For now, return as JSON. In production, this would generate a PDF
      res.json(report);
    } catch (error) {
      console.error("Error exporting case:", error);
      res.status(500).json({ message: "Failed to export case" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time document generation updates
  const wss = new WebSocketServer({ server: httpServer, path: '/api/ws/document-generation' });
  
  // Store WebSocket clients by user ID
  const wsClients = new Map();
  (app as any).wsClients = wsClients;
  
  wss.on('connection', (ws, req) => {
    // Extract user ID from session/auth
    const userId = (req as any).session?.passport?.user?.claims?.sub;
    
    if (userId) {
      wsClients.set(userId, ws);
      
      ws.on('close', () => {
        wsClients.delete(userId);
      });
    }
  });
  
  return httpServer;
}
