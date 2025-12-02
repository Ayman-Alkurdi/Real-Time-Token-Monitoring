'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import io from 'socket.io-client';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { settings } from '../settings';

const ResponsiveGridLayout = WidthProvider(Responsive);
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

// Widget components
const TotalTokensWidget = ({ totalTokens }: { totalTokens: number }) => (
  <div className="bg-gray-800 p-2 rounded-lg h-full">
    <h3 className="text-base">Total Tokens</h3>
    <p className="text-2xl">{totalTokens.toLocaleString()}</p>
  </div>
);

const InputTokensWidget = ({ inputTokens, inputCost, inputTokenPrice }: { inputTokens: number, inputCost: number, inputTokenPrice: number }) => (
  <div className="bg-gray-800 p-2 rounded-lg h-full">
    <h3 className="text-base">Input Tokens</h3>
    <p className="text-2xl">{inputTokens.toLocaleString()}</p>
    <p className="text-sm text-gray-400">
      Cost: ${inputCost.toFixed(2)} (@ ${inputTokenPrice}/million)
    </p>
  </div>
);

const OutputTokensWidget = ({ outputTokens, outputCost, outputTokenPrice }: { outputTokens: number, outputCost: number, outputTokenPrice: number }) => (
  <div className="bg-gray-800 p-2 rounded-lg h-full">
    <h3 className="text-base">Output Tokens</h3>
    <p className="text-2xl">{outputTokens.toLocaleString()}</p>
    <p className="text-sm text-gray-400">
      Cost: ${outputCost.toFixed(2)} (@ ${outputTokenPrice}/million)
    </p>
  </div>
);

const TotalCostWidget = ({ totalCost }: { totalCost: number }) => (
  <div className="bg-gray-800 p-2 rounded-lg h-full">
    <h3 className="text-base">Total Estimated Cost</h3>
    <p className="text-2xl">${totalCost.toFixed(2)}</p>
  </div>
);

const AverageTokensWidget = ({ averageTokensPerTurn }: { averageTokensPerTurn: number }) => (
  <div className="bg-gray-800 p-2 rounded-lg h-full">
    <h3 className="text-base">Average Tokens per Turn</h3>
    <p className="text-2xl">{averageTokensPerTurn.toLocaleString()}</p>
  </div>
);

const MostExpensiveTurnWidget = ({ mostExpensiveTurn }: { mostExpensiveTurn: Message | null }) => (
  <div className="bg-gray-800 p-2 rounded-lg h-full">
    <h3 className="text-base">Most Expensive Turn</h3>
    <p className="text-2xl">
      {mostExpensiveTurn ? mostExpensiveTurn.tokens.total.toLocaleString() : 'N/A'}
    </p>
    <p className="text-sm text-gray-400 truncate">
      {mostExpensiveTurn ? mostExpensiveTurn.content : ''}
    </p>
  </div>
);

