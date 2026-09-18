
# Agri Decision Agent

An agriculture hackathon prototype that turns field and market inputs into clear, explainable farming recommendations. The project is intentionally split so a four-person team can build in parallel while keeping `main` demo-ready.

## Team roles

| Role | Primary responsibility | Main areas |
| --- | --- | --- |
| Team lead + AI/Data | Recommendation logic, data quality, architecture, integration | `ai/`, `data/` |
| Frontend developer | User flows, screens, and API integration | `frontend/` |
| Backend/API developer | APIs, database integration, authentication, and service reliability | `backend/` |
| Research + testing | Domain research, test scenarios, validation, and demo evidence | `docs/research/`, `tests/` |

Everyone may contribute anywhere, but the named owner reviews changes in their primary area when possible.

## Repository layout

```text
frontend/              Web or mobile interface
backend/               API, data services, and integrations
ai/                    Recommendation models, prompts, and evaluation logic
data/                  Small non-sensitive sample data and data notes
tests/                 Automated and manual test cases
docs/research/         Agricultural research, sources, and assumptions
docs/architecture/     System design and technical decisions
.github/ISSUE_TEMPLATE/ Issue forms for work tracking
```

Do not commit real farmer data, passwords, API keys, or production exports. Start from `.env.example` and create a local `.env` file for secrets.

## Team workflow

`main` is the stable, demo-ready branch. Do not develop directly on it.

```text
main
├── feature/frontend
├── feature/backend
├── feature/ai-data
└── feature/research-testing
```

For each task:

1. Update your assigned branch from `main`.
2. Make a focused change and test it locally.
3. Open a pull request into `main` with a clear summary and test notes.
4. Have one teammate review it when time permits, then merge only when the demo still works.

For concurrent tasks, create a short-lived branch from the relevant team branch, for example `feature/frontend/login-screen`, and merge it back through a pull request.

## GitHub setup checklist

After pushing this project to GitHub, the repository owner should:

1. Invite the three teammates under **Settings → Collaborators** with **Write** access.
2. Create the four feature branches shown above from `main`.
3. In **Settings → Branches**, add a protection rule for `main`: require pull requests before merging and, if practical, one approval. Keep administrators able to bypass it during the hackathon if a demo-critical fix is needed.
4. Add project-specific run instructions here as the stack is chosen.

## Getting started

Choose the frontend and backend stacks, then document the commands required to run the prototype in this section. Commit a working vertical slice early: one input, one API response, and one recommendation visible in the interface.
# selling-blind

