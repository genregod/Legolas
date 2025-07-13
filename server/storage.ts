import {
  users,
  cases,
  documents,
  allegations,
  affirmativeDefenses,
  caseTimeline,
  type User,
  type UpsertUser,
  type Case,
  type InsertCase,
  type Document,
  type InsertDocument,
  type Allegation,
  type InsertAllegation,
  type AffirmativeDefense,
  type InsertAffirmativeDefense,
  type CaseTimelineEvent,
  type InsertCaseTimeline,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Case operations
  getCases(userId: string): Promise<Case[]>;
  getCase(id: number, userId: string): Promise<Case | undefined>;
  createCase(case_data: InsertCase): Promise<Case>;
  updateCase(id: number, case_data: Partial<InsertCase>): Promise<Case>;
  deleteCase(id: number, userId: string): Promise<boolean>;
  
  // Document operations
  getDocuments(caseId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document>;
  
  // Allegation operations
  getAllegations(caseId: number): Promise<Allegation[]>;
  createAllegation(allegation: InsertAllegation): Promise<Allegation>;
  updateAllegation(id: number, allegation: Partial<InsertAllegation>): Promise<Allegation>;
  
  // Affirmative defense operations
  getAffirmativeDefenses(caseId: number): Promise<AffirmativeDefense[]>;
  createAffirmativeDefense(defense: InsertAffirmativeDefense): Promise<AffirmativeDefense>;
  updateAffirmativeDefense(id: number, defense: Partial<InsertAffirmativeDefense>): Promise<AffirmativeDefense>;
  
  // Timeline operations
  getCaseTimeline(caseId: number): Promise<CaseTimelineEvent[]>;
  addTimelineEvent(event: InsertCaseTimeline): Promise<CaseTimelineEvent>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Case operations
  async getCases(userId: string): Promise<Case[]> {
    return await db.select().from(cases).where(eq(cases.userId, userId)).orderBy(desc(cases.createdAt));
  }

  async getCase(id: number, userId: string): Promise<Case | undefined> {
    const [case_data] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, id), eq(cases.userId, userId)));
    return case_data;
  }

  async createCase(case_data: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(case_data).returning();
    return newCase;
  }

  async updateCase(id: number, case_data: Partial<InsertCase>): Promise<Case> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...case_data, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async deleteCase(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(cases)
      .where(and(eq(cases.id, id), eq(cases.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Document operations
  async getDocuments(caseId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.caseId, caseId));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  // Allegation operations
  async getAllegations(caseId: number): Promise<Allegation[]> {
    return await db.select().from(allegations).where(eq(allegations.caseId, caseId));
  }

  async createAllegation(allegation: InsertAllegation): Promise<Allegation> {
    const [newAllegation] = await db.insert(allegations).values(allegation).returning();
    return newAllegation;
  }

  async updateAllegation(id: number, allegation: Partial<InsertAllegation>): Promise<Allegation> {
    const [updatedAllegation] = await db
      .update(allegations)
      .set(allegation)
      .where(eq(allegations.id, id))
      .returning();
    return updatedAllegation;
  }

  // Affirmative defense operations
  async getAffirmativeDefenses(caseId: number): Promise<AffirmativeDefense[]> {
    return await db.select().from(affirmativeDefenses).where(eq(affirmativeDefenses.caseId, caseId));
  }

  async createAffirmativeDefense(defense: InsertAffirmativeDefense): Promise<AffirmativeDefense> {
    const [newDefense] = await db.insert(affirmativeDefenses).values(defense).returning();
    return newDefense;
  }

  async updateAffirmativeDefense(id: number, defense: Partial<InsertAffirmativeDefense>): Promise<AffirmativeDefense> {
    const [updatedDefense] = await db
      .update(affirmativeDefenses)
      .set(defense)
      .where(eq(affirmativeDefenses.id, id))
      .returning();
    return updatedDefense;
  }

  // Timeline operations
  async getCaseTimeline(caseId: number): Promise<CaseTimelineEvent[]> {
    return await db.select().from(caseTimeline).where(eq(caseTimeline.caseId, caseId)).orderBy(desc(caseTimeline.eventDate));
  }

  async addTimelineEvent(event: InsertCaseTimeline): Promise<CaseTimelineEvent> {
    const [newEvent] = await db.insert(caseTimeline).values(event).returning();
    return newEvent;
  }
}

export const storage = new DatabaseStorage();
