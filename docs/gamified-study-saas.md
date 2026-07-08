# Serverless Gamified Study Platform

This document describes the evolution of the current plain HTML/JS quiz into a complete **React** application, with a **serverless backend on Cloudflare**, a relational **Cloudflare D1 database using Drizzle ORM**, and file storage on **Cloudflare R2**.

> Note: Cloudflare provides **D1** for SQL databases and **R2** for objects and files. Since Drizzle integrates very well with D1, this plan assumes **D1 + Drizzle** for application data and **R2** for JSON uploads. If the original intention was to use “R1,” the correct service is probably D1 or R2, depending on the type of data.

## 1. Product Overview

The application will be a quiz-based study support community. Users will be able to create accounts, log in, upload JSON files containing questions, answer quizzes, track their progress, publish their own question banks, follow other users, join study groups, and participate in chats.

The goal is to combine three experiences:

* **Individual study**: answer questions, review mistakes, track history, and monitor progress.
* **Gamification**: points, achievements, streaks, rankings, and goals.
* **Community**: public profiles, followers, groups, chat, and shared quizzes.

## 2. Core Features

### 2.1 Accounts, Login, and Profiles

The system should support:

* registration using email and password;
* login and logout;
* password recovery;
* public profiles containing name, avatar, bio, statistics, and published quizzes;
* private profiles containing email, preferences, security settings, and personal history;
* privacy settings for profiles and quizzes.

Suggested profile fields:

* display name;
* unique username;
* profile picture or avatar;
* short bio;
* field of study;
* optional links;
* public statistics: quizzes completed, questions studied, correct answers, daily streak, and ranking position.

### 2.2 Quiz JSON Uploads

After logging in, users will be able to upload a JSON file using the current project format:

```json
{
  "title": "HCI Question Bank",
  "description": "Multiple-choice questions.",
  "questions": [
    {
      "id": 1,
      "topic": "Usability",
      "statement": "What is effectiveness in usability?",
      "options": [
        { "id": "A", "text": "..." },
        { "id": "B", "text": "..." }
      ],
      "answer": "A",
      "explanation": "..."
    }
  ],
  "tags": ["hci", "usability"]
}
```

Recommended flow:

1. The user selects the file.
2. The frontend validates the file size, extension, and JSON syntax.
3. The backend validates the schema using Zod.
4. The original file is stored in R2.
5. Normalized data is stored in D1.
6. The quiz is private by default.
7. The user may edit the title, description, tags, and visibility.

### 2.3 Taking Quizzes

Users will be able to:

* start a quiz;
* answer one question at a time;
* navigate between questions;
* save progress automatically;
* receive corrections at the end or after each question, depending on the selected mode;
* review mistakes;
* retry only incorrect questions;
* view explanations;
* continue an interrupted attempt.

Useful modes:

* **Practice**: shows immediate feedback.
* **Exam**: displays the result only at the end.
* **Review**: filters incorrect, favorite, or topic-specific questions.
* **Quick**: a short session with a limited number of questions.

### 2.4 Study History

The system should store:

* every quiz uploaded by the user;
* every attempt started;
* submitted answers;
* the date and time of each answer;
* correct answers, incorrect answers, and time spent;
* reviewed questions;
* progress by topic or tag.

Important metrics:

* questions studied today;
* questions studied per week or month;
* overall accuracy rate;
* accuracy rate by tag;
* average time per question;
* study streak;
* recurring mistakes;
* weak topics.

### 2.5 Public Quizzes and Search

Users will be able to make quizzes public so other people can use them.

Discovery features:

* search by title;
* search by tags;
* filters by subject, author, popularity, and date;
* sorting by most used, newest, and highest rated;
* public quiz pages containing a summary, tags, number of questions, author, and statistics.

### 2.6 Social Features: Following and Followers

Minimum features:

* follow users;
* unfollow users;
* view followers;
* view followed users;
* a simple feed containing published quizzes and relevant achievements;
* basic notifications when someone follows the user or uses one of their public quizzes.

### 2.7 Study Groups

Groups may be public, private, or invite-only.

Each group should have:

* name;
* description;
* avatar or cover image;
* members;
* roles: owner, moderator, and member;
* shared quizzes;
* text chat;
* internal ranking;
* optional collective goals.

Initial features:

* create a group;
* invite users;
* join or leave;
* send messages;
* share quizzes with the group;
* view the group ranking.

### 2.8 Text Chat

The chat should support:

* real-time messages;
* persistent history;
* pagination for older messages;
* editing or deleting the user’s own messages;
* moderation by owners and moderators;
* sending links to quizzes.

