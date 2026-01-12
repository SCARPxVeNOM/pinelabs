import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';

function App() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Dashboard 
          selectedApp={selectedApp}
          onSelectApp={setSelectedApp}
        />
      </main>
    </div>
  );
}

export default App;



