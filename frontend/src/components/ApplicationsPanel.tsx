import { useState } from 'react';
import { useApplications } from '../hooks/useApplications';

interface ApplicationsPanelProps {
  onSelect: (appId: string | null) => void;
  selectedApp: string | null;
}

export default function ApplicationsPanel({ onSelect, selectedApp }: ApplicationsPanelProps) {
  const { applications, loading, error, addApp, removeApp, refetch } = useApplications();
  const [form, setForm] = useState({
    applicationId: '',
    chainId: '',
    graphqlEndpoint: '',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!form.applicationId || !form.chainId || !form.graphqlEndpoint) {
      setMessage('All fields are required');
      return;
    }
    setBusy(true);
    try {
      await addApp({
        variables: {
          applicationId: form.applicationId,
          chainId: form.chainId,
          graphqlEndpoint: form.graphqlEndpoint,
        },
      });
      setMessage('Application added');
      setForm({ applicationId: '', chainId: '', graphqlEndpoint: '' });
      onSelect(form.applicationId);
    } catch (err: any) {
      setMessage(err.message || 'Failed to add application');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (appId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await removeApp({ variables: { applicationId: appId } });
      if (selectedApp === appId) onSelect(null);
      setMessage('Application removed');
    } catch (err: any) {
      setMessage(err.message || 'Failed to remove application');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Monitored Applications</h3>
        <button
          onClick={() => refetch()}
          className="text-blue-600 underline text-sm"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-600 text-sm">Loading applications...</p>}
      {error && <p className="text-red-600 text-sm">Error: {error.message}</p>}
      {message && <p className="text-sm text-gray-700">{message}</p>}

      <div className="space-y-2">
        {applications.length === 0 && <p className="text-gray-500">No applications yet.</p>}
        {applications.map((app: any) => (
          <div
            key={app.applicationId}
            className={`flex justify-between items-center border rounded p-2 ${
              selectedApp === app.applicationId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div>
              <p className="font-semibold">{app.applicationId}</p>
              <p className="text-xs text-gray-600">Chain: {app.chainId}</p>
              <p className="text-xs text-gray-600 break-all">Endpoint: {app.graphqlEndpoint}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSelect(app.applicationId)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
              >
                Select
              </button>
              <button
                onClick={() => handleRemove(app.applicationId)}
                className="px-3 py-1 text-sm border rounded"
                disabled={busy}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Application ID"
          value={form.applicationId}
          onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Chain ID"
          value={form.chainId}
          onChange={(e) => setForm({ ...form, chainId: e.target.value })}
        />
        <div className="md:col-span-1 flex gap-2">
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="GraphQL Endpoint"
            value={form.graphqlEndpoint}
            onChange={(e) => setForm({ ...form, graphqlEndpoint: e.target.value })}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={busy}
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}


