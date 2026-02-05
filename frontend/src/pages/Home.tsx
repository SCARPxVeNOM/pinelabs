import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import Layout from '@/components/Layout';
import Aurora from "@/components/Aurora";

export default function HomePage() {
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const [timeRange] = useState({
        start: Date.now() - 24 * 60 * 60 * 1000,
        end: Date.now()
    });
    const [eventType] = useState('all');

    return (
        <Layout>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            <Dashboard
                selectedApp={selectedApp}
                onSelectApp={setSelectedApp}
                timeRange={timeRange}
                eventType={eventType}
            />
        </Layout>
    )
}
