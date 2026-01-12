# Deployment Guide

## Prerequisites

- Rust 1.86.0 installed
- Linera CLI tools installed (version 0.15.7)
- Node.js 18+ installed
- Access to Linera Testnet Conway

## Build Process

### 1. Build Contract and Service

```bash
#!/bin/bash
# scripts/build.sh

set -e

echo "Building Pine Analytics..."

# Navigate to project directory
cd pine-analytics

# Build for WASM
echo "Building WASM binaries..."
cargo build --release --target wasm32-unknown-unknown

# Verify binaries exist
if [ ! -f "target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm" ]; then
    echo "Error: Contract binary not found"
    exit 1
fi

if [ ! -f "target/wasm32-unknown-unknown/release/pine_analytics_service.wasm" ]; then
    echo "Error: Service binary not found"
    exit 1
fi

echo "WASM binaries built successfully"

# Build frontend
echo "Building frontend..."
cd ../frontend
npm install
npm run build

echo "Frontend built successfully"
echo "Build complete!"
```

Make executable:
```bash
chmod +x scripts/build.sh
```

### 2. Deploy to Linera

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# Configuration
ADMIN_OWNER=${ADMIN_OWNER:-"your-owner-address-here"}
PORT=${PORT:-8080}

echo "Deploying Pine Analytics to Linera..."

# Publish bytecode
echo "Publishing bytecode..."
BYTECODE_ID=$(linera publish-bytecode \
    pine-analytics/target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm \
    pine-analytics/target/wasm32-unknown-unknown/release/pine_analytics_service.wasm \
    | grep "Bytecode ID" | awk '{print $NF}')

if [ -z "$BYTECODE_ID" ]; then
    echo "Error: Failed to publish bytecode"
    exit 1
fi

echo "Bytecode published: $BYTECODE_ID"

# Create application instance
echo "Creating application instance..."
APP_ID=$(linera create-application $BYTECODE_ID \
    --json-argument "{\"admin_owner\": \"$ADMIN_OWNER\"}" \
    | grep "Application ID" | awk '{print $NF}')

if [ -z "$APP_ID" ]; then
    echo "Error: Failed to create application"
    exit 1
fi

echo "Application created: $APP_ID"

