#!/bin/bash

# Saleor Platform GCP Monitoring Setup Script
# This script sets up comprehensive monitoring for the Saleor platform

set -e

PROJECT_ID="saleor-platform-prod"
REGION="us-central1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create alerting policies
create_alerting_policies() {
    log_info "Creating alerting policies..."
    
    # Cloud Run service availability alert
    cat > /tmp/cloud-run-availability-policy.yaml <<EOF
displayName: "Cloud Run Service Availability"
documentation:
  content: "Alert when Cloud Run services are not available"
conditions:
  - displayName: "Cloud Run service is down"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count"'
      comparison: COMPARISON_LESS_THAN
      thresholdValue: 1
      duration: 300s
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
          groupByFields:
            - resource.labels.service_name
notificationChannels: []
alertStrategy:
  autoClose: 86400s
enabled: true
EOF

    gcloud alpha monitoring policies create --policy-from-file=/tmp/cloud-run-availability-policy.yaml
    
    # Database connection alert
    cat > /tmp/database-connection-policy.yaml <<EOF
displayName: "Database Connection Issues"
documentation:
  content: "Alert when database connections are failing"
conditions:
  - displayName: "High database connection errors"
    conditionThreshold:
      filter: 'resource.type="cloudsql_database" AND metric.type="cloudsql.googleapis.com/database/network/connections"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 80
      duration: 300s
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_MEAN
          crossSeriesReducer: REDUCE_MEAN
notificationChannels: []
alertStrategy:
  autoClose: 86400s
enabled: true
EOF

    gcloud alpha monitoring policies create --policy-from-file=/tmp/database-connection-policy.yaml
    
    # High CPU usage alert
    cat > /tmp/high-cpu-policy.yaml <<EOF
displayName: "High CPU Usage"
documentation:
  content: "Alert when Cloud Run services have high CPU usage"
conditions:
  - displayName: "CPU usage above 80%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/container/cpu/utilizations"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.8
      duration: 300s
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_MEAN
          crossSeriesReducer: REDUCE_MEAN
          groupByFields:
            - resource.labels.service_name
notificationChannels: []
alertStrategy:
  autoClose: 86400s
enabled: true
EOF

    gcloud alpha monitoring policies create --policy-from-file=/tmp/high-cpu-policy.yaml
    
    # Memory usage alert
    cat > /tmp/high-memory-policy.yaml <<EOF
displayName: "High Memory Usage"
documentation:
  content: "Alert when Cloud Run services have high memory usage"
conditions:
  - displayName: "Memory usage above 80%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/container/memory/utilizations"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.8
      duration: 300s
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_MEAN
          crossSeriesReducer: REDUCE_MEAN
          groupByFields:
            - resource.labels.service_name
notificationChannels: []
alertStrategy:
  autoClose: 86400s
enabled: true
EOF

    gcloud alpha monitoring policies create --policy-from-file=/tmp/high-memory-policy.yaml
    
    log_info "Alerting policies created successfully."
}

