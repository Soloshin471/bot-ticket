import { tickets, type Ticket, type InsertTicket, guilds, type Guild, type InsertGuild, users, type User, type InsertUser } from "@shared/schema";

// Interface de stockage pour les opérations CRUD
export interface IStorage {
  // Utilisateurs
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Guilds (serveurs Discord)
  getGuild(id: string): Promise<Guild | undefined>;
  getGuilds(): Promise<Guild[]>;
  createGuild(guild: InsertGuild): Promise<Guild>;
  updateGuild(id: string, data: Partial<InsertGuild>): Promise<Guild | undefined>;
  deleteGuild(id: string): Promise<boolean>;
  
  // Tickets
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByTicketId(ticketId: string): Promise<Ticket | undefined>;
  getTicketByChannelId(channelId: string): Promise<Ticket | undefined>;
  getTicketsByGuildId(guildId: string): Promise<Ticket[]>;
  getTicketsByUserId(userId: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined>;
  closeTicket(id: number, closedBy: string): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  
  // Statistiques
  getTicketStats(guildId: string): Promise<{
    total: number;
    open: number;
    closed: number;
    byType: Record<string, number>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private guilds: Map<string, Guild>;
  private tickets: Map<number, Ticket>;
  private userIdCounter: number;
  private ticketIdCounter: number;

  constructor() {
    this.users = new Map();
    this.guilds = new Map();
    this.tickets = new Map();
    this.userIdCounter = 1;
    this.ticketIdCounter = 1;
  }

  // Implémentation des méthodes utilisateurs
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  // Implémentation des méthodes guilds
  async getGuild(id: string): Promise<Guild | undefined> {
    return this.guilds.get(id);
  }

  async getGuilds(): Promise<Guild[]> {
    return Array.from(this.guilds.values());
  }

  async createGuild(guildData: InsertGuild): Promise<Guild> {
    const guild = { ...guildData };
    this.guilds.set(guildData.id, guild);
    return guild;
  }

  async updateGuild(id: string, data: Partial<InsertGuild>): Promise<Guild | undefined> {
    const guild = this.guilds.get(id);
    if (!guild) return undefined;
    
    const updatedGuild = { ...guild, ...data };
    this.guilds.set(id, updatedGuild);
    return updatedGuild;
  }

  async deleteGuild(id: string): Promise<boolean> {
    return this.guilds.delete(id);
  }

  // Implémentation des méthodes tickets
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(ticket => ticket.ticketId === ticketId);
  }

  async getTicketByChannelId(channelId: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(ticket => ticket.channelId === channelId);
  }

  async getTicketsByGuildId(guildId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(ticket => ticket.guildId === guildId);
  }

  async getTicketsByUserId(userId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(ticket => ticket.userId === userId);
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const id = this.ticketIdCounter++;
    const ticket = { 
      ...ticketData, 
      id, 
      createdAt: new Date(), 
      closedAt: null, 
      closedBy: null 
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket = { ...ticket, ...data };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async closeTicket(id: number, closedBy: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket = { 
      ...ticket, 
      status: "closed", 
      closedAt: new Date(), 
      closedBy 
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<boolean> {
    return this.tickets.delete(id);
  }

  // Statistiques sur les tickets
  async getTicketStats(guildId: string): Promise<{
    total: number;
    open: number;
    closed: number;
    byType: Record<string, number>;
  }> {
    const guildTickets = await this.getTicketsByGuildId(guildId);
    
    const total = guildTickets.length;
    const open = guildTickets.filter(t => t.status === "open").length;
    const closed = guildTickets.filter(t => t.status === "closed").length;
    
    const byType: Record<string, number> = {};
    guildTickets.forEach(ticket => {
      byType[ticket.type] = (byType[ticket.type] || 0) + 1;
    });
    
    return { total, open, closed, byType };
  }
}

export const storage = new MemStorage();
