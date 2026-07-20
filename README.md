# 🎮 GameVault — Gaming Account Manager

A full-stack gaming account management platform built with React + Supabase. Manage your Steam/Epic library, trade accounts, buy/sell on the marketplace, track prices, and get AI-powered gaming insights.

**Live:** [gamevault-eta.vercel.app](https://gamevault-eta.vercel.app)  
**GitHub:** [github.com/SMPanther/gamevault](https://github.com/SMPanther/gamevault)

---

## ✨ Features

- **📚 Game Library** — Manage Steam & Epic games with genres, playtime, ratings
- **🛒 Marketplace** — Buy/sell gaming accounts with offer/counter-offer system
- **🔄 Trade Center** — Trade games peer-to-peer with proposal system
- **💰 Price Tracker** — Track Steam game prices over time with history charts
- **🤖 GV-AI** — AI assistant powered by Groq Llama 3.3 70B with:
  - Game recommendations based on your library
  - Price analysis (BUY / WAIT / SKIP verdicts)
  - Live price finder across Steam, Epic, GOG
  - Account market valuation
  - Trade fairness assessment
  - Gaming news briefing
- **📋 Activity Log** — Full account activity history
- **🎬 Video Backgrounds** — Per-tab ambient video backgrounds (toggleable)
- **🌙 Dark/Light Mode** — Full theme support
- **📱 Mobile Friendly** — Responsive design with bottom navigation
- **👑 Owner Dashboard** — Admin panel for user management

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Create React App) |
| Backend | Supabase (Auth + Postgres + Realtime) |
| AI | Groq API — Llama 3.3 70B |
| OTP Email | EmailJS |
| Deployment | Vercel |
| Styling | Custom CSS-in-JS (no UI library) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Groq](https://console.groq.com) account (free)
- An [EmailJS](https://emailjs.com) account (free)

### 1. Clone the repo
```bash
git clone https://github.com/SMPanther/gamevault.git
cd gamevault
npm install
```

### 2. Set up environment variables
Create a `.env.local` file in the project root:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON=your_supabase_anon_key
REACT_APP_EMAILJS_SERVICE=your_emailjs_service_id
REACT_APP_EMAILJS_TEMPLATE=your_emailjs_template_id
REACT_APP_EMAILJS_KEY=your_emailjs_public_key
REACT_APP_GROQ_KEY=your_groq_api_key
REACT_APP_OWNER_PASSWORD=your_owner_password
```

### 3. Set up Supabase database
Go to **Supabase → SQL Editor** and run:

```sql
create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  name text, email text, avatar text,
  role text default 'user',
  steam_verified bool default false,
  has_seen_onboarding bool default false,
  recovery_code text, banned bool default false,
  verification jsonb, created_at timestamptz default now()
);

create table if not exists game_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  sg jsonb default '[]', eg jsonb default '[]',
  s_linked bool default false, e_linked bool default false,
  s_prof jsonb default '{}', e_prof jsonb default '{}',
  wish_extras jsonb default '[]',
  updated_at timestamptz default now(), unique(user_id)
);

create table if not exists listings (
  id text primary key, owner_id uuid references auth.users,
  seller text, seller_email text, ask_price numeric,
  steam bool default false, epic bool default false,
  steam_val numeric default 0, epic_val numeric default 0,
  note text, discord text, verified bool default false,
  offers jsonb default '[]', rating numeric default 0,
  created_at timestamptz default now()
);

