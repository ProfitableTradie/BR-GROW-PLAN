# Getting this live at boardroom-growth-plan.onrender.com

Four steps. Copy each block into Terminal in order. Stop if one errors — the next won't work.

---

## Step 0 — Do you have the tools?

```sh
git --version && curl --version | head -1
```

Both ship with macOS. If `git` prompts you to install Command Line Tools, say yes and re-run.

Optional but it makes step 2 one command instead of six:

```sh
brew install gh
```

---

## Step 1 — Unpack the app

```sh
cd ~/Downloads
unzip -o BR-GROW-PLAN.zip -d BR-GROW-PLAN
cd BR-GROW-PLAN
ls
```

You should see `public`, `src`, `render.yaml`, `build.sh`, `README.md`.

---

## Step 2 — Put it on GitHub

### With the `gh` CLI (creates the repo and pushes in one go)

```sh
gh auth login          # once: GitHub.com → HTTPS → browser
git init -b main
git add -A
git commit -m "BR Grow Plan v2.1"
gh repo create ProfitableTradie/BR-GROW-PLAN --private --source=. --push
```

### Without `gh`

Create the repo first at **github.com/organizations/ProfitableTradie/repositories/new** — name it `BR-GROW-PLAN`, private, and **do not** tick "Add a README". Then:

```sh
git init -b main
git add -A
git commit -m "BR Grow Plan v2.1"
git remote add origin https://github.com/ProfitableTradie/BR-GROW-PLAN.git
git push -u origin main
```

If it asks for a password, GitHub wants a **personal access token**, not your account password — github.com → Settings → Developer settings → Personal access tokens.

Check it worked:

```sh
git ls-remote --heads origin
```

Should print a `refs/heads/main` line.

---

## Step 3 — Let Render see the repo

The repo is private, so Render can't clone it until its GitHub App is installed on the org. **Do this before step 4 or the deploy will fail with a clone error.**

Render dashboard → avatar (top right) → **Account Settings** → **GitHub** → **Configure** → pick the **ProfitableTradie** org → grant access to `BR-GROW-PLAN`.

One-off. Skip it only if Render already deploys other repos from that org.

---

## Step 4 — Point the site at this repo

There is **already a live site** at `boardroom-growth-plan.onrender.com`. It was built from the predecessor repo (`ProfitableTradie/boardroom-growth-plan`, lowercase) and serves a saved-page capture, not the build in this repo. So this step is *repointing an existing service*, not creating one.

The URL comes from the service **name**, so keep the service named `boardroom-growth-plan`. Rename it and every link members hold breaks.

Render dashboard → the **boardroom-growth-plan** service → **Settings**:

| Setting | Value |
|---|---|
| Repository | `ProfitableTradie/BR-GROW-PLAN` |
| Branch | `main` |
| Build command | `sh ./build.sh` |
| Publish directory | `./public` |
| Auto-deploy | On |

Save, then **Manual Deploy → Deploy latest commit** to pick it up immediately.

If Render won't let you change the repository on an existing service, the fallback is to delete that service and re-create it **with the same name** so the hostname is preserved — Render frees the name for reuse once the service is gone. Blueprint route: Render → **New** → **Blueprint** → pick `BR-GROW-PLAN` → **Apply**; `render.yaml` already declares the name, build command and publish path, so there is nothing to fill in.

Do **not** run `./render-create.sh` here — it creates a service and will collide with the existing name.

---

## Step 5 — Confirm it actually works

```sh
open "https://boardroom-growth-plan.onrender.com/?selftest=1"
```

Should say **122 passed · 0 failed**. That's the maths verified on the live site, not just on a laptop.

Then check the plain URL loads the app and the top bar reads **Boardroom Growth Plan v2.9**.

---

## Updating it later

Edit the **source fragments**, never the built HTML — `public/index.html` and `BR-Grow-Plan.html` are build outputs and any hand-edit to them is overwritten by the next build.

```sh
cd ~/Claude/Projects/boardroom-growth-plan/BR-GROW-PLAN
# edit the relevant file in src/, then:
sh ./build.sh
```

