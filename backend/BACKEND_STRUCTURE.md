# Backend File Structure

```
backend/
├── .gitignore
├── .prettierrc
├── ADMIN_SETUP.md
├── all_postgres_queries.sql
├── check-users.ts
├── DATABASE_CONNECTION.md
├── DATABASE_FIX.md
├── database.sql
├── eslint.config.mjs
├── FIX_DATABASE_URL.md
├── login.json
├── logs.txt
├── main.ts
├── nest-cli.json
├── package-lock.json
├── package.json
├── prisma.config.d.ts
├── prisma.config.ts
├── README.md
├── SETUP_DATABASE.md
├── tsconfig.build.json
├── tsconfig.json
├── verify-tables.sql
├── verify-users-auth.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── seed.js
│   ├── seed.d.ts
│   ├── seed.js.map
│   ├── create-student.ts
│   ├── list-logs-json.ts
│   ├── list-users-json.ts
│   ├── list-users.ts
│   ├── reproduce-issue.ts
│   ├── view-logs.ts
│   └── migrations/
│       ├── 20260110163433_init/
│       ├── 20260110164741_add_admin_coordinator_tables/
│       ├── 20260111151657_add_email_verification/
│       ├── 20260112104403_add_audit_logs/
│       ├── 20260113181051_add_application_activity_status_studentname_index/
│       ├── 20260117152112_ensure_student_id_column/
│       ├── 20260117152359_add_student_id_if_missing/
│       ├── 20260203100259_add_category_model/
│       └── migration_lock.toml
│
├── src/
│   ├── main.ts
│   ├── app.controller.ts
│   ├── app.controller.spec.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── check-admin.ts
│   │
│   ├── activities/
│   │   ├── activities.controller.ts
│   │   ├── activities.module.ts
│   │   └── activities.service.ts
│   │
│   ├── admins/
│   │   ├── admins.module.ts
│   │   └── admins.service.ts
│   │
│   ├── applications/
│   │   ├── applications.controller.ts
│   │   ├── applications.module.ts
│   │   └── applications.service.ts
│   │
│   ├── attendance/
│   │   ├── attendance.controller.ts
│   │   ├── attendance.module.ts
│   │   └── attendance.service.ts
│   │
│   ├── audit-logs/
│   │   ├── audit-logs.controller.ts
│   │   ├── audit-logs.module.ts
│   │   └── audit-logs.service.ts
│   │
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── email-verification.mailer.ts
│   │
│   ├── authz/
│   │   ├── authz.module.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.decorator.ts
│   │   └── roles.guard.ts
│   │
│   ├── categories/
│   │   ├── categories.controller.ts
│   │   ├── categories.module.ts
│   │   └── categories.service.ts
│   │
│   ├── chat/
│   │   ├── chat.controller.ts
│   │   ├── chat.gateway.ts
│   │   ├── chat.module.ts
│   │   └── chat.service.ts
│   │
│   ├── coordinators/
│   │   ├── coordinators.module.ts
│   │   └── coordinators.service.ts
│   │
│   ├── notifications/
│   │   ├── notifications.controller.ts
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   │
│   ├── generated/
│   │   └── prisma/
│   │       ├── browser.ts
│   │       ├── client.ts
│   │       ├── commonInputTypes.ts
│   │       ├── enums.ts
│   │       ├── index.ts
│   │       ├── models.ts
│   │       ├── internal/
│   │       │   ├── class.ts
│   │       │   ├── prismaNamespace.ts
│   │       │   └── prismaNamespaceBrowser.ts
│   │       └── models/
│   │           ├── Activity.ts
│   │           ├── Admin.ts
│   │           ├── Application.ts
│   │           ├── Attendance.ts
│   │           ├── AuditLog.ts
│   │           ├── Category.ts
│   │           ├── Coordinator.ts
│   │           ├── Message.ts
│   │           ├── Notification.ts
│   │           └── User.ts
│   │
│   └── scripts/
│       ├── create-clerk-user.ts
│       ├── setup-admin-complete.ts
│       ├── setup-admin.ts
│       ├── setup-database-url.ts
│       ├── test-backend-connection.ts
│       └── test-db-connection.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
└── uploads/
    └── (chat media files)
```