Recommended architecture:

* **Durable Objects** for real-time chat rooms;
* **D1** for persistent message history;
* **Workers** for authentication, permissions, and APIs;
* WebSocket connections between the frontend and the Durable Object.

### 2.9 Audio Calls

Audio is a more advanced feature and should be introduced only after the chat is stable.

Recommendation:

* use **WebRTC** for audio communication between users;
* use **Durable Objects** as the signaling server;
* limit calls to small groups in the MVP;
* consider an external service for large rooms, recording, or advanced moderation.

The MVP should include text chat only. Audio may be introduced in a later phase.

## 3. Applied HCI Principles

The application should follow Human-Computer Interaction principles from the beginning.

### 3.1 Visibility of System Status

* display quiz progress;
* indicate automatic saving;
* clearly display loading states and errors;
* show whether a quiz is private or public;
* display online or offline chat status, when implemented.

### 3.2 User Control and Freedom

* allow users to return to previous questions;
* allow users to pause and resume;
* allow users to cancel uploads before saving;
* allow quizzes to remain private;
* allow users to delete or unpublish their own content.

### 3.3 Error Prevention

* validate JSON before the final upload;
* display a preview of imported questions;
* block publication when a quiz contains invalid questions;
* confirm destructive actions such as deleting a quiz or group.

### 3.4 Consistency

* maintain the same button, feedback, and navigation patterns throughout the app;
* use clear and direct language;
* standardize tags, quiz cards, profile pages, and metrics.

### 3.5 Recognition Rather Than Recall

* display visible filters;
* show recent history;
* suggest resuming previous study sessions;
* keep frequent actions easy to find.

### 3.6 Accessibility

* provide adequate contrast;
* support keyboard navigation;
* use visible focus indicators;
* provide labels for form fields;
* provide alternative text for images;
* use a responsive layout;
* do not rely exclusively on color to indicate correct or incorrect answers.

## 4. Technical Architecture

### 4.1 Recommended Stack

Frontend:

* React;
* TypeScript;
* Vite;
* React Router;
* TanStack Query for API caching;
* React Hook Form + Zod for forms;
* Tailwind CSS or CSS Modules;
* Zustand or Context API for simple local state.

Backend/serverless:

* Cloudflare Pages for hosting the frontend;
* Cloudflare Workers for the API;
* Cloudflare D1 as the SQL database;
* Drizzle ORM for schemas, migrations, and queries;
* Cloudflare R2 for storing original JSON files and avatars;
* Durable Objects for real-time chat and future WebRTC signaling;
* Cloudflare Queues for asynchronous tasks, when necessary.

Authentication:

* simple option: custom sessions using HTTP-only cookies;
* more robust option: Better Auth, Lucia Auth, or Auth.js adapted to the serverless environment;
* secure password hashing using Web Crypto or a Workers-compatible library.

### 4.2 Suggested Folder Structure

```text
.
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  ├─ components/
│  │  │  ├─ features/
│  │  │  ├─ routes/
│  │  │  ├─ lib/
│  │  │  └─ styles/
│  │  └─ package.json
│  └─ api/
│     ├─ src/
│     │  ├─ routes/
│     │  ├─ db/
│     │  ├─ auth/
│     │  ├─ validators/
│     │  ├─ services/
│     │  └─ durable-objects/
│     ├─ drizzle/
│     ├─ drizzle.config.ts
│     └─ wrangler.toml
├─ packages/
│  └─ shared/
│     ├─ quiz-schema.ts
│     ├─ validators.ts
│     └─ types.ts
└─ package.json
```

For a smaller project, it is also possible to keep `web` and `api` together in a single application using Cloudflare Pages Functions.

## 5. Data Model

### 5.1 Main Tables

```text
users
- id
- email
- password_hash
- username
- display_name
- bio
- avatar_url
- created_at
- updated_at

sessions
- id
- user_id
- token_hash
- expires_at
- created_at

quizzes
- id
- owner_id
- title
- description
- visibility
- source_file_key
- question_count
- plays_count
- created_at
- updated_at
- published_at

quiz_tags
- quiz_id
- tag_id

tags
- id
- name
- slug

questions
- id
- quiz_id
- external_id
- topic
- statement
- answer
- explanation
- position

question_options
- id
- question_id
- option_key
- text
- position

quiz_attempts
- id
- quiz_id
- user_id
- mode
- status
- score
- correct_count
- wrong_count
- started_at
- finished_at

question_answers
- id
- attempt_id
- question_id
- selected_option
- is_correct
- answered_at
- time_spent_ms

follows
- follower_id
- following_id
- created_at

study_groups
- id
- owner_id
- name
- description
- visibility
- created_at
- updated_at

study_group_members
- group_id
- user_id
- role
- joined_at

study_group_quizzes
- group_id
- quiz_id
- shared_by
- created_at

chat_messages
- id
- group_id
- sender_id
- body
- created_at
- edited_at
- deleted_at

points_events
- id
- user_id
- type
- points
- metadata_json
- created_at

achievements
- id
- key
- title
- description
- points

user_achievements
- user_id
- achievement_id
- unlocked_at
```

