# QMemory Library - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the QMemory Node.js utility library with all scalability enhancements in production environments. The library now supports enterprise-grade traffic volumes with robust error handling, performance monitoring, and horizontal scaling capabilities.

## Prerequisites

### System Requirements

**Minimum Requirements:**

- Node.js v18.0+ (LTS version recommended)
- MongoDB v5.0+ or MongoDB Atlas cluster
- Redis v6.0+ (optional, for distributed caching)
- 4GB RAM minimum
- 2 CPU cores minimum

**Recommended for High Traffic:**

- Node.js v20.0+ (latest LTS)
- MongoDB cluster with replica sets
- Redis Cluster for distributed caching
- 16GB+ RAM
- 8+ CPU cores

### Software Dependencies

```bash
# Core dependencies (automatically installed)
npm install qmemory@latest

# Optional production dependencies
npm install pm2           # Process management
npm install nginx          # Load balancing (if not using cloud LB)
npm install redis-cli     # Redis management
npm install mongodb-tools  # Database management
```

## Configuration

### Environment Variables

Create a `.env` file in your deployment directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
MONGODB_URL=mongodb://username:password@prod-cluster.mongodb.net/qmemory?retryWrites=true&w=majority
MONGODB_MIN_POOL_SIZE=10
MONGODB_MAX_POOL_SIZE=50
MONGODB_ACQUIRE_TIMEOUT=10000
MONGODB_IDLE_TIMEOUT=30000

# Caching Configuration (Optional)
REDIS_URL=redis://prod-redis-cluster.redis.ports.net:6379
REDIS_PASSWORD=your-redis-password
REDIS_CLUSTER_MODE=true

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_MEMORY_CLEANUP=300000

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
API_KEY_SECRET=your-api-secret-key
CORS_ORIGIN=https://yourdomain.com

# Monitoring and Logging
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
PERFORMANCE_MONITORING=true

# I/O Optimization
CACHE_TTL=300000
BATCH_OPERATION_TIMEOUT=5000
BACKGROUND_QUEUE_SIZE=10000
```

### Production Configuration Files

#### PM2 Ecosystem File (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'qmemory-api',
      script: './dist/scalability-demo-app.js',
      instances: 'max', // Auto-scale based on CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/qmemory-error.log',
      out_file: './logs/qmemory-out.log',
      log_file: './logs/qmemory-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      env_file: '.env',
    },
  ],
};
```

#### Nginx Configuration (`/etc/nginx/sites-available/qmemory`)

```nginx
upstream qmemory_backend {
    least_conn;
    server 127.0.0.1:5000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5002 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=ip:10m rate=100r/s;
    limit_req_status 429;

    # Proxy configuration
    location / {
        proxy_pass http://qmemory_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Health check endpoint (bypass rate limiting)
    location /health {
        proxy_pass http://qmemory_backend;
        limit_req zone=ip burst=200 nodelay;
    }

    # Static assets
    location /public/ {
        root /var/www/qmemory/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri $uri/ /index.html;
    }
}
```

## Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install and configure Redis (optional)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Create application user
sudo useradd -m -d /var/www/qmemory qmemory
sudo usermod -a -G www-data qmemory
```

### 2. Application Deployment

```bash
# Create deployment directory
sudo mkdir -p /var/www/qmemory
sudo chown qmemory:qmemory /var/www/qmemory

# Clone or copy application
cd /var/www/qmemory
sudo -u qmemory git clone https://github.com/yourorg/qmemory.git .

# Install dependencies
sudo -u qmemory npm ci --production

# Build application
sudo -u qmemory npm run build

# Create logs directory
sudo -u qmemory mkdir -p logs

# Set up environment file
sudo -u qmemory cp .env.example .env
sudo -u qmemory nano .env  # Edit with production values
```

### 3. Database Setup

```bash
# Connect to MongoDB
mongo mongodb://prod-cluster.mongodb.net/qmemory

# Create indexes for performance
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "createdAt": 1 })
db.users.createIndex({ "updatedAt": 1 })

# Enable authentication in production
use admin
db.createUser({
  user: "qmemory_app",
  pwd: "secure_password_here",
  roles: [
    { role: "readWrite", db: "qmemory" }
  ]
})
```

### 4. Start Application

```bash
# Start with PM2
sudo -u qmemory pm2 start ecosystem.config.js

# Save PM2 configuration
sudo -u qmemory pm2 save

