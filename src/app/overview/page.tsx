
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Session {
  name: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export default function OverviewPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllSessionsData() {
      try {
        const res = await fetch('/api/sessions');
        const sessionNames = await res.json();

        const sessionDataPromises = sessionNames.map(async (name: string) => {
          const sessionRes = await fetch(`/api/sessions/${name}`);
          const sessionDetails = await sessionRes.json();
          const messages = sessionDetails.messages || [];
          const messagesWithTokens = messages.filter((m: any) => m.tokens);

          const totalTokens = messagesWithTokens.reduce((acc: number, m: any) => acc + m.tokens.total, 0);
          const inputTokens = messagesWithTokens.reduce((acc: number, m: any) => acc + m.tokens.input, 0);
          const outputTokens = messagesWithTokens.reduce((acc: number, m: any) => acc + m.tokens.output, 0);

          // Assuming default prices for now, can be made configurable later
          const inputCost = (inputTokens / 1000000) * 0.625;
          const outputCost = (outputTokens / 1000000) * 5.00;
          const totalCost = inputCost + outputCost;

          return {
            name,
            totalTokens,
            inputTokens,
            outputTokens,
            cost: totalCost,
          };
        });

        const allSessionsData = await Promise.all(sessionDataPromises);
        setSessions(allSessionsData);
      } catch (err) {
        setError('Failed to fetch session data.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllSessionsData();
  }, []);

  const chartData = selectedSessions.length > 0
    ? sessions.filter(s => selectedSessions.includes(s.name))
    : sessions;


  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl">Sessions Overview</h1>
        <div>
          <div className="relative inline-block text-left">
            <select
              multiple
              value={selectedSessions}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedSessions(selectedOptions);
              }}
              className="bg-gray-700 p-2 rounded"
            >
              {sessions.map(session => (
                <option key={session.name} value={session.name}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4">
        {loading && <p>Loading session data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg mb-4">Total Tokens per Session</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalTokens" fill="#8884d8" name="Total Tokens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg mb-4">Estimated Cost per Session</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="cost" fill="#82ca9d" name="Cost (USD)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
