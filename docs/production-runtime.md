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
| `AUTH_MICROSOFT_CLIENT_ID` | Microsoft Entra ID app registration client ID. |
| `AUTH_MICROSOFT_TENANT_ID` | Microsoft Entra ID tenant ID. |
| `AUTH_MICROSOFT_CLIENT_SECRET_FILE` | Path to the Docker secret file containing the Microsoft app client secret. |

Do not commit secret values to Git. The `loario-infra` stack should reference
Docker secrets or an approved secret provider.

## Microsoft Entra ID Auth

Production auth uses the Microsoft provider:

| Setting | Value |
|---|---|
| Tenant ID | `db6ca47c-e3a0-4376-9c21-477764fe543a` |
| Client ID | `c4ce8bf7-4d88-4d64-bb66-6289ab784ee4` |
| Redirect URI | `https://csp.loartec.io/api/auth/microsoft/handler/frame` |
| Client secret file | `/run/secrets/backstage_microsoft_client_secret` |

Guest auth is not configured in `app-config.yaml` or
`app-config.production.yaml`, and the frontend registers an explicit Microsoft
sign-in page. The first production Microsoft sign-in resolver uses the Entra
Enterprise Application as the access gate and allows sign-in before full
catalog ingestion is implemented. The Enterprise Application must keep
assignment required enabled and must only assign security groups.