# Setup PM2 startup script
sudo -u qmemory pm2 startup
```

### 5. Configure Load Balancer

```bash
# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/qmemory /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com --email admin@yourdomain.com --agree-tos --non-interactive
```

## Monitoring and Maintenance

### Health Checks

```bash
# Application health
curl -f http://localhost:5000/health || echo "Health check failed"

# Load balancer health
curl -f http://api.yourdomain.com/health || echo "Load balancer health check failed"

# PM2 process status
sudo -u qmemory pm2 status
sudo -u qmemory pm2 monit

# System resources
pm2 show qmemory 0 mem-cpu
```

### Log Management

```bash
# View application logs
sudo -u qmemory pm2 logs qmemory

# Rotate logs
sudo -u qmemory pm2 logs qmemory --lines 1000 --nostream > /var/log/qmemory/$(date +%F).log

# Monitor errors in real-time
sudo -u qmemory tail -f logs/qmemory-error.log | grep ERROR
```

### Performance Monitoring

```bash
# Application metrics
curl -H "X-Request-ID: $(uuidgen)" http://api.yourdomain.com/metrics

# Database performance
mongo --eval "db.runCommand({profile: 1})" qmemory

# Redis performance (if used)
redis-cli info stats
```

## Scaling Strategies

### Horizontal Scaling

#### Multiple Instances

```bash
# Scale to 4 instances
sudo -u qmemory pm2 scale qmemory 4

# Add more instances dynamically
sudo -u qmemory pm2 scale qmemory +2

# Monitor cluster
sudo -u qmemory pm2 show qmemory
```

#### Load Balancer Configuration

```nginx
upstream qmemory_backend {
    ip_hash;  # Consistent user routing
    server 10.0.1.10:5000 weight=1;
    server 10.0.1.11:5000 weight=1;
    server 10.0.1.12:5000 weight=1;
    server 10.0.1.13:5000 weight=1 backup;  # Backup server
}

# Enable health checks
upstream qmemory_backend {
    server 10.0.1.10:5000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:5000 max_fails=3 fail_timeout=30s;
    health_check;
}
```

### Database Scaling

#### MongoDB Replica Set

```javascript
// Configuration for production cluster
{
  "_id": "qmemory-prod",
  "members": [
    { "_id": 0, "host": "mongo1.yourdomain.com", "priority": 1 },
    { "_id": 1, "host": "mongo2.yourdomain.com", "priority": 1 },
    { "_id": 2, "host": "mongo3.yourdomain.com", "priority": 2 }
  ],
  "settings": {
    "heartbeatIntervalMillis": 2000,
    "electionTimeoutMillis": 10000,
    "chainingAllowed": false
  }
}
```

#### Caching Strategy

```bash
# Redis Cluster Configuration
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
    --cluster-replicas 1

# Configure QMemory to use Redis
echo "REDIS_URL=redis://prod-redis-cluster.redis.ports.net:6379" >> .env
echo "CACHE_STRATEGY=redis" >> .env
```

## Security Configuration

### SSL/TLS Setup

```bash
# Generate strong SSL certificates
sudo openssl genrsa -out /etc/ssl/private/qmemory.key 4096
sudo openssl req -new -x509 -key /etc/ssl/private/qmemory.key \
    -out /etc/ssl/certs/qmemory.crt -days 365

# Configure Nginx for HTTPS
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/qmemory.crt;
    ssl_certificate_key /etc/ssl/private/qmemory.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow from 10.0.0.0/24 to any port 27017  # MongoDB internal
sudo ufw enable

# iptables rules (alternative)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5000 -s 10.0.0.0/24 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

## Backup and Recovery

### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%F)
BACKUP_DIR="/backup/qmemory"
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="mongodb://username:password@prod-cluster.mongodb.net/qmemory" \
    --out="$BACKUP_DIR/mongodb-$DATE" \
    --gzip

# Compress and upload to cloud storage
tar -czf "$BACKUP_DIR/qmemory-$DATE.tar.gz" $BACKUP_DIR/mongodb-$DATE/
aws s3 cp "$BACKUP_DIR/qmemory-$DATE.tar.gz" s3://your-backup-bucket/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Application Backup

```bash
# Backup application files
#!/bin/bash
DATE=$(date +%F)
BACKUP_DIR="/backup/qmemory/app"

mkdir -p $BACKUP_DIR

# Backup code and configuration
tar -czf "$BACKUP_DIR/qmemory-app-$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=.env \
    /var/www/qmemory/

# Backup PM2 configuration
cp /home/qmemory/.pm2/ $BACKUP_DIR/pm2-config-$DATE/
```

