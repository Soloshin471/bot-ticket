import { Link, useLocation } from "wouter";
import { MessageSquare, TicketIcon, ServerIcon, SettingsIcon, InfoIcon, Activity } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 h-screen bg-discord-darker flex flex-col border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 text-discord-blurple mr-2" />
          <h1 className="text-white font-bold text-lg">JB Ticket Bot</h1>
        </div>
        <p className="text-gray-400 text-xs mt-1">Système de tickets Discord</p>
      </div>
      
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/" className={`flex items-center px-4 py-2 rounded ${location === '/' ? 'bg-discord-blurple text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
              <TicketIcon className="h-5 w-5 mr-3" />
              Tickets Dashboard
            </Link>
          </li>
          <li>
            <Link href="/config" className={`flex items-center px-4 py-2 rounded ${location === '/config' ? 'bg-discord-blurple text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
              <SettingsIcon className="h-5 w-5 mr-3" />
              Configuration
            </Link>
          </li>
          <li>
            <Link href="/commands" className={`flex items-center px-4 py-2 rounded ${location === '/commands' ? 'bg-discord-blurple text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
              <ServerIcon className="h-5 w-5 mr-3" />
              Commandes
            </Link>
          </li>
          <li>
            <Link href="/bot/ping" className={`flex items-center px-4 py-2 rounded ${location === '/bot/ping' ? 'bg-discord-blurple text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
              <Activity className="h-5 w-5 mr-3" />
              Bot Ping
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center text-sm text-gray-400">
          <InfoIcon className="h-4 w-4 mr-2" />
          <span>v1.0.0</span>
        </div>
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer" 
          className="text-xs text-discord-blurple hover:underline mt-1 block"
        >
          Documentation
        </a>
      </div>
    </aside>
  );
}
