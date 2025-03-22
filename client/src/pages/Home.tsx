import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import TicketStats from "@/components/TicketStats";
import { TicketIcon, AlertTriangleIcon } from "lucide-react";
import { Guild, Ticket } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function Home() {
  const { toast } = useToast();

  // Récupérer la liste des serveurs
  const { data: guilds, isLoading: isLoadingGuilds, error: guildsError } = useQuery<Guild[]>({
    queryKey: ["/api/guilds"],
    queryFn: async () => {
      const response = await fetch("/api/guilds");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des serveurs");
      }
      return response.json();
    }
  });

  // État du bot
  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
    queryFn: async () => {
      const response = await fetch("/api/bot/status");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'état du bot");
      }
      return response.json();
    }
  });

  // Récupérer les tickets du premier serveur par défaut
  const selectedGuildId = guilds && guilds.length > 0 ? guilds[0].id : null;

  // Récupérer les tickets du serveur sélectionné
  const { data: tickets, isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", selectedGuildId],
    queryFn: async () => {
      const response = await fetch(`/api/tickets?guildId=${selectedGuildId}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des tickets");
      }
      return response.json();
    },
    enabled: !!selectedGuildId
  });

  if (isLoadingGuilds) {
    return (
      <div className="flex h-screen bg-discord-darker">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="flex items-center justify-center h-full">
            <p className="text-white">Chargement des données...</p>
          </div>
        </main>
      </div>
    );
  }

  if (guildsError || !guilds) {
    return (
      <div className="flex h-screen bg-discord-darker">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="flex flex-col items-center justify-center h-full">
            <AlertTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Erreur de connexion</h2>
            <p className="text-gray-400 mb-4">Impossible de récupérer les données des serveurs.</p>
            <button 
              className="bg-discord-blurple text-white px-4 py-2 rounded"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Filtrer les tickets par statut
  const openTickets = tickets?.filter(ticket => ticket.status === "open") || [];
  const closedTickets = tickets?.filter(ticket => ticket.status === "closed") || [];

  // Message d'avertissement si le bot n'est pas en ligne
  const botOffline = botStatus && !botStatus.online;

  return (
    <div className="flex h-screen bg-discord-darker">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard Tickets</h1>
            
            <div className="flex items-center">
              {botOffline ? (
                <div className="bg-red-900/30 text-red-400 px-3 py-1 rounded flex items-center mr-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                  Bot hors ligne
                </div>
              ) : (
                <div className="bg-green-900/30 text-green-400 px-3 py-1 rounded flex items-center mr-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Bot en ligne
                </div>
              )}
              
              <select 
                className="bg-discord-dark border border-gray-700 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                disabled={guilds.length <= 1}
              >
                {guilds.map(guild => (
                  <option key={guild.id} value={guild.id}>{guild.name}</option>
                ))}
              </select>
            </div>
          </div>

          {botOffline && (
            <Card className="bg-red-900/20 border-red-800 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-400 font-semibold mb-1">Bot Discord déconnecté</h3>
                    <p className="text-gray-300 text-sm">
                      Le bot semble être hors ligne. Vérifiez que le token Discord est correctement configuré.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedGuildId && (
            <TicketStats guildId={selectedGuildId} />
          )}

          <Tabs defaultValue="open" className="w-full">
            <TabsList className="bg-discord-dark border-b border-gray-700 w-full justify-start rounded-none mb-6">
              <TabsTrigger 
                value="open" 
                className="text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-discord-blurple rounded-none"
              >
                Tickets Ouverts ({openTickets.length})
              </TabsTrigger>
              <TabsTrigger 
                value="closed" 
                className="text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-discord-blurple rounded-none"
              >
                Tickets Fermés ({closedTickets.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="open">
              {isLoadingTickets ? (
                <p className="text-gray-400">Chargement des tickets...</p>
              ) : openTickets.length === 0 ? (
                <div className="text-center py-8">
                  <TicketIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aucun ticket ouvert</h3>
                  <p className="text-gray-400">Les tickets créés apparaîtront ici</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {openTickets.map(ticket => (
                    <Card key={ticket.id} className="bg-discord-dark border-gray-700 hover:border-discord-blurple transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-white text-lg flex items-center">
                            <TicketIcon className="h-4 w-4 mr-2 text-discord-blurple" />
                            {ticket.ticketId}
                          </CardTitle>
                          <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">Ouvert</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Créé par:</span>
                            <span className="text-white">{ticket.userName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white capitalize">{ticket.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white">{formatDate(new Date(ticket.createdAt!))}</span>
                          </div>
                          {ticket.reason && (
                            <div className="pt-2 border-t border-gray-700">
                              <span className="text-gray-400 block mb-1">Raison:</span>
                              <p className="text-white text-xs">{ticket.reason}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="closed">
              {isLoadingTickets ? (
                <p className="text-gray-400">Chargement des tickets...</p>
              ) : closedTickets.length === 0 ? (
                <div className="text-center py-8">
                  <TicketIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aucun ticket fermé</h3>
                  <p className="text-gray-400">Les tickets fermés apparaîtront ici</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {closedTickets.map(ticket => (
                    <Card key={ticket.id} className="bg-discord-dark border-gray-700">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-white text-lg flex items-center">
                            <TicketIcon className="h-4 w-4 mr-2 text-gray-500" />
                            {ticket.ticketId}
                          </CardTitle>
                          <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">Fermé</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Créé par:</span>
                            <span className="text-white">{ticket.userName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white capitalize">{ticket.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fermé:</span>
                            <span className="text-white">{ticket.closedAt ? formatDate(new Date(ticket.closedAt)) : 'N/A'}</span>
                          </div>
                          {ticket.closedBy && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Fermé par:</span>
                              <span className="text-white">{ticket.closedBy}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
