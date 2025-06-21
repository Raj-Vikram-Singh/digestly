This will serve as a “source of truth” and context for you, future contributors, and for me (ChatGPT) to generate precise, context-aware code and instructions—even if you start a new chat.

---

# Digestly

Digestly is a web application that lets users connect their Notion workspace, select databases, and receive database summaries via email—on-demand or on a schedule.
It is designed to be **MVP-ready** but has an **enterprise-level, modular code structure** for easy extension and team scaling.

---

## **Key Features**

- **User Authentication:**
  Email/password and magic link login via Supabase Auth.
- **Notion Integration:**
  Secure OAuth2 login with Notion, listing all user databases.
- **Database Selection & Preview:**
  Users can select a Notion database and preview its contents.
- **Email Digest:**
  Send database contents to any recipient via Resend (or other providers).
- **Scheduled Digests:**
  Users can schedule automated, recurring database emails (daily, weekly, or custom cron).
- **Enterprise Code Quality:**
  Modular monorepo layout, strict linting/formatting, Husky/lint-staged, CI-ready, Typescript-first.

---

## **Architecture Overview**

```text
/apps
  /web               # Next.js 14+ (frontend, API routes)
/packages
  /ui                # Reusable UI components (shadcn/ui, TailwindCSS)
/lib
  /notion            # All Notion API wrappers and helpers
  /email             # Email sending and formatting logic
  /scheduler         # Utilities for cron jobs and scheduling
  /auth              # Authentication logic, session management
  /types             # Shared TypeScript types
/supabase
  /functions         # Edge Functions for scheduled digests

/.husky              # Git hooks for code quality
/.github             # CI/CD workflows
.env.example         # Environment variable template
```

---

## **Tech Stack**

- **Frontend:** Next.js 14, TypeScript, shadcn/ui, TailwindCSS
- **Backend/API:** Next.js API routes (extendable to separate service)
- **Auth & DB:** Supabase (Auth, Postgres, Edge Functions)
- **Email:** Resend (default, easily swappable)
- **Notion:** Official Notion SDK & OAuth2
- **Scheduling:** Supabase Edge Functions (cron)
- **Quality/CI:** ESLint, Prettier, Husky, lint-staged, GitHub Actions

---

## **Setup & Installation**

### 1. **Clone the Repository**

```sh
git clone https://github.com/<your-username>/digestly.git
cd digestly
```

### 2. **Install Dependencies**

```sh
npm install
```

### 3. **Configure Environment Variables**

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NEXT_PUBLIC_VERCEL_URL=
RESEND_API_KEY=
```

- Get Supabase values from your Supabase dashboard.
- Register an OAuth app at [Notion Developers](https://www.notion.com/my-integrations) for client credentials.
- Create an account at [Resend](https://resend.com/) for email API key.

---

### 4. **Initialize Husky**

```sh
npx husky install
```

- Ensure `.husky/pre-commit` contains just:

  ```sh
  npx lint-staged
  ```

- Make sure it’s executable:

  ```sh
  chmod +x .husky/pre-commit
  ```

---

### 5. **Set Up Supabase Database**

- Enable Email Auth in Supabase dashboard.
- Run the SQL below in Supabase SQL Editor to add a scheduled_emails table:

```sql
create table if not exists scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  notion_db_id text not null,
  recipient_email text not null,
  cron_expr text not null,
  created_at timestamptz default now(),
  last_sent timestamptz
);
```

---

### 6. **Run Locally**

```sh
npm run dev
```

- App will be available at `http://localhost:3000`

---

## **Development Workflow**

### **Branching & PRs**

- Main development on `main` branch
- Feature/bugfix branches: `feature/<desc>`, `fix/<desc>`
- PRs require passing lint, format, and build checks (via Husky and GitHub Actions)

### **Linting/Formatting**

- Pre-commit checks run via Husky/lint-staged on `*.ts, *.tsx`
- Manual: `npm run lint` and `npm run format`

### **Testing**

- (Placeholder for future) Place tests in `/tests`, use Jest or Playwright

---

## **Core Modules & File Structure**

### `/apps/web`

- `pages/` (or `app/`): Main Next.js routes
- `components/`: Page-level UI components
- `api/`: API routes (auth, notion, email, schedule)

### `/packages/ui`

- Custom, reusable UI elements (shadcn/ui-based)

### `/packages/lib/notion`

- Notion API OAuth helpers
- Database fetch and data normalization

### `/packages/lib/email`

- Email template builder (HTML table summaries)
- Resend (or provider) send logic

### `/packages/lib/scheduler`