Check it before pushing — open `public/index.html?selftest=1`, or run the dev server:

```sh
npm run dev
```

Then `http://localhost:3000/?selftest=1` should say **122 passed · 0 failed**. Only then:

```sh
git add -A && git commit -m "What changed" && git push
```

Render redeploys on its own — `autoDeploy` is on, and it runs `sh ./build.sh` itself, so the committed outputs and the deployed ones stay in step.

---

## When it goes wrong

**The site still shows the old version after a deploy**
Check which repo the service is actually building from — Service → Settings → Repository. Until v2.5 the live site was fed by the predecessor repo `ProfitableTradie/boardroom-growth-plan` (lowercase), so pushing to `BR-GROW-PLAN` changed nothing visible. It must say `BR-GROW-PLAN`.

**A new URL appeared with a suffix on it — `boardroom-growth-plan-myi4.onrender.com`**

This happened for real on 18 Aug 2026 and took several rounds to sort out, so the whole procedure is written down here.

Two Render rules cause it, and the second is the one that catches people:

1. `.onrender.com` names are **globally unique across every Render account**, not just yours. If the name is taken, Render silently appends a random suffix and deploys anyway — reporting a green *"Deploy live"* that is perfectly true and completely useless, because members are still on the old URL.
2. **Renaming a service does not move its hostname.** The subdomain is claimed when the service is *created*. Renaming `…-myi4` to `boardroom-growth-plan` changes only the dashboard label; the URL stays put. There is no setting that moves it.

Together those mean the fix is never "rename it". The service has to be **created while the name is free**:

1. Find and delete whatever holds the name. Check *every* project group in the workspace — the dashboard list is scoped to one project and hides the rest. `⌘K` → search the name finds them all.
2. **Verify the name is actually free before going further.** Load `https://boardroom-growth-plan.onrender.com` and confirm you get a bare `404 Not Found` (about 10 bytes) with no `last-modified` header. Anything else means something still holds it. This check is worth doing properly — a delete dialog that wants you to type the service name is easy to abandon halfway believing it worked.
3. Delete the suffixed service too. Nothing is lost: it rebuilds from the commit on GitHub in about a minute.
4. **New → Blueprint → `BR-GROW-PLAN` → Apply.** Confirm the name shown on the review screen has no suffix *before* clicking. `render.yaml` declares the name, so with it free the service is created on the right hostname.
5. Don't leave a gap between 3 and 4 — the name is globally unclaimed in that window.

If step 2 will not come back clean, the name is held by an account you don't control and no amount of deleting will free it. Attach a custom domain to the suffixed service instead (Settings → Custom Domains) — which is the better answer anyway, since it survives any future move off Render.

**How to tell which build is actually being served**, without trusting the dashboard:

| Signal | This repo's build | Anything else |
|---|---|---|
| `referrer-policy` response header | `strict-origin-when-cross-origin` | absent |
| `cache-control` response header | `no-cache, must-revalidate` | Render default `public, max-age=0, s-maxage=300` |
| `last-modified` | the deploy time | an older date |
| External requests | **none** | e.g. Google Fonts |
| `/?selftest=1` | `122 passed · 0 failed` | no self-test at all |

Those two headers exist only because `render.yaml` declares them, so they are proof the deploy came from this repo. `last-modified` is the fastest way to spot a deploy that never happened.

**Build succeeds, page is blank or 404**
Publish directory isn't `public`. Service → Settings → Build & Deploy → set **Publish directory** to `public`, leave **Build command** empty, then Manual Deploy.

**`permission denied: ./build.sh`**
Only happens if the files were uploaded through the GitHub website, which strips the execute bit. Leave the build command empty — `public/index.html` is committed already built — or set it to `sh ./build.sh`.

**Deploy log says it can't clone the repository**
Step 3 wasn't done, or the GitHub App wasn't granted this specific repo.

**Everything loads but Save doesn't write back into the file**
Expected on Safari and Firefox — they don't support the File System Access API and fall back to a download. Chrome and Edge save in place. It also needs HTTPS, which Render gives you.
