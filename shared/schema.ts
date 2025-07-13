import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("trial"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  caseNumber: varchar("case_number"),
  court: varchar("court"),
  plaintiff: varchar("plaintiff"),
  defendant: varchar("defendant"),
  caseType: varchar("case_type"),
  filingDate: date("filing_date"),
  responseDeadline: date("response_deadline"),
  status: varchar("status").default("active"),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => cases.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type"),
  filePath: varchar("file_path"),
  documentType: varchar("document_type"), // 'complaint', 'answer', 'motion', etc.
  ocrText: text("ocr_text"),
  extractedData: jsonb("extracted_data"),
  aiAnalysis: jsonb("ai_analysis"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const allegations = pgTable("allegations", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id),
  allegationNumber: integer("allegation_number").notNull(),
  allegationText: text("allegation_text").notNull(),
  response: varchar("response"), // 'admit', 'deny', 'lack_knowledge'
  responseNotes: text("response_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affirmativeDefenses = pgTable("affirmative_defenses", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id),
  defenseType: varchar("defense_type").notNull(),
  defenseTitle: varchar("defense_title").notNull(),
  defenseDescription: text("defense_description"),
  selected: boolean("selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const caseTimeline = pgTable("case_timeline", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id),
  event: varchar("event").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCase = typeof cases.$inferInsert;
export type Case = typeof cases.$inferSelect;

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

export type InsertAllegation = typeof allegations.$inferInsert;
export type Allegation = typeof allegations.$inferSelect;

export type InsertAffirmativeDefense = typeof affirmativeDefenses.$inferInsert;
export type AffirmativeDefense = typeof affirmativeDefenses.$inferSelect;

export type InsertCaseTimeline = typeof caseTimeline.$inferInsert;
export type CaseTimelineEvent = typeof caseTimeline.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertAllegationSchema = createInsertSchema(allegations).omit({
  id: true,
  createdAt: true,
});

export const insertAffirmativeDefenseSchema = createInsertSchema(affirmativeDefenses).omit({
  id: true,
  createdAt: true,
});
