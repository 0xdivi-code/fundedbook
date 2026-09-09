# FundedBook setup — for non-coders (no coding, no terminal)

This guide takes you from zero to a **live trading journal on the internet**,
with all your data stored in a **private cloud database** — using only free
plans and copy/paste. About 15 minutes.

> Prefer to run it on your own computer instead? There's a
> [section for that at the bottom](#prefer-running-it-on-your-own-computer).

## What you need

- ~15 minutes
- Your GitHub account (you already have it — that's where this code lives)
- An email address

---

## Step 1 — Put the new code on `main` (one click)

The new features (cloud database + welcome tour) live on a branch until the
pull request is merged:

1. Open the repo on GitHub → **Pull requests** → the open pull request
   *"Move journal storage to Supabase Postgres + guided onboarding tour"*.
2. Click **Merge pull request** → **Confirm merge**.

## Step 2 — Create your free database (Supabase)

Supabase is the free service that stores your trades and handles sign-in.

1. Go to [supabase.com](https://supabase.com) → **Start your project** →
   **Continue with GitHub** (one less password to remember).
2. Click **New project**.
3. **Name**: `fundedbook` · **Database Password**: click **Generate a
   password** and save it in your notes · **Region**: the one closest to you.
4. Click **Create new project** and wait 1–2 minutes while it builds.

## Step 3 — Create the database tables (copy + paste, one time only)

Think of this as unboxing the shelves your trades will sit on.

1. In your new Supabase project, click **SQL Editor** in the left menu.
2. Click **New query** (the **+**).
3. Open
   [supabase/schema.sql](https://github.com/0xdivi-code/fundedbook/blob/main/supabase/schema.sql)
   in this repo and click the **Copy raw contents** button (top-right of the
   file box).
4. Paste it into the Supabase query box and click **Run**.
5. You should see **Success**. Done — you never have to do this again.

## Step 4 — Copy your two keys

1. In Supabase, click the gear icon (**Project Settings**).
2. Open **API Keys** (on some layouts it's under **Data API**).
3. Copy these two values into your notes and **label them**:

   - **Project URL** — looks like `https://abcdxyz.supabase.co`
   - **anon public** key — a long string of letters and numbers

## Step 5 — Put your journal on the internet (free, ~2 minutes)

Vercel is a free hosting service that runs websites from GitHub repos.

1. Go to [vercel.com](https://vercel.com) → **Sign Up** → **Continue with
   GitHub**.
2. Click **Add New…** → **Project**.
3. Find `fundedbook` in the list and click **Import**.
   (Not listed? Click **Adjust GitHub App Permissions**, allow access, retry.)
4. **Important — before clicking Deploy**, scroll to **Environment
   Variables** and add these two, exactly as written (copy/paste the names!):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your **Project URL** from Step 4 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your **anon public** key from Step 4 |

5. Click **Deploy** and wait ~2 minutes.
6. You'll get a live address like `https://fundedbook-xyz.vercel.app` —
   open it. Your journal is live! 🎉

## Step 6 — Connect the email sign-in

Back in Supabase:

1. Click **Authentication** in the left menu (shield icon) → **URL
   Configuration** tab.
2. **Site URL**: paste your Vercel address → **Save**.
3. Under **Redirect URLs**, click **Add URL** and paste:
   `https://YOUR-ADDRESS.vercel.app/auth/confirm` → **Save**.
4. Optional, while you're here: **Sign In / Up** tab → **Email** provider →
   turn **Confirm email** **OFF** while you're testing (no inbox-checking),
   and back **ON** when real people start using it.

## Step 7 — Create your account and take the tour

1. Open your live address → **Create an account**.
2. If Confirm email is ON, click the link in your inbox.
3. The **welcome tour pops up automatically** and walks you through every
   feature with Next / Skip buttons. Log your first trade!

### Already had trades in the old version?

The old version stored trades in your browser. Sign in **once on that same
browser** — FundedBook uploads them to your new database automatically and
cleans up the browser copy. From then on your journal follows your account on
any device.

---

## Prefer running it on your own computer?

A bit more clicking, but no website needed:

1. **Install Node.js**: go to [nodejs.org](https://nodejs.org) → click the
   big green button (LTS) → install with the defaults.
2. **Download this code**: repo page on GitHub → green **<> Code** button →
   **Download ZIP** → unzip it.
3. **Create the settings file** (this replaces the Vercel step):
   - Open **Notepad** (Windows) or **TextEdit** (Mac — first do
     Format → **Make Plain Text**).
   - Paste these two lines, replacing the placeholders with your values from
     Step 4:
     ```
     NEXT_PUBLIC_SUPABASE_URL=paste-your-project-url-here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
     ```
   - Save it **inside the unzipped `fundedbook` folder** named exactly
     `.env.local` — with the dot, no `.txt` at the end.
     (In Notepad: set *Save as type* to **All Files** and type the name
     `".env.local"` in quotes so it doesn't add `.txt`.)
4. **Open a command window in that folder**:
   - Windows: open the folder, click the **address bar**, type `cmd`, Enter.
   - Mac: open **Terminal**, type `cd ` (with the space), drag the folder
     onto the window, Enter.
5. Type `npm install` → Enter (a few minutes; lots of scrolling text is
   normal).
6. Type `npm run dev` → Enter.
7. Open **http://localhost:3000** in your browser.
8. One-time only: in Supabase → Authentication → URL Configuration → Redirect
   URLs, add `http://localhost:3000/auth/confirm`.

To stop it later: click the command window and press `Ctrl+C`. To start it
again: `npm run dev`.

---

## Troubleshooting

| What you see | Fix |
|---|---|
| Yellow "Supabase is not configured" banner | A key is missing or typo'd. Online: Vercel → your project → Settings → Environment Variables (then Deployments → ⋯ → Redeploy). Local: check `.env.local` and rerun `npm run dev`. |
| "Couldn't load your journal" | Step 3 (schema.sql) didn't run or failed — paste and Run it again in the Supabase SQL Editor. |
| Sign-up email never arrives | Check spam. Supabase also limits ~2 emails per hour to the same address — test with a different email. |
| "Link expired or already used" | Confirmation links are single-use — just sign up again for a fresh one. |
| Old trades are missing | Sign in once in the browser you used before the update — they'll upload automatically. |

## What does it cost?

Nothing on the free plans: **Supabase** free includes a 500 MB database
(thousands of trades + screenshots) and sign-in for up to 50,000 users;
**Vercel** Hobby is free for personal projects. You'd only outgrow it if the
journal became huge or very popular.

## Where your data lives

In **your own Supabase project** — a private Postgres database guarded by
"row level security": every account can only ever read and write its own
rows. Nothing is stored in the browser anymore.
