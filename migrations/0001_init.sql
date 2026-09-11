-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "avatar" TEXT,
    "username" TEXT NOT NULL,
    "nickname" TEXT,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NORMAL',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "balance" REAL DEFAULT 0,
    "plan_end_time" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "profile" JSONB
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "user_created_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "user_plan_time_idx" ON "users"("plan", "plan_end_time");
