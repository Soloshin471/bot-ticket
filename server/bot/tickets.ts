import { 
  ChannelType, 
  TextChannel, 
  Guild, 
  User, 
  PermissionFlagsBits, 
  GuildMember,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  Collection,
  PermissionsBitField,
  ThreadAutoArchiveDuration,
  MessageCreateOptions,
  CategoryChannel
} from "discord.js";
import { storage } from "../storage";
import { 
  createTicketInfoEmbed, 
  createTicketControlButtons, 
  createTicketLogEmbed,
  COLORS
} from "./embeds";
import { BOT_MESSAGES, TICKET_PERMISSIONS } from "./config";
import { generateTicketId } from "./utils";

// Créer un nouveau ticket à partir d'une interaction
export async function createTicket(
  interaction: ModalSubmitInteraction | ButtonInteraction | StringSelectMenuInteraction,
  ticketType: string,
  reason: string
) {
  try {
    if (!interaction.guild || !interaction.member || !interaction.guild.members) {
      await interaction.reply({ 
        content: "Erreur: Ce ticket ne peut pas être créé en dehors d'un serveur Discord.",
        ephemeral: true 
      });
      return;
    }

    // Récupérer les infos du serveur
    const guildData = await storage.getGuild(interaction.guild.id);
    if (!guildData) {
      await interaction.reply({ 
        content: "Erreur: Le bot n'est pas configuré sur ce serveur. Un administrateur doit utiliser la commande `/setup`.",
        ephemeral: true 
      });
      return;
    }

    // Vérifier si la configuration est complète
    if (!guildData.categoryId) {
      await interaction.reply({ 
        content: "Erreur: Aucune catégorie n'a été configurée pour les tickets. Un administrateur doit utiliser la commande `/setup`.",
        ephemeral: true 
      });
      return;
    }

    // Récupérer l'utilisateur
    const user = interaction.user;
    const member = interaction.member as GuildMember;

    // Vérifier si l'utilisateur a déjà des tickets ouverts (limite)
    const userTickets = await storage.getTicketsByUserId(user.id);
    const openTickets = userTickets.filter(t => t.status === "open");
    
    if (openTickets.length >= 3) {
      await interaction.reply({ 
        content: "Vous avez déjà 3 tickets ouverts. Veuillez fermer un ticket existant avant d'en ouvrir un nouveau.",
        ephemeral: true 
      });
      return;
    }

    // Générer un nouvel ID de ticket
    const ticketId = generateTicketId();
    const channelName = `ticket-${ticketType.split('_')[0]}-${ticketId}`;

    // Récupérer la catégorie
    const category = await interaction.guild.channels.fetch(guildData.categoryId) as CategoryChannel;
    if (!category) {
      await interaction.reply({ 
        content: "Erreur: La catégorie configurée n'existe plus. Un administrateur doit utiliser la commande `/setup`.",
        ephemeral: true 
      });
      return;
    }

    // Définir les permissions du salon
    const staffRole = interaction.guild.roles.cache.find(role => 
      role.name.toLowerCase().includes('staff') || 
      role.name.toLowerCase().includes('mod') || 
      role.name.toLowerCase().includes('admin')
    );

    const permissionOverwrites = [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel.toString()],
      },
      {
        id: user.id,
        allow: TICKET_PERMISSIONS.user.map(perm => PermissionFlagsBits[perm].toString()),
      },
      {
        id: interaction.client.user.id,
        allow: TICKET_PERMISSIONS.admin.map(perm => PermissionFlagsBits[perm].toString()),
      }
    ];

    // Ajouter le rôle staff si disponible
    if (staffRole) {
      permissionOverwrites.push({
        id: staffRole.id,
        allow: TICKET_PERMISSIONS.staff.map(perm => PermissionFlagsBits[perm].toString()),
      });
    }

    // Créer le salon de ticket
    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissionOverwrites,
      topic: `Ticket de ${user.tag} | Type: ${ticketType} | ID: ${ticketId}`
    });

    // Créer l'embed et les boutons pour le salon de ticket
    const embed = createTicketInfoEmbed({
      userId: user.id,
      userName: user.tag,
      type: ticketType,
      reason: reason,
      ticketId: ticketId,
    });

    const components = [createTicketControlButtons()];

    // Enregistrer le ticket dans la base de données
    const ticketData = await storage.createTicket({
      ticketId: ticketId,
      guildId: interaction.guild.id,
      channelId: ticketChannel.id,
      userId: user.id,
      userName: user.tag,
      type: ticketType,
      reason: reason,
      status: "open"
    });

    // Envoyer le message initial dans le salon du ticket
    await ticketChannel.send({
      content: `<@${user.id}> Votre ticket a été créé.`,
      embeds: [embed],
      components: components
    });

    // Ajouter le message de bienvenue
    await ticketChannel.send({
      content: BOT_MESSAGES.ticketCreated(user.tag, ticketType, reason)
    });

    // Envoyer un log si configuré
    if (guildData.logsChannelId) {
      const logsChannel = await interaction.guild.channels.fetch(guildData.logsChannelId) as TextChannel;
      if (logsChannel) {
        const logEmbed = createTicketLogEmbed({
          ...ticketData,
          createdAt: new Date()
        }, 'created');
        
        await logsChannel.send({ embeds: [logEmbed] });
      }
    }

    // Répondre à l'utilisateur
    await interaction.reply({ 
      content: `Votre ticket a été créé avec succès. Rendez-vous dans <#${ticketChannel.id}>.`,
      ephemeral: true 
    });

  } catch (error) {
    console.error("Erreur lors de la création du ticket:", error);
    
    // Répondre en cas d'erreur
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: "Une erreur est survenue lors de la création du ticket. Veuillez réessayer ou contacter un administrateur.",
        ephemeral: true 
      });
    } else {
      await interaction.reply({ 
        content: "Une erreur est survenue lors de la création du ticket. Veuillez réessayer ou contacter un administrateur.",
        ephemeral: true 
      });
    }
  }
}

