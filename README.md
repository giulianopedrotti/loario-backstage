# Loar AiOps Backstage

Backstage internal developer portal for the Loar AiOps platform.

This repository contains the Loar-controlled Backstage application that will be
built and published as a public GHCR image for the Docker Swarm cluster.

## Purpose

The Backstage portal will be the Internal Developer Platform entry point for:

- service catalog
- platform documentation
- operational runbooks
- scaffolder templates
- links to GLPI, Zabbix, Grafana, Portainer and future automation flows

## Runtime Baseline

- Backstage app version: `1.51.0`
- Node.js: `22` or `24`
- Yarn: `4.4.1`
- Production image target: `ghcr.io/giulianopedrotti/loario-backstage`

## Local Development

```sh
yarn install
yarn start
```

## Production Build

Backstage's host-build Docker flow expects the backend bundle to be generated
before building the image.

```sh
yarn install --immutable
yarn tsc
yarn build:backend
yarn build-image
```

The generated Dockerfile lives at:

```text
packages/backend/Dockerfile
```

## Pipeline

The Azure DevOps pipeline definition is:

```text
azure-pipelines.yml
```

It validates the app, builds the backend bundle, builds the Docker image and
pushes public image tags to GHCR.

## Image Tags

Use immutable tags for deploys:

```text
ghcr.io/giulianopedrotti/loario-backstage:v0.1.0
ghcr.io/giulianopedrotti/loario-backstage:sha-<short-sha>
```

Do not use `latest` in the Docker Swarm production stack.

## Production Configuration

Production config is loaded through:

```sh
node packages/backend --config app-config.yaml --config app-config.production.yaml
```

Required environment variables:

```env
APP_BASE_URL=https://csp.loartec.io
BACKEND_BASE_URL=https://csp.loartec.io
POSTGRES_HOST=postgresql
POSTGRES_PORT=5432
POSTGRES_USER=backstage
POSTGRES_PASSWORD=<secret>
POSTGRES_DATABASE=backstage
GITHUB_TOKEN=<token>
```

Secrets must be injected by Docker secrets, environment variables, or Vault in
future phases. Do not commit secrets to this repository.

## Docker Swarm

The Swarm stack should consume a versioned public image:

```yaml
image: ghcr.io/giulianopedrotti/loario-backstage:v0.1.0
```

Cluster access pattern:

```sh
ssh loar-btn-01
ssh loar-node-01
sudo -n docker service ps --no-trunc loario-infra_backstage
```

## References

- Backstage docs: https://backstage.io/docs/
- Docker image build: https://backstage.io/docs/deployment/docker/
