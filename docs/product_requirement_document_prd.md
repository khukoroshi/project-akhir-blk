# Product Requirement Document (PRD) — AniSphere

**Project Name:** AniSphere (Formerly *MyAnimeWatchList*)  
**Version:** 2.0.1 (Refactoring & Community Integration)  
**Status:** Active Draft  
**Target Architecture:** Modular Monolith (Express.js) + Feature-Based React Frontend  

---

## 1. Project Overview & Architectural Vision

### 1.1 Core Concept
**AniSphere** is a hybrid **Anime Watchlist Tracker & Social Community Platform**. It bridges personal episode/anime tracking with community interaction, allowing anime fans to discuss, review, share thoughts, and build connections around their favorite series.

### 1.2 Core Architectural Decisions
1. **Primary Concept:** Hybrid (Anime Tracker + Social Community)
2. **Community Model:** Open Community Feed with anime-specific discussion threads.
3. **Development Strategy:** **Phased Refactoring** — Retain existing React 19 + Express setup while restructuring database schemas, decoupling anime catalog data from user watchlists, and introducing domain-driven features incrementally.
4. **Tech Stack:** Frontend: React 19, Vite, Tailwind CSS. Backend: Node.js, Express, MySQL. External anime API: AniList only (Jikan is not used).

---

## 2. Technical Audit & Refactoring Requirements (Phase 0 Fixes)

Before implementing community features, the following foundational issues in `project-akhir-blk-main` must be resolved:

### 2.1 Critical Fixes Checklist
- [ ] **Dual `AuthProvider` Bug:** Remove duplicate `AuthProvider` wrapping in `App.jsx`. Retain single wrapper at `main.jsx`.
- [ ] **Hardcoded API URLs:** Replace hardcoded `"http://localhost:3000/api"` in `frontend/src/services/api.js` with Vite environment variable `import.meta.env.VITE_API_URL`.
- [ ] **JWT Storage & Auth:** Transition JWT storage from `localStorage` to **HttpOnly, Secure, SameSite Cookies** with CSRF protection mechanisms.
- [ ] **Backend Input Validation:** Introduce **Zod** or **Joi** middleware across all POST/PUT routes (validate email formats, string lengths, score boundaries 0-10, episode counts, and enum statuses).
- [ ] **HTML Sanitization:** Replace raw `dangerouslySetInnerHTML` in `AnimeDetail.jsx` with `DOMPurify.sanitize()` or direct plain-text rendering to mitigate XSS risks from external AniList API payloads.
- [ ] **Database Migration Safety:** Remove `DROP DATABASE` directives from `project_akhir_blk.sql`. Implement a structured SQL migration script workflow (Schema Creation -> Data Migration -> Seeders).
- [ ] **AniList API Integration:** AniList is the single external anime API. Remove all Jikan code (controller, service, routes). Standardize the AniList handler with request timeouts, rate-limit handling, and search query caching.
- [ ] **Backend Test Runner:** Configure Vitest/Supertest inside `backend/package.json`.

---

## 3. Database Schema & Architecture

### 3.1 Relational Architecture Concept
The current `animes` table blends master anime data with user progress. We decouple this into `anime_catalog` (cached master data) and `user_anime` (user-specific watchlist state).

```
[USERS] 1 ─── 1 [USER_PROFILES]
  │
  ├── 1 ─── N [USER_ANIME] N ─── 1 [ANIME_CATALOG]
  ├── 1 ─── N [POSTS] 1 ─── N [POST_IMAGES]
  │             │
  │             ├── 1 ─── N [COMMENTS] (Self-referential parent_comment_id)
  │             └── 1 ─── N [POST_LIKES]
  ├── 1 ─── N [REVIEWS] N ─── 1 [ANIME_CATALOG]
  ├── 1 ─── N [FOLLOWS] (Follower / Following)
  └── 1 ─── N [NOTIFICATIONS]
```

### 3.2 SQL Schema Specification (MySQL 8.0)

