Medicine Search and Tracking System

Project layout
- back_end: Express API, MongoDB models, authentication, and API routes
- front_end: React and Vite medicine-search interface

Getting started
1. Copy .env.example to .env and set MONGO_URI and a strong JWT_SECRET. The default local database is `meditrack`.
2. From the project root, run `npm install --prefix back_end`.
3. Run `npm install --prefix front_end`.
4. Start the API with `npm run dev:backend`.
5. In another terminal, start the UI with `npm run dev:frontend`.

The API is available at http://localhost:5000/api and the Vite UI at
http://localhost:5173. The UI proxies /api requests to the API.

Accounts
- Customers and pharmacies can register in the app. Pharmacy registration creates its first pharmacy location.
- Public registration cannot create administrator accounts. To provision one, set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the current terminal session, then run `npm run create-admin --prefix back_end`. The password must be at least 12 characters.
- The pharmacy and admin workspaces require their respective account roles; signing out clears the browser session.