import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Types de tickets disponibles
export const TICKET_TYPES = [
  "aide",
  "recrutement_joueur",
  "recrutement_staff",
  "show_match",
  "c2s"
] as const;

// Table des utilisateurs (pour l'authentification éventuelle du dashboard)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Table des serveurs Discord où le bot est installé
export const guilds = pgTable("guilds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ticketChannelId: text("ticket_channel_id"),
  logsChannelId: text("logs_channel_id"),
  categoryId: text("category_id"),
  enabled: boolean("enabled").default(true),
});

// Table des tickets
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: text("ticket_id").notNull().unique(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  type: text("type").$type<typeof TICKET_TYPES[number]>().notNull(),
  reason: text("reason"),
  status: text("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  closedBy: text("closed_by"),
});

// Schémas d'insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGuildSchema = createInsertSchema(guilds)
  .pick({
    id: true,
    name: true,
    ticketChannelId: true,
    logsChannelId: true,
    categoryId: true,
    enabled: true,
  })
  .partial({ 
    ticketChannelId: true, 
    logsChannelId: true, 
    categoryId: true, 
    enabled: true 
  });

export const insertTicketSchema = createInsertSchema(tickets)
  .pick({
    ticketId: true,
    guildId: true,
    channelId: true,
    userId: true,
    userName: true,
    type: true,
    reason: true,
    status: true,
  })
  .partial({ 
    reason: true, 
    status: true 
  });

// Types exportés
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGuild = z.infer<typeof insertGuildSchema>;
export type Guild = typeof guilds.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Configuration
export const ticketConfigSchema = z.object({
  ticketChannelId: z.string().optional(),
  logsChannelId: z.string().optional(),
  categoryId: z.string().optional(),
  ticketTypes: z.array(z.string()).default(TICKET_TYPES),
  enabled: z.boolean().default(true),
});

export type TicketConfig = z.infer<typeof ticketConfigSchema>;

// Statistiques
export type TicketStats = {
  total: number;
  open: number;
  closed: number;
  byType: Record<string, number>;
};
