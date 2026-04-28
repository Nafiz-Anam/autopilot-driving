# 📊 Enterprise Monitoring Guide

This guide provides comprehensive documentation for setting up and using the enterprise monitoring stack included in this template.

## 🎯 Overview

The monitoring stack includes:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Loki** - Log aggregation
- **Promtail** - Log collection
- **Jaeger** - Distributed tracing
- **AlertManager** - Alert management and notifications

## 🚀 Quick Start

### **Start the Monitoring Stack**

```bash
# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Check service status
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

### **Access the Services**

| Service          | URL                    | Credentials | Purpose                    |
| ---------------- | ---------------------- | ----------- | -------------------------- | --- |
| **Grafana**      | http://localhost:4000  | admin/admin | Dashboards & Visualization |
| **Prometheus**   | http://localhost:9090  | -           | Metrics Query & Storage    |
| **Jaeger**       | http://localhost:16686 | -           | Distributed Tracing        |
| **AlertManager** | http://localhost:9093  | -           | Alert Management           |
| **Loki**         | http://localhost:3100  | -           | Log Aggregation API        |     |

## Grafana Dashboards

### **Pre-built Dashboards**

#### **1. API Metrics Dashboard**

- **Request Rate**: Requests per second by method and route
- **Response Time**: 95th and 50th percentile response times
- **Error Rate**: Percentage of 5xx responses
- **Active Connections**: Current active connections
- **Request Size**: Incoming request payload sizes
- **Status Code Distribution**: HTTP status code breakdown

#### **2. System Metrics Dashboard**

- **CPU Usage**: System CPU utilization
- **Memory Usage**: Memory consumption
- **Disk Usage**: Disk space utilization
- **Network I/O**: Network traffic (RX/TX)
- **Database Connections**: Active database connections
- **Redis Memory**: Redis memory usage
- **Load Average**: System load averages

### **Accessing Dashboards**

1. **Login to Grafana**: http://localhost:3000 (admin/admin)
2. **Navigate**: Dashboards → Browse
3. **Select**: "API Metrics" or "System Metrics"

### **Creating Custom Dashboards**

```javascript
// Example Prometheus queries for custom dashboards

// Request rate by endpoint
rate(http_requests_total[5m])

// Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

// Error rate
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

// Database connections
database_connections

// Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

## 🔍 Prometheus Metrics

### **Application Metrics**

#### **HTTP Metrics**

```typescript
// Request count by method, route, and status
http_requests_total{method="GET", route="/api/v1/users", status_code="200"}

// Request duration histogram
http_request_duration_seconds_bucket{le="0.1", method="GET", route="/api/v1/users"}

// Request and response sizes
http_request_size_bytes{method="GET", route="/api/v1/users"}
http_response_size_bytes{method="GET", route="/api/v1/users", status_code="200"}
```

#### **Business Metrics**

```typescript
// Active connections
active_connections

// Database connections
database_connections{pool="default"}

// User registrations
user_registrations_total{status="success"}

// User logins
user_logins_total{method="jwt"}
```

### **System Metrics**

#### **Node Exporter Metrics**

```typescript
// CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

// Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

// Disk usage
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100

// Network traffic
rate(node_network_receive_bytes_total[5m]) * 8
rate(node_network_transmit_bytes_total[5m]) * 8
```

### **Querying Metrics**

#### **PromQL Examples**

```promql
# Top 10 slowest endpoints
topk(10, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])))

# Error rate by endpoint
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# Request rate over time
sum(rate(http_requests_total[5m])) by (method)

# Database connection usage
database_connections

# Memory usage prediction
predict_linear(node_memory_MemAvailable_bytes[1h], 3600)
```

## 📝 Log Management

### **Loki Configuration**

The Loki service is configured with:

- **Retention**: 168 hours (7 days)
- **Index**: 24-hour chunks
- **Storage**: Filesystem-based

### **Promtail Log Collection**

Promtail collects logs from:

- **Docker containers**: `/var/lib/docker/containers/*/*log`
- **System logs**: `/var/log/*log`

### **Log Querying in Grafana**

```logql
# Query application logs
{job="containerlogs"} |= "ERROR"

# Query logs by container
{container_name="api-template"}

# Query logs with time range
{job="containerlogs"} |= "login" |= "ERROR"

# Extract fields from JSON logs
{job="containerlogs"} | json | level="ERROR"
```

### **Application Logging**

```typescript
// Structured logging example
import logger from '../config/logger';

logger.info('User login successful', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  requestId: req.id,
});

logger.error('Database error', {
  error: error.message,
  query: sqlQuery,
  userId: req.user?.id,
});
```

## 🕵️ Distributed Tracing

### **Jaeger Integration**

The application is configured with OpenTelemetry tracing:

```typescript
// Tracing is automatically initialized in src/index.ts
import { initializeTracing } from './utils/tracing';

initializeTracing();
```

### **Trace Configuration**

- **Service Name**: `api-template`
- **Jaeger Endpoint**: `http://localhost:14268/api/traces`
- **Sampling**: Default OpenTelemetry sampling

### **Viewing Traces**

