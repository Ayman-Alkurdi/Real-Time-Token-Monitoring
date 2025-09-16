'use client';

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

interface Alert {
  id: number;
  name: string;
  metric: 'total_token' | 'cost' | 'elc';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  enabled: boolean;
  filePath: string;
}

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({
    name: '',
    metric: 'total_token',
    operator: '>',
    value: 0,
    filePath: '',
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data);
    };
    fetchAlerts();

    const socket = io('http://localhost:3001');

    socket.on('alertTriggered', (alert: Alert) => {
      window.alert(`Alert Triggered: ${alert.name}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAlert({ ...newAlert, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newAlert,
        value: Number(newAlert.value), // Ensure value is a number
      }),
    });
    const createdAlert = await response.json();
    setAlerts([...alerts, createdAlert]);
    setNewAlert({ name: '', metric: 'total_token', operator: '>', value: 0, filePath: '' });
  };

  const handleDelete = async (id: number) => {
    const response = await fetch(`/api/alerts?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setAlerts(alerts.filter((alert) => alert.id !== id));
    } else {
      console.error('Failed to delete alert');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Alerts</h1>
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Create New Alert</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <input
            type="text"
            name="name"
            value={newAlert.name}
            onChange={handleInputChange}
            placeholder="Alert Name"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="filePath"
            value={newAlert.filePath}
            onChange={handleInputChange}
            placeholder="File Path (e.g., session-1/file.json)"
            className="border p-2 rounded"
            required
          />
          <select
            name="metric"
            value={newAlert.metric}
            onChange={handleInputChange}
            className="border p-2 rounded"
          >
            <option value="total_token">Total Tokens</option>
            <option value="cost">Cost</option>
            <option value="elc">ELC</option>
          </select>
          <select
            name="operator"
            value={newAlert.operator}
            onChange={handleInputChange}
            className="border p-2 rounded"
          >
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">&gt;=</option>
            <option value="<=">&lt;=</option>
            <option value="==">==</option>
            <option value="!=">!=</option>
          </select>
          <input
            type="number"
            name="value"
            value={newAlert.value}
            onChange={handleInputChange}
            placeholder="Value"
            className="border p-2 rounded"
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 md:col-span-2">
            Create Alert
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Existing Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="border p-4 rounded-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-lg">{alert.name}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${alert.enabled ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {alert.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  File: <span className="font-mono bg-gray-100 p-1 rounded">{alert.filePath}</span>
                </div>
                <div className="text-gray-600 my-2">
                  Trigger when: <span className="font-mono bg-gray-100 p-1 rounded">{alert.metric}</span> {alert.operator} <span className="font-mono bg-gray-100 p-1 rounded">{alert.value}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 self-end"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;