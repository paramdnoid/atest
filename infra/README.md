# Infrastructure Baseline

## Included

- `docker-compose.yml`: local Postgres and Redis
- `k8s/base`: namespace, API deployment and service
- `gateway/envoy.yaml`: grpc-web gateway baseline

## Enterprise Hardening Checklist

- Replace placeholder image refs and secret names
- Add cert-manager, TLS termination, and mTLS where required
- Integrate managed KMS-backed secret store
- Add network policies and pod security standards
- Add Prometheus/Grafana and alert routing