create table if not exists trades (
  id text primary key, owner_id uuid references auth.users,
  seller text, offer_game text, want_game text,
  offer_note text, want_note text, platform text,
  status text default 'open', proposals jsonb default '[]',
  posted_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.game_states enable row level security;
alter table public.listings enable row level security;
alter table public.trades enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_select_owner_all" on public.profiles for select to authenticated using (exists (select 1 from public.profiles po where po.id = auth.uid() and po.role = 'owner'));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_update_owner" on public.profiles for update to authenticated using (exists (select 1 from public.profiles po where po.id = auth.uid() and po.role = 'owner'));
create policy "Public listings" on listings for select using (true);
create policy "Own listings" on listings for all using (auth.uid() = owner_id);
create policy "Public trades" on trades for select using (true);
create policy "Own trades" on trades for all using (auth.uid() = owner_id);
create policy "Own game state" on game_states for all using (auth.uid() = user_id);
```

### 4. Set owner account
Register normally on the app, then run in Supabase SQL Editor:
```sql
update public.profiles set role = 'owner' where email = 'your@email.com';
```

### 5. Run locally
```bash
npm start
```

---

## 📁 Project Structure

```
src/
├── GameVault.jsx          # Root component, routing, auth
├── components/
│   ├── UI.jsx             # Nav, notifications, profile menu
│   ├── Charts.jsx         # Bar, pie, sparkline charts
│   ├── GenrePicker.jsx    # Multi-select genre picker
│   ├── LogoPicker.jsx     # Game logo search
│   └── PlaytimeHeatmap.jsx
├── pages/
│   ├── Login.jsx          # Auth — sign in, register, forgot password
│   ├── Dashboard.jsx      # Stats, charts, news
│   ├── Library.jsx        # Game library management
│   ├── Wishlist.jsx       # Wishlist with suggestions
│   ├── Accounts.jsx       # Steam/Epic account linking
│   ├── Market.jsx         # Buy/sell marketplace
│   ├── TradeCenter.jsx    # Game trading
│   ├── PriceTracker.jsx   # Steam price tracking
│   ├── AIAssistant.jsx    # GV-AI chat interface
│   ├── ActivityLog.jsx    # Account activity history
│   ├── OwnerDashboard.jsx # Admin panel
│   ├── GameDetail.jsx     # Individual game page
│   └── AccountDetail.jsx  # Account detail view
├── utils/
│   ├── supabase.js        # Supabase client + all DB functions
│   ├── aiClient.js        # Groq AI integration
│   ├── storage.js         # localStorage helpers
│   ├── helpers.js         # Utility functions
│   └── steamAPI.js        # Steam CDN helpers
└── constants/
    ├── styles.js          # Global CSS
    ├── data.js            # App data, backgrounds, genres
    └── auth.js            # Legacy auth helpers
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_SUPABASE_URL` | ✅ | Supabase project URL |
| `REACT_APP_SUPABASE_ANON` | ✅ | Supabase anon public key |
| `REACT_APP_EMAILJS_SERVICE` | ✅ | EmailJS service ID |
| `REACT_APP_EMAILJS_TEMPLATE` | ✅ | EmailJS template ID |
| `REACT_APP_EMAILJS_KEY` | ✅ | EmailJS public key |
| `REACT_APP_GROQ_KEY` | ✅ | Groq API key (free at console.groq.com) |
| `REACT_APP_OWNER_PASSWORD` | ⚠️ | Legacy owner bypass (optional) |

---

## 🌐 Deployment

### Vercel (recommended)
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables in **Settings → Environment Variables**
4. Deploy — auto-deploys on every `git push`

### After deploying
- Set **Supabase → Authentication → URL Configuration → Site URL** to your Vercel URL
- Add your Vercel URL to **Redirect URLs**

---

## 📱 Video Backgrounds

Place MP4 files in `public/videos/`:
```
bg-login.mp4
bg-dashboard.mp4
bg-library.mp4
bg-wishlist.mp4
bg-accounts.mp4
bg-market.mp4
bg-trades.mp4
bg-prices.mp4
```

Toggle with the 🎬 button in the navbar.

---

## 👤 Author

**Umer Iqbal** — L1F24BSCS0601  
University of Central Punjab, Lahore  
Faculty of Information Technology

---

## 📄 License

This project is for educational purposes.