1. **Access Jaeger UI**: http://localhost:16686
2. **Select Service**: `api-template`
3. **Search Traces**: View recent traces
4. **Trace Details**: Click on individual traces

### **Custom Tracing**

```typescript
import { trace } from '@opentelemetry/api';

// Add custom spans
const tracer = trace.getTracer('api-template');
const span = tracer.startSpan('custom-operation');

try {
  // Your operation here
  span.setAttributes({
    'user.id': userId,
    'operation.type': 'database-query',
  });
} finally {
  span.end();
}
```

## 🚨 Alert Management

### **AlertManager Configuration**

AlertManager is configured with:

- **Email Notifications**: SMTP setup required
- **Slack Integration**: Webhook URL required
- **Alert Routing**: Critical and warning routes

### **Pre-configured Alerts**

#### **API Alerts**

- **High Error Rate**: > 5% for 2 minutes
- **High Response Time**: 95th percentile > 2s for 5 minutes
- **Service Down**: API service unavailable for 1 minute

#### **System Alerts**

- **High Memory Usage**: > 90% for 5 minutes
- **High CPU Usage**: > 80% for 5 minutes
- **Low Disk Space**: > 85% for 5 minutes
- **Database Connections**: > 80 connections
- **Redis Down**: Redis service unavailable

### **Alert Rules**

```yaml
# Example alert rule
- alert: HighErrorRate
  expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: 'High error rate detected'
    description: 'Error rate is {{ $value | humanizePercentage }} for the last 5 minutes'
```

### **Configuring Notifications**

#### **Email Setup**

```yaml
# docker/alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@yourcompany.com'
  smtp_auth_username: 'alerts@yourcompany.com'
  smtp_auth_password: 'your-smtp-password'
```

#### **Slack Setup**

```yaml
slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    channel: '#alerts'
    title: 'Critical Alert: {{ .GroupLabels.alertname }}'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

## 🔧 Configuration

### **Environment Variables**

```bash
# OpenTelemetry
SERVICE_NAME=api-template
SERVICE_VERSION=1.0.0
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Monitoring
PROMETHEUS_ENDPOINT=http://localhost:9090
GRAFANA_ENDPOINT=http://localhost:3000
```

### **Docker Compose Override**

```yaml
# docker-compose.monitoring.override.yml
version: '3.8'

services:
  grafana:
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your-secure-password
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - '3000:3000'

  prometheus:
    command:
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'

  alertmanager:
    environment:
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=alerts@yourcompany.com
      - SMTP_PASSWORD=your-app-password
```

## 📈 Best Practices

### **Metrics Design**

1. **Use consistent naming**: `service_metric_unit`
2. **Add meaningful labels**: Method, route, status
3. **Use appropriate types**: Counter, Histogram, Gauge
4. **Document metrics**: Help text for each metric

### **Alert Design**

1. **Set appropriate thresholds**: Avoid alert fatigue
2. **Use severity levels**: Critical, warning, info
3. **Provide context**: Include descriptions and runbooks
4. **Test alerts**: Verify notification channels

### **Log Management**

1. **Use structured logging**: JSON format
2. **Add correlation IDs**: Request tracing
3. **Log at appropriate levels**: Error, warn, info, debug
4. **Avoid sensitive data**: Don't log passwords or tokens

### **Dashboard Design**

1. **Focus on key metrics**: Most important information first
2. **Use consistent time ranges**: 1h, 6h, 24h views
3. **Add thresholds**: Visual indicators for problems
4. **Include context**: Service health, dependencies

## 🛠️ Troubleshooting

### **Common Issues**

#### **Prometheus Not Scraping**

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check metrics endpoint
curl http://localhost:8000/metrics
```

#### **Grafana No Data**

```bash
# Check datasource connection
curl http://localhost:9090/api/v1/query?query=up

# Verify Prometheus is running
docker-compose ps prometheus
```

#### **Jaeger No Traces**

```bash
# Check Jaeger health
curl http://localhost:14268/api/services

# Verify OpenTelemetry initialization
docker-compose logs app | grep -i tracing
```

#### **Loki Not Receiving Logs**

```bash
# Check Promtail status
docker-compose logs promtail

# Verify Loki health
curl http://localhost:3100/ready
```

### **Performance Tuning**

#### **Prometheus**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

storage:
  tsdb:
    retention.time: 30d
    retention.size: 10GB
```

#### **Grafana**

```yaml
# grafana.ini
[database]
max_open_conns = 10
max_idle_conns = 5

[server]
http_addr = 0.0.0.0
http_port = 3000
```

## 📚 Additional Resources

### **Documentation**

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)

### **Community**

- [Grafana Community Dashboards](https://grafana.com/grafana/dashboards/)
- [Prometheus Exporters](https://prometheus.io/docs/instrumenting/exporters/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)

---

## 🎯 Next Steps

1. **Customize Dashboards**: Add service-specific metrics
2. **Configure Alerts**: Set up notification channels
3. **Monitor Performance**: Track key performance indicators
4. **Scale Monitoring**: Add more services as needed
5. **Automate**: Use Infrastructure as Code for monitoring setup

This monitoring stack provides enterprise-grade observability for your REST API template! 🚀