```sql
-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  banner_url VARCHAR(500),
  is_private BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. ANIME CATALOG & TRACKER DECOUPLING
CREATE TABLE IF NOT EXISTS anime_catalog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(100) NOT NULL,
  source ENUM('anilist') NOT NULL DEFAULT 'anilist',
  title VARCHAR(255) NOT NULL,
  cover_image VARCHAR(500),
  total_episodes INT DEFAULT 0,
  status VARCHAR(50),
  synopsis TEXT,
  genres JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_external_anime (external_id, source)
);

CREATE TABLE IF NOT EXISTS user_anime (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  anime_id INT NOT NULL,
  status ENUM('watching', 'completed', 'plan_to_watch', 'dropped', 'on_hold', 'rewatching') NOT NULL,
  episodes_watched INT DEFAULT 0,
  score DECIMAL(3,1) DEFAULT 0.0,
  tier VARCHAR(10) NULL,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (anime_id) REFERENCES anime_catalog(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_anime (user_id, anime_id)
);

-- 3. COMMUNITY FEED & INTERACTION
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  anime_id INT NULL, -- Optional link to specific anime
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (anime_id) REFERENCES anime_catalog(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS post_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_comment_id INT NULL,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_likes (
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 4. SOCIAL & REVIEWS
CREATE TABLE IF NOT EXISTS follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  anime_id INT NOT NULL,
  rating DECIMAL(3,1) NOT NULL,
  summary VARCHAR(255),
  content TEXT NOT NULL,
  contains_spoilers BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (anime_id) REFERENCES anime_catalog(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_anime_review (user_id, anime_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  sender_id INT NOT NULL,
  type ENUM('like', 'comment', 'follow', 'reply') NOT NULL,
  entity_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. Software Architecture Specifications

### 4.1 Backend Structure (Modular Monolith)
```
backend/
├── src/
│   ├── config/              # Environment, CORS, DB connections
│   ├── middlewares/         # Auth, Zod Validation, Error Handler, Rate Limiter
│   ├── integrations/        # AniList API client with timeout & cache
│   ├── modules/             # Feature Modules
│   │   ├── auth/            # Controllers, Services, Models, Routes
│   │   ├── users/           # User profile & social follow
│   │   ├── anime/           # Catalog caching & API fetching
│   │   ├── watchlist/       # Personal tracking & status
│   │   ├── posts/           # Community feed & likes
│   │   ├── comments/        # Nested commenting logic
│   │   ├── reviews/         # Long-form anime reviews
│   │   └── notifications/   # User alert feeds
│   ├── utils/               # Logger, token signers, response helpers
│   └── app.mjs              # Express initialization
└── index.mjs
```

### 4.2 Frontend Structure (Feature-Based Domain Layout)
```
frontend/src/
├── components/              # Global reusable UI (Button, Modal, Navbar, Input)
├── layouts/                 # AppLayout, AuthLayout
├── features/                # Domain-specific components, hooks, & state
│   ├── auth/
│   ├── anime/               # Catalog, Details, Search
│   ├── watchlist/           # List view, status badges, episode incrementor
│   ├── community/           # PostCard, Feed, CreatePostModal
│   ├── discussion/          # Anime-specific threads
│   ├── reviews/             # Review Form & Card
│   └── profile/             # User stats, headers, follow buttons
├── services/                # Axios instance & unified API methods
├── context/                 # Global contexts (AuthContext, ThemeContext)
├── hooks/                   # Shared custom React hooks
└── pages/                   # Top-level routes (Home, Feed, AnimeDetail, Profile)
```

---

## 5. API Endpoint Specifications

### Auth & User Management
- `POST /api/auth/register` — Create user account
- `POST /api/auth/login` — Authenticate & set HttpOnly cookie
- `POST /api/auth/logout` — Clear auth cookie
- `GET /api/auth/me` — Fetch active session user profile

### Profiles & Social Relationships
- `GET /api/users/:username` — Fetch public profile & tracking stats
- `PUT /api/users/profile` — Update bio, display name, avatar
- `POST /api/users/:id/follow` — Follow/Unfollow user

### Anime Catalog & Watchlist
- `GET /api/anime/search?q=...` — Proxy search through AniList API + cache
- `GET /api/anime/:id` — Details from catalog + external metadata
- `GET /api/watchlist` — Fetch personal watchlist
- `POST /api/watchlist` — Add or update anime progress in user watchlist

### Community Feed & Discussions
- `GET /api/posts?page=1&limit=20` — Paginated chronological feed
- `POST /api/posts` — Create a feed post (with optional anime linkage)
- `POST /api/posts/:id/like` — Toggle like on post
- `GET /api/posts/:id/comments` — Fetch thread comments
- `POST /api/posts/:id/comments` — Add comment or reply

### Reviews
- `GET /api/anime/:id/reviews` — Get user reviews for a specific anime
- `POST /api/reviews` — Write/Edit long-form anime review

---

## 6. Development Roadmap & Implementation Steps

### Phase 1: Security, Hygiene & Database Refactoring
1. Fix duplicate `AuthProvider` in frontend.
2. Setup environment variables (`VITE_API_URL`, DB secrets).
3. Implement Zod request validation middleware on Express routes.
4. Execute DB migration scripts to separate `anime_catalog` from `user_anime`.
5. Implement HttpOnly Cookie authentication flow.

### Phase 2: User Profiles & Social Graph
1. Implement User Profile schema and endpoints.
2. Build Profile page UI with stats summary (total watched, episodes, score distribution).
3. Implement Follow/Unfollow API and action controls on profile pages.

### Phase 3: Community Feed Implementation
1. Construct `posts`, `post_images`, `comments`, and `post_likes` backend modules.
2. Build `Community Feed` UI page with `CreatePostModal` and `PostCard`.
3. Add spoiler toggles and image upload support (Cloudinary/Storage).
4. Implement comment thread components supporting replies via `parent_comment_id`.

### Phase 4: Anime Discussion & Reviews Integration
1. Extend `AnimeDetail` page to include tabs: Overview, Reviews, Discussions, Watchers.
2. Implement Anime Review creation and rating components.
3. Link feed posts specifically to an `anime_id` for targeted discussions.

### Phase 5: Notifications & Optimization
1. Build notification polling / query endpoint for likes, comments, and follows.
2. Implement SQL query optimizations, pagination on feeds, and backend indexing.

---

## 7. Guidelines for AI Assistants

When assisting on this repository, all AI agents must strictly adhere to the following rules:

1. **Preserve Authentic Code Base Structure:** Do not rewrite whole modules from scratch unless requested. Refactor existing code cleanly.
2. **Modular Monolith Integrity:** Always place new backend logic within `backend/src/modules/<feature_name>/` adhering to controller-service-model separation.
3. **Feature-Based Frontend Design:** Place new React components inside `frontend/src/features/<feature_name>/`.
4. **Validation First:** Ensure every new POST/PUT endpoint is guarded by a Zod schema before processing logic.
5. **Database Safety:** Never issue destructible `DROP TABLE` or `DROP DATABASE` queries during schema migrations. Always provide backwards-compatible migration steps.
6. **Single External API:** AniList is the only external anime API. Do not add or reintroduce Jikan.