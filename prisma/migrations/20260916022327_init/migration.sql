-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "pronouns" TEXT,
    "gsuEmail" TEXT,
    "gsuEmailVerifiedAt" DATETIME,
    "gsuVerificationCodeHash" TEXT,
    "gsuVerificationExpiresAt" DATETIME,
    "gsuVerificationSentAt" DATETIME,
    "gsuVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "expectedGraduationMonth" INTEGER,
    "expectedGraduationYear" INTEGER,
    "educationStatus" TEXT NOT NULL DEFAULT 'current_student',
    "graduationConfirmedAt" DATETIME,
    "registeredAsAlumni" BOOLEAN NOT NULL DEFAULT false,
    "membershipStatus" TEXT NOT NULL DEFAULT 'pending',
    "membershipDecidedAt" DATETIME,
    "membershipDecidedById" TEXT,
    "membershipNote" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "major" TEXT,
    "interests" TEXT,
    "experienceLevel" TEXT,
    "discordUsername" TEXT,
    "discordUserId" TEXT,
    "discordGuildMember" BOOLEAN,
    "discordCheckedAt" DATETIME,
    "publicProfileOptIn" BOOLEAN NOT NULL DEFAULT false,
    "publicHeadline" TEXT,
    "linkedinUrl" TEXT,
    "onboardingCompletedAt" DATETIME,
    "lastActiveAt" DATETIME,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PathSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pathSlug" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "selectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "PathSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionnaireAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "resultJson" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "QuestionnaireAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "checksJson" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "stepsJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "submissionUrl" TEXT,
    "submissionNote" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trackSlug" TEXT NOT NULL,
    "checklistJson" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CertProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trackSlug" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedJson" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "environmentId" TEXT,
    "checklistJson" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LabProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "location" TEXT,
    "locationUrl" TEXT,
    "audienceLevel" TEXT NOT NULL DEFAULT 'all',
    "pinUrl" TEXT,
    "pinEventId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "pinStatus" TEXT,
    "whatToBring" TEXT,
    "prepChecklist" TEXT NOT NULL DEFAULT '[]',
    "relatedLessons" TEXT NOT NULL DEFAULT '[]',
    "followUp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "coverAssetId" TEXT,
    "coverImageUrl" TEXT,
    "lastSyncedAt" DATETIME,
    "syncHash" TEXT,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PinSyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedUrl" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'running',
    "itemsSeen" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "cancelled" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "LeadershipProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "bio" TEXT,
    "termLabel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "portraitAssetId" TEXT,
    "contactEmail" TEXT,
    "linkedinUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MemberStory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberName" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "dates" TEXT,
    "summary" TEXT NOT NULL,
    "contribution" TEXT,
    "profileUrl" TEXT,
    "photoAssetId" TEXT,
    "permissionGranted" BOOLEAN NOT NULL DEFAULT false,
    "permissionNote" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL DEFAULT 1,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "caption" TEXT,
    "credit" TEXT,
    "focalX" REAL NOT NULL DEFAULT 0.5,
    "focalY" REAL NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "folder" TEXT NOT NULL DEFAULT 'uploads',
    "variantsJson" TEXT NOT NULL DEFAULT '{}',
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MediaSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotKey" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaSlot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentKey" TEXT NOT NULL,
    "status" TEXT,
    "title" TEXT,
    "body" TEXT,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DevMailbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "html" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_userId_key" ON "MemberProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_gsuEmail_key" ON "MemberProfile"("gsuEmail");

-- CreateIndex
CREATE INDEX "PathSelection_userId_active_idx" ON "PathSelection"("userId", "active");

-- CreateIndex
CREATE INDEX "QuestionnaireAttempt_userId_status_idx" ON "QuestionnaireAttempt"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_contentKey_key" ON "LessonProgress"("userId", "contentKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProgress_userId_projectSlug_key" ON "ProjectProgress"("userId", "projectSlug");

-- CreateIndex
CREATE UNIQUE INDEX "CertProgress_userId_trackSlug_key" ON "CertProgress"("userId", "trackSlug");

-- CreateIndex
CREATE INDEX "PracticeAttempt_userId_trackSlug_questionId_idx" ON "PracticeAttempt"("userId", "trackSlug", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewNote_userId_promptId_key" ON "InterviewNote"("userId", "promptId");

-- CreateIndex
CREATE UNIQUE INDEX "LabProfile_userId_key" ON "LabProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Event_pinEventId_key" ON "Event"("pinEventId");

-- CreateIndex
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");

-- CreateIndex
CREATE INDEX "MediaSlot_slotKey_idx" ON "MediaSlot"("slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaSlot_slotKey_assetId_key" ON "MediaSlot"("slotKey", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentOverride_contentKey_key" ON "ContentOverride"("contentKey");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
