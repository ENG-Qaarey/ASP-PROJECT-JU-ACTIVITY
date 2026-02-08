# JU-Activity (Web Frontend) File Structure

```
ju-activity/
├── .env                    # Environment variables (API URL, Clerk keys)
├── .gitignore
├── ADMIN_CREDENTIALS.md    # Reference for admin login
├── README.md               # Project documentation
├── components.json         # Shadcn/UI configuration
├── eslint.config.js        # Linting rules
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── postcss.config.js       # CSS processing
├── tailwind.config.ts      # Styling configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
│
├── public/                 # Static assets (logos, icons)
│
├── src/
│   ├── main.tsx            # Application entry point
│   ├── App.tsx             # Main Router and Layout configuration
│   ├── index.css           # Global styles and Tailwind imports
│   ├── App.css
│   │
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Shadcn/UI base components (Button, Input, etc.)
│   │   └── shared/         # Custom shared components (Navbar, Sidebar, etc.)
│   │
│   ├── contexts/           # React Contexts (AuthContext, ThemeContext)
│   │
│   ├── hooks/              # Custom React hooks (useToast, useAuth)
│   │
│   ├── lib/                # Utility functions and shared libraries (utils.ts)
│   │
│   ├── data/               # Static data or mock data for development
│   │
│   ├── services/           # API service layers
│   │
│   ├── pages/              # Screen components grouped by role/function
│   │   ├── Index.tsx               # Landing page
│   │   ├── LoginScreen.tsx         # User login
│   │   ├── RegisterScreen.tsx      # User registration
│   │   ├── SplashScreen.tsx        # Initial loading screen
│   │   ├── ProfileScreen.tsx       # User profile management
│   │   ├── NotificationsCenter.tsx # Notification list
│   │   ├── AccessDenied.tsx        # 403 Forbidden page
│   │   ├── NotFound.tsx            # 404 Error page
│   │   │
│   │   ├── admin/          # Admin-only dashboard and management
│   │   │   ├── Dashboard.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── SystemConfig.tsx
│   │   │
│   │   ├── coordinator/    # Coordinator dashboards and activities
│   │   │   ├── Dashboard.tsx
│   │   │   └── ActivityManagement.tsx
│   │   │
│   │   └── student/        # Student-facing views
│   │       ├── Home.tsx
│   │       └── MyActivities.tsx
│   │
│   └── shims/              # Polyfills or environment fixes
```
