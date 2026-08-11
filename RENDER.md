# Deploying to Render

The app is one self-contained HTML file, so the right shape on Render is a **Static Site** — no server, no cold starts, works on the free tier. This repo also ships a zero-dependency Node server in case the service you already have is a **Web Service** instead.

Both paths run the same `./build.sh`, which concatenates the source fragments in `src/` into `public/index.html`.

```
src/*                 → build.sh → public/index.html   ← what Render serves
                                 → BR-Grow-Plan.html           ← copy you can email
```

---

## Path A — Static Site (recommended)

### The build command is optional

`public/index.html` is committed to the repo, already built. So a static site works with **no build command at all** — just publish `./public`. Set a build command only if you want Render to rebuild from `src/` on every deploy.

If you uploaded these files through the GitHub website rather than pushing with git, the execute bit on `build.sh` is lost and `./build.sh` will fail with *permission denied*. Use `sh ./build.sh`, or leave the build command empty.

### If you already have a service on Render

Point it at this repo and set:

| Setting | Value |
|---|---|
| Build command | `sh ./build.sh` — or leave it empty, see below |
| Publish directory | `public` |

Deploy. Nothing else changes — same service, same URL.

### From scratch, via the Blueprint

`render.yaml` in the repo root already defines the service. In Render: **New → Blueprint**, pick the repo, apply. It creates:

- a static site named `boardroom-growth-plan`
- `Cache-Control: no-cache, must-revalidate` on every path, so a member never opens a stale copy after you deploy
- a rewrite so any URL serves the app
- pull-request previews, so a change gets its own URL before it goes live

### From scratch, without the Blueprint

**New → Static Site**, connect the repo, then:

- **Build command:** `sh ./build.sh` (or empty)
- **Publish directory:** `public`

---

## Path B — Web Service

Use this only if your existing service is already a Web Service and you would rather not convert it.

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `sh ./build.sh` — or leave it empty, see below |
| Start command | `node server.js` |
| Health check path | `/healthz` |

`server.js` is ~40 lines of Node standard library — no `npm install`, no dependencies, nothing to keep patched. It binds `process.env.PORT`, serves `public/`, falls back to the app for any unknown path, refuses path traversal, and answers `/healthz` with `{"status":"ok"}`.

To switch `render.yaml` over, comment out the static block and uncomment the Web Service block at the bottom of the file.

Note that a free-tier Web Service sleeps after inactivity, so the first load after a quiet period takes a few seconds. A static site does not.

---

## Pushing this to a NEW repo

The remote is already set to `ProfitableTradie/BR-GROW-PLAN`. Create that repo on GitHub first (empty — no README, no .gitignore, no licence), then:

```sh
tar xzf BR-GROW-PLAN.tar.gz
cd BR-GROW-PLAN
git push -u origin main
```

Or just run `./deploy.sh`, which does the same thing and refuses to overwrite an existing `main`.

If your existing `main` has history you want to keep, fetch and merge instead of force-pushing:

```sh
git remote -v                       # confirm origin is ProfitableTradie/boardroom-growth-plan
git fetch origin
git rebase origin/main              # or: git merge origin/main
git push -u origin main
```

Render redeploys automatically on push if auto-deploy is on for the service.

---

## After it is live

- **Check it over HTTPS.** Save-in-place uses the File System Access API, which browsers only allow in a secure context. Render serves HTTPS, so this works on the deployed URL but not if you open the file over plain `http://`.
- **Run the self-test** on the live URL: append `?selftest=1` to the address. It runs 51 checks with hand-calculated expected answers and prints pass/fail. Worth doing after every deploy.
- **Nothing is stored on the server.** The app holds a member's data in memory and saves it to a `.json` file on their own machine. There is no database, no session, no upload. That is why a static site is enough, and it is also the honest answer if a member asks where their numbers live.

---

## Local development

```sh
./build.sh                 # rebuild public/index.html from src/
npm run dev                # build, then serve on http://localhost:3000
```

Or just open `public/index.html` directly — everything works except save-in-place, which needs a secure context.

Edit a fragment in `src/`, re-run `./build.sh`. There is no bundler, no watch mode and no `node_modules`.
