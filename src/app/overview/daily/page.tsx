
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { settings } from '../../../settings';

interface Session {
  name: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  createdAt: string;
}

interface DailyData {
  date: string;
  totalTokens: number;
  cost: number;
  sessionCount: number;
}

export default function DailyOverviewPage() {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllSessionsData() {
      try {
        const res = await fetch('/api/sessions');
        const sessions: { name: string, createdAt: string }[] = await res.json();

        const sessionDataPromises = sessions.map(async (session) => {
          const sessionRes = await fetch(`/api/sessions/${session.name}`);
          const sessionDetails = await sessionRes.json();
          
          let messages: any[] = [];
          if (sessionDetails.files) {
            messages = Object.values(sessionDetails.files).flat();
          } else if (sessionDetails.messages) {
            messages = sessionDetails.messages;
          }

          const messagesWithTokens = messages.filter((m: any) => m.tokens);

          const totalTokens = messagesWithTokens.reduce((acc: number, m: any) => acc + m.tokens.total, 0);
          const inputTokens = messagesWithTokens.reduce((acc: number, m: any) => acc + m.tokens.input, 0);
          const outputTokens = messagesWithTokens.reduce((acc: number, m: any) => acc + m.tokens.output, 0);

          const inputCost = (inputTokens / 1000000) * settings.inputTokenPrice;
          const outputCost = (outputTokens / 1000000) * settings.outputTokenPrice;
          const totalCost = inputCost + outputCost;

          return {
            name: session.name,
            totalTokens,
            inputTokens,
            outputTokens,
            cost: totalCost,
            createdAt: session.createdAt,
          };
        });

        const allSessionsData = await Promise.all(sessionDataPromises);
        
        const groupedByDay = allSessionsData.reduce((acc, session) => {
          const date = new Date(session.createdAt).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = {
              date,
              totalTokens: 0,
              cost: 0,
              sessionCount: 0,
            };
          }
          acc[date].totalTokens += session.totalTokens;
          acc[date].cost += session.cost;
          acc[date].sessionCount += 1;
          return acc;
        }, {} as Record<string, DailyData>);

        const dailyDataArray = Object.values(groupedByDay).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setDailyData(dailyDataArray);

      } catch (err) {
        setError('Failed to fetch session data.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllSessionsData();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl">Daily Sessions Overview</h1>
        <a href="/overview" className="bg-gray-700 p-2 rounded">View Session Overview</a>
      </header>
      <main className="flex-1 p-4">
        {loading && <p>Loading session data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg mb-4">Total Tokens per Day</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalTokens" fill="#8884d8" name="Total Tokens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg mb-4">Estimated Cost per Day</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