# Create custom dashboards
create_dashboards() {
    log_info "Creating monitoring dashboards..."
    
    # Saleor Platform Overview Dashboard
    cat > /tmp/saleor-overview-dashboard.json <<EOF
{
  "displayName": "Saleor Platform Overview",
  "mosaicLayout": {
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Cloud Run Request Count",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\"",
                    "aggregation": {
                      "alignmentPeriod": "300s",
                      "perSeriesAligner": "ALIGN_RATE",
                      "crossSeriesReducer": "REDUCE_SUM",
                      "groupByFields": ["resource.labels.service_name"]
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Requests/sec",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Cloud Run Response Latency",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\"",
                    "aggregation": {
                      "alignmentPeriod": "300s",
                      "perSeriesAligner": "ALIGN_DELTA",
                      "crossSeriesReducer": "REDUCE_PERCENTILE_95",
                      "groupByFields": ["resource.labels.service_name"]
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Latency (ms)",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Database Connections",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/network/connections\"",
                    "aggregation": {
                      "alignmentPeriod": "300s",
                      "perSeriesAligner": "ALIGN_MEAN",
                      "crossSeriesReducer": "REDUCE_MEAN"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Connections",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Redis Memory Usage",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"redis_instance\" AND metric.type=\"redis.googleapis.com/stats/memory/usage_ratio\"",
                    "aggregation": {
                      "alignmentPeriod": "300s",
                      "perSeriesAligner": "ALIGN_MEAN",
                      "crossSeriesReducer": "REDUCE_MEAN"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Usage Ratio",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
EOF

    gcloud monitoring dashboards create --config-from-file=/tmp/saleor-overview-dashboard.json
    
    log_info "Monitoring dashboards created successfully."
}

# Set up log-based metrics
create_log_based_metrics() {
    log_info "Creating log-based metrics..."
    
    # Error rate metric
    gcloud logging metrics create saleor_error_rate \
        --description="Rate of errors in Saleor services" \
        --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR' \
        --value-extractor='EXTRACT(labels.service_name)'
    
    # API response time metric
    gcloud logging metrics create saleor_api_response_time \
        --description="API response time distribution" \
        --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="saleor-api" AND httpRequest.latency!=""' \
        --value-extractor='EXTRACT(httpRequest.latency)'
    
    # Database query time metric
    gcloud logging metrics create saleor_db_query_time \
        --description="Database query execution time" \
        --log-filter='resource.type="cloud_run_revision" AND textPayload=~".*query.*time.*"' \
        --value-extractor='REGEXP_EXTRACT(textPayload, "time: ([0-9.]+)")'
    
    log_info "Log-based metrics created successfully."
}

# Configure uptime checks
create_uptime_checks() {
    log_info "Creating uptime checks..."
    
    # Get service URLs
    local api_url=$(gcloud run services describe saleor-api --region=$REGION --format="value(status.url)")
    local dashboard_url=$(gcloud run services describe saleor-dashboard --region=$REGION --format="value(status.url)")
    local storefront_url=$(gcloud run services describe saleor-storefront --region=$REGION --format="value(status.url)")
    
    # API uptime check
    cat > /tmp/api-uptime-check.yaml <<EOF
displayName: "Saleor API Uptime Check"
monitoredResource:
  type: "uptime_url"
  labels:
    project_id: "$PROJECT_ID"
    host: "$(echo $api_url | sed 's|https://||' | sed 's|/.*||')"
httpCheck:
  path: "/graphql/"
  port: 443
  useSsl: true
  requestMethod: "POST"
  headers:
    Content-Type: "application/json"
  body: '{"query": "{ __schema { types { name } } }"}'
  validateSsl: true
period: 300s
timeout: 10s
selectedRegions:
  - "USA"
  - "EUROPE"
  - "ASIA_PACIFIC"
EOF

    gcloud monitoring uptime create --config-from-file=/tmp/api-uptime-check.yaml
    
    # Dashboard uptime check
    cat > /tmp/dashboard-uptime-check.yaml <<EOF
displayName: "Saleor Dashboard Uptime Check"
monitoredResource:
  type: "uptime_url"
  labels:
    project_id: "$PROJECT_ID"
    host: "$(echo $dashboard_url | sed 's|https://||' | sed 's|/.*||')"
httpCheck:
  path: "/"
  port: 443
  useSsl: true
  requestMethod: "GET"
  validateSsl: true
period: 300s
timeout: 10s
selectedRegions:
  - "USA"
  - "EUROPE"
  - "ASIA_PACIFIC"
EOF

    gcloud monitoring uptime create --config-from-file=/tmp/dashboard-uptime-check.yaml
    
    # Storefront uptime check
    cat > /tmp/storefront-uptime-check.yaml <<EOF
displayName: "Saleor Storefront Uptime Check"
monitoredResource:
  type: "uptime_url"
  labels:
    project_id: "$PROJECT_ID"
    host: "$(echo $storefront_url | sed 's|https://||' | sed 's|/.*||')"
httpCheck:
  path: "/"
  port: 443
  useSsl: true
  requestMethod: "GET"
  validateSsl: true
period: 300s
timeout: 10s
selectedRegions:
  - "USA"
  - "EUROPE"
  - "ASIA_PACIFIC"
EOF

    gcloud monitoring uptime create --config-from-file=/tmp/storefront-uptime-check.yaml
    
    log_info "Uptime checks created successfully."
}

# Main monitoring setup function
main() {
    log_info "Setting up comprehensive monitoring for Saleor Platform..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Create alerting policies
    create_alerting_policies
    
    # Create dashboards
    create_dashboards
    
    # Create log-based metrics
    create_log_based_metrics
    
    # Create uptime checks
    create_uptime_checks
    
    # Clean up temporary files
    rm -f /tmp/*-policy.yaml /tmp/*-dashboard.json /tmp/*-uptime-check.yaml
    
    log_info "Monitoring setup completed successfully!"
    echo ""
    echo "Monitoring Resources Created:"
    echo "  - Alerting policies for service availability, CPU, memory, and database"
    echo "  - Custom dashboard for Saleor Platform overview"
    echo "  - Log-based metrics for error tracking and performance"
    echo "  - Uptime checks for API, Dashboard, and Storefront"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure notification channels for alerts (email, Slack, etc.)"
    echo "  2. Set up custom SLIs and SLOs for your business requirements"
    echo "  3. Configure log retention policies"
    echo "  4. Set up automated reporting and dashboards"
    echo ""
    echo "Access your monitoring at: https://console.cloud.google.com/monitoring"
}

# Run main function
main "$@"