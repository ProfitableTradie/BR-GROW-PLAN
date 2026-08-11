# Getting this live at br-grow-plan.onrender.com

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

## Step 4 — Create the site

Get an API key: Render → avatar → **Account Settings** → **API Keys** → **Create API Key**. Copy it.

```sh
export RENDER_API_KEY=rnd_paste_your_key_here
./render-create.sh
```

It finds your workspace, creates the static site named `br-grow-plan`, and prints the dashboard link. First build takes a minute or two.

**Prefer clicking?** Skip the key entirely: Render → **New** → **Blueprint** → pick `BR-GROW-PLAN` → **Apply**. `render.yaml` in the repo already specifies everything, so there's nothing to fill in.

---

## Step 5 — Confirm it actually works

```sh
open "https://br-grow-plan.onrender.com/?selftest=1"
```

Should say **51 passed · 0 failed**. That's the maths verified on the live site, not just on a laptop.

Then check the plain URL loads the app and the top bar reads **Boardroom Growth Plan v2.1**.

---

## Updating it later

```sh
cd ~/Downloads/BR-GROW-PLAN
# replace public/index.html with the new build, then:
git add -A && git commit -m "Update" && git push
```

Render redeploys on its own. `autoDeploy` is on.

---

## When it goes wrong

**`br-grow-plan.onrender.com` shows someone else's site, or the URL has a suffix**
Service names are global on Render. If `br-grow-plan` was taken, Render appended something. The real URL is printed by the script and shown in the dashboard.

**Build succeeds, page is blank or 404**
Publish directory isn't `public`. Service → Settings → Build & Deploy → set **Publish directory** to `public`, leave **Build command** empty, then Manual Deploy.

**`permission denied: ./build.sh`**
Only happens if the files were uploaded through the GitHub website, which strips the execute bit. Leave the build command empty — `public/index.html` is committed already built — or set it to `sh ./build.sh`.

**Deploy log says it can't clone the repository**
Step 3 wasn't done, or the GitHub App wasn't granted this specific repo.

**Everything loads but Save doesn't write back into the file**
Expected on Safari and Firefox — they don't support the File System Access API and fall back to a download. Chrome and Edge save in place. It also needs HTTPS, which Render gives you.
