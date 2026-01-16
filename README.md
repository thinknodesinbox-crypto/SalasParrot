# Parrot Frontend

React frontend for the LinkedIn + Email outreach platform.

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Routing:** TanStack Router
- **Data Fetching:** TanStack Query
- **State Management:** Zustand

## Getting Started

### 1. Install dependencies

```bash
cd parrot-frontend
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Set up git hooks (recommended)

Husky and lint-staged are configured to run linting and formatting on staged files before each commit:

```bash
npm run prepare
```

## Development

### Lint code

```bash
npm run lint
```

### Fix lint errors

```bash
npm run lint:fix
```

### Format code

```bash
npm run format
```

### Check formatting

```bash
npm run format:check
```

### Type check

```bash
npm run typecheck
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/      # Header, Footer
│   ├── sections/    # Page sections (Hero, Features, etc.)
│   └── ui/          # Reusable UI components
├── assets/          # Static assets
├── styles/          # Global styles
├── lib/             # Utilities
├── routes/          # TanStack Router routes
└── App.tsx          # Root component
```
