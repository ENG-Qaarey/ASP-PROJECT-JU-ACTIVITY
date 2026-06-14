CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "Categories" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    CONSTRAINT "PK_Categories" PRIMARY KEY ("Id")
);

CREATE TABLE "PendingUsers" (
    "Id" uuid NOT NULL,
    "Email" character varying(255) NOT NULL,
    "Name" character varying(100) NOT NULL,
    "PasswordHash" text NOT NULL,
    "Role" character varying(20) NOT NULL,
    "StudentId" character varying(50),
    "Department" character varying(100),
    "AvatarUrl" character varying(500),
    "VerificationCodeHash" character varying(500) NOT NULL,
    "VerificationCodeExpiresAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_PendingUsers" PRIMARY KEY ("Id")
);

CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Email" character varying(255) NOT NULL,
    "PasswordHash" text NOT NULL,
    "PasswordVersion" integer NOT NULL,
    "Role" character varying(20) NOT NULL,
    "StudentId" character varying(50),
    "Department" character varying(100),
    "AvatarUrl" character varying(500),
    "Status" character varying(20),
    "EmailVerified" boolean NOT NULL,
    "EmailVerificationCodeHash" character varying(500),
    "EmailVerificationCodeExpiresAt" timestamp with time zone,
    "ResetPasswordCodeHash" character varying(500),
    "ResetPasswordCodeExpiresAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE "Activities" (
    "Id" uuid NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Description" character varying(2000),
    "Date" date NOT NULL,
    "Time" character varying(20) NOT NULL,
    "Location" character varying(500),
    "Capacity" integer NOT NULL,
    "Enrolled" integer NOT NULL,
    "CoordinatorId" uuid NOT NULL,
    "CoordinatorName" character varying(100),
    "Status" character varying(20) NOT NULL,
    "Category" character varying(100),
    "ImageUrl" character varying(500),
    "Latitude" double precision,
    "Longitude" double precision,
    "QrCodeSecret" character varying(500),
    "Radius" double precision,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Activities" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Activities_Users_CoordinatorId" FOREIGN KEY ("CoordinatorId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AdminProfiles" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Permissions" text,
    "AccessLevel" character varying(50) NOT NULL,
    "LastLogin" timestamp with time zone,
    CONSTRAINT "PK_AdminProfiles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AdminProfiles_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "AuditLogs" (
    "Id" uuid NOT NULL,
    "Action" character varying(100) NOT NULL,
    "ActorId" uuid,
    "TargetId" uuid,
    "Entity" character varying(50),
    "EntityId" character varying(100),
    "Message" character varying(1000),
    "Metadata" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AuditLogs_Users_ActorId" FOREIGN KEY ("ActorId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);

CREATE TABLE "CoordinatorProfiles" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Department" character varying(100),
    "Specialization" character varying(100),
    "MaxActivities" integer NOT NULL,
    "ApprovalLevel" character varying(50) NOT NULL,
    CONSTRAINT "PK_CoordinatorProfiles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CoordinatorProfiles_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Notifications" (
    "Id" uuid NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Message" character varying(2000) NOT NULL,
    "Type" character varying(20) NOT NULL,
    "IsRead" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "SenderRole" character varying(20),
    "RecipientId" uuid NOT NULL,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_Users_RecipientId" FOREIGN KEY ("RecipientId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "PushTokens" (
    "Id" uuid NOT NULL,
    "Token" character varying(500) NOT NULL,
    "UserId" uuid NOT NULL,
    CONSTRAINT "PK_PushTokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PushTokens_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Applications" (
    "Id" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "StudentName" character varying(100),
    "ActivityId" uuid NOT NULL,
    "ActivityTitle" character varying(200),
    "AppliedAt" date NOT NULL,
    "Status" character varying(20) NOT NULL,
    "Notes" character varying(1000),
    "IsAdmin" boolean NOT NULL,
    CONSTRAINT "PK_Applications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Applications_Activities_ActivityId" FOREIGN KEY ("ActivityId") REFERENCES "Activities" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Applications_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Messages" (
    "Id" uuid NOT NULL,
    "Content" text NOT NULL,
    "Type" character varying(20) NOT NULL,
    "Metadata" text,
    "SenderId" uuid NOT NULL,
    "ReceiverId" uuid,
    "GroupId" uuid,
    "IsRead" boolean NOT NULL,
    "ReplyTo" text,
    "HiddenBy" text,
    "IsDeleted" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ActivityId" uuid,
    CONSTRAINT "PK_Messages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Messages_Activities_ActivityId" FOREIGN KEY ("ActivityId") REFERENCES "Activities" ("Id"),
    CONSTRAINT "FK_Messages_Users_ReceiverId" FOREIGN KEY ("ReceiverId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Messages_Users_SenderId" FOREIGN KEY ("SenderId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Attendances" (
    "Id" uuid NOT NULL,
    "ActivityId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "StudentName" character varying(100),
    "ApplicationId" uuid NOT NULL,
    "MarkedById" uuid NOT NULL,
    "Status" character varying(20) NOT NULL,
    "MarkedAt" date NOT NULL,
    CONSTRAINT "PK_Attendances" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Attendances_Activities_ActivityId" FOREIGN KEY ("ActivityId") REFERENCES "Activities" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Attendances_Applications_ApplicationId" FOREIGN KEY ("ApplicationId") REFERENCES "Applications" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Attendances_Users_MarkedById" FOREIGN KEY ("MarkedById") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Attendances_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Activities_CoordinatorId" ON "Activities" ("CoordinatorId");

CREATE UNIQUE INDEX "IX_AdminProfiles_UserId" ON "AdminProfiles" ("UserId");

CREATE INDEX "IX_Applications_ActivityId" ON "Applications" ("ActivityId");

CREATE UNIQUE INDEX "IX_Applications_StudentId_ActivityId" ON "Applications" ("StudentId", "ActivityId");

CREATE UNIQUE INDEX "IX_Attendances_ActivityId_StudentId" ON "Attendances" ("ActivityId", "StudentId");

CREATE INDEX "IX_Attendances_ApplicationId" ON "Attendances" ("ApplicationId");

CREATE INDEX "IX_Attendances_MarkedById" ON "Attendances" ("MarkedById");

CREATE INDEX "IX_Attendances_StudentId" ON "Attendances" ("StudentId");

CREATE INDEX "IX_AuditLogs_ActorId" ON "AuditLogs" ("ActorId");

CREATE UNIQUE INDEX "IX_Categories_Name" ON "Categories" ("Name");

CREATE UNIQUE INDEX "IX_CoordinatorProfiles_UserId" ON "CoordinatorProfiles" ("UserId");

CREATE INDEX "IX_Messages_ActivityId" ON "Messages" ("ActivityId");

CREATE INDEX "IX_Messages_ReceiverId" ON "Messages" ("ReceiverId");

CREATE INDEX "IX_Messages_SenderId" ON "Messages" ("SenderId");

CREATE INDEX "IX_Notifications_RecipientId" ON "Notifications" ("RecipientId");

CREATE UNIQUE INDEX "IX_PendingUsers_Email" ON "PendingUsers" ("Email");

CREATE UNIQUE INDEX "IX_PushTokens_Token" ON "PushTokens" ("Token");

CREATE INDEX "IX_PushTokens_UserId" ON "PushTokens" ("UserId");

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260614132954_Initial', '10.0.9');

COMMIT;