const TokenUsageChartWidget = ({ chartData, lineVisibility, timeframe, setTimeframe }: { chartData: any[], lineVisibility: any, timeframe: string, setTimeframe: (tf: any) => void }) => (
  <div className="bg-gray-800 p-4 rounded-lg h-full flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg">Token Usage Over Time</h3>
      <div className="flex space-x-2">
        <button className={`px-3 py-1 rounded ${timeframe === '15m' ? 'bg-blue-500' : 'bg-gray-700'}`} onClick={() => setTimeframe('15m')}>15M</button>
        <button className={`px-3 py-1 rounded ${timeframe === '30m' ? 'bg-blue-500' : 'bg-gray-700'}`} onClick={() => setTimeframe('30m')}>30M</button>
        <button className={`px-3 py-1 rounded ${timeframe === '1h' ? 'bg-blue-500' : 'bg-gray-700'}`} onClick={() => setTimeframe('1h')}>1H</button>
        <button className={`px-3 py-1 rounded ${timeframe === '24h' ? 'bg-blue-500' : 'bg-gray-700'}`} onClick={() => setTimeframe('24h')}>24H</button>
        <button className={`px-3 py-1 rounded ${timeframe === 'all' ? 'bg-blue-500' : 'bg-gray-700'}`} onClick={() => setTimeframe('all')}>All</button>
      </div>
    </div>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {lineVisibility.total && <Line type="monotone" dataKey="total" stroke="#8884d8" />}
        {lineVisibility.input && <Line type="monotone" dataKey="input" stroke="#82ca9d" />}
        {lineVisibility.output && <Line type="monotone" dataKey="output" stroke="#ffc658" />}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const RecentActivityWidget = ({ allMessages, searchTerm, setSearchTerm, expandedRow, setExpandedRow, tokenThreshold, recentMessageIds }: { allMessages: Message[], searchTerm: string, setSearchTerm: (term: string) => void, expandedRow: string | null, setExpandedRow: (id: string | null) => void, tokenThreshold: number, recentMessageIds: string[] }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex flex-col flex-1 h-full">
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
          {allMessages.map((message, index) => {
            const isRecent = recentMessageIds.includes(message.id);
            let rowClassName = 'cursor-pointer';
            if (message.tokens && message.tokens.total > tokenThreshold) {
              rowClassName += ' bg-red-900';
            }
            if (isRecent) {
              rowClassName += ' new-message';
            }

            return (
            <React.Fragment key={`${message.id}-${index}`}>
              <tr
                className={rowClassName}
                onClick={() => setExpandedRow(expandedRow === message.id ? null : message.id)}
              >
                <td className="p-2">{new Date(message.timestamp).toLocaleString()}</td>
                <td className="p-2">{message.type}</td>
                <td className="p-2">{message.content.slice(0, 100)}...</td>
                <td className="p-2">{message.tokens ? message.tokens.input.toLocaleString() : 'N/A'}</td>
                <td className="p-2">{message.tokens ? message.tokens.output.toLocaleString() : 'N/A'}</td>
                <td className="p-2">{message.tokens ? message.tokens.total.toLocaleString() : 'N/A'}</td>
              </tr>
              {expandedRow === message.id && (
                <tr>
                  <td colSpan={6} className="p-4 bg-gray-900">
                    <pre>{message.content}</pre>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )})}
        </tbody>
      </table>
    </div>
  </div>
);


export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [sessionData, setSessionData] = useState<{ [filename: string]: Message[] }>({});
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [contentLoading, setContentLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'15m' | '30m' | '1h' | '24h' | 'all'>('all');
  const [tokenThreshold, setTokenThreshold] = useState<number>(35000);
  const [inputTokenPrice, setInputTokenPrice] = useState<number>(settings.inputTokenPrice);
  const [outputTokenPrice, setOutputTokenPrice] = useState<number>(settings.outputTokenPrice);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isLayoutEditable, setIsLayoutEditable] = useState(false);
  const [recentMessageIds, setRecentMessageIds] = useState<string[]>([]);
  const [lineVisibility, setLineVisibility] = useState({
    total: true,
    input: true,
    output: true,
  });

  const initialLayouts = {
    lg: [
      { i: 'totalTokens', x: 0, y: 0, w: 1, h: 1 },
      { i: 'inputTokens', x: 0, y: 2, w: 1, h: 1 },
      { i: 'outputTokens', x: 0, y: 3, w: 1, h: 1 },
      { i: 'totalCost', x: 0, y: 4, w: 1, h: 1 },
      { i: 'avgTokens', x: 0, y: 1, w: 1, h: 1 },
      { i: 'tokenUsageChart', x: 1, y: 0, w: 3, h: 3 },
      { i: 'recentActivity', x: 1, y: 3, w: 3, h: 4 },
    ],
  };

  const initialWidgets = [
    'totalTokens',
    'inputTokens',
    'outputTokens',
    'totalCost',
    'avgTokens',
    'tokenUsageChart',
    'recentActivity',
  ];

  const [layouts, setLayouts] = useState(initialLayouts);
  const [widgets, setWidgets] = useState(initialWidgets);

  useEffect(() => {
    const savedLayouts = localStorage.getItem('dashboardLayouts');
    const savedWidgets = localStorage.getItem('dashboardWidgets');

    if (savedLayouts && savedWidgets) {
      setLayouts(JSON.parse(savedLayouts));
      setWidgets(JSON.parse(savedWidgets));
    }
  }, []);

  const onLayoutChange = (layout: any, newLayouts: any) => {
    setLayouts(newLayouts);
  };

  const onRemoveItem = (itemId: string) => {
    const newWidgets = widgets.filter((i) => i !== itemId);
    setWidgets(newWidgets);
  };

  const onAddItem = (itemId: string) => {
    const newWidgets = [...widgets, itemId];
    setWidgets(newWidgets);
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

  // Fetch initial session data (all files)
  useEffect(() => {
    if (selectedSession) {
      setContentLoading(true);
      fetch(`/api/sessions/${selectedSession}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.files) {
            setSessionData(data.files);
          } else {
             // Fallback or empty if API fails structure
             setSessionData({});
          }
          setContentLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch session content.');
          setContentLoading(false);
        });

      // Watch the session via socket
      socket.emit('watchSession', selectedSession);
    }
  }, [selectedSession]);

  // Listen for file updates within the session
  useEffect(() => {
    socket.on('sessionFileUpdate', ({ fileName, content }: { fileName: string, content: string }) => {
      try {
        const parsedContent = JSON.parse(content);
        const newMessages = parsedContent.messages || [];
        
        setSessionData(currentData => {
           // Check if there are new messages to highlight
           const oldMessages = currentData[fileName] || [];
           if (newMessages.length > oldMessages.length) {
              const newMessage = newMessages[newMessages.length - 1];
              setRecentMessageIds(prev => [...prev, newMessage.id]);
              setTimeout(() => {
                setRecentMessageIds(prev => prev.filter(id => id !== newMessage.id));
              }, 3000);
           }
           
           return {
             ...currentData,
             [fileName]: newMessages
           };
        });
      } catch (e) {
        console.error("Failed to parse update for file:", fileName, e);
      }
    });

    return () => {
      socket.off('sessionFileUpdate');
    };
  }, []);

  // Flatten messages from all files and sort by timestamp
  const allMessages = useMemo(() => {
    const messages = Object.values(sessionData).flat();
    return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sessionData]);

  const messagesWithTokens = allMessages.filter((message) => message.tokens);

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

  const chartData = messagesWithTokens.map((message) => ({
    name: new Date(message.timestamp).toLocaleTimeString(),
    total: message.tokens.total,
    input: message.tokens.input,
    output: message.tokens.output,
  }));

  const widgetComponents: { [key: string]: React.ReactNode } = {
    totalTokens: <TotalTokensWidget totalTokens={totalTokens} />,
    inputTokens: <InputTokensWidget inputTokens={inputTokens} inputCost={inputCost} inputTokenPrice={inputTokenPrice} />,
    outputTokens: <OutputTokensWidget outputTokens={outputTokens} outputCost={outputCost} outputTokenPrice={outputTokenPrice} />,
    totalCost: <TotalCostWidget totalCost={totalCost} />,
    avgTokens: <AverageTokensWidget averageTokensPerTurn={averageTokensPerTurn} />,
    mostExpensiveTurn: <MostExpensiveTurnWidget mostExpensiveTurn={mostExpensiveTurn} />,
    tokenUsageChart: <TokenUsageChartWidget chartData={chartData} lineVisibility={lineVisibility} timeframe={timeframe} setTimeframe={setTimeframe} />,
    recentActivity: <RecentActivityWidget allMessages={allMessages} searchTerm={searchTerm} setSearchTerm={setSearchTerm} expandedRow={expandedRow} setExpandedRow={setExpandedRow} tokenThreshold={tokenThreshold} recentMessageIds={recentMessageIds} />,
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl">Real-Time Token Monitoring</h1>
        <div className="flex items-center space-x-4">
          <a href="/overview"><button className="bg-gray-700 p-2 rounded">Overview</button></a>
          <select className="bg-gray-700 p-2 rounded" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} disabled={sessionsLoading}>
            <option value="">{sessionsLoading ? 'Loading...' : 'Select a session'}</option>
            {sessions.map((session) => (<option key={session.name} value={session.name}>{session.name}</option>))}
          </select>
          {/* File selector removed as we now show aggregated session view */}
          
          <button
            className={`p-2 rounded ${isLayoutEditable ? 'bg-blue-500' : 'bg-gray-700'}`}
            onClick={() => setIsLayoutEditable(!isLayoutEditable)}
          >
            {isLayoutEditable ? 'Lock Layout' : 'Edit Layout'}
          </button>
          {isLayoutEditable && (
            <>
              <div className="relative">
                <button className="bg-gray-700 p-2 rounded" onClick={() => setIsAddWidgetOpen(!isAddWidgetOpen)}>Add Widget</button>
                {isAddWidgetOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg p-4">
                    <ul>
                      {Object.keys(widgetComponents).filter(w => !widgets.includes(w)).map(w => (
                        <li key={w}><button onClick={() => onAddItem(w)}>{w}</button></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                className="bg-gray-700 p-2 rounded"
                onClick={() => {
                  localStorage.setItem('dashboardLayouts', JSON.stringify(layouts));
                  localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
                }}
              >
                Save Layout
              </button>
              <button
                className="bg-gray-700 p-2 rounded"
                onClick={() => {
                  localStorage.removeItem('dashboardLayouts');
                  localStorage.removeItem('dashboardWidgets');
                  window.location.reload();
                }}
              >
                Reset Layout
              </button>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 p-4">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={100}
          onLayoutChange={onLayoutChange}
          compactType={null}
          allowOverlap={true}
          isDraggable={isLayoutEditable}
          isResizable={isLayoutEditable}
        >
          {widgets.map((key) => (
            <div key={key} className="bg-gray-900 rounded-lg">
              {isLayoutEditable && <button className="absolute top-2 right-2 text-white" onClick={() => onRemoveItem(key)}>x</button>}
              {widgetComponents[key]}
            </div>
          ))}
        </ResponsiveGridLayout>
      </main>
    </div>
  );
}