- Utilities for managing cron expressions
- Functions for triggering scheduled email jobs (Supabase Edge Functions)

### `/packages/types`

- Shared types for Notion DBs, user, email jobs, etc.

---

## **How Digestly Works: Flow**

1. **User logs in** (Supabase Auth).
2. **User connects Notion** (OAuth2, token stored securely).
3. **Digestly fetches user’s Notion databases.**
4. **User selects a database** to send.
5. **User chooses recipient email** and either:

   - Sends a one-off digest
   - Schedules a daily/weekly/cron job (saved in `scheduled_emails`)

6. **Digestly formats the database as an HTML table,** sends it via email using Resend.
7. **Supabase Edge Functions run scheduled jobs** and trigger email sends.

---

## **Security Considerations**

- OAuth tokens are encrypted and never exposed to frontend
- Emails are sent via secure transactional providers
- User data is stored securely in Supabase
- All secrets in `.env.local` and not checked into git

---

## **Extending the App**

- Add team/multi-tenant support by linking users to organizations
- Add support for Notion pages or filtering database rows
- Add email templates and branding
- Add more granular scheduling (timezone support, etc.)
- Support other email providers (SendGrid, SMTP)

---

## **Contributing**

1. Fork and clone the repo
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to your branch (`git push origin feature/my-feature`)
5. Create a new Pull Request

---

## **Support/Contact**

- [issues](https://github.com/<your-username>/digestly/issues) for bugs/features
- Maintainer: [Your Name](mailto:your@email.com)

---

## **FAQ**

- **Q:** Can I use Gmail or another SMTP provider for email?
  **A:** Yes, modular email logic allows swapping providers.

- **Q:** Can I connect more than one Notion account?
  **A:** MVP supports one; multi-account is planned for future releases.

- **Q:** Can I schedule multiple digests?
  **A:** Yes, each user can create multiple scheduled email jobs.

---

Absolutely! Here’s the updated README section with clear **project phases**.
This will help you (and any future team or assistant) track what’s done, what’s in scope, and what comes next—making it easy to revisit and extend as the codebase grows.

---

## **Project Phases: Digestly**

This project follows a **phased delivery model** for MVP-first, enterprise-grade product development.
Each phase is designed to be a complete, testable increment that’s ready for feedback and extension.

---

### **Phase 1: Foundations**

- Set up project repo, code structure, linting, formatting, and Git hooks (Husky v10+).
- Initialize Next.js 14, TailwindCSS, shadcn/ui, TypeScript.
- Set up Supabase project, enable Auth, configure DB for scheduling.
- Integrate CI/CD (GitHub Actions, Vercel).
- Document architecture, setup, and core flows (this README).

---

### **Phase 2: Notion Integration**

- Implement Notion OAuth2 login and securely store tokens.
- Fetch and display connected user’s Notion databases.
- Normalize and validate Notion DB structure for preview.

---

### **Phase 3: Email Digest**

- Integrate Resend API for transactional email.
- Format Notion database contents into an HTML email table.
- UI/UX: Let user select database, enter recipient email, and send instant digest.
- Success/error handling for email flow.

---

### **Phase 4: Scheduling & Automation**

- Build scheduler UI (daily, weekly, or custom cron).
- Store scheduled jobs in Supabase.
- Implement Supabase Edge Functions to process and send scheduled emails.
- Allow users to view, edit, and delete scheduled digests.

---

### **Phase 5: Enterprise UI/UX Polish**

- Full responsive design, onboarding, error boundaries.
- Notifications, confirmations, and success screens.
- Accessibility and dark mode.
- Modularization and code splitting.

---

### **Phase 6: Security & Compliance**

- Audit token management, enforce API rate limits.
- Add logs for all scheduled and sent emails.
- Prepare for compliance requirements (future B2B/enterprise clients).

---

### **Phase 7+: Extensions & Enterprise Features**

- Team/multi-tenant support (organizations).
- Support for multiple Notion accounts per user.
- Advanced filters and reporting on Notion data.
- Custom email templates and branding.
- Support for additional integrations (Google Sheets, Slack, etc.).

---

**We can revisit and update these phases as the product evolves. Each phase builds on the last and leaves you with a working, testable feature set.**

---

_(End of README phase section. Let me know if you want these phases referenced in your main README summary or at the top for even quicker context!)_

## **License**

MIT License

---

**This README serves as your comprehensive project and architecture context for future contributors, project automation, and ChatGPT prompts. If you want to update or extend any part, just specify your change, and the assistant (me!) can work off of this foundation.**

---

**Ready to move to the next phase, or need any part of this README further customized?**
