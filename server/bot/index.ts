import { 
  Client, 
  GatewayIntentBits, 
  Partials,
  Events,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ChatInputCommandInteraction
} from "discord.js";
import { createTicketModal } from "./embeds";
import { parseCustomId } from "./utils";
import { registerCommands, handleCommandInteraction } from "./commands";
import { createTicket, closeTicket } from "./tickets";

// Crée une instance du client Discord avec les intentions et partials nécessaires
export function createDiscordClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,             // Nécessaire pour les commandes slash
      GatewayIntentBits.GuildMessages,      // Nécessaire pour lire les messages
      GatewayIntentBits.GuildMembers,       // Nécessaire pour les permissions et membres
      GatewayIntentBits.MessageContent,     // Nécessaire pour lire le contenu des messages
      GatewayIntentBits.DirectMessages      // Nécessaire pour les messages privés
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
      Partials.GuildMember,
      Partials.Reaction            // Ajout pour les réactions
    ]
  });

  // Événement ready: lorsque le bot se connecte à Discord
  client.on(Events.ClientReady, async () => {
    console.log(`Bot connecté en tant que ${client.user?.tag}!`);
    
    // Enregistrer les commandes slash
    await registerCommands(client);
  });

  // Événement interactionCreate: gérer les interactions (boutons, modals, commandes slash)
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      // Gérer les interactions de bouton
      if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
      }
      // Gérer les soumissions de modal
      else if (interaction.isModalSubmit()) {
        await handleModalSubmitInteraction(interaction);
      }
      // Gérer les interactions de menu de sélection
      else if (interaction.isStringSelectMenu()) {
        await handleSelectMenuInteraction(interaction);
      }
      // Gérer les commandes slash
      else if (interaction.isChatInputCommand()) {
        await handleCommandInteraction(interaction);
      }
    } catch (error) {
      console.error("Erreur lors du traitement de l'interaction:", error);
      
      // Répondre à l'utilisateur en cas d'erreur non gérée
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Une erreur est survenue lors du traitement de votre action.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "Une erreur est survenue lors du traitement de votre action.",
          ephemeral: true
        });
      }
    }
  });
  
  // Ajouter un log pour indiquer que les commandes slash sont disponibles
  console.log("Le bot est prêt à utiliser les commandes slash (tapez / pour les voir)");

  return client;
}

// Gestionnaire d'interactions de bouton
async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { action, type } = parseCustomId(interaction.customId);
  
  // Bouton pour créer un ticket
  if (action === "ticket_create" && type) {
    // Créer et afficher la modal pour la description du ticket
    const modalData = createTicketModal(type);
    
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${type}`)
      .setTitle(modalData.title);
    
    // Ajouter les champs à la modal
    const fields = modalData.fields.map(field => {
      return new TextInputBuilder()
        .setCustomId(field.customId)
        .setLabel(field.label)
        .setStyle(field.style as TextInputStyle)
        .setPlaceholder(field.placeholder || "")
        .setRequired(field.required || false);
    });
    
    const rows = fields.map(field => {
      return new ActionRowBuilder<TextInputBuilder>().addComponents(field);
    });
    
    modal.addComponents(...rows);
    
    await interaction.showModal(modal);
  }
  
  // Bouton pour fermer un ticket
  else if (action === "ticket_close") {
    await closeTicket(interaction, false);
  }
  
  // Bouton pour archiver un ticket
  else if (action === "ticket_archive") {
    await closeTicket(interaction, true);
  }
}

// Gestionnaire des soumissions de modal
async function handleModalSubmitInteraction(interaction: ModalSubmitInteraction) {
  const { action, type } = parseCustomId(interaction.customId);
  
  // Modal pour la création de ticket
  if (action === "ticket_modal" && type) {
    const reason = interaction.fields.getTextInputValue("ticket_description");
    await createTicket(interaction, type, reason);
  }
}

// Gestionnaire des interactions de menu de sélection
async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction) {
  const { action, type } = parseCustomId(interaction.customId);
  
  // Menu de sélection pour la raison du ticket
  if (action === "ticket_reason" && type) {
    const [selectedReason] = interaction.values;
    
    // Pour les raisons prédéfinies, créer directement le ticket
    if (selectedReason !== "autre") {
      await createTicket(interaction, type, selectedReason);
    }
    // Pour "autre raison", afficher une modal pour description personnalisée
    else {
      const modalData = createTicketModal(type);
      
      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${type}`)
        .setTitle(modalData.title);
      
      const fields = modalData.fields.map(field => {
        return new TextInputBuilder()
          .setCustomId(field.customId)
          .setLabel(field.label)
          .setStyle(field.style as TextInputStyle)
          .setPlaceholder(field.placeholder || "")
          .setRequired(field.required || false);
      });
      
      const rows = fields.map(field => {
        return new ActionRowBuilder<TextInputBuilder>().addComponents(field);
      });
      
      modal.addComponents(...rows);
      
      await interaction.showModal(modal);
    }
  }
}
