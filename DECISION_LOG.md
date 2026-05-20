# Architectural Decision Log

| Date | Context | Decision | Consequence |
|---|---|---|---|
| May 2026 | Initial codebase was a monolithic Express app returning static HTML | **Migrate to Vite + React Frontend** | Better developer experience, hot-reloading, component-driven UI, and a premium interactive demo experience using TailwindCSS and Recharts. |
| May 2026 | Need for clean boundaries between frontend, backend, and DB | **Adopt NPM Workspaces (Monorepo)** | Allows shared types (Zod schemas), isolated dependencies, and cleaner deployment processes while keeping everything in one GitHub repo. |
| May 2026 | AI inference latency | **Switch to Groq LLaMA-3 (70B)** | Groq's LPU architecture provides sub-second inference, meaning the AI reasoning phase doesn't block the UI for 10+ seconds like standard LLM providers. |
| May 2026 | Production Deployment Errors (Render ESM Resolution) | **Use `tsx` for production Node execution** | Because the `@workspace/db` module uses pure TypeScript without an explicit build step, standard Node.js failed to resolve the ESM paths in production. Changing the start script to `tsx src/server.ts` allowed seamless execution of the monorepo TS files without a complex global build step. |
| May 2026 | Frontend API Routing | **Dynamic API Base URL** | By setting `baseURL: ""` in the Axios client on Render, the frontend dynamically hits the backend origin without needing strict environment variables to define the path, preventing CORS and missing-URL errors. |
