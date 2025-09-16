
'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:3001');

interface Message {
  id: string;
  timestamp: string;
  type: string;
  content: string;
  thoughts: any[];
  tokens: {
    input: number;
    output: number;
    cached: number;
    thoughts: number;
    tool: number;
    total: number;
  };
  model: string;
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'15m' | '30m' | '1h' | '24h' | 'all'>('all');
  const [tokenThreshold, setTokenThreshold] = useState<number>(20000);

  useEffect(() => {
    setLoading(true);
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch sessions.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setLoading(true);
      fetch(`/api/sessions/${selectedSession}?files=true`) // Fetch file list
        .then((res) => res.json())
        .then((data) => {
          setFiles(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch files.');
          setLoading(false);
        });
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      setLoading(true);
      let url = `/api/sessions/${selectedSession}`;
      if (selectedFile) {
        url = `/api/sessions/${selectedSession}/${selectedFile}`;
      }

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setFileContent(data.messages || []);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch file content.');
          setLoading(false);
        });

      if (selectedFile) {
        const filePath = `${selectedSession}/${selectedFile}`;
        console.log('Emitting watchFile with path:', filePath); // Added for debugging
        socket.emit('watchFile', filePath);
      }
    }
  }, [selectedSession, selectedFile]);

  useEffect(() => {
    socket.on('fileUpdate', (content) => {
      console.log('Received fileUpdate:', content); // Added for debugging
      setFileContent(JSON.parse(content).messages || []);
    });

    return () => {
      socket.off('fileUpdate');
    };
  }, []);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSession(e.target.value);
    setSelectedFile('');
    setFileContent([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(e.target.value);
  };

  const allMessages = fileContent;
  const messagesWithTokens = fileContent.filter((message) => message.tokens);

  const totalTokens = messagesWithTokens.reduce((acc, message) => acc + message.tokens.total, 0);
  const inputTokens = messagesWithTokens.reduce((acc, message) => acc + message.tokens.input, 0);
  const outputTokens = messagesWithTokens.reduce((acc, message) => acc + message.tokens.output, 0);

  const INPUT_TOKEN_PRICE = 0.625; // Price per 1 million tokens
  const OUTPUT_TOKEN_PRICE = 5.00; // Price per 1 million tokens

  const inputCost = (inputTokens / 1000000) * INPUT_TOKEN_PRICE;
  const outputCost = (outputTokens / 1000000) * OUTPUT_TOKEN_PRICE;
  const totalCost = inputCost + outputCost;

  const filteredMessages = messagesWithTokens.filter((message) => {
    if (timeframe === 'all') {
      return true;
    }
    const messageDate = new Date(message.timestamp);
    const now = new Date();
    if (timeframe === '15m') {
      return now.getTime() - messageDate.getTime() < 15 * 60 * 1000;
    }
    if (timeframe === '30m') {
      return now.getTime() - messageDate.getTime() < 30 * 60 * 1000;
    }
    if (timeframe === '1h') {
      return now.getTime() - messageDate.getTime() < 60 * 60 * 1000;
    }
    if (timeframe === '24h') {
      return now.getTime() - messageDate.getTime() < 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const formatYAxis = (tickItem: number) => {
    return tickItem.toLocaleString();
  };

  const chartData = filteredMessages.map((message) => ({
    name: new Date(message.timestamp).toLocaleTimeString(),
    total: message.tokens.total,
    input: message.tokens.input,
    output: message.tokens.output,
  }));

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl">Real-Time Token Monitoring</h1>
      </header>
      <main className="flex flex-1 p-4">
        <aside className="w-1/4 bg-gray-800 p-4 rounded-lg mr-4">
          <h2 className="text-xl mb-4">Sessions</h2>
          <div className="mb-4">
            <select
              className="w-full bg-gray-700 p-2 rounded"
              value={selectedSession}
              onChange={handleSessionChange}
            >
              <option value="">Select a session</option>
              {sessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>
          <h2 className="text-xl mb-4">Files</h2>
          <div>
            <select
              className="w-full bg-gray-700 p-2 rounded"
              value={selectedFile}
              onChange={handleFileChange}
              disabled={!selectedSession}
            >
              <option value="">Select a file</option>
              {files.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>
          <h2 className="text-xl mb-4">Settings</h2>
          <div>
            <label htmlFor="tokenThreshold" className="block mb-2">
              Token Threshold
            </label>
            <input
              type="number"
              id="tokenThreshold"
              className="w-full bg-gray-700 p-2 rounded"
              value={tokenThreshold}
              onChange={(e) => setTokenThreshold(Number(e.target.value))}
            />
          </div>
        </aside>
        <section className="flex-1 grid grid-cols-3 grid-rows-3 gap-4">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <>
              <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg">Total Tokens</h3>
                <p className="text-3xl">{totalTokens.toLocaleString()}</p>
              </div>
              <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg">Input Tokens</h3>
                <p className="text-3xl">{inputTokens.toLocaleString()}</p>
              </div>
              <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg">Output Tokens</h3>
                <p className="text-3xl">{outputTokens.toLocaleString()}</p>
              </div>
              <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg">Total Estimated Cost</h3>
                <p className="text-3xl">${totalCost.toFixed(2)}</p>
              </div>
              <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg">Input Token Cost</h3>
                <p className="text-3xl">${inputCost.toFixed(2)}</p>
                <p className="text-sm text-gray-400">@ ${INPUT_TOKEN_PRICE}/million</p>
              </div>
              <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg">Output Token Cost</h3>
                <p className="text-3xl">${outputCost.toFixed(2)}</p>
                <p className="text-sm text-gray-400">@ ${OUTPUT_TOKEN_PRICE}/million</p>
              </div>
              <div className="col-span-3 row-span-2 bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg">Token Usage Over Time</h3>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 rounded ${timeframe === '15m' ? 'bg-blue-500' : 'bg-gray-700'}`}
                      onClick={() => setTimeframe('15m')}
                    >
                      15M
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${timeframe === '30m' ? 'bg-blue-500' : 'bg-gray-700'}`}
                      onClick={() => setTimeframe('30m')}
                    >
                      30M
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${timeframe === '1h' ? 'bg-blue-500' : 'bg-gray-700'}`}
                      onClick={() => setTimeframe('1h')}
                    >
                      1H
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${timeframe === '24h' ? 'bg-blue-500' : 'bg-gray-700'}`}
                      onClick={() => setTimeframe('24h')}
                    >
                      24H
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${timeframe === 'all' ? 'bg-blue-500' : 'bg-gray-700'}`}
                      onClick={() => setTimeframe('all')}
                    >
                      All
                    </button>
                  </div>
                </div>
                {fileContent.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={formatYAxis} />
                      <Tooltip formatter={(value: number) => value.toLocaleString()} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" />
                      <Line type="monotone" dataKey="input" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="output" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No data to display.</p>
                )}
              </div>
              <div className="col-span-3 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg">Recent Activity</h3>
                {fileContent.length > 0 ? (
                  <div className="overflow-y-auto h-48">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th className="p-2">Timestamp</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Content</th>
                          <th className="p-2">Total Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allMessages.slice().reverse().map((message) => (
                          <tr key={message.id} className={message.tokens && message.tokens.total > tokenThreshold ? 'bg-red-900' : ''}>
                            <td className="p-2">{new Date(message.timestamp).toLocaleString()}</td>
                            <td className="p-2">{message.type}</td>
                            <td className="p-2">{message.content.slice(0, 100)}...</td>
                            <td className="p-2">{message.tokens ? message.tokens.total.toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No activity to display.</p>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
