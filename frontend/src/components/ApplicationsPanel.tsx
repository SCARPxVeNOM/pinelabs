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
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Monitored Applications</h3>
        <button
          onClick={() => refetch()}
          className="text-xs text-emerald-200 underline"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading applications...</p>}
      {error && <p className="text-sm text-red-400">Error: {error.message}</p>}
      {message && <p className="text-sm text-slate-300">{message}</p>}

      <div className="space-y-2">
        {applications.length === 0 && <p className="text-slate-500">No applications yet.</p>}
        {applications.map((app: any) => (
          <div
            key={app.applicationId}
            className={`flex justify-between items-center rounded-lg border px-3 py-2 ${
              selectedApp === app.applicationId
                ? 'border-emerald-500/60 bg-emerald-500/10'
                : 'border-slate-800 bg-slate-950/60'
            }`}
          >
            <div>
              <p className="font-semibold text-slate-100">{app.applicationId}</p>
              <p className="text-xs text-slate-500">Chain: {app.chainId}</p>
              <p className="text-xs text-slate-500 break-all">Endpoint: {app.graphqlEndpoint}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSelect(app.applicationId)}
                className="px-3 py-1 text-sm rounded border border-emerald-500/60 text-emerald-100 hover:bg-emerald-500/10"
              >
                Select
              </button>
              <button
                onClick={() => handleRemove(app.applicationId)}
                className="px-3 py-1 text-sm rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
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
          className="rounded border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
          placeholder="Application ID"
          value={form.applicationId}
          onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
        />
        <input
          className="rounded border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
          placeholder="Chain ID"
          value={form.chainId}
          onChange={(e) => setForm({ ...form, chainId: e.target.value })}
        />
        <div className="md:col-span-1 flex gap-2">
          <input
            className="rounded border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/60 flex-1"
            placeholder="GraphQL Endpoint"
            value={form.graphqlEndpoint}
            onChange={(e) => setForm({ ...form, graphqlEndpoint: e.target.value })}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-60"
            disabled={busy}
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}