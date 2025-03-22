import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TicketIcon, Users, Clock, Archive } from "lucide-react";
import { TicketStats as TicketStatsType } from "@shared/schema";

export default function TicketStats({ guildId }: { guildId: string }) {
  const { data: stats, isLoading, error } = useQuery<TicketStatsType>({
    queryKey: ["/api/tickets/stats", guildId],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/stats?guildId=${guildId}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques");
      }
      return response.json();
    },
    enabled: !!guildId
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-discord-dark">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Chargement...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-discord-dark text-white mb-8">
        <CardContent className="pt-6">
          <p className="text-red-400">Erreur lors du chargement des statistiques</p>
        </CardContent>
      </Card>
    );
  }

  // Récupérer les statistiques par type
  const typeCounts = stats.byType || {};
  
  // Récupérer la liste des types de ticket les plus utilisés
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => {
      const readableType = type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return { type: readableType, count };
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-discord-dark border-discord-blurple">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <TicketIcon className="h-4 w-4 mr-2 text-discord-blurple" />
            Total des tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-discord-dark border-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Users className="h-4 w-4 mr-2 text-green-500" />
            Tickets actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.open}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-discord-dark border-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Archive className="h-4 w-4 mr-2 text-red-500" />
            Tickets fermés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.closed}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-discord-dark border-yellow-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-yellow-500" />
            Types populaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-white">
            {topTypes.length > 0 ? (
              <ul className="space-y-1">
                {topTypes.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.type}</span>
                    <span className="font-semibold">{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun ticket</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
