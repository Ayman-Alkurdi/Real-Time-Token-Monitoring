
'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface Session {
  name: string;
  createdAt: string;
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<Message[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [contentLoading, setContentLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'15m' | '30m' | '1h' | '24h' | 'all'>('all');
  const [tokenThreshold, setTokenThreshold] = useState<number>(35000);
  const [inputTokenPrice, setInputTokenPrice] = useState<number>(0.625); // Price per 1 million tokens
  const [outputTokenPrice, setOutputTokenPrice] = useState<number>(5.00); // Price per 1 million tokens
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lineVisibility, setLineVisibility] = useState({
    total: true,
    input: true,
    output: true,
  });
  const settingsRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    const dataToExport = {
      kpis: {
        totalTokens,
        inputTokens,
        outputTokens,
        totalCost,
        averageTokensPerTurn,
        mostExpensiveTurn,
      },
      chartData,
      log: allMessages,
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedSession || 'session'}_${selectedFile || 'data'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setSessionsLoading(true);
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setSessionsLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch sessions.');
        setSessionsLoading(false);
      });

    if (selectedSession) {
      setFilesLoading(true);
      fetch(`/api/sessions/${selectedSession}?files=true`)
        .then((res) => res.json())
        .then((data) => {
          setFiles(data);
          setFilesLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch files.');
          setFilesLoading(false);
        });
    }
  };



  useEffect(() => {
    setSessionsLoading(true);
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        if (data.length > 0 && !selectedSession) {
          setSelectedSession(data[0].name);
        }
        setSessionsLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch sessions.');
        setSessionsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setFilesLoading(true);
      fetch(`/api/sessions/${selectedSession}?files=true`) // Fetch file list
        .then((res) => res.json())
        .then((data) => {
          setFiles(data);
          if (data.length > 0 && !selectedFile) {
            setSelectedFile(data[0]);
          }
          setFilesLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch files.');
          setFilesLoading(false);
        });
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      setContentLoading(true);
      let url = `/api/sessions/${selectedSession}`;
      if (selectedFile) {
        url = `/api/sessions/${selectedSession}/${selectedFile}`;
      }

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setFileContent(data.messages || []);
          setContentLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch file content.');
          setContentLoading(false);
        });

      if (selectedFile) {
        const filePath = `${selectedSession}/${selectedFile}`;
        console.log('Emitting watchFile with path:', filePath); // Added for debugging
        socket.emit('watchFile', filePath);
      }
    }
  }, [selectedSession, selectedFile]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedSession]);


  useEffect(() => {
    socket.on('fileUpdate', (content) => {
      console.log('Received fileUpdate:', content); // Added for debugging
      setFileContent(JSON.parse(content).messages || []);
    });

    return () => {
      socket.off('fileUpdate');
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
  const averageTokensPerTurn = messagesWithTokens.length > 0
    ? Math.round(totalTokens / messagesWithTokens.length)
    : 0;

  const mostExpensiveTurn = messagesWithTokens.reduce((max, message) =>
    message.tokens.total > (max ? max.tokens.total : 0) ? message : max,
    null as Message | null
  );

  const inputCost = (inputTokens / 1000000) * inputTokenPrice;
  const outputCost = (outputTokens / 1000000) * outputTokenPrice;
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-800 border border-gray-700 rounded">
          <p className="label text-white">{`Turn : ${label}`}</p>
          {payload[0] && <p className="intro text-blue-400">{`Total : ${payload[0].value.toLocaleString()}`}</p>}
          {payload[1] && <p className="intro text-green-400">{`Input : ${payload[1].value.toLocaleString()}`}</p>}
          {payload[2] && <p className="intro text-yellow-400">{`Output : ${payload[2].value.toLocaleString()}`}</p>}
        </div>
      );
    }

    return null;
  };

  const chartData = filteredMessages.map((message) => ({
    name: new Date(message.timestamp).toLocaleTimeString(),
    total: message.tokens.total,
    input: message.tokens.input,
    output: message.tokens.output,
  }));

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl">Real-Time Token Monitoring</h1>
        <div className="flex items-center space-x-4">
          <a href="/overview">
            <button
              className="bg-gray-700 p-2 rounded"
            >
              Overview
            </button>
          </a>
          <button
            className="bg-gray-700 p-2 rounded"
            onClick={handleExport}
            disabled={!selectedSession}
          >
            Export
          </button>
          <select
            className="bg-gray-700 p-2 rounded"
            value={selectedSession}
            onChange={handleSessionChange}
            disabled={sessionsLoading}
          >
            <option value="">{sessionsLoading ? 'Loading...' : 'Select a session'}</option>
            {sessions.map((session) => (
              <option key={session.name} value={session.name}>
                {session.name}
              </option>
            ))}
          </select>
          <select
            className="bg-gray-700 p-2 rounded"
            value={selectedFile}
            onChange={handleFileChange}
            disabled={!selectedSession || filesLoading}
          >
            <option value="">{filesLoading ? 'Loading...' : 'Select a file'}</option>
            {files.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
          <button
            className="bg-gray-700 p-2 rounded"
            onClick={handleRefresh}
          >
            Refresh
          </button>
          <div className="relative" ref={settingsRef}>
            <button
              className="bg-gray-700 p-2 rounded"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              Settings
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg p-4">
                <label htmlFor="tokenThreshold" className="block mb-2">
                  Token Threshold
                </label>
                <input
                  type="number"
                  id="tokenThreshold"
                  className="w-full bg-gray-600 p-2 rounded"
                  value={tokenThreshold}
                  onChange={(e) => setTokenThreshold(Number(e.target.value))}
                />
                <label htmlFor="inputTokenPrice" className="block mb-2 mt-4">
                  Input Token Price (/million)
                </label>
                <input
                  type="number"
                  id="inputTokenPrice"
                  className="w-full bg-gray-600 p-2 rounded"
                  value={inputTokenPrice}
                  onChange={(e) => setInputTokenPrice(Number(e.target.value))}
                />
                <label htmlFor="outputTokenPrice" className="block mb-2 mt-4">
                  Output Token Price (/million)
                </label>
                <input
                  type="number"
                  id="outputTokenPrice"
                  className="w-full bg-gray-600 p-2 rounded"
                  value={outputTokenPrice}
                  onChange={(e) => setOutputTokenPrice(Number(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 p-4">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
          {error && <p className="text-red-500">{error}</p>}
          {!error && !selectedSession && (
            <div className="flex flex-col items-center justify-center h-full col-span-4">
              <img src="/globe.svg" alt="Globe" className="w-32 h-32 mb-4" />
              <h2 className="text-3xl mb-2">Welcome to Real-Time Token Monitoring</h2>
              <p className="text-lg text-gray-400">Select a session from the dropdown above to get started.</p>
            </div>
          )}
          {!error && selectedSession && contentLoading && <p>Loading content...</p>}
          {!error && selectedSession && !contentLoading && (
            <>
              {/* Left Column */}
              <div className="md:col-span-1 flex flex-col gap-4">
                <div className="bg-gray-800 p-2 rounded-lg">
                  <h3 className="text-base">Total Tokens</h3>
                  <p className="text-2xl">{totalTokens.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-2 rounded-lg">
                  <h3 className="text-base">Input Tokens</h3>
                  <p className="text-2xl">{inputTokens.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">
                    Cost: ${inputCost.toFixed(2)} (@ ${inputTokenPrice}/million)
                  </p>
                </div>
                <div className="bg-gray-800 p-2 rounded-lg">
                  <h3 className="text-base">Output Tokens</h3>
                  <p className="text-2xl">{outputTokens.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">
                    Cost: ${outputCost.toFixed(2)} (@ ${outputTokenPrice}/million)
                  </p>
                </div>
                <div className="bg-gray-800 p-2 rounded-lg">
                  <h3 className="text-base">Total Estimated Cost</h3>
                  <p className="text-2xl">${totalCost.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800 p-2 rounded-lg">
                  <h3 className="text-base">Average Tokens per Turn</h3>
                  <p className="text-2xl">{averageTokensPerTurn.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-2 rounded-lg">
                  <h3 className="text-base">Most Expensive Turn</h3>
                  <p className="text-2xl">
                    {mostExpensiveTurn ? mostExpensiveTurn.tokens.total.toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {mostExpensiveTurn ? mostExpensiveTurn.content : ''}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="md:col-span-3 flex flex-col gap-4">
                <div className="bg-gray-800 p-4 rounded-lg h-96">
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
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" align="right" />
                        {lineVisibility.total && <Line type="monotone" dataKey="total" stroke="#8884d8" />}
                        {lineVisibility.input && <Line type="monotone" dataKey="input" stroke="#82ca9d" />}
                        {lineVisibility.output && <Line type="monotone" dataKey="output" stroke="#ffc658" />}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>No data to display.</p>
                  )}
                  <div className="flex justify-center space-x-4 mt-4">
                    <button
                      className={`px-3 py-1 rounded ${lineVisibility.total ? 'bg-blue-500' : 'bg-gray-700'}`}
                      onClick={() => setLineVisibility(prev => ({ ...prev, total: !prev.total }))}
                    >
                      Total
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${lineVisibility.input ? 'bg-green-500' : 'bg-gray-700'}`}
                      onClick={() => setLineVisibility(prev => ({ ...prev, input: !prev.input }))}
                    >
                      Input
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${lineVisibility.output ? 'bg-yellow-500' : 'bg-gray-700'}`}
                      onClick={() => setLineVisibility(prev => ({ ...prev, output: !prev.output }))}
                    >
                      Output
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg">Recent Activity</h3>
                    <input
                      type="text"
                      placeholder="Search content..."
                      className="bg-gray-700 p-2 rounded"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {fileContent.length > 0 ? (
                    <div className="overflow-y-auto flex-1">
                      <table className="w-full text-left">
                        <thead>
                          <tr>
                            <th className="p-2">Timestamp</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Content</th>
                            <th className="p-2">Input</th>
                            <th className="p-2">Output</th>
                            <th className="p-2">Total Tokens</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            let messagesToDisplay = allMessages;
                            if (searchTerm.trim() !== '') {
                              const lowerCaseSearchTerm = searchTerm.toLowerCase();
                              messagesToDisplay = allMessages.filter((msg) =>
                                msg.content.toLowerCase().includes(lowerCaseSearchTerm)
                              );
                            }
                            return messagesToDisplay
                              .slice()
                              .reverse()
                              .map((message, index) => (
                                <React.Fragment key={`${message.id}-${index}`}>
                                  <tr
                                    className={
                                      message.tokens && message.tokens.total > tokenThreshold
                                        ? 'bg-red-900 cursor-pointer'
                                        : 'cursor-pointer'
                                    }
                                    onClick={() => setExpandedRow(expandedRow === message.id ? null : message.id)}
                                  >
                                    <td className="p-2">
                                      {new Date(message.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-2">{message.type}</td>
                                    <td className="p-2">{message.content.slice(0, 100)}...</td>
                                    <td className="p-2">
                                      {message.tokens
                                        ? message.tokens.input.toLocaleString()
                                        : 'N/A'}
                                    </td>
                                    <td className="p-2">
                                      {message.tokens
                                        ? message.tokens.output.toLocaleString()
                                        : 'N/A'}
                                    </td>
                                    <td className="p-2">
                                      {message.tokens
                                        ? message.tokens.total.toLocaleString()
                                        : 'N/A'}
                                    </td>
                                  </tr>
                                  {expandedRow === message.id && (
                                    <tr>
                                      <td colSpan={6} className="p-4 bg-gray-900">
                                        <pre>{message.content}</pre>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>No activity to display.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
