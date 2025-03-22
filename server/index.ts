import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

// Charger les variables d'environnement depuis .env
dotenv.config();

// Créer l'application Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware pour logger les requêtes API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Intercepter la méthode json pour capturer les réponses
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Logger les informations quand la réponse est terminée
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Vérifier le token Discord à l'initialisation
if (!process.env.DISCORD_TOKEN) {
  console.warn("\x1b[33m%s\x1b[0m", "⚠️ Aucun token Discord n'a été trouvé dans les variables d'environnement (DISCORD_TOKEN)");
  console.warn("\x1b[33m%s\x1b[0m", "⚠️ Le bot ne pourra pas se connecter à Discord");
}

// Démarrer l'application
(async () => {
  // Configurer les routes
  const server = await registerRoutes(app);

  // Middleware de gestion des erreurs
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Erreur interne du serveur";

    console.error("Erreur de serveur:", err);
    res.status(status).json({ message });
  });

  // Configurer Vite en développement ou servir les fichiers statiques en production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Démarrer le serveur sur le port 5000
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Serveur démarré sur le port ${port}`);
    
    // Afficher un message concernant le token Discord
    if (process.env.DISCORD_TOKEN) {
      log("Bot Discord configuré et prêt à être connecté");
    } else {
      log("⚠️ Bot Discord non configuré (token manquant)");
    }
  });
})();
