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

Then check the plain URL loads the app and the top bar reads **Boardroom Growth Plan v2.5**.

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

**A new URL appeared with a suffix on it**
Service names are global on Render, and the hostname follows the name. If you created a second service instead of repointing the existing one, you now have two — delete the new one and repoint `boardroom-growth-plan` instead, so members' links keep working.

**Build succeeds, page is blank or 404**
Publish directory isn't `public`. Service → Settings → Build & Deploy → set **Publish directory** to `public`, leave **Build command** empty, then Manual Deploy.

**`permission denied: ./build.sh`**
Only happens if the files were uploaded through the GitHub website, which strips the execute bit. Leave the build command empty — `public/index.html` is committed already built — or set it to `sh ./build.sh`.

**Deploy log says it can't clone the repository**
Step 3 wasn't done, or the GitHub App wasn't granted this specific repo.

**Everything loads but Save doesn't write back into the file**
Expected on Safari and Firefox — they don't support the File System Access API and fall back to a download. Chrome and Edge save in place. It also needs HTTPS, which Render gives you.
