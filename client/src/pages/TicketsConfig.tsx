import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import CommandsInfo from "@/components/CommandsInfo";
import { TicketIcon, AlertTriangleIcon, Save, SettingsIcon, ServerIcon } from "lucide-react";
import { Guild } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

export default function TicketsConfig() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("config");
  
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

  // Récupérer l'état du bot
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

  // Sélection du serveur
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);

  // Mettre à jour le serveur sélectionné par défaut
  if (!selectedGuildId && guilds && guilds.length > 0) {
    setSelectedGuildId(guilds[0].id);
  }

  // Configuration du serveur sélectionné
  const selectedGuild = guilds?.find(guild => guild.id === selectedGuildId);

  // Mutation pour mettre à jour la configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<Guild>) => {
      const response = await fetch(`/api/guilds/${selectedGuildId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la configuration");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres ont été enregistrés avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/guilds"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la mise à jour : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fonction pour mettre à jour la configuration
  const handleSaveConfig = () => {
    if (!selectedGuild) return;
    
    updateConfigMutation.mutate({
      ticketChannelId: selectedGuild.ticketChannelId,
      logsChannelId: selectedGuild.logsChannelId,
      categoryId: selectedGuild.categoryId,
      enabled: selectedGuild.enabled,
    });
  };

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

  // Message d'avertissement si le bot n'est pas en ligne
  const botOffline = botStatus && !botStatus.online;

  return (
    <div className="flex h-screen bg-discord-darker">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Configuration</h1>
            
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-discord-dark border-b border-gray-700 w-full justify-start rounded-none mb-6">
              <TabsTrigger 
                value="config" 
                className="text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-discord-blurple rounded-none"
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="commands" 
                className="text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-discord-blurple rounded-none"
              >
                <ServerIcon className="h-4 w-4 mr-2" />
                Commandes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="config">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-discord-dark border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <SettingsIcon className="h-5 w-5 mr-2 text-discord-blurple" />
                        Configuration du Bot
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Configurez les paramètres du bot de tickets pour votre serveur
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="guildSelect" className="text-white mb-2 block">
                          Serveur Discord
                        </Label>
                        <Select 
                          value={selectedGuildId || ''} 
                          onValueChange={(value) => setSelectedGuildId(value)}
                        >
                          <SelectTrigger className="bg-discord-darker border-gray-700 text-white">
                            <SelectValue placeholder="Sélectionner un serveur" />
                          </SelectTrigger>
                          <SelectContent className="bg-discord-darker border-gray-700">
                            {guilds.map(guild => (
                              <SelectItem key={guild.id} value={guild.id} className="text-white hover:bg-discord-dark">
                                {guild.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedGuild && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="ticketChannelId" className="text-white mb-2 block">
                                ID du Salon de Tickets
                              </Label>
                              <Input
                                id="ticketChannelId"
                                placeholder="ID du salon pour l'embed de tickets"
                                className="bg-discord-darker border-gray-700 text-white"
                                value={selectedGuild.ticketChannelId || ''}
                                onChange={(e) => {
                                  const newGuilds = guilds.map(g => 
                                    g.id === selectedGuildId 
                                      ? { ...g, ticketChannelId: e.target.value } 
                                      : g
                                  );
                                  queryClient.setQueryData(["/api/guilds"], newGuilds);
                                }}
                              />
                              <p className="text-gray-400 text-xs mt-1">
                                Salon où l'embed de création de tickets sera affiché
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="logsChannelId" className="text-white mb-2 block">
                                ID du Salon de Logs
                              </Label>
                              <Input
                                id="logsChannelId"
                                placeholder="ID du salon pour les logs"
                                className="bg-discord-darker border-gray-700 text-white"
                                value={selectedGuild.logsChannelId || ''}
                                onChange={(e) => {
                                  const newGuilds = guilds.map(g => 
                                    g.id === selectedGuildId 
                                      ? { ...g, logsChannelId: e.target.value } 
                                      : g
                                  );
                                  queryClient.setQueryData(["/api/guilds"], newGuilds);
                                }}
                              />
                              <p className="text-gray-400 text-xs mt-1">
                                Salon où les logs des tickets seront envoyés
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="categoryId" className="text-white mb-2 block">
                              ID de la Catégorie
                            </Label>
                            <Input
                              id="categoryId"
                              placeholder="ID de la catégorie pour les tickets"
                              className="bg-discord-darker border-gray-700 text-white"
                              value={selectedGuild.categoryId || ''}
                              onChange={(e) => {
                                const newGuilds = guilds.map(g => 
                                  g.id === selectedGuildId 
                                    ? { ...g, categoryId: e.target.value } 
                                    : g
                                );
                                queryClient.setQueryData(["/api/guilds"], newGuilds);
                              }}
                            />
                            <p className="text-gray-400 text-xs mt-1">
                              Catégorie où les salons de tickets seront créés
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                            <div>
                              <h3 className="text-white font-medium">Activer le système de tickets</h3>
                              <p className="text-gray-400 text-sm">
                                Activer ou désactiver le bot pour ce serveur
                              </p>
                            </div>
                            <Switch
                              checked={selectedGuild.enabled}
                              onCheckedChange={(checked) => {
                                const newGuilds = guilds.map(g => 
                                  g.id === selectedGuildId 
                                    ? { ...g, enabled: checked } 
                                    : g
                                );
                                queryClient.setQueryData(["/api/guilds"], newGuilds);
                              }}
                              className="data-[state=checked]:bg-discord-blurple"
                            />
                          </div>
                          
                          <div className="pt-4 flex justify-end">
                            <Button 
                              onClick={handleSaveConfig}
                              disabled={updateConfigMutation.isPending}
                              className="bg-discord-blurple hover:bg-indigo-600"
                            >
                              {updateConfigMutation.isPending ? (
                                "Enregistrement..."
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Enregistrer les modifications
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card className="bg-discord-dark border-gray-700 mb-6">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <TicketIcon className="h-5 w-5 mr-2 text-discord-blurple" />
                        Utilisation du Bot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300 text-sm">
                        Pour configurer le bot, utilisez la commande <code className="bg-discord-darker px-1 rounded">/setup</code> dans votre serveur Discord.
                      </p>
                      
                      <div className="bg-discord-darker rounded p-3 text-sm space-y-2">
                        <p className="text-white font-semibold">/setup #tickets #logs-tickets</p>
                        <p className="text-gray-400">Cette commande va configurer le système de tickets avec:</p>
                        <ul className="text-gray-400 list-disc pl-5 space-y-1">
                          <li>Un embed de tickets dans #tickets</li>
                          <li>Les logs envoyés dans #logs-tickets</li>
                          <li>Création automatique d'une catégorie pour les tickets</li>
                        </ul>
                      </div>
                      
                      <p className="text-gray-300 text-sm">
                        Vous pouvez également configurer manuellement les IDs ici et enregistrer les modifications.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-discord-dark border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <AlertTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                        Informations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-gray-300 text-sm">
                        Les IDs de salons et catégories peuvent être obtenus en activant le mode développeur dans Discord puis en faisant un clic droit sur le salon et en sélectionnant "Copier l'ID".
                      </p>
                      
                      <p className="text-gray-300 text-sm">
                        La commande <code className="bg-discord-darker px-1 rounded">/setup</code> est la méthode recommandée pour configurer le bot, car elle vérifie automatiquement les permissions.
                      </p>
                      
                      <a 
                        href="https://discord.com/developers/docs/tutorials/hosting-on-cloudflare-workers"
                        target="_blank" 
                        rel="noreferrer"
                        className="text-discord-blurple hover:underline text-sm block mt-4"
                      >
                        Comment activer le mode développeur dans Discord →
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="commands">
              <CommandsInfo />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