### 5.2 Simplified Drizzle Schema

```ts
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  visibility: text("visibility", { enum: ["private", "public", "unlisted"] }).notNull(),
  sourceFileKey: text("source_file_key"),
  questionCount: integer("question_count").notNull().default(0),
  playsCount: integer("plays_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});

export const follows = sqliteTable(
  "follows",
  {
    followerId: text("follower_id").notNull().references(() => users.id),
    followingId: text("following_id").notNull().references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.followerId, table.followingId] }),
  }),
);
```

## 6. Proposed API

### 6.1 Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PATCH /api/me
```

### 6.2 Quizzes

```text
POST   /api/quizzes/upload
GET    /api/quizzes
GET    /api/quizzes/search?query=hci&tags=usability
GET    /api/quizzes/:id
PATCH  /api/quizzes/:id
DELETE /api/quizzes/:id
POST   /api/quizzes/:id/publish
POST   /api/quizzes/:id/unpublish
```

### 6.3 Attempts and Answers

```text
POST  /api/quizzes/:id/attempts
GET   /api/attempts/:id
POST  /api/attempts/:id/answers
POST  /api/attempts/:id/finish
GET   /api/me/stats
GET   /api/me/history
```

### 6.4 Profiles and Social Features

```text
GET    /api/users/:username
POST   /api/users/:id/follow
DELETE /api/users/:id/follow
GET    /api/users/:id/followers
GET    /api/users/:id/following
```

### 6.5 Groups

```text
POST   /api/groups
GET    /api/groups
GET    /api/groups/:id
PATCH  /api/groups/:id
DELETE /api/groups/:id
POST   /api/groups/:id/join
POST   /api/groups/:id/leave
POST   /api/groups/:id/quizzes
GET    /api/groups/:id/messages
```

### 6.6 Chat

```text
GET /api/groups/:id/chat/connect
```

This endpoint returns or opens a WebSocket connection to the Durable Object responsible for the group’s chat room.

## 7. Main Screens

### 7.1 Dashboard

The first screen displayed after login.

It should show:

* a button to continue the most recent study session;
* daily statistics;
* the current streak;
* recent quizzes;
* active groups;
* a ranking summary;
* recommendations based on tags.

### 7.2 Quiz Library

A screen for discovering quizzes.

Elements:

* title search;
* tag filters;
* quiz cards;
* difficulty indicator or average accuracy rate;
* author;
* start button;
* save or favorite button.

### 7.3 Upload and Import

Step-by-step flow:

1. Select the JSON file.
2. Validate the file.
3. Preview the title, description, number of questions, and tags.
4. Display validation errors, when present.
5. Save the quiz as private.
6. Edit metadata.
7. Publish the quiz, when desired.

### 7.4 Quiz Screen

The screen should prioritize focus and readability:

* clear question statement;
* answer options with large clickable areas;
* visible progress;
* previous and next navigation;
* answer feedback;
* explanation after correction;
* button for marking the question for review.

### 7.5 User Profile

Displays:

* public information;
* statistics;
* published quizzes;
* followers and followed users;
* achievements;
* follow or unfollow button.

### 7.6 Study Group

Displays:

* group header;
* members;
* internal ranking;
* shared quizzes;
* chat;
* moderation actions.

## 8. Gamification

### 8.1 Points

Initial suggestion:

* +10 points for each correct answer;
* +2 points for each answered question;
* +20 points for completing a quiz;
* bonus points for maintaining a daily streak;
* bonus points for publishing a quiz used by other people;
* bonus points for reviewing a mistake and answering correctly later.

Avoid a scoring system that encourages quantity without quality. The system should reward review and consistency.

### 8.2 Leaderboard

Possible rankings:

* weekly global ranking;
* monthly global ranking;
* ranking by group;
* ranking by tag or subject;
* ranking among followed users.

To reduce unfairness:

* prefer weekly or monthly rankings instead of permanent rankings;
* limit excessive daily point accumulation;
* consider accuracy and consistency;
* do not focus exclusively on competition: also display personal progress.

### 8.3 Achievements

Examples:

* first completed study session;
* 100 questions answered;
* 7 consecutive study days;
* 10 quizzes published;
* 50 mistakes reviewed;
* 80% accuracy in a specific tag.

## 9. Search by Title and Tags

In D1, the initial search may use `LIKE` with simple indexes:

```sql
SELECT *
FROM quizzes
WHERE visibility = 'public'
  AND title LIKE '%' || ? || '%'
