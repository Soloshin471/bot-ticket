import express, { Router } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createDiscordClient } from "./bot/index";
import { ticketConfigSchema } from "@shared/schema";
import { z } from "zod";

// Variable pour suivre la dernière fois que le bot a été pingé
let lastPingTime = new Date();

export async function registerRoutes(app: Express): Promise<Server> {
  // Créer un routeur pour les routes API
  const apiRouter = Router();
  
  // Créer et connecter le client Discord
  const client = createDiscordClient();
  
  // Se connecter au bot Discord si un token est fourni
  if (process.env.DISCORD_TOKEN) {
    client.login(process.env.DISCORD_TOKEN)
      .catch(error => {
        console.error("Erreur lors de la connexion du bot Discord:", error);
      });
  } else {
    console.warn("Aucun token Discord trouvé. Le bot ne sera pas connecté.");
  }

  // Routes pour les serveurs Discord
  apiRouter.get("/guilds", async (req, res) => {
    try {
      const guilds = await storage.getGuilds();
      res.json(guilds);
    } catch (error) {
      console.error("Erreur lors de la récupération des serveurs:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  apiRouter.get("/guilds/:id", async (req, res) => {
    try {
      const guild = await storage.getGuild(req.params.id);
      
      if (!guild) {
        return res.status(404).json({ error: "Serveur non trouvé" });
      }
      
      res.json(guild);
    } catch (error) {
      console.error("Erreur lors de la récupération du serveur:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  apiRouter.patch("/guilds/:id", async (req, res) => {
    try {
      const configSchema = ticketConfigSchema.partial();
      const validationResult = configSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Données invalides",
          details: validationResult.error.errors
        });
      }
      
      const updatedGuild = await storage.updateGuild(req.params.id, validationResult.data);
      
      if (!updatedGuild) {
        return res.status(404).json({ error: "Serveur non trouvé" });
      }
      
      res.json(updatedGuild);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du serveur:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  // Routes pour les tickets
  apiRouter.get("/tickets", async (req, res) => {
    try {
      const guildId = req.query.guildId as string;
      
      if (!guildId) {
        return res.status(400).json({ error: "Le paramètre guildId est requis" });
      }
      
      const tickets = await storage.getTicketsByGuildId(guildId);
      res.json(tickets);
    } catch (error) {
      console.error("Erreur lors de la récupération des tickets:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  apiRouter.get("/tickets/stats", async (req, res) => {
    try {
      const guildId = req.query.guildId as string;
      
      if (!guildId) {
        return res.status(400).json({ error: "Le paramètre guildId est requis" });
      }
      
      const stats = await storage.getTicketStats(guildId);
      res.json(stats);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques des tickets:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  apiRouter.get("/tickets/:id", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: "ID de ticket invalide" });
      }
      
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket non trouvé" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Erreur lors de la récupération du ticket:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  // Route pour récupérer l'état du bot
  apiRouter.get("/bot/status", (req, res) => {
    try {
      const status = {
        online: client.isReady(),
        username: client.user?.username || null,
        guilds: client.guilds.cache.size,
        lastPing: lastPingTime
      };
      
      res.json(status);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'état du bot:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });
  
  // Route pour ping le bot et maintenir la connexion active
  apiRouter.get("/bot/ping", (req, res) => {
    try {
      lastPingTime = new Date();
      
      // Vérifier si le bot est connecté
      if (!client.isReady()) {
        console.log("Bot déconnecté, tentative de reconnexion...");
        if (process.env.DISCORD_TOKEN) {
          client.login(process.env.DISCORD_TOKEN)
            .then(() => {
              console.log("Bot reconnecté avec succès");
            })
            .catch(error => {
              console.error("Erreur lors de la reconnexion du bot Discord:", error);
            });
        }
      }
      
      res.json({
        success: true,
        timestamp: lastPingTime,
        status: client.isReady() ? "connected" : "disconnected"
      });
    } catch (error) {
      console.error("Erreur lors du ping du bot:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  // Préfixer toutes les routes API avec /api
  app.use("/api", apiRouter);

  // Créer le serveur HTTP
  const httpServer = createServer(app);
  
  return httpServer;
}
