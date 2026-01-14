import { Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Pine Analytics</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Blockchain Analytics Platform
        </p>
      </div>
    </header>
  );
}




