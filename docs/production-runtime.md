# Production Runtime Contract

This document records the runtime contract expected by the Loar production
Docker Swarm stack.

## Public URL

```text
https://csp.loartec.io
```

`app.baseUrl`, `backend.baseUrl` and backend CORS are pinned to this URL in
`app-config.production.yaml`.

## Database

Backstage uses the existing PostgreSQL service in the `loario-infra` stack.

| Setting | Value |
|---|---|
| Host | `postgresql` |
| Port | `5432` |
| User | `backstage` |
| Database | `backstage` |
| Password | Docker secret file |

Expected secret file:

```text
/run/secrets/backstage_db_password
```

## Required Runtime Values

| Name | Purpose |
|---|---|
| `BACKEND_SECRET_FILE` | Path to the Docker secret file containing the Backstage backend service-to-service auth signing secret. |
| `POSTGRES_HOST` | PostgreSQL service hostname. |
| `POSTGRES_PORT` | PostgreSQL service port. |
| `POSTGRES_USER` | PostgreSQL user for Backstage. |
| `POSTGRES_DATABASE` | PostgreSQL database for Backstage. |
| `POSTGRES_PASSWORD_FILE` | Path to the Docker secret file containing the database password. |

Do not commit secret values to Git. The `loario-infra` stack should reference
Docker secrets or an approved secret provider.

## Temporary Auth State

Guest auth remains configured only as a short-lived bridge while production
networking and database wiring are prepared. The portal must not be exposed
broadly to customers until the Microsoft Entra ID provider replaces guest auth.
