// Génère un identifiant de ticket unique au format numérique
export function generateTicketId(): string {
  // Génère un nombre aléatoire à 4 chiffres
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Formate un timestamp pour affichage dans les logs
export function formatTimestamp(timestamp: Date | number): string {
  const date = new Date(timestamp);
  
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Convertit un nom de type de ticket en nom lisible par l'utilisateur
export function formatTicketType(type: string): string {
  const typeMap: Record<string, string> = {
    'aide': 'Aide Générale',
    'recrutement_joueur': 'Recrutement Joueur',
    'recrutement_staff': 'Recrutement Staff',
    'show_match': 'Demande Show Match',
    'c2s': 'Demande C2S'
  };
  
  return typeMap[type] || type;
}

// Récupère l'emoji correspondant à un type de ticket
export function getTicketTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    'aide': '❓',
    'recrutement_joueur': '👥',
    'recrutement_staff': '👮',
    'show_match': '🏆',
    'c2s': '🔄'
  };
  
  return emojiMap[type] || '🎫';
}

// Extraction d'informations de l'ID personnalisé d'un bouton ou menu
export function parseCustomId(customId: string): {action: string, type?: string} {
  const parts = customId.split('_');
  
  if (parts.length < 2) {
    return { action: customId };
  }
  
  return {
    action: `${parts[0]}_${parts[1]}`,
    type: parts[2]
  };
}

// Tronque une chaîne de caractères à une longueur spécifique
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// Calcule le temps écoulé depuis une date donnée
export function getElapsedTime(startDate: Date, endDate: Date = new Date()): string {
  const diff = Math.abs(endDate.getTime() - startDate.getTime());
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

// Génère une couleur aléatoire au format hexadécimal pour Discord
export function getRandomColor(): number {
  return Math.floor(Math.random() * 0xFFFFFF);
}

// Vérifie si un salon est probablement un salon de ticket
export function isTicketChannel(channelName: string): boolean {
  return /^ticket-[a-z]+-\d{4}$/.test(channelName);
}
