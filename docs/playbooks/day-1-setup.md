# Day 1 — Step-by-Step Setup Guide

The first day. Follow this exactly. Don't improvise. By the end, you'll have everything installed and Claude Code will be running in a terminal, ready to start Wave 1 tomorrow.

Estimated time: **2–3 hours** (mostly waiting for installs and account approvals).

## Step 1: Install software (45 minutes)

### 1.1 Node.js v20 LTS

- Go to https://nodejs.org/en/download
- Pick "LTS" version for your operating system
- Download and run the installer
- After install, open a terminal (Mac: Terminal app; Windows: Command Prompt or PowerShell; Linux: your usual terminal)
- Type `node --version` and press Enter
- Expected output: `v20.something`

If you don't see that, the install didn't work. Restart your terminal and try again. If still nothing, restart your computer.

### 1.2 Git

- Mac: `git` is usually preinstalled. Type `git --version` to verify.
- Windows: Download from https://git-scm.com/download/win and install with default settings.
- Linux: Use your package manager (`sudo apt install git` on Ubuntu).
- Verify: `git --version` should show something.

### 1.3 VS Code

- Go to https://code.visualstudio.com
- Download for your OS
- Install with default settings
- Open it once to make sure it works

### 1.4 Claude Code CLI

In your terminal:

```bash
npm install -g @anthropic-ai/claude-code
```

Wait for it to finish (1–2 minutes). Then verify:

```bash
claude --version
```

Should show a version number.

### 1.5 Azure CLI

- Mac: Install Homebrew first if you don't have it (https://brew.sh), then run `brew install azure-cli`
- Windows: Download from https://aka.ms/installazurecliwindows and run the MSI
- Linux: Follow https://learn.microsoft.com/cli/azure/install-azure-cli-linux

Verify with `az --version`.

## Step 2: Create accounts (30 minutes active, 24 hours waiting)

### 2.1 Claude Pro ($20/month)

- Go to https://claude.ai
- Sign up (use the email you'll use for GitHub too — keeps things simple)
- Upgrade to Pro from the settings menu
- Pro is needed because Claude Code uses your Pro account

### 2.2 GitHub (free)

- Go to https://github.com
- Sign up
- Confirm your email

### 2.3 Supabase (free)

- Go to https://supabase.com
- Sign up (you can use "Sign in with GitHub" to skip account creation)
- Don't create a project yet — we'll do that in Wave 1

### 2.4 Azure for Students ($100 credit)

- Go to https://azure.microsoft.com/free/students
- Click "Activate now"
- Sign in with your student email (must end in `.edu` or your university's domain)
- Verify your student status (the form asks for university name)
- Wait for approval — usually 30 minutes, occasionally up to 24 hours

While you wait, continue with Step 3.

## Step 3: Set up the project folder (15 minutes)

### 3.1 Pick a location

Create a folder somewhere sensible. Examples:
- Mac: `~/Projects/reearth-demo`
- Windows: `C:\Users\YourName\Projects\reearth-demo`
- Linux: `~/projects/reearth-demo`

### 3.2 Unzip the starter kit

You should have received a zip file (`reearth-pilot-starter.zip`). Unzip it. Move the contents into the folder you just created.

### 3.3 Initialize Git

In your terminal:

```bash
cd ~/Projects/reearth-demo
git init
git add .
git commit -m "Initial project scaffold"
```

(Adjust the path for your OS.)

### 3.4 Open in VS Code

```bash
code .
```

VS Code opens with the project. The file tree on the left should show `CLAUDE.md`, `docs/`, `web/`, `.claude/`, etc.

### 3.5 Install the Claude Code VS Code extension

In VS Code:
- Click the Extensions icon (left sidebar, looks like four squares)
- Search for "Claude Code"
- Install the official extension

## Step 4: First Claude Code conversation (15 minutes)

### 4.1 Open a terminal in VS Code

In VS Code: View → Terminal (or Ctrl+`)

### 4.2 Start Claude Code

In the terminal, type:

```bash
claude
```

It'll open a login flow in your browser. Approve. The terminal will confirm you're authenticated.

### 4.3 First conversation

Once Claude Code is ready, paste this exactly:

```
Read CLAUDE.md, README.md, docs/vertical-slice-spec.md, docs/decisions.md, docs/playbooks/current-wave.md, and docs/playbooks/how-to-direct-claude.md. After reading, summarize what you understand about:

1. What this project is
2. What we're building first (Wave 1)
3. The architect-developer relationship
4. Any rules or constraints you noticed

Then ask me 2–3 clarifying questions before we start anything. Do NOT write any code or make any changes.
```

Claude Code will read everything and reply. Read its response carefully. If it understood correctly, you're aligned.

If it asks questions, answer them.

### 4.4 Verify Claude Code is configured

After the first reply, try:

```
/orient
```

This is a slash command we set up. Claude Code should re-read context, identify Wave 1's first task (Task 1.0 — Initialize Next.js project), and propose a plan using the planner subagent. Don't approve the plan yet — that's Day 2's work.

### 4.5 End the session cleanly

Run:

```
/end-session
```

Claude Code will summarize the session.

## Step 5: Wait for Azure (whatever's remaining of the 24 hours)

Once Azure for Students is approved, you'll get an email. When you see "Welcome to Azure for Students":

1. Open terminal: `az login`
2. A browser opens, authenticate with the same email
3. Verify with `az account show`

Don't provision anything yet. Wave 1 will guide that.

## Day 1 done

By end of Day 1:

- [x] Software installed (Node, Git, VS Code, Claude Code, Azure CLI)
- [x] Accounts created (Claude Pro, GitHub, Supabase, Azure for Students)
- [x] Project folder set up with starter kit
- [x] Git initialized with first commit
- [x] First Claude Code conversation completed
- [x] Slash commands tested (`/orient`, `/end-session`)
- [x] Azure CLI authenticated (when approval comes through)

Tomorrow: Wave 1 begins.

## Common Day 1 issues

**"npm install -g failed with permission error"**
- Mac/Linux: try `sudo npm install -g @anthropic-ai/claude-code`. Better: configure npm to install globally without sudo.
- Windows: run terminal as Administrator.

**"claude command not found"**
- Restart terminal after npm install
- Verify global npm path: `npm config get prefix`
- Add that path's `bin/` to your PATH environment variable

**"VS Code 'code' command not found in terminal"**
- Mac: in VS Code, Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"
- Windows: usually works automatically after install

**"Claude Code asks me to log in repeatedly"**
- Make sure you're using the same email everywhere
- Make sure you're on Claude Pro
- Try `claude logout` then `claude` again

**"Azure for Students rejected my email"**
- Double-check your university is on the approved list
- Try alternative ID verification (student ID upload)
- Last resort: use a free Azure trial ($200 credit, 30 days)

**Claude Code seems confused / drifts off task**
- Stop, run `/orient` to re-orient
- Re-read `docs/playbooks/how-to-direct-claude.md`
- Push back: "That's not in the spec. Re-read vertical-slice-spec.md"

## When you're ready for Day 2

Tell me: "Day 1 complete." I'll walk you through Day 2 (starting Wave 1 Task 1.0).
