import { TicketConfig } from "@shared/schema";

// Configuration par défaut pour le bot de tickets
export const DEFAULT_CONFIG: TicketConfig = {
  ticketChannelId: undefined,
  logsChannelId: undefined,
  categoryId: undefined,
  ticketTypes: ["aide", "recrutement_joueur", "recrutement_staff", "show_match", "c2s"],
  enabled: true
};

// Informations sur les types de tickets
export const TICKET_TYPE_INFO = {
  aide: {
    name: "Aide Générale",
    emoji: "❓",
    description: "Obtenir de l'aide sur n'importe quel sujet",
    buttonColor: "Primary", // discord.js ButtonStyle.Primary (bleu)
  },
  recrutement_joueur: {
    name: "Recrutement Joueur",
    emoji: "👥",
    description: "Rejoindre notre équipe en tant que joueur",
    buttonColor: "Primary", // discord.js ButtonStyle.Primary (bleu)
  },
  recrutement_staff: {
    name: "Recrutement Staff",
    emoji: "👮",
    description: "Rejoindre notre équipe en tant que staff",
    buttonColor: "Secondary", // discord.js ButtonStyle.Secondary (gris)
  },
  show_match: {
    name: "Demande Show Match",
    emoji: "🏆",
    description: "Organiser un match amical avec votre équipe",
    buttonColor: "Success", // discord.js ButtonStyle.Success (vert)
  },
  c2s: {
    name: "Demande C2S",
    emoji: "🔄",
    description: "Demande pour les tournois C2S",
    buttonColor: "Success", // discord.js ButtonStyle.Success (vert)
  }
};

// Messages du bot
export const BOT_MESSAGES = {
  ticketCreated: (userName: string, ticketType: string, reason: string) => `
# Ticket créé par ${userName}

**Type:** ${TICKET_TYPE_INFO[ticketType as keyof typeof TICKET_TYPE_INFO]?.name || ticketType}
**Raison:** ${reason || "Aucune raison spécifiée"}

Un membre du staff va vous aider dès que possible.
  `,
  ticketClosed: (closedBy: string) => `
# Ticket fermé

Ce ticket a été fermé par ${closedBy}.
Le salon sera automatiquement supprimé dans 5 minutes.
  `,
  ticketArchived: "Ce ticket a été archivé et sera bientôt supprimé."
};

// Permissions pour les différents types de tickets
export const TICKET_PERMISSIONS = {
  user: [
    "ViewChannel",
    "SendMessages",
    "ReadMessageHistory",
    "AttachFiles",
    "EmbedLinks"
  ],
  staff: [
    "ViewChannel",
    "SendMessages",
    "ReadMessageHistory",
    "AttachFiles",
    "EmbedLinks",
    "ManageMessages"
  ],
  admin: [
    "ViewChannel",
    "SendMessages",
    "ReadMessageHistory",
    "AttachFiles",
    "EmbedLinks",
    "ManageMessages",
    "ManageChannels"
  ]
};

// Commandes du bot
export const COMMANDS = {
  setup: {
    name: "setup",
    description: "Configure le système de tickets dans un salon spécifique",
    options: [
      {
        name: "salon",
        description: "Le salon où afficher le panel de tickets",
        type: 7, // ChannelType
        required: true
      },
      {
        name: "logs",
        description: "Le salon où envoyer les logs des tickets",
        type: 7, // ChannelType
        required: false
      },
      {
        name: "categorie",
        description: "La catégorie où créer les tickets",
        type: 7, // ChannelType (catégorie)
        required: false
      }
    ]
  },
  close: {
    name: "close",
    description: "Fermer le ticket actuel",
  },
  add: {
    name: "add",
    description: "Ajouter un utilisateur au ticket actuel",
    options: [
      {
        name: "utilisateur",
        description: "L'utilisateur à ajouter au ticket",
        type: 6, // UserType
        required: true
      }
    ]
  },
  remove: {
    name: "remove",
    description: "Retirer un utilisateur du ticket actuel",
    options: [
      {
        name: "utilisateur",
        description: "L'utilisateur à retirer du ticket",
        type: 6, // UserType
        required: true
      }
    ]
  }
};