// Fermer un ticket existant
export async function closeTicket(interaction: ButtonInteraction, isArchive = false) {
  try {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: "Erreur: Impossible de fermer ce ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier si le salon est un salon de ticket
    const ticket = await storage.getTicketByChannelId(interaction.channel.id);
    if (!ticket) {
      await interaction.reply({
        content: "Erreur: Ce salon n'est pas un ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier les permissions
    const member = interaction.member as GuildMember;
    const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                          ticket.userId === interaction.user.id;
    
    if (!hasPermission) {
      await interaction.reply({
        content: "Erreur: Vous n'avez pas la permission de fermer ce ticket.",
        ephemeral: true
      });
      return;
    }

    // Mettre à jour le statut du ticket
    const updatedTicket = await storage.closeTicket(ticket.id, interaction.user.tag);
    if (!updatedTicket) {
      await interaction.reply({
        content: "Erreur: Impossible de mettre à jour ce ticket.",
        ephemeral: true
      });
      return;
    }

    // Envoyer le message de fermeture
    await interaction.reply({
      content: BOT_MESSAGES.ticketClosed(interaction.user.tag),
      components: []
    });

    // Désactiver les permissions d'écriture pour l'utilisateur
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: false
    });

    // Envoyer un log
    await sendTicketLog(interaction.guild, updatedTicket, isArchive ? 'archived' : 'closed');

    // Si c'est une archive, créer un thread et supprimer le salon après délai
    if (isArchive) {
      await interaction.followUp({
        content: BOT_MESSAGES.ticketArchived
      });
      
      // Créer un thread pour archiver la conversation
      try {
        const thread = await channel.threads.create({
          name: `Archive-${ticket.ticketId}`,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
        });
        
        await thread.send({
          content: `Ce ticket a été archivé par ${interaction.user.tag}. Il sera automatiquement supprimé.`
        });
      } catch (error) {
        console.error("Erreur lors de la création du thread d'archive:", error);
      }
    }

    // Supprimer le salon après un délai
    setTimeout(async () => {
      try {
        if (channel.deletable) {
          await channel.delete(`Ticket fermé par ${interaction.user.tag}`);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du salon de ticket:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

  } catch (error) {
    console.error("Erreur lors de la fermeture du ticket:", error);
    await interaction.reply({
      content: "Une erreur est survenue lors de la fermeture du ticket.",
      ephemeral: true
    });
  }
}

// Ajouter un utilisateur à un ticket
export async function addUserToTicket(interaction: any, userToAdd: User) {
  try {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: "Erreur: Cette commande ne peut être utilisée que dans un salon de ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier si le salon est un ticket
    const ticket = await storage.getTicketByChannelId(interaction.channel.id);
    if (!ticket) {
      await interaction.reply({
        content: "Erreur: Ce salon n'est pas un ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier les permissions
    const member = interaction.member as GuildMember;
    const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                          ticket.userId === interaction.user.id;
    
    if (!hasPermission) {
      await interaction.reply({
        content: "Erreur: Vous n'avez pas la permission d'ajouter des utilisateurs à ce ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier si l'utilisateur est déjà dans le ticket
    const channel = interaction.channel as TextChannel;
    const permissionOverwrites = channel.permissionOverwrites.cache;
    
    if (permissionOverwrites.has(userToAdd.id)) {
      await interaction.reply({
        content: `${userToAdd.tag} a déjà accès à ce ticket.`,
        ephemeral: true
      });
      return;
    }

    // Ajouter l'utilisateur au ticket
    await channel.permissionOverwrites.edit(userToAdd.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });

    await interaction.reply({
      content: `${userToAdd.tag} a été ajouté au ticket.`
    });

  } catch (error) {
    console.error("Erreur lors de l'ajout d'un utilisateur au ticket:", error);
    await interaction.reply({
      content: "Une erreur est survenue lors de l'ajout de l'utilisateur au ticket.",
      ephemeral: true
    });
  }
}

// Retirer un utilisateur d'un ticket
export async function removeUserFromTicket(interaction: any, userToRemove: User) {
  try {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: "Erreur: Cette commande ne peut être utilisée que dans un salon de ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier si le salon est un ticket
    const ticket = await storage.getTicketByChannelId(interaction.channel.id);
    if (!ticket) {
      await interaction.reply({
        content: "Erreur: Ce salon n'est pas un ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier les permissions
    const member = interaction.member as GuildMember;
    const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                          ticket.userId === interaction.user.id;
    
    if (!hasPermission) {
      await interaction.reply({
        content: "Erreur: Vous n'avez pas la permission de retirer des utilisateurs de ce ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier si l'utilisateur est le créateur du ticket
    if (ticket.userId === userToRemove.id) {
      await interaction.reply({
        content: "Vous ne pouvez pas retirer le créateur du ticket.",
        ephemeral: true
      });
      return;
    }

    // Vérifier si l'utilisateur est dans le ticket
    const channel = interaction.channel as TextChannel;
    const permissionOverwrites = channel.permissionOverwrites.cache;
    
    if (!permissionOverwrites.has(userToRemove.id)) {
      await interaction.reply({
        content: `${userToRemove.tag} n'a pas accès à ce ticket.`,
        ephemeral: true
      });
      return;
    }

    // Retirer l'utilisateur du ticket
    await channel.permissionOverwrites.delete(userToRemove.id);

    await interaction.reply({
      content: `${userToRemove.tag} a été retiré du ticket.`
    });

  } catch (error) {
    console.error("Erreur lors du retrait d'un utilisateur du ticket:", error);
    await interaction.reply({
      content: "Une erreur est survenue lors du retrait de l'utilisateur du ticket.",
      ephemeral: true
    });
  }
}

// Fonctions utilitaires

// Envoyer un log de ticket
async function sendTicketLog(guild: Guild, ticket: any, action: 'created' | 'closed' | 'archived') {
  try {
    const guildData = await storage.getGuild(guild.id);
    if (!guildData || !guildData.logsChannelId) return;
    
    const logsChannel = await guild.channels.fetch(guildData.logsChannelId) as TextChannel;
    if (!logsChannel) return;
    
    const logEmbed = createTicketLogEmbed(ticket, action);
    await logsChannel.send({ embeds: [logEmbed] });
  } catch (error) {
    console.error("Erreur lors de l'envoi du log de ticket:", error);
  }
}

// Convertir les permissions textuelles en bits
function getPermissionBits(permissions: string[]): string[] {
  return permissions.map(perm => {
    // @ts-ignore - PermissionFlagsBits est bien un objet avec des propriétés de type bigint
    return PermissionFlagsBits[perm].toString();
  });
}
