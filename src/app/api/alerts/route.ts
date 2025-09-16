import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const alertsFilePath = path.join(process.cwd(), 'src', 'server', 'alerts.json');

export async function GET() {
  try {
    const fileContents = await fs.readFile(alertsFilePath, 'utf8');
    const alerts = JSON.parse(fileContents);
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error reading alerts file:', error);
    return NextResponse.json({ message: 'Error reading alerts file' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.metric || !body.operator || body.value === undefined || !body.filePath) {
      return NextResponse.json({ message: 'Invalid alert data' }, { status: 400 });
    }

    const fileContents = await fs.readFile(alertsFilePath, 'utf8');
    const alerts = JSON.parse(fileContents);
    
    const newAlert = {
      id: alerts.length > 0 ? Math.max(...alerts.map((a: { id: number; }) => a.id)) + 1 : 1,
      name: body.name,
      metric: body.metric,
      operator: body.operator,
      value: Number(body.value),
      filePath: body.filePath,
      enabled: true, // enabled by default
    };

    alerts.push(newAlert);
    
    await fs.writeFile(alertsFilePath, JSON.stringify(alerts, null, 2));
    
    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error('Error writing to alerts file:', error);
    return NextResponse.json({ message: 'Error writing to alerts file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Alert ID is required' }, { status: 400 });
    }

    const fileContents = await fs.readFile(alertsFilePath, 'utf8');
    const alerts = JSON.parse(fileContents);

    const alertId = parseInt(id, 10);
    const filteredAlerts = alerts.filter((alert: { id: number; }) => alert.id !== alertId);

    if (alerts.length === filteredAlerts.length) {
      return NextResponse.json({ message: 'Alert not found' }, { status: 404 });
    }

    await fs.writeFile(alertsFilePath, JSON.stringify(filteredAlerts, null, 2));

    return NextResponse.json({ message: 'Alert deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ message: 'Error deleting alert' }, { status: 500 });
  }
}