### Recovery Procedures

```bash
# Disaster recovery script
#!/bin/bash

# Restore from backup
BACKUP_FILE=$1
RESTORE_DIR="/restore/qmemory"

mkdir -p $RESTORE_DIR

# Restore database
mongorestore --uri="mongodb://username:password@prod-cluster.mongodb.net/qmemory" \
    --drop \
    --gzip \
    $BACKUP_FILE

# Restart application
sudo -u qmemory pm2 restart qmemory

# Verify recovery
curl -f http://api.yourdomain.com/health
echo "Recovery completed: $?"
```

## Performance Optimization

### Application Tuning

```bash
# Node.js performance flags
export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
export UV_THREADPOOL_SIZE=16

# PM2 optimization
{
  "node_args": "--max-old-space-size=4096",
  "max_memory_restart": "2G",
  "min_uptime": "10s",
  "kill_timeout": 5000
}
```

### Database Optimization

```javascript
// MongoDB production optimization
{
  "storage": {
    "dbPath": "/var/lib/mongodb/qmemory",
    "journal": {
      "commitIntervalMs": 100
    },
    "wiredTiger": {
      "engineConfig": {
        "cacheSizeGB": 4,
        "journalCompressor": "zstd"
      }
    }
  },
  "operationProfiling": {
    "slowOpThresholdMs": 100,
    "mode": "slowOp"
  },
  "net": {
    "maxIncomingConnections": 1000
  }
}
```

### System Optimization

```bash
# System limits for production
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
echo "vm.swappiness = 10" >> /etc/sysctl.conf

sysctl -p
```

## Troubleshooting

### Common Issues

#### Memory Leaks

```bash
# Monitor memory usage
sudo -u qmemory pm2 monit
top -p $(pgrep -f qmemory)

# Node.js memory profiling
node --inspect=0.0.0.0:9229 dist/scalability-demo-app.js

# Heap dump analysis
node --inspect --heap-prof dist/scalability-demo-app.js
```

#### Database Connection Issues

```bash
# Check MongoDB connectivity
mongo mongodb://prod-cluster.mongodb.net/qmemory --eval "db.adminCommand('ismaster')"

# Monitor connection pool
curl -s http://localhost:5000/metrics | jq '.data.database.pool'
```

#### Performance Bottlenecks

```bash
# CPU profiling
node --cpu-prof dist/scalability-demo-app.js

# Flame graph analysis
node --prof-process isolate-* isolate-*.log > processed.txt
```

### Health Check Diagnostics

```bash
# Comprehensive health check
#!/bin/bash
echo "=== QMemory Health Check ==="
echo "Timestamp: $(date)"
echo

# Application health
echo "Application Status:"
curl -s http://localhost:5000/health | jq '.data.status'

# Database status
echo "Database Status:"
mongo --quiet --eval "db.serverStatus().connections"

# Redis status (if used)
if command -v redis-cli; then
    echo "Redis Status:"
    redis-cli info server | grep -E "(redis_version|uptime_in_seconds)"
fi

# System resources
echo "System Resources:"
echo "Memory: $(free -h | grep Mem)"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1)"

# PM2 status
echo "PM2 Status:"
sudo -u qmemory pm2 jlist
```

## Maintenance Schedule

### Daily Tasks

- [ ] Health check monitoring
- [ ] Log rotation and cleanup
- [ ] Performance metrics review
- [ ] Security scan
- [ ] Database backup verification

### Weekly Tasks

- [ ] Security updates
- [ ] Performance optimization review
- [ ] Database optimization
- [ ] Scaling metrics analysis
- [ ] Backup testing

### Monthly Tasks

- [ ] Full disaster recovery test
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Documentation updates
- [ ] Dependencies update review

## Support and Monitoring

### Alert Configuration

```bash
# Uptime monitoring setup
# Using UptimeRobot or Pingdom for external monitoring

# Slack/Email alerts setup
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
    -H 'Content-type: application/json' \
    -d '{
      "text": "🚨 QMemory Alert: Service down on '$(hostname)'",
      "username": "monitoring-bot"
    }'
```

### Monitoring Dashboard

```javascript
// Grafana dashboard configuration (JSON)
{
  "dashboard": {
    "title": "QMemory Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

This deployment guide provides a comprehensive foundation for running QMemory library at enterprise scale with high availability, performance monitoring, and robust operational procedures.
