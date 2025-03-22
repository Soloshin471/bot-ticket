import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function BotPing() {
  const [botStatus, setBotStatus] = useState<{
    online: boolean;
    username: string | null;
    guilds: number;
    lastPing?: Date;
  } | null>(null);
  
  const [pingInfo, setPingInfo] = useState<{
    success: boolean;
    timestamp: string;
    status: string;
  } | null>(null);
  
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [nextPingTime, setNextPingTime] = useState<Date | null>(null);
  const [pingInterval, setPingInterval] = useState<number>(120); // 2 minutes en secondes
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [automaticPing, setAutomaticPing] = useState<boolean>(true);
  
  const { toast } = useToast();

  // Formater le temps restant
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Effet pour mettre à jour le statut du bot
  useEffect(() => {
    const fetchBotStatus = async () => {
      try {
        const response = await fetch('/api/bot/status');
        const data = await response.json();
        
        if (data.lastPing) {
          data.lastPing = new Date(data.lastPing);
        }
        
        setBotStatus(data);
      } catch (error) {
        console.error("Erreur lors de la récupération du statut du bot:", error);
      }
    };

    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 10000); // Actualiser toutes les 10 secondes
    
    return () => clearInterval(interval);
  }, []);

  // Fonction pour pinguer le bot
  const pingBot = async () => {
    try {
      const response = await fetch('/api/bot/ping');
      const data = await response.json();
      
      setPingInfo(data);
      const currentTime = new Date();
      setLastPingTime(currentTime);
      
      const nextPing = new Date(currentTime.getTime() + pingInterval * 1000);
      setNextPingTime(nextPing);
      setTimeRemaining(pingInterval);
      
      toast({
        title: "Bot pingé avec succès",
        description: `Statut: ${data.status}`,
      });
    } catch (error) {
      console.error("Erreur lors du ping du bot:", error);
      toast({
        title: "Erreur lors du ping",
        description: "Impossible de pinguer le bot Discord",
        variant: "destructive",
      });
    }
  };

  // Effet pour le ping automatique
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdown: NodeJS.Timeout;
    
    if (automaticPing) {
      // Premier ping immédiat
      pingBot();
      
      // Configurer le compte à rebours
      countdown = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Configurer le ping périodique
      timer = setInterval(pingBot, pingInterval * 1000);
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(countdown);
    };
  }, [automaticPing, pingInterval]);

  const toggleAutomaticPing = () => {
    setAutomaticPing(prev => !prev);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
        Système de ping pour le bot Discord
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Carte d'état du bot */}
        <Card>
          <CardHeader>
            <CardTitle>État du bot</CardTitle>
            <CardDescription>
              Informations sur l'état actuel du bot Discord
            </CardDescription>
          </CardHeader>
          <CardContent>
            {botStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Statut:</span>
                  <Badge variant={botStatus.online ? "success" : "destructive"}>
                    {botStatus.online ? "En ligne" : "Hors ligne"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nom d'utilisateur:</span>
                  <span>{botStatus.username || "Non connecté"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Serveurs:</span>
                  <span>{botStatus.guilds || 0}</span>
                </div>
                {botStatus.lastPing && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dernier ping API:</span>
                    <span>{formatDate(botStatus.lastPing)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <p>Chargement des données...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carte de ping */}
        <Card>
          <CardHeader>
            <CardTitle>Ping automatique</CardTitle>
            <CardDescription>
              Ping le bot toutes les 2 minutes pour maintenir la connexion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">État du ping:</span>
                <Badge variant={automaticPing ? "outline" : "secondary"}>
                  {automaticPing ? "Activé" : "Désactivé"}
                </Badge>
              </div>
              
              {lastPingTime && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dernier ping:</span>
                  <span>{formatDate(lastPingTime)}</span>
                </div>
              )}
              
              {nextPingTime && automaticPing && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Prochain ping:</span>
                  <span>{formatDate(nextPingTime)}</span>
                </div>
              )}
              
              {automaticPing && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Temps restant:</span>
                  <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant={automaticPing ? "destructive" : "default"}
              onClick={toggleAutomaticPing}
            >
              {automaticPing ? "Désactiver" : "Activer"} le ping automatique
            </Button>
            <Button 
              variant="outline" 
              onClick={pingBot}
              disabled={timeRemaining < pingInterval && timeRemaining > 0 && automaticPing}
            >
              Ping manuel
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Info sur le dernier ping effectué */}
      {pingInfo && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Dernier ping</CardTitle>
            <CardDescription>
              Détails du dernier ping effectué
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Succès:</span>
                <Badge variant={pingInfo.success ? "success" : "destructive"}>
                  {pingInfo.success ? "Oui" : "Non"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Statut:</span>
                <Badge 
                  variant={pingInfo.status === "connected" ? "success" : "destructive"}
                >
                  {pingInfo.status === "connected" ? "Connecté" : "Déconnecté"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Horodatage:</span>
                <span>{pingInfo.timestamp}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Ce système permet de maintenir le bot Discord actif en le pingant régulièrement.</p>
        <p>Laissez cette page ouverte pour que le ping automatique fonctionne.</p>
      </div>
    </div>
  );
}