import { 
  REST, 
  Routes, 
  ApplicationCommandDataResolvable,
  Client,
  CommandInteraction,
  TextChannel,
  CategoryChannel,
  ChannelType,
  PermissionFlagsBits,
  GuildMember
} from "discord.js";
import { storage } from "../storage";
import { COMMANDS } from "./config";
import { closeTicket, addUserToTicket, removeUserFromTicket } from "./tickets";
import { createTicketEmbed, createTicketButtons } from "./embeds";

// Fonction pour enregistrer les commandes slash du bot
export async function registerCommands(client: Client) {
  try {
    if (!client.user) {
      console.error("Le client n'est pas prêt pour enregistrer les commandes.");
      return;
    }

    const commands: ApplicationCommandDataResolvable[] = [
      {
        name: COMMANDS.setup.name,
        description: COMMANDS.setup.description,
        options: COMMANDS.setup.options,
        defaultMemberPermissions: PermissionFlagsBits.Administrator.toString()
      },
      {
        name: COMMANDS.close.name,
        description: COMMANDS.close.description
      },
      {
        name: COMMANDS.add.name,
        description: COMMANDS.add.description,
        options: COMMANDS.add.options
      },
      {
        name: COMMANDS.remove.name,
        description: COMMANDS.remove.description,
        options: COMMANDS.remove.options
      }
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || "");

    console.log(`Enregistrement de ${commands.length} commandes slash...`);

    // Déploiement des commandes slash de manière globale pour tous les serveurs
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("Commandes slash enregistrées avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des commandes slash:", error);
  }
}

// Gestionnaire de commandes
export async function handleCommandInteraction(interaction: CommandInteraction) {
  try {
    const { commandName } = interaction;

    if (commandName === COMMANDS.setup.name) {
      await handleSetupCommand(interaction);
    } else if (commandName === COMMANDS.close.name) {
      await handleCloseCommand(interaction);
    } else if (commandName === COMMANDS.add.name) {
      await handleAddCommand(interaction);
    } else if (commandName === COMMANDS.remove.name) {
      await handleRemoveCommand(interaction);
    }
  } catch (error) {
    console.error(`Erreur lors du traitement de la commande ${interaction.commandName}:`, error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: "Une erreur est survenue lors de l'exécution de cette commande.",
        ephemeral: true 
      });
    } else {
      await interaction.reply({ 
        content: "Une erreur est survenue lors de l'exécution de cette commande.",
        ephemeral: true 
      });
    }
  }
}

// Gestionnaire pour la commande setup
async function handleSetupCommand(interaction: CommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Cette commande ne peut être utilisée que dans un serveur Discord.",
      ephemeral: true
    });
    return;
  }

  // Vérifier les permissions
  const member = interaction.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "Vous devez être administrateur pour utiliser cette commande.",
      ephemeral: true
    });
    return;
  }

  // Récupérer les options
  const channel = interaction.options.getChannel("salon");
  const logsChannel = interaction.options.getChannel("logs");
  const categoryChannel = interaction.options.getChannel("categorie");

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Veuillez spécifier un salon textuel valide pour afficher le panel de tickets.",
      ephemeral: true
    });
    return;
  }

  // Vérifier le salon des logs
  if (logsChannel && logsChannel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Le salon des logs doit être un salon textuel.",
      ephemeral: true
    });
    return;
  }

  // Vérifier la catégorie
  if (categoryChannel && categoryChannel.type !== ChannelType.GuildCategory) {
    await interaction.reply({
      content: "La catégorie spécifiée n'est pas valide. Veuillez sélectionner une catégorie.",
      ephemeral: true
    });
    return;
  }

  // Créer ou mettre à jour la configuration du serveur
  const ticketChannel = channel as TextChannel;
  const categoryId = categoryChannel ? categoryChannel.id : null;
  const logsChannelId = logsChannel ? logsChannel.id : null;

  try {
    // Vérifier si le serveur existe déjà
    const existingGuild = await storage.getGuild(interaction.guild.id);
    
    if (existingGuild) {
      // Mettre à jour la configuration
      await storage.updateGuild(interaction.guild.id, {
        ticketChannelId: ticketChannel.id,
        logsChannelId: logsChannelId || existingGuild.logsChannelId,
        categoryId: categoryId || existingGuild.categoryId,
        enabled: true
      });
    } else {
      // Créer une nouvelle configuration
      await storage.createGuild({
        id: interaction.guild.id,
        name: interaction.guild.name,
        ticketChannelId: ticketChannel.id,
        logsChannelId: logsChannelId || undefined,
        categoryId: categoryId || undefined,
        enabled: true
      });
    }

    // Créer la catégorie si elle n'existe pas encore
    if (!categoryId) {
      const newCategory = await interaction.guild.channels.create({
        name: "Tickets",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel.toString()]
          },
          {
            id: interaction.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel.toString(),
              PermissionFlagsBits.SendMessages.toString(),
              PermissionFlagsBits.ManageChannels.toString()
            ]
          }
        ]
      });
      
      // Mettre à jour la configuration avec la nouvelle catégorie
      await storage.updateGuild(interaction.guild.id, {
        categoryId: newCategory.id
      });
    }

    // Envoyer l'embed de tickets dans le salon spécifié
    const embed = createTicketEmbed();
    const components = createTicketButtons();
    
    await ticketChannel.send({
      embeds: [embed],
      components: components
    });

    await interaction.reply({
      content: `Le système de tickets a été configuré avec succès dans le salon <#${ticketChannel.id}>.`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Erreur lors de la configuration du système de tickets:", error);
    await interaction.reply({
      content: "Une erreur est survenue lors de la configuration du système de tickets.",
      ephemeral: true
    });
  }
}

// Gestionnaire pour la commande close
async function handleCloseCommand(interaction: CommandInteraction) {
  // On utilise la même fonction que pour le bouton de fermeture
  await closeTicket(interaction as any, false);
}

// Gestionnaire pour la commande add
async function handleAddCommand(interaction: CommandInteraction) {
  const user = interaction.options.getUser("utilisateur");
  
  if (!user) {
    await interaction.reply({
      content: "Veuillez spécifier un utilisateur valide.",
      ephemeral: true
    });
    return;
  }
  
  await addUserToTicket(interaction, user);
}

// Gestionnaire pour la commande remove
async function handleRemoveCommand(interaction: CommandInteraction) {
  const user = interaction.options.getUser("utilisateur");
  
  if (!user) {
    await interaction.reply({
      content: "Veuillez spécifier un utilisateur valide.",
      ephemeral: true
    });
    return;
  }
  
  await removeUserFromTicket(interaction, user);
}
