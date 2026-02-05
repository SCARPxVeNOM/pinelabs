import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LineraProvider } from '@/context/LineraContext';
import { DynamicApolloProvider } from '@/context/DynamicApolloProvider';
import './index.css';

// Fallback endpoint when not connected to Linera
const FALLBACK_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LineraProvider>
      <DynamicApolloProvider fallbackEndpoint={FALLBACK_ENDPOINT}>
        <App />
      </DynamicApolloProvider>
    </LineraProvider>
  </React.StrictMode>,
);