# Save deployment info
cat > deployment-info.json <<EOF
{
  "bytecode_id": "$BYTECODE_ID",
  "application_id": "$APP_ID",
  "admin_owner": "$ADMIN_OWNER",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "Deployment info saved to deployment-info.json"

# Start service
echo "Starting GraphQL service on port $PORT..."
linera service --port $PORT &

SERVICE_PID=$!
echo "Service started with PID: $SERVICE_PID"
echo $SERVICE_PID > service.pid

# Wait for service to be ready
echo "Waiting for service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT/health > /dev/null; then
        echo "Service is ready!"
        break
    fi
    sleep 1
done

echo "Deployment complete!"
echo "GraphQL endpoint: http://localhost:$PORT/graphql"
echo "Application ID: $APP_ID"
```

Make executable:
```bash
chmod +x scripts/deploy.sh
```

### 3. Configuration Files

#### config.json
```json
{
  "analytics": {
    "chain_id": "YOUR_CHAIN_ID",
    "application_id": "YOUR_APP_ID",
    "graphql_endpoint": "http://localhost:8080/graphql",
    "admin_owner": "YOUR_OWNER_ADDRESS"
  },
  "monitoring": {
    "poll_interval_ms": 1000,
    "max_events_per_query": 1000,
    "cache_size_mb": 512
  },
  "frontend": {
    "port": 5173,
    "api_endpoint": "http://localhost:8080/graphql"
  }
}
```

#### .env (for frontend)
```bash
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
VITE_WS_ENDPOINT=ws://localhost:8080/graphql
VITE_APP_ID=YOUR_APP_ID
VITE_CHAIN_ID=YOUR_CHAIN_ID
```

## Running the Application

### Start Backend Service

```bash
# Using deployment script
./scripts/deploy.sh

# Or manually
linera service --port 8080
```

### Start Frontend

```bash
cd frontend
npm run dev
# Or for production
npm run build
npm run preview
```

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "total_events": 1234,
  "monitored_apps": 3,
  "last_event_timestamp": 1234567890
}
```

### View Logs

```bash
# Service logs
tail -f linera-service.log

# Application logs
linera query-application YOUR_APP_ID
```

### Metrics

```bash
# Query metrics via GraphQL
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ health { status totalEvents monitoredApps } }"
  }'
```

## Maintenance

### Update Application

```bash
# Build new version
./scripts/build.sh

# Publish new bytecode
NEW_BYTECODE_ID=$(linera publish-bytecode ...)

# Upgrade application
linera upgrade-application YOUR_APP_ID $NEW_BYTECODE_ID
```

### Backup Data

```bash
# Export all events
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ events { events { id sourceApp timestamp eventType data } } }"
  }' > backup-events.json

# Export configuration
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ monitoredApplications { applicationId chainId graphqlEndpoint } }"
  }' > backup-config.json
```

### Restore Data

```bash
# Re-add monitored applications
for app in $(jq -r '.data.monitoredApplications[] | @json' backup-config.json); do
    curl -X POST http://localhost:8080/graphql \
      -H "Content-Type: application/json" \
      -d "{
        \"query\": \"mutation { addMonitoredApplication(applicationId: \\\"$app_id\\\", chainId: \\\"$chain_id\\\", graphqlEndpoint: \\\"$endpoint\\\") { applicationId } }\"
      }"
done
```

## Troubleshooting

### Service Won't Start

**Check port availability:**
```bash
lsof -i :8080
```

**Check Linera CLI version:**
```bash
linera --version
# Should be 0.15.7
```

**Check WASM binaries:**
```bash
ls -lh pine-analytics/target/wasm32-unknown-unknown/release/*.wasm
```

### GraphQL Queries Fail

**Test connection:**
```bash
curl http://localhost:8080/graphql
```

**Check service logs:**
```bash
tail -f linera-service.log
```

**Verify application ID:**
```bash
linera query-application YOUR_APP_ID
```

### Frontend Can't Connect

**Update .env file:**
```bash
# frontend/.env
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
```

**Check CORS settings:**
```bash
# Service should allow CORS for development
```

**Test GraphQL endpoint:**
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status } }"}'
```

## Production Deployment

### Security Checklist

- [ ] Change default admin owner
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable authentication
- [ ] Set up monitoring alerts
- [ ] Configure backup schedule
- [ ] Review access logs

### Performance Optimization

```bash
# Increase cache size
export CACHE_SIZE_MB=1024

# Adjust worker threads
export TOKIO_WORKER_THREADS=8

# Enable connection pooling
export MAX_CONNECTIONS=100
```

### Load Balancing

```nginx
# nginx.conf
upstream pine_analytics {
    server localhost:8080;
    server localhost:8081;
    server localhost:8082;
}

server {
    listen 80;
    server_name analytics.example.com;
    
    location /graphql {
        proxy_pass http://pine_analytics;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Scaling

### Horizontal Scaling

Deploy multiple instances:

```bash
# Instance 1
linera service --port 8080 &

# Instance 2
linera service --port 8081 &

# Instance 3
linera service --port 8082 &
```

### Database Optimization

```bash
# Increase RocksDB cache
export ROCKSDB_CACHE_SIZE=2GB

# Enable compression
export ROCKSDB_COMPRESSION=lz4
```

## Monitoring & Alerts

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'pine_analytics'
    static_configs:
      - targets: ['localhost:8080']
```

### Grafana Dashboard

Import dashboard JSON:
```json
{
  "dashboard": {
    "title": "Pine Analytics",
    "panels": [
      {
        "title": "Event Rate",
        "targets": [
          {
            "expr": "rate(events_total[5m])"
          }
        ]
      }
    ]
  }
}
```

## Support

For issues:
1. Check logs: `tail -f linera-service.log`
2. Verify configuration: `cat config.json`
3. Test connectivity: `curl http://localhost:8080/health`
4. Review documentation: `docs/`

## Next Steps

After deployment:
1. Add monitored applications via GraphQL mutations
2. Configure custom metrics
3. Set up dashboards
4. Enable monitoring and alerts
5. Schedule regular backups
