import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, StringSelectMenuOptionBuilder } from "discord.js";
import { TICKET_TYPE_INFO } from "./config";

// Couleurs des embeds
export const COLORS = {
  PRIMARY: 0x5865F2, // Blurple (Discord)
  SUCCESS: 0x2D7D46, // Vert
  ERROR: 0xED4245,   // Rouge
  WARNING: 0xFEE75C, // Jaune
  INFO: 0x5865F2     // Bleu
};

// Embed principal pour la création de tickets
export function createTicketEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle("🎫 Système de Tickets")
    .setDescription("Bienvenue dans notre système de tickets. Cliquez sur l'un des boutons ci-dessous pour créer un ticket en fonction de votre besoin.")
    .setFooter({ text: "John Bot - Système de tickets" })
    .setTimestamp();
}

// Boutons pour les différents types de tickets
export function createTicketButtons(enabledTypes: string[] = Object.keys(TICKET_TYPE_INFO)) {
  // Filtrer pour n'avoir que les types activés
  const availableTypes = Object.entries(TICKET_TYPE_INFO)
    .filter(([key]) => enabledTypes.includes(key));
  
  // Créer les boutons - maximum 5 par ligne
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();
  let buttonCount = 0;
  
  availableTypes.forEach(([key, info]) => {
    const buttonStyle = getButtonStyle(info.buttonColor);
    
    const button = new ButtonBuilder()
      .setCustomId(`ticket_create_${key}`)
      .setLabel(info.name)
      .setEmoji(info.emoji)
      .setStyle(buttonStyle);
    
    if (buttonCount % 5 === 0 && buttonCount > 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
    }
    
    currentRow.addComponents(button);
    buttonCount++;
  });
  
  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

// Convertir string en ButtonStyle
function getButtonStyle(style: string): ButtonStyle {
  switch (style) {
    case "Primary": return ButtonStyle.Primary;
    case "Secondary": return ButtonStyle.Secondary;
    case "Success": return ButtonStyle.Success;
    case "Danger": return ButtonStyle.Danger;
    default: return ButtonStyle.Primary;
  }
}

// Menu de sélection pour le motif du ticket
export function createReasonSelectMenu(ticketType: string) {
  const typeInfo = TICKET_TYPE_INFO[ticketType as keyof typeof TICKET_TYPE_INFO];
  
  return new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`ticket_reason_${ticketType}`)
        .setPlaceholder(`Choisissez un motif pour votre ticket ${typeInfo?.name || ticketType}`)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Question générale")
            .setValue("question_generale")
            .setDescription("J'ai une question générale")
            .setEmoji("❓"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Besoin d'assistance")
            .setValue("assistance")
            .setDescription("J'ai besoin d'aide pour résoudre un problème")
            .setEmoji("🔧"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Autre raison")
            .setValue("autre")
            .setDescription("J'ai une autre raison (à préciser)")
            .setEmoji("📝")
        )
    );
}

// Embed pour la modal de description du ticket
export function createTicketModal(ticketType: string) {
  const typeInfo = TICKET_TYPE_INFO[ticketType as keyof typeof TICKET_TYPE_INFO];
  
  return {
    title: `Créer un ticket - ${typeInfo?.name || ticketType}`,
    customId: `ticket_modal_${ticketType}`,
    fields: [
      {
        label: "Description de votre demande",
        customId: "ticket_description",
        style: 2, // Paragraph
        placeholder: "Veuillez décrire votre demande de manière détaillée...",
        required: true
      }
    ]
  };
}

// Embed pour un ticket créé
export function createTicketInfoEmbed(ticket: {
  userId: string;
  userName: string;
  type: string;
  reason: string;
  ticketId: string;
}) {
  const typeInfo = TICKET_TYPE_INFO[ticket.type as keyof typeof TICKET_TYPE_INFO];
  
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`Ticket ${typeInfo?.name || ticket.type} Créé`)
    .setDescription("Bienvenue dans votre ticket. Un membre du staff vous assistera dès que possible.")
    .addFields(
      { name: "Créé par", value: ticket.userName, inline: true },
      { name: "ID du ticket", value: ticket.ticketId, inline: true },
      { name: "Type", value: typeInfo?.name || ticket.type, inline: true },
      { name: "Raison", value: ticket.reason || "Non spécifiée" }
    )
    .setTimestamp()
    .setFooter({ text: "John Bot - Système de tickets" });
}

// Boutons de contrôle des tickets
export function createTicketControlButtons() {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Fermer le Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket_archive")
        .setLabel("Archiver")
        .setEmoji("📤")
        .setStyle(ButtonStyle.Secondary)
    );
}

// Embed pour le log de création de ticket
export function createTicketLogEmbed(ticket: {
  ticketId: string;
  userId: string;
  userName: string;
  type: string;
  channelId: string;
  reason: string;
  createdAt: Date;
}, action: 'created' | 'closed' | 'archived') {
  const typeInfo = TICKET_TYPE_INFO[ticket.type as keyof typeof TICKET_TYPE_INFO];
  
  const embed = new EmbedBuilder()
    .setTimestamp();
  
  if (action === 'created') {
    embed
      .setColor(COLORS.SUCCESS)
      .setTitle("📝 Ticket Créé")
      .addFields(
        { name: "ID du Ticket", value: ticket.ticketId, inline: true },
        { name: "Créé par", value: ticket.userName, inline: true },
        { name: "Type", value: typeInfo?.name || ticket.type, inline: true },
        { name: "Salon", value: `<#${ticket.channelId}>`, inline: true },
        { name: "Date", value: ticket.createdAt.toLocaleString(), inline: true }
      );
    
    if (ticket.reason) {
      embed.addFields({ name: "Raison", value: ticket.reason });
    }
  } else if (action === 'closed') {
    embed
      .setColor(COLORS.ERROR)
      .setTitle("🔒 Ticket Fermé")
      .addFields(
        { name: "ID du Ticket", value: ticket.ticketId, inline: true },
        { name: "Créé par", value: ticket.userName, inline: true },
        { name: "Type", value: typeInfo?.name || ticket.type, inline: true },
        { name: "Date de fermeture", value: new Date().toLocaleString(), inline: true }
      );
    
    if (ticket.closedBy) {
      embed.addFields({ name: "Fermé par", value: ticket.closedBy, inline: true });
    }
  } else if (action === 'archived') {
    embed
      .setColor(COLORS.WARNING)
      .setTitle("📤 Ticket Archivé")
      .addFields(
        { name: "ID du Ticket", value: ticket.ticketId, inline: true },
        { name: "Créé par", value: ticket.userName, inline: true },
        { name: "Type", value: typeInfo?.name || ticket.type, inline: true },
        { name: "Date d'archivage", value: new Date().toLocaleString(), inline: true }
      );
  }
  
  return embed;
}
