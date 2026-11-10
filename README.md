# nap-dev-fullstack

A Docker Compose based development environment for building a web front end (HTML + CSS + JavaScript) and a Node.js backend API, backed by Microsoft SQL Server Express.

Three containers form the stack, started in a fixed order:

```
ict-db (SQL Server) -> ict-api (Node.js) -> ict-web (Debian)
```

---

## Table of Contents

- [Deliberately bare by design](#deliberately-bare-by-design)
- [Services](#services)
  - [`ict-web` — web front end](#ict-web--web-front-end)
  - [`ict-api` — Node.js backend](#ict-api--nodejs-backend)
  - [`ict-db` — Microsoft SQL Server Express 2025](#ict-db--microsoft-sql-server-2025)
- [Project structure](#project-structure)
- [Start order](#start-order)
- [Usage](#usage)
- [Working inside a Container](#working-inside-a-container)
  - [1. Open the project folder in VS Code from the terminal](#1-open-the-project-folder-in-vs-code-from-the-terminal)
  - [2. Attach VS Code to a running container](#2-attach-vs-code-to-a-running-container)
  - [3. Close Remote Connection](#3-close-remote-connection)
- [Ports summary](#ports-summary)
- [Notes](#notes)

---

<a id="deliberately-bare-by-design" name="deliberately-bare-by-design"></a>

## Deliberately bare by design

This scaffold is intentionally built with the bare minimum: base images, `sleep infinity` as the keep-alive, no framework, no bundler, no `package.json`, and **no preinstalled npm dependencies**. That is the point — it is a starting point, not a finished application.

You (the developer) decide the stack. Add whatever npm packages your project needs inside `workspace/api`, for example:

```bash
docker compose exec ict-api bash
cd /workspace
npm init -y
npm install express
npm install --save-dev nodemon
```

Everything lives on the bind mount, so `node_modules` ends up in `workspace/api/node_modules` on your host and survives container restarts. Nothing in `docker-compose.yml` needs to change to add dependencies — the Node runtime picks them up directly. The same freedom applies to the front end: add a bundler, a dev server, or plain static files in `workspace/web` as you see fit.

The trade-off is that nothing is served until you add it: no default app, no default `package.json`, no default scripts. That keeps the scaffold small and unopinionated, at the cost of a few manual setup steps.

[Back to Table of Contents](#table-of-contents)

---

<a id="services" name="services"></a>

## Services

| Service   | Container | Image                                        | Host port | Purpose                              |
| --------- | --------- | -------------------------------------------- | --------- | ------------------------------------ |
| `ict-web` | `ict-web` | `debian:trixie`                              | `5500`    | Static web front end / tooling shell |
| `ict-api` | `ict-api` | `node:26-trixie`                             | `3080`    | Node.js backend runtime              |
| `ict-db`  | `ict-db`  | `mcr.microsoft.com/mssql/server:2025-latest` | `1433`    | Microsoft SQL Server 2025 Express    |

All three use `restart: unless-stopped`, and all expose their container port on the same host port.

[Back to Table of Contents](#table-of-contents)

<a id="ict-web--web-front-end" name="ict-web--web-front-end"></a>

### `ict-web` — web front end

Uses the official Debian Trixie image with **nothing preinstalled** — no `python3`, no `node`, no `curl`. It is the shell for serving and developing the HTML/CSS/JavaScript front end. Because it is non-root, packages must be added at image build time (a `Dockerfile` with `apt-get install`) rather than on the fly; as a result, the front end is usually served by the Node runtime in `ict-api` during development, with `ict-web` used for shells and inspection.

- Working directory: `/workspace`, bind-mounted from `workspace/web`
- Runs as **non-root**, mapped to the host login user (`user: "1000:1000"`)
- `HOME` is set to `/workspace` because Debian has no passwd entry for uid 1000 (otherwise `HOME` defaults to the unwritable `/`)
- Started only after `ict-api` reports **healthy**

[Back to Table of Contents](#table-of-contents)

<a id="ict-api--nodejs-backend" name="ict-api--nodejs-backend"></a>

### `ict-api` — Node.js backend

Uses the official Node.js 26.x image on Debian Trixie. It is the runtime for the backend API, which should listen on port `3080` inside the container. Only Node and npm ship in the image — no project files, no dependencies, no opinion about your framework. Create `package.json` in `workspace/api` and install whatever you need.

- Working directory: `/workspace`, bind-mounted from `workspace/api`
- Runs as **non-root**, mapped to the host login user (the image already has a `node` user at uid/gid 1000, so `HOME` resolves to `/home/node`)
- Started only after `ict-db` reports **healthy**

Current health check verifies the runtime is up and the bind mount is writable:

```
node -e "const fs=require('fs');fs.accessSync('/workspace',fs.constants.W_OK);process.exit(0)"
```

This is a liveness probe, not a port probe. Once the API app actually listens on `3080`, replace it with a readiness probe:

```yaml
test:
  [
    "CMD",
    "node",
    "-e",
    "require('net').connect(3080,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))",
  ]
```

Be aware that `ict-web` waits for `ict-api` to be healthy — with a port probe in place, a fresh `docker compose up` will stop at the API stage until something is actually listening on `3080`.

[Back to Table of Contents](#table-of-contents)

<a id="ict-db--microsoft-sql-server-2025" name="ict-db--microsoft-sql-server-2025"></a>

### `ict-db` — Microsoft SQL Server 2025

Runs the official SQL Server image, which Microsoft publishes on the Microsoft Container Registry (`mcr.microsoft.com`), not Docker Hub.

| Setting        | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Edition        | `MSSQL_PID: Express` (free, full-featured, non-production)   |
| Port           | `1433` inside the container, published as `1433` on the host |
| SA password    | `MSSQL_SA_PASSWORD` (change the default before real use)     |
| EULA           | `ACCEPT_EULA: "Y"` is required for the container to start    |
| Data directory | `/var/opt/mssql`, bind-mounted from `workspace/db`           |

> **Change the password.** `Your_Strong_Password123` is a placeholder, not a usable credential. Before you develop against this database, edit `MSSQL_SA_PASSWORD` in `docker-compose.yml` to a password of your choosing. SQL Server enforces a complexity policy — at least 8 characters, mixing upper case, lower case, digits, and symbols. A password that fails the policy does not degrade gracefully: setup aborts with `Unable to set system administrator password: Password validation failed`, the container exits with code 255, and `restart: unless-stopped` keeps cycling it.

Because the password is only read when the database is **first initialised**, changing it later has no effect on an existing `workspace/db`. To apply your new password you must stop the stack and wipe the data directory:

```bash
docker compose down
sudo rm -rf workspace/db/*
mkdir -p workspace/db && sudo chown 10001:10001 workspace/db
docker compose up -d
```

If you want to change the password on the _existing_ database instead of resetting it, do it in SQL:

```bash
docker compose exec ict-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '<current password>' -C \
  -Q "ALTER LOGIN sa WITH PASSWORD = '<new password>'"
```

Either way, update `MSSQL_SA_PASSWORD` in `docker-compose.yml` to match — the health check and every tool you connect with read the value from there.

Health check runs `sqlcmd` against `localhost` and only passes once the server answers queries:

```yaml
test:
  [
    "CMD-SHELL",
    '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$$MSSQL_SA_PASSWORD" -C -Q ''SELECT 1'' -b -o /dev/null',
  ]
```

`start_period` is 40 seconds because SQL Server needs time to initialise (or upgrade) its system databases — expect the first start to sit in `Waiting` for a while.

**Permissions:** the image runs as uid `10001` (user `mssql`), so the bind-mounted host directory must be writable by that user. If `workspace/db` is owned by your own account, SQL Server fails at startup with:

```
The system directory [/.system] could not be created ... Access Denied
```

and restart-loops. Fix it once with either:

```bash
sudo chown 10001:10001 workspace/db     # preferred
# or
chmod 777 workspace/db
```

Connecting from the host (requires `sqlcmd` / `mssql-tools18` installed on the host):

```bash
sqlcmd -S localhost,1433 -U sa -P 'Your_Strong_Password123' -C -Q "SELECT @@VERSION"
```

Or use the tools that ship inside the DB image itself, no host install needed:

```bash
docker compose exec ict-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Your_Strong_Password123' -C -Q "SELECT @@VERSION"
```

From another container on the same Compose network, address the server by service name:

```bash
sqlcmd -S ict-db -U sa -P 'Your_Strong_Password123' -C
```

[Back to Table of Contents](#table-of-contents)

---

<a id="project-structure" name="project-structure"></a>

## Project structure

```
nap-dev-fullstack/
├── docker-compose.yml       # the three-service stack, health checks and start order
├── README.md
└── workspace/               # bind-mounted into the containers
    ├── web/                 # ict-web  -> /workspace  (HTML + CSS + JavaScript)
    ├── api/                 # ict-api  -> /workspace  (Node.js backend)
    └── db/                  # ict-db   -> /var/opt/mssql (SQL Server data + logs)
        ├── data/            # system and user database files (.mdf/.ldf)
        ├── log/             # SQL Server error log
        ├── secrets/         # generated machine key material
        └── .system/         # internal system directory
```

`workspace/` is host-owned working data. Edit files there from the host and they are visible in the containers immediately — no rebuild or image copy needed. `workspace/db` is runtime state created by SQL Server, not source code; back it up or delete it to reset the database.

The bind mount is the reason both application services run as your host uid/gid: files written inside the container come out owned by you, so nothing ends up `root`-owned and undeletable on the host.

[Back to Table of Contents](#table-of-contents)

---

<a id="start-order" name="start-order"></a>

## Start order

Enforced with `depends_on` plus health checks:

1. `ict-db` starts and is polled until `sqlcmd` returns successfully → **healthy**
2. `ict-api` starts only then, and is polled until its health check passes → **healthy**
3. `ict-web` starts only then

`depends_on` with `condition: service_healthy` governs **startup only**. If a dependency dies later, Compose does not stop its dependents; use `restart: unless-stopped` together with your app's own reconnect logic for runtime resilience.

[Back to Table of Contents](#table-of-contents)

---

<a id="usage" name="usage"></a>

## Usage

Start everything:

```bash
docker compose up -d
```

Check status and health:

```bash
docker compose ps
docker compose ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'
```

Watch the startup sequence:

```bash
docker compose logs -f
docker compose logs -f ict-db     # waiting for "ready for client connections"
```

Open a shell in a service (as the non-root user):

```bash
docker compose exec ict-web bash
docker compose exec ict-api bash
```

Stop the containers (keeps `workspace/`):

```bash
docker compose down
```

Reset the database completely:

```bash
docker compose down
sudo rm -rf workspace/db/*
mkdir -p workspace/db && sudo chown 10001:10001 workspace/db
```

[Back to Table of Contents](#table-of-contents)

---

<a id="working-inside-a-container" name="working-inside-a-container"></a>

## Working inside a Container

The `ict-web` and `ict-api` containers are Linux environments you write code in, not just processes. You can drive them entirely from VS Code, so the editor, terminal, and file tree all operate _inside_ the container while the files stay on your host through the bind mount.

[Back to Table of Contents](#table-of-contents)

<a id="1-open-the-project-folder-in-vs-code-from-the-terminal" name="1-open-the-project-folder-in-vs-code-from-the-terminal"></a>

### 1. Open the project folder in VS Code from the terminal

```bash
cd /path/to/nap-dev-fullstack
code .
```

Notes:

- Use the **same host user** that owns `workspace/` (uid 1000 in this setup), so files created by the container appear owned by you.
- If `code` is not found, install the shell command once: open VS Code → `Cmd/Ctrl + Shift + P` → **Shell Command: Install 'code' command in PATH**, then reopen your terminal.
- `code -n .` forces a new window if one is already open for this folder.

[Back to Table of Contents](#table-of-contents)

<a id="2-attach-vs-code-to-a-running-container" name="2-attach-vs-code-to-a-running-container"></a>

### 2. Attach VS Code to a running container

Install the **Dev Containers** extension by Microsoft first (`ms-vscode-remote.remote-containers`) — this workflow does not need a `devcontainer.json`, only the extension. Then:

1. Start the stack: `docker compose up -d`
2. Open this project folder in VS Code (step 1)
3. `Cmd/Ctrl + Shift + P` → **Dev Containers: Attach to Running Container…**
4. Pick **`ict-web`** or **`ict-api`** from the list

A new window opens connected to that container. The bottom-left corner shows the container name, and **Terminal → New Terminal** gives you a shell inside it. From there you can also right-click a running container in the **Docker** view and choose **Attach Visual Studio Code**.

On first attach, VS Code installs its server component into the container's `$HOME`:

| Service   | Container `$HOME`                   | Where the VS Code server lives        | Survives `docker compose down`?       |
| --------- | ----------------------------------- | ------------------------------------- | ------------------------------------- |
| `ict-api` | `/home/node`                        | inside the container's writable layer | No — it is inside the container layer |
| `ict-web` | `/workspace` (host `workspace/web`) | `workspace/web/.vscode-server`        | Yes — it is on the bind mount         |

Both containers run as **uid 1000**, so the server install succeeds without `sudo`. Neither requires elevated privileges, and you should not attach as root.

Practical details specific to this scaffold:

- **The attached window's folder is `/workspace`, not the repo root.** In `ict-web` you see only `workspace/web`; in `ict-api` only `workspace/api`. `docker-compose.yml`, `README.md`, and the sibling service folders are not mounted into the containers — edit those from the host window.
- **Extensions are per-container.** Those installed "on the container" are persisted in the same `$HOME` location as the server, so they are lost for `ict-api` when the container is recreated but kept for `ict-web`.
- **Prefer the API container for Node tooling.** `ict-web` has no Node, so in that window the integrated terminal works but there is no JS runtime, no `npm`, and no debugger for Node.
- **Do not attach to `ict-db`.** The SQL Server image is a single-purpose appliance: the shell runs as uid `10001`, and its `$HOME` (`/home/mssql`) is not writable, so VS Code cannot install its server. Use `sqlcmd` through `docker compose exec` instead, as shown in the `ict-db` section.
- **Prefer rebuilding over reinstalling.** Because this scaffold has no `Dockerfile`, the server and any container-installed tooling are ephemeral for `ict-api`. If you need a repeatable toolchain, add a `Dockerfile` (installing OS packages and, if you like, the Dev Containers features) rather than installing by hand each time.

[Back to Table of Contents](#table-of-contents)

---

<a id="3-close-remote-connection" name="3-close-remote-connection"></a>

### 3. Close Remote Connection

Disconnecting is independent of stopping the container. Three equivalent ways to end the session:

1. **Status bar** — click the green remote indicator in the bottom-left corner (`><` icon, labelled with `ict-web` or `ict-api`) and choose **Close Remote Connection**.
2. **Command Palette** — `Cmd/Ctrl + Shift + P` → **Remote: Close Remote Connection**.
3. **Close the window** — close the VS Code window that is connected to the container. The local window for this repo is a separate window and is unaffected.

The same commands exist on the **File** menu of the remote window.

After closing:

- **The container keeps running.** Use `docker compose ps` to confirm, `docker compose stop` to stop it, or `docker compose down` to remove the containers.
- **Reattach** with **Dev Containers: Attach to Running Container…** — you land back in the same container with your files intact, because they live on the bind mount.
- **Reverse order also works.** If you stop the container while still attached (`docker compose stop ict-api`), the window drops to a disconnected state; start the container and attach again to recover.
- **The VS Code server stays behind.** For `ict-web` it is in `workspace/web/.vscode-server` and persists on the host — delete that folder if you want a clean slate. For `ict-api` it lives inside the container's writable layer, so it is discarded when the container is recreated.
- **Foreground processes end with the session.** Anything you started in the integrated terminal (for example `npm run dev`) is tied to that terminal and stops when the session closes; detached processes keep running until the container is stopped.

[Back to Table of Contents](#table-of-contents)

---

<a id="ports-summary" name="ports-summary"></a>

## Ports summary

| Host   | Container | Service                     |
| ------ | --------- | --------------------------- |
| `5500` | `5500`    | `ict-web` — front end       |
| `3080` | `3080`    | `ict-api` — HTTP API        |
| `1433` | `1433`    | `ict-db` — TDS / SQL Server |

All three bind to `0.0.0.0`, so they are reachable from other machines on your network. Change to `127.0.0.1:5500:5500` style mappings if you want them local to the host only.

[Back to Table of Contents](#table-of-contents)

---

<a id="notes" name="notes"></a>

## Notes

- Set a real `MSSQL_SA_PASSWORD` before using this beyond local development; the default is a placeholder.
- The API container does not know the database credentials yet — pass them as environment variables (e.g. `MSSQL_HOST=ict-db`, `MSSQL_USER=sa`, `MSSQL_PASSWORD=...`) when you build the backend.
- `ict-web` and `ict-api` run `sleep infinity` so the containers stay up with only base images; nothing is listening until you put an app in `workspace/web` and `workspace/api`.
- No npm dependencies are installed anywhere by design — bring your own `package.json` and install what your project needs.

[Back to Table of Contents](#table-of-contents)
