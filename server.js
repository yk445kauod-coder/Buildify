/**
 * Autotronic - Visual Automation Platform
 * Backend Server
 * By Egytronic
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ============================================
// IN-MEMORY STORAGE (Replace with DB in production)
// ============================================

const projects = new Map();
const workflows = new Map();
const executions = new Map();
const credentials = new Map();
const webhooks = new Map();
const mcpConnections = new Map();
const jobs = new Map();

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ============================================
// PROJECT ROUTES
// ============================================

// List all projects
app.get('/api/projects', (req, res) => {
    const projectList = Array.from(projects.values()).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        nodeCount: p.workflow?.nodes?.length || 0,
        updatedAt: p.updatedAt,
        createdAt: p.createdAt
    }));
    res.json(projectList);
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
});

// Create project
app.post('/api/projects', (req, res) => {
    const id = uuidv4();
    const project = {
        id,
        name: req.body.name || 'Untitled Project',
        description: req.body.description || '',
        workflow: req.body.workflow || { nodes: [], wires: [] },
        settings: req.body.settings || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    projects.set(id, project);
    res.status(201).json(project);
});

// Update project
app.put('/api/projects/:id', (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.workflow = req.body.workflow || project.workflow;
    project.settings = req.body.settings || project.settings;
    project.updatedAt = new Date().toISOString();
    
    projects.set(req.params.id, project);
    res.json(project);
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
    if (!projects.has(req.params.id)) {
        return res.status(404).json({ error: 'Project not found' });
    }
    projects.delete(req.params.id);
    res.status(204).send();
});

// ============================================
// WORKFLOW EXECUTION ROUTES
// ============================================

// Execute workflow
app.post('/api/workflows/:id/execute', async (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    const executionId = uuidv4();
    const execution = {
        id: executionId,
        projectId: req.params.id,
        status: 'running',
        startedAt: new Date().toISOString(),
        input: req.body.input || {},
        output: null,
        logs: [],
        error: null
    };
    
    executions.set(executionId, execution);
    
    // Execute workflow asynchronously
    executeWorkflow(execution, project.workflow);
    
    res.status(202).json({ executionId, status: 'started' });
});

// Get execution status
app.get('/api/executions/:id', (req, res) => {
    const execution = executions.get(req.params.id);
    if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
    }
    res.json(execution);
});

// List executions for a project
app.get('/api/projects/:id/executions', (req, res) => {
    const projectExecutions = Array.from(executions.values())
        .filter(e => e.projectId === req.params.id)
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    res.json(projectExecutions);
});

// ============================================
// WEBHOOK ROUTES
// ============================================

// Create webhook for project
app.post('/api/projects/:id/webhooks', (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    const webhookId = uuidv4().substring(0, 8);
    const webhook = {
        id: webhookId,
        projectId: req.params.id,
        url: `/webhook/${webhookId}`,
        secret: uuidv4(),
        active: true,
        createdAt: new Date().toISOString()
    };
    
    webhooks.set(webhookId, webhook);
    res.status(201).json(webhook);
});

// Get project webhooks
app.get('/api/projects/:id/webhooks', (req, res) => {
    const projectWebhooks = Array.from(webhooks.values())
        .filter(w => w.projectId === req.params.id);
    res.json(projectWebhooks);
});

// Delete webhook
app.delete('/api/webhooks/:id', (req, res) => {
    if (!webhooks.has(req.params.id)) {
        return res.status(404).json({ error: 'Webhook not found' });
    }
    webhooks.delete(req.params.id);
    res.status(204).send();
});

// Webhook trigger endpoint
app.all('/webhook/:id', async (req, res) => {
    const webhook = webhooks.get(req.params.id);
    if (!webhook || !webhook.active) {
        return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const project = projects.get(webhook.projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    const executionId = uuidv4();
    const execution = {
        id: executionId,
        projectId: webhook.projectId,
        triggerType: 'webhook',
        triggerData: { method: req.method, body: req.body, params: req.params, query: req.query },
        status: 'running',
        startedAt: new Date().toISOString(),
        input: req.body,
        output: null,
        logs: [],
        error: null
    };
    
    executions.set(executionId, execution);
    
    // Execute workflow asynchronously
    executeWorkflow(execution, project.workflow);
    
    res.json({ executionId, status: 'triggered' });
});

// ============================================
// MCP (Model Context Protocol) ROUTES
// ============================================

// List MCP connections
app.get('/api/mcp/connections', (req, res) => {
    const connections = Array.from(mcpConnections.values());
    res.json(connections);
});

// Create MCP connection
app.post('/api/mcp/connections', (req, res) => {
    const { name, type, endpoint, apiKey } = req.body;
    
    const connection = {
        id: uuidv4(),
        name: name || 'MCP Connection',
        type: type || 'client', // client or server
        endpoint,
        apiKey,
        status: 'disconnected',
        createdAt: new Date().toISOString()
    };
    
    mcpConnections.set(connection.id, connection);
    res.status(201).json(connection);
});

// Get MCP connection
app.get('/api/mcp/connections/:id', (req, res) => {
    const connection = mcpConnections.get(req.params.id);
    if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
    }
    res.json(connection);
});

// Update MCP connection
app.put('/api/mcp/connections/:id', (req, res) => {
    const connection = mcpConnections.get(req.params.id);
    if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
    }
    
    Object.assign(connection, req.body);
    mcpConnections.set(req.params.id, connection);
    res.json(connection);
});

// Delete MCP connection
app.delete('/api/mcp/connections/:id', (req, res) => {
    if (!mcpConnections.has(req.params.id)) {
        return res.status(404).json({ error: 'Connection not found' });
    }
    mcpConnections.delete(req.params.id);
    res.status(204).send();
});

// Call MCP tool
app.post('/api/mcp/connections/:id/tools', async (req, res) => {
    const connection = mcpConnections.get(req.params.id);
    if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
    }
    
    const { tool, arguments: args } = req.body;
    
    // In production, this would call the actual MCP server
    // For now, return a mock response
    res.json({
        success: true,
        result: { message: `Mock MCP tool ${tool} called` },
        connectionId: req.params.id,
        tool,
        timestamp: new Date().toISOString()
    });
});

// List MCP tools from a connection
app.get('/api/mcp/connections/:id/tools', async (req, res) => {
    const connection = mcpConnections.get(req.params.id);
    if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
    }
    
    // Mock tools list
    res.json([
        { name: 'get_weather', description: 'Get weather for a location' },
        { name: 'search_web', description: 'Search the web' },
        { name: 'send_email', description: 'Send an email' },
        { name: 'get_time', description: 'Get current time' }
    ]);
});

// ============================================
// CREDENTIALS ROUTES
// ============================================

// List credentials
app.get('/api/credentials', (req, res) => {
    const credList = Array.from(credentials.values()).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        createdAt: c.createdAt
    }));
    res.json(credList);
});

// Create credential
app.post('/api/credentials', (req, res) => {
    const { name, type, data } = req.body;
    
    // Encrypt sensitive data in production
    const credential = {
        id: uuidv4(),
        name,
        type,
        data, // Should be encrypted
        createdAt: new Date().toISOString()
    };
    
    credentials.set(credential.id, credential);
    res.status(201).json({ id: credential.id, name: credential.name, type: credential.type });
});

// Delete credential
app.delete('/api/credentials/:id', (req, res) => {
    if (!credentials.has(req.params.id)) {
        return res.status(404).json({ error: 'Credential not found' });
    }
    credentials.delete(req.params.id);
    res.status(204).send();
});

// ============================================
// JOBS ROUTES
// ============================================

// List jobs
app.get('/api/jobs', (req, res) => {
    const { status, projectId } = req.query;
    let jobList = Array.from(jobs.values());
    
    if (status) {
        jobList = jobList.filter(j => j.status === status);
    }
    if (projectId) {
        jobList = jobList.filter(j => j.projectId === projectId);
    }
    
    res.json(jobList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Create job
app.post('/api/jobs', (req, res) => {
    const { projectId, schedule, trigger } = req.body;
    
    const job = {
        id: uuidv4(),
        projectId,
        schedule, // Cron expression
        trigger, // 'schedule', 'webhook', 'event'
        status: 'active',
        lastRun: null,
        nextRun: calculateNextRun(schedule),
        createdAt: new Date().toISOString()
    };
    
    jobs.set(job.id, job);
    
    // Start job scheduler
    if (job.schedule) {
        startJobScheduler(job);
    }
    
    res.status(201).json(job);
});

// Get job
app.get('/api/jobs/:id', (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
});

// Update job
app.put('/api/jobs/:id', (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    
    Object.assign(job, req.body);
    jobs.set(req.params.id, job);
    res.json(job);
});

// Delete job
app.delete('/api/jobs/:id', (req, res) => {
    if (!jobs.has(req.params.id)) {
        return res.status(404).json({ error: 'Job not found' });
    }
    jobs.delete(req.params.id);
    res.status(204).send();
});

// Run job immediately
app.post('/api/jobs/:id/run', async (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    
    const project = projects.get(job.projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    const executionId = uuidv4();
    const execution = {
        id: executionId,
        projectId: job.projectId,
        triggerType: 'job',
        triggerData: { jobId: job.id },
        status: 'running',
        startedAt: new Date().toISOString(),
        output: null,
        logs: [],
        error: null
    };
    
    executions.set(executionId, execution);
    job.lastRun = new Date().toISOString();
    
    executeWorkflow(execution, project.workflow);
    
    res.json({ executionId, status: 'started' });
});

// ============================================
// NODE EXECUTION HELPERS
// ============================================

const nodeExecutors = {
    'http-request': async (node, input, context) => {
        const fetch = require('node-fetch');
        const { url, method = 'GET', headers = {}, body } = node.parameters || {};
        
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        
        const data = await response.json();
        return { status: response.status, data };
    },
    
    'ai-agent': async (node, input, context) => {
        // Placeholder for AI agent execution
        // In production, integrate with OpenAI, Anthropic, etc.
        return { response: 'AI response placeholder', actions: [] };
    },
    
    'data-transform': async (node, input, context) => {
        // Execute transformation code
        try {
            const fn = new Function('input', 'context', node.code || 'return input;');
            return fn(input, context);
        } catch (error) {
            throw new Error(`Transform error: ${error.message}`);
        }
    },
    
    'action-email': async (node, input, context) => {
        // Placeholder for email sending
        // In production, integrate with SendGrid, Mailgun, etc.
        return { sent: true, messageId: uuidv4() };
    },
    
    'action-discord': async (node, input, context) => {
        const fetch = require('node-fetch');
        const { webhook, message } = node.parameters || {};
        
        if (webhook && message) {
            await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });
        }
        
        return { sent: !!webhook };
    },
    
    'trigger-schedule': async (node, input, context) => {
        return { triggered: true, time: Date.now() };
    },
    
    'util-random': async (node, input, context) => {
        return {
            number: Math.random(),
            integer: Math.floor(Math.random() * 100),
            string: Math.random().toString(36),
            uuid: uuidv4()
        };
    }
};

async function executeNode(node, input, context) {
    const executor = nodeExecutors[node.type];
    if (executor) {
        return await executor(node, input, context);
    }
    // Default: return input
    return input;
}

async function executeWorkflow(execution, workflow) {
    const { nodes = [], wires = [] } = workflow;
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n, outputs: {} }]));
    const executionOrder = topologicalSort(nodes, wires);
    
    try {
        for (const nodeId of executionOrder) {
            const node = nodeMap.get(nodeId);
            
            // Gather inputs from connected wires
            const inputValues = {};
            const incomingWires = wires.filter(w => w.toNode === nodeId);
            
            for (const wire of incomingWires) {
                const sourceNode = nodeMap.get(wire.fromNode);
                if (sourceNode) {
                    inputValues[wire.toPort] = sourceNode.outputs[wire.fromPort];
                }
            }
            
            // Execute node
            execution.logs.push(`Executing: ${node.name}`);
            const result = await executeNode(node, inputValues, { execution });
            node.outputs = { out: result };
        }
        
        execution.status = 'success';
        execution.completedAt = new Date().toISOString();
        execution.output = Array.from(nodeMap.values()).map(n => n.outputs);
        
    } catch (error) {
        execution.status = 'error';
        execution.error = error.message;
        execution.completedAt = new Date().toISOString();
    }
    
    // Broadcast update via WebSocket
    broadcastExecutionUpdate(execution);
}

function topologicalSort(nodes, wires) {
    const inDegree = new Map();
    const adjacency = new Map();
    
    nodes.forEach(n => {
        inDegree.set(n.id, 0);
        adjacency.set(n.id, []);
    });
    
    wires.forEach(w => {
        adjacency.get(w.fromNode)?.push(w.toNode);
        inDegree.set(w.toNode, (inDegree.get(w.toNode) || 0) + 1);
    });
    
    const queue = nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);
    const result = [];
    
    while (queue.length > 0) {
        const nodeId = queue.shift();
        result.push(nodeId);
        
        adjacency.get(nodeId)?.forEach(neighbor => {
            inDegree.set(neighbor, inDegree.get(neighbor) - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        });
    }
    
    return result;
}

// ============================================
// WEBSOCKET HANDLING
// ============================================

const wsClients = new Map();

wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    wsClients.set(clientId, ws);
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    ws.send(JSON.stringify({ type: 'connected', clientId }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(clientId, data);
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        wsClients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
    });
});

function handleWebSocketMessage(clientId, data) {
    const { type, payload } = data;
    
    switch (type) {
        case 'subscribe':
            // Subscribe to project updates
            break;
        case 'execute':
            // Trigger workflow execution
            break;
        case 'ping':
            wsClients.get(clientId)?.send(JSON.stringify({ type: 'pong' }));
            break;
    }
}

function broadcastExecutionUpdate(execution) {
    const message = JSON.stringify({ type: 'execution', payload: execution });
    wsClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    });
}

// ============================================
// JOB SCHEDULER
// ============================================

const jobTimers = new Map();

function calculateNextRun(cronExpression) {
    // Simple implementation - calculate next minute for demo
    // In production, use node-cron or similar
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1);
    return next.toISOString();
}

function startJobScheduler(job) {
    // Clear existing timer
    if (jobTimers.has(job.id)) {
        clearInterval(jobTimers.get(job.id));
    }
    
    // Set up interval (every minute for demo)
    const timer = setInterval(async () => {
        const project = projects.get(job.projectId);
        if (!project || job.status !== 'active') return;
        
        const executionId = uuidv4();
        const execution = {
            id: executionId,
            projectId: job.projectId,
            triggerType: 'schedule',
            triggerData: { jobId: job.id },
            status: 'running',
            startedAt: new Date().toISOString(),
            output: null,
            logs: [],
            error: null
        };
        
        executions.set(executionId, execution);
        job.lastRun = new Date().toISOString();
        
        executeWorkflow(execution, project.workflow);
    }, 60000); // Every minute
    
    jobTimers.set(job.id, timer);
}

// ============================================
// DEMO DATA
// ============================================

function createDemoData() {
    // Create a demo project
    const demoProjectId = 'demo-project';
    projects.set(demoProjectId, {
        id: demoProjectId,
        name: 'Demo Workflow',
        description: 'A demonstration workflow',
        workflow: {
            nodes: [
                { id: 'n1', type: 'trigger-schedule', name: 'Schedule', x: 100, y: 100 },
                { id: 'n2', type: 'data-code', name: 'Process', x: 400, y: 100, code: 'return { processed: true, time: Date.now() };' },
                { id: 'n3', type: 'action-notify', name: 'Notify', x: 700, y: 100 }
            ],
            wires: [
                { id: 'w1', fromNode: 'n1', fromPort: 'trigger', toNode: 'n2', toPort: 'input1' },
                { id: 'w2', fromNode: 'n2', fromPort: 'output', toNode: 'n3', toPort: 'message' }
            ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    console.log('Demo data created');
}

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

createDemoData();

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   █████╗ ██╗     ███████╗██╗  ██╗     ██████╗██╗  ██╗   ║
║  ██╔══██╗██║     ██╔════╝╚██╗██╔╝    ██╔════╝██║  ██║   ║
║  ███████║██║     █████╗   ╚███╔╝     ██║     ███████║   ║
║  ██╔══██║██║     ██╔══╝   ██╔██╗     ██║     ██╔══██║   ║
║  ██║  ██║███████╗███████╗██╔╝ ██╗    ╚██████╗██║  ██║   ║
║  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝     ╚═════╝╚═╝  ╚═╝   ║
║                                                           ║
║   By Egytronic - Visual Automation Platform                ║
║   Version 1.0.0                                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📊 API Docs: http://localhost:${PORT}/api/health
🔌 WebSocket: ws://localhost:${PORT}
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    jobTimers.forEach(timer => clearInterval(timer));
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
