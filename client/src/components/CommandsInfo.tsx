import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsIcon, AlertCircleIcon, UserPlusIcon, UserMinusIcon } from "lucide-react";

export default function CommandsInfo() {
  const commands = [
    {
      name: "/setup",
      description: "Configure le système de tickets dans un salon spécifique",
      icon: <SettingsIcon className="h-5 w-5 text-discord-blurple" />,
      options: [
        { name: "salon", description: "Le salon où afficher le panel de tickets", required: true },
        { name: "logs", description: "Le salon où envoyer les logs des tickets", required: false },
        { name: "categorie", description: "La catégorie où créer les tickets", required: false }
      ],
      example: "/setup #tickets #logs-tickets Tickets",
      permissions: "Administrateur"
    },
    {
      name: "/close",
      description: "Ferme le ticket actuel",
      icon: <AlertCircleIcon className="h-5 w-5 text-red-500" />,
      options: [],
      example: "/close",
      permissions: "Membre du Staff ou créateur du ticket"
    },
    {
      name: "/add",
      description: "Ajoute un utilisateur au ticket actuel",
      icon: <UserPlusIcon className="h-5 w-5 text-green-500" />,
      options: [
        { name: "utilisateur", description: "L'utilisateur à ajouter au ticket", required: true }
      ],
      example: "/add @utilisateur",
      permissions: "Membre du Staff ou créateur du ticket"
    },
    {
      name: "/remove",
      description: "Retire un utilisateur du ticket actuel",
      icon: <UserMinusIcon className="h-5 w-5 text-yellow-500" />,
      options: [
        { name: "utilisateur", description: "L'utilisateur à retirer du ticket", required: true }
      ],
      example: "/remove @utilisateur",
      permissions: "Membre du Staff ou créateur du ticket"
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Commandes du Bot</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {commands.map((command) => (
          <Card key={command.name} className="bg-discord-dark border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                {command.icon}
                <CardTitle className="text-white">{command.name}</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                {command.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {command.options.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Options:</h4>
                  <ul className="text-sm space-y-1 text-gray-400">
                    {command.options.map((option) => (
                      <li key={option.name} className="flex justify-between">
                        <span className="text-discord-blurple font-mono">{option.name}</span>
                        <span>{option.description} {option.required && <span className="text-red-400">(Requis)</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300">Exemple:</h4>
                  <p className="text-sm text-gray-400 font-mono">{command.example}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-300">Permissions requises:</h4>
                  <p className="text-sm text-gray-400">{command.permissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-discord-dark border-discord-blurple">
        <CardHeader>
          <CardTitle className="text-white">Boutons de Ticket</CardTitle>
          <CardDescription className="text-gray-400">
            En plus des commandes slash, le bot dispose de boutons interactifs
          </CardDescription>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-2">
          <p className="flex items-center">
            <span className="inline-block w-28 font-semibold">🔒 Fermer</span>
            <span>Ferme le ticket actuel</span>
          </p>
          <p className="flex items-center">
            <span className="inline-block w-28 font-semibold">📤 Archiver</span>
            <span>Archive le ticket avant sa suppression</span>
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Ces boutons sont disponibles dans chaque ticket créé et peuvent être utilisés par le staff ou le créateur du ticket.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
