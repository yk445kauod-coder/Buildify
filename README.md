# Autotronic

### By Egytronic

**Autotronic** is a powerful visual automation platform that enables you to create complex workflows, AI agents, and integrations through an intuitive drag-and-drop interface. Inspired by n8n, it provides enterprise-grade automation capabilities with a modern, orange-themed design.

![Autotronic](https://img.shields.io/badge/Autotronic-v1.0.0-FF6B00?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-FF6B00?style=for-the-badge)

---

## 🌟 Features

### Visual Workflow Editor
- **Drag & Drop Interface** - Intuitive node-based workflow builder
- **40+ Pre-built Nodes** - Triggers, AI, HTTP, Data, Flow control, Actions, MCP
- **Real-time Execution** - Watch your workflows run step-by-step
- **Mini-map Navigation** - Easily navigate large workflows

### AI & Agents
- **AI Agent Nodes** - Create intelligent agents with tool access
- **Chat Interfaces** - Conversational AI workflows
- **Embeddings** - Text vectorization for semantic search
- **Document AI** - Parse and analyze documents with AI

### MCP (Model Context Protocol)
- **MCP Client** - Connect to external MCP servers
- **MCP Server** - Expose your own tools via MCP
- **Tool Integration** - Use MCP tools in your workflows

### Integrations
- **HTTP Requests** - GET, POST, PUT, DELETE with custom headers
- **API Connectors** - OAuth, API keys, custom authentication
- **GraphQL** - Full GraphQL query/mutation support
- **Webhooks** - Trigger workflows from external services

### Enterprise Features
- **Job Scheduling** - Cron-based workflow execution
- **Execution History** - Track all workflow runs
- **Error Handling** - Robust error catching and recovery
- **WebSocket Updates** - Real-time execution status

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yk445kauod-coder/Autotronic.git
cd Autotronic

# Start with Docker Compose
docker-compose up -d

# Open in browser
open http://localhost:3000
```

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/yk445kauod-coder/Autotronic.git
cd Autotronic

# Install dependencies
npm install

# Start the server
npm start

# Open in browser
open http://localhost:3000
```

### Option 3: Standalone (Frontend Only)

Simply open `index.html` in your browser for the standalone editor.

---

## 📦 Node Types

### Triggers
| Node | Description |
|------|-------------|
| Schedule | Run workflow on a cron schedule |
| Webhook | Trigger via HTTP webhook |
| Manual | Trigger manually with button |
| Event | Trigger on custom events |

### AI & Agents
| Node | Description |
|------|-------------|
| AI Agent | Intelligent agent with tool access |
| Chat | Conversational AI interface |
| Embeddings | Text vectorization |
| Document AI | Document parsing and analysis |

### MCP
| Node | Description |
|------|-------------|
| MCP Client | Connect to MCP servers |
| MCP Server | Host MCP server |
| MCP Tools | Call MCP tools |
| MCP Resource | Read MCP resources |

### HTTP & APIs
| Node | Description |
|------|-------------|
| HTTP Request | Make HTTP requests |
| HTTP Response | Send HTTP responses |
| API Connector | OAuth/API key auth |
| GraphQL | GraphQL queries |

### Data
| Node | Description |
|------|-------------|
| Transform | Transform data structure |
| Filter | Filter array items |
| Aggregate | Aggregate data |
| Code | Custom JavaScript |

### Flow Control
| Node | Description |
|------|-------------|
| IF/Switch | Conditional branching |
| Loop | Loop over items |
| Wait | Delay execution |
| Split | Split into multiple paths |

### Actions
| Node | Description |
|------|-------------|
| Notify | Send notifications |
| Email | Send emails |
| Discord | Send Discord messages |
| Slack | Send Slack messages |

### Utilities
| Node | Description |
|------|-------------|
| Date/Time | Date utilities |
| Random | Random generators |
| JSON | JSON operations |
| Error | Error handling |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Pan tool |
| `N` | Node tool |
| `C` | Wire/Connect tool |
| `F5` | Run workflow |
| `Delete` | Delete selected |
| `P` | Toggle properties panel |
| `L` | Toggle logs panel |
| `Ctrl+S` | Save project |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom |

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Server
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Database (optional)
POSTGRES_USER=autotronic
POSTGRES_PASSWORD=your-password
DATABASE_URL=postgresql://user:pass@host:5432/autotronic

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/execute` | Execute workflow |
| GET | `/api/executions/:id` | Get execution status |
| POST | `/api/projects/:id/webhooks` | Create webhook |
| GET | `/api/mcp/connections` | List MCP connections |
| POST | `/api/mcp/connections` | Create MCP connection |
| GET | `/api/jobs` | List scheduled jobs |
| POST | `/api/jobs` | Create scheduled job |

### WebSocket Events

Connect to `ws://localhost:3000` for real-time updates:

```javascript
// Subscribe to updates
ws.send(JSON.stringify({ type: 'subscribe', projectId: 'xxx' }));

// Listen for execution updates
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'execution') {
        console.log('Execution update:', data.payload);
    }
};
```

---

## 🐳 Deployment

### Docker Compose (Production)

```bash
# Clone and configure
git clone https://github.com/yk445kauod-coder/Autotronic.git
cd Autotronic

# Edit .env with your values
cp .env.example .env
nano .env

# Deploy
./scripts/deploy.sh

# Or manually:
docker-compose up -d
```

### Docker Swarm

```bash
docker stack deploy -c docker-compose.yml autotronic
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

### Nginx Reverse Proxy

The included nginx configuration provides:
- Reverse proxy to backend
- WebSocket support
- Gzip compression
- Rate limiting
- Security headers

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Autotronic                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Frontend  │  │   Backend   │  │   Job Scheduler     │ │
│  │  (HTML/JS)  │  │  (Express)  │  │   (Bull/Redis)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         │                │                    │             │
│         └────────────────┼────────────────────┘             │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │                    Data Layer                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │  PostgreSQL │  │    Redis    │  │    Files    │ │  │
│  │  │  (Storage)  │  │   (Queue)   │  │  (Uploads)  │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Examples

### Example 1: Scheduled Data Processing

```
[Schedule: Every hour] → [HTTP Request: Fetch API] → [Transform: Process Data] → [Email: Send Report]
```

### Example 2: AI Agent Workflow

```
[Webhook Trigger] → [AI Agent: Analyze Request] → [HTTP Request: External API] → [Discord: Notify Team]
```

### Example 3: MCP Integration

```
[MCP Client: Connect Server] → [MCP Tools: Get Weather] → [Transform: Format Data] → [Slack: Send Message]
```

---

## 📁 Project Structure

```
Autotronic/
├── index.html          # Main application (standalone)
├── server.js           # Backend server
├── package.json        # Dependencies
├── Dockerfile          # Docker image
├── docker-compose.yml  # Docker Compose
├── nginx/
│   └── nginx.conf     # Nginx configuration
├── scripts/
│   └── deploy.sh      # Deployment script
├── public/            # Static files
└── data/              # Persistent data
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with inspiration from [n8n](https://n8n.io/)
- Orange & Black theme by [Egytronic](https://egytronic.com/)
- Icons by [FontAwesome](https://fontawesome.com/)

---

<div align="center">

**Built with ❤️ by [Egytronic](https://egytronic.com/)**

**Autotronic** - Visual Automation for Everyone

</div>