ORDER BY plays_count DESC, created_at DESC;
```

For tags:

```sql
SELECT q.*
FROM quizzes q
JOIN quiz_tags qt ON qt.quiz_id = q.id
JOIN tags t ON t.id = qt.tag_id
WHERE q.visibility = 'public'
  AND t.slug IN (?, ?, ?)
GROUP BY q.id;
```

As the application grows, consider:

* Cloudflare D1 FTS5, when available in the environment;
* Meilisearch, Typesense, or Algolia;
* a custom index using a normalized auxiliary table.

## 10. Security and Privacy

Mandatory precautions:

* strong password hashing;
* HTTP-only, Secure, and SameSite cookies;
* CSRF protection when using cookies on state-changing routes;
* input validation using Zod throughout the API;
* resource-level authorization: quiz owner, group member, or moderator;
* rate limiting for login, uploads, messages, and search;
* sanitization of chat messages;
* file size limits for JSON files and avatars;
* logs without sensitive data;
* the ability to delete accounts and personal data.

## 11. Phased Implementation

### Phase 1: React Foundation and Authentication

* Create the React application using Vite and TypeScript.
* Migrate the current screens to React components.
* Create routes for home, login, registration, dashboard, and quizzes.
* Configure Cloudflare Pages and Workers.
* Configure D1, Drizzle, and migrations.
* Implement users, sessions, and basic profiles.

### Phase 2: Persistent Quizzes

* Implement JSON uploads.
* Validate JSON using Zod.
* Store the original file in R2.
* Store quizzes, questions, and answer options in D1.
* Create a list of the user’s quizzes.
* Create the quiz-taking flow with persistent attempts and answers.
* Create study history and basic statistics.

### Phase 3: Publishing and Discovery

* Add private, public, and unlisted visibility.
* Implement search by title and tags.
* Create public quiz pages.
* Create public user profiles.
* Implement following and unfollowing.

### Phase 4: Gamification

* Create the point events table.
* Calculate points for answers, quiz completion, and streaks.
* Create achievements.
* Create global and group leaderboards.
* Create the progress dashboard.

### Phase 5: Groups and Chat

* Create study groups.
* Create members and roles.
* Share quizzes with groups.
* Implement chat using Durable Objects and WebSockets.
* Persist chat history in D1.

### Phase 6: Audio

* Implement WebRTC signaling using Durable Objects.
* Create group audio rooms.
* Add microphone, input, output, and participant controls.
* Evaluate scalability and moderation limits.

## 12. Suggested Initial Commands

Create the React project:

```bash
npm create vite@latest apps/web -- --template react-ts
```

Install the main dependencies:

```bash
npm install @tanstack/react-query react-router-dom zod react-hook-form
npm install -D wrangler drizzle-kit typescript
npm install drizzle-orm
```

Create the D1 database:

```bash
npx wrangler d1 create study-quiz-db
```

Run migrations:

```bash
npx drizzle-kit generate
npx wrangler d1 migrations apply study-quiz-db --local
npx wrangler d1 migrations apply study-quiz-db --remote
```

Create the R2 bucket:

```bash
npx wrangler r2 bucket create study-quiz-files
```

## 13. MVP Definition of Done

The MVP will be complete when:

* users can create accounts and log in;
* users can upload a valid JSON file;
* the imported quiz appears in the private library;
* users can answer and complete quizzes;
* answers are saved on the server;
* the dashboard displays studied questions, correct answers, and history;
* users can publish quizzes;
* another user can search for and use a public quiz;
* the interface is responsive, accessible, and consistent.

## 14. Recommended Priority

To avoid making the project too large too early, the healthiest order is:

1. Migrate the current quiz to React while preserving its existing behavior.
2. Add authentication.
3. Persist quizzes and answers in D1.
4. Implement real JSON uploads.
5. Create the progress dashboard.
6. Publish and search quizzes.
7. Add simple social features.
8. Add groups.
9. Add chat.
10. Evaluate audio.

This allows the application to grow without losing its core purpose: helping users study more effectively.
