# Docker Compose Operations — nap-dev-fullstack

All commands assume you are in the project root where `docker-compose.yml` lives:

```bash
cd /home/zulu/Projects/containers/nap-dev-fullstack
```

---

## 1. Start all service containers (detached mode)

```bash
docker compose up -d
```

- `-d` / `--detach` runs the containers in the background and returns control to your shell.
- Compose enforces the start order automatically: `ict-db` starts first, `ict-api` waits until `ict-db` is **healthy**, then `ict-web` waits until `ict-api` is **healthy**.
- If images are missing locally, they are pulled first (note: `ict-db` pulls from `mcr.microsoft.com`, not Docker Hub).

Useful variations:

```bash
# Recreate containers even if config/images unchanged
docker compose up -d --force-recreate

# Pull newer images before starting
docker compose up -d --pull always
```

---

## 2. Check the status of all containers

```bash
docker container ls
```

Shows each running container with its ID, image, command, state, and published ports. Example output:

```
CONTAINER ID   IMAGE                                        COMMAND                  CREATED      STATUS                PORTS                                         NAMES
18462fc091c2   debian:trixie                                "sleep infinity"         2 days ago   Up 2 days             0.0.0.0:5500->5500/tcp, [::]:5500->5500/tcp   ict-web
f0d0c69e824a   node:26-trixie                               "docker-entrypoint.s…"   2 days ago   Up 2 days (healthy)   0.0.0.0:3080->3080/tcp, [::]:3080->3080/tcp   ict-api
fb50402baccc   mcr.microsoft.com/mssql/server:2022-latest   "/opt/mssql/bin/laun…"   2 days ago   Up 2 days (healthy)   0.0.0.0:1433->1433/tcp, [::]:1433->1433/tcp   ict-db
```

- The `(healthy)` tag in the `STATUS` column reflects the configured healthchecks (`ict-db` runs a `sqlcmd SELECT 1` probe; `ict-api` verifies the Node runtime and a writable `/workspace`).
- `ict-web` has no healthcheck, so it just shows `Up`.

Useful variations:

```bash
# Include stopped/exited containers
docker container ls -a

# Follow logs to diagnose a container
docker logs -f ict-db

# Inspect one container in detail
docker inspect ict-api
```

---

## 3. Shut down all service containers

```bash
docker compose down
```

- Stops and **removes** the containers and the Compose-created network.
- Your bind-mounted data in `workspace/db` (SQL Server files) and `workspace/web` / `workspace/api` is **not** deleted — it lives on the host.

Useful variations:

```bash
# Stop containers but keep them (start again with `docker compose start`)
docker compose stop

# Start them again after `stop`
docker compose start

# Shut down AND remove named volumes (not needed here — this project uses bind mounts only)
docker compose down -v
```

---

## Quick reference

| Goal | Command |
|---|---|
| Start everything, background | `docker compose up -d` |
| See status | `docker container ls` |
| Stop & remove | `docker compose down` |
