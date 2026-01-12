import { format } from 'date-fns';

interface EventStreamProps {
  applicationId: string;
}

interface Event {
  id: number;
  sourceApp: string;
  sourceChain: string;
  timestamp: number;
  eventType: string;
  data: any;
  transactionHash: string;
}

export default function EventStream({ applicationId: _applicationId }: EventStreamProps) {
  // For now, display a placeholder since subscriptions require WebSocket setup
  // In production, this would use useSubscription from Apollo Client
  
  const events: Event[] = []; // Placeholder - would come from subscription
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Live Event Stream</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No events to display. Events will appear here when captured.
          </div>
        ) : (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="flex justify-between">
        <span className="font-semibold">{event.eventType}</span>
        <span className="text-gray-500 text-sm">
          {format(new Date(event.timestamp), 'HH:mm:ss')}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {JSON.stringify(event.data)}
      </p>
    </div>
  );
}

