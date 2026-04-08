const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ep_token");
}

async function request(method, path, body, opts = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get:    (path)        => request("GET",    path),
  post:   (path, body)  => request("POST",   path, body),
  put:    (path, body)  => request("PUT",    path, body),
  delete: (path)        => request("DELETE", path),

  // File upload (multipart)
  upload: async (path, formData) => {
    const token = getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register:       (b) => api.post("/api/auth/register", b),
  login:          (b) => api.post("/api/auth/login", b),
  me:             ()  => api.get("/api/auth/me"),
  onboarding:     (b) => api.post("/api/auth/onboarding", b),
  forgotPassword: (b) => api.post("/api/auth/forgot-password", b),
  resetPassword:  (b) => api.post("/api/auth/reset-password", b),
};

// ── Content ───────────────────────────────────────────────────────────────────
export const contentApi = {
  subjects:     (levelType) => api.get(`/api/content/subjects${levelType ? `?levelType=${levelType}` : ""}`),
  topics:       (id)        => api.get(`/api/content/subjects/${id}/topics`),
  lessons:      (subtopicId)=> api.get(`/api/content/subtopics/${subtopicId}/lessons`),
  lesson:       (id)        => api.get(`/api/content/lessons/${id}`),
  mindmap:      (id)        => api.get(`/api/content/subtopics/${id}/mindmap`),
  // Admin
  createSubject:  (b) => api.post("/api/content/subjects", b),
  createTopic:    (b) => api.post("/api/content/topics", b),
  createSubtopic: (b) => api.post("/api/content/subtopics", b),
  createLesson:   (b) => api.post("/api/content/lessons", b),
  updateLesson:   (id, b) => api.put(`/api/content/lessons/${id}`, b),
  deleteLesson:   (id) => api.delete(`/api/content/lessons/${id}`),
  createModelAnswer: (b) => api.post("/api/content/model-answers", b),
  completeLesson:    (id) => api.post(`/api/content/lessons/${id}/complete`),
  deleteSubject:     (id) => api.delete(`/api/content/subjects/${id}`),
  mySubjects:        () => api.get("/api/users/me/subjects"),
  myProgress:         () => api.get("/api/content/my-progress"),
  subtopics:          (topicId) => api.get(`/api/content/topics/${topicId}/subtopics`),
};

// ── Flashcards ────────────────────────────────────────────────────────────────
export const flashcardsApi = {
  decks:           (params = {}) => api.get(`/api/flashcards/decks?${new URLSearchParams(params)}`),
  createDeck:      (b)  => api.post("/api/flashcards/decks", b),
  updateDeck:      (id, b) => api.put(`/api/flashcards/decks/${id}`, b),
  deleteDeck:      (id) => api.delete(`/api/flashcards/decks/${id}`),
  cards:           (deckId) => api.get(`/api/flashcards/decks/${deckId}/cards`),
  due:             ()   => api.get("/api/flashcards/due"),
  addCard:         (b)  => api.post("/api/flashcards/cards", b),
  updateCard:      (id, b) => api.put(`/api/flashcards/cards/${id}`, b),
  deleteCard:      (id) => api.delete(`/api/flashcards/cards/${id}`),
  review:          (b)  => api.post("/api/flashcards/review", b),
  sessionComplete: (b)  => api.post("/api/flashcards/session-complete", b),
  compete:         (b)  => api.post("/api/flashcards/compete", b),
  daily:           ()   => api.get("/api/flashcards/daily"),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat:               (b) => api.post("/api/ai/chat", b),
  sessions:           ()  => api.get("/api/ai/sessions"),
  messages:           (id)=> api.get(`/api/ai/sessions/${id}/messages`),
  mark:               (b) => api.post("/api/ai/mark", b),
  blurt:              (b) => api.post("/api/ai/blurt", b),
  feynman:            (b) => api.post("/api/ai/feynman", b),
  generateFlashcards: (b) => api.post("/api/ai/generate-flashcards", b),
  studyGuidance:      ()  => api.get("/api/ai/study-guidance"),
};

// ── Exams ─────────────────────────────────────────────────────────────────────
export const examsApi = {
  papers:           (params = {}) => api.get(`/api/exams/papers?${new URLSearchParams(params)}`),
  papersBySubject:  (subjectId)   => api.get(`/api/exams/papers?subjectId=${subjectId}`),
  paper:         (id)  => api.get(`/api/exams/papers/${id}`),
  questions:     (id)  => api.get(`/api/exams/papers/${id}/questions`),
  startAttempt:  (b)   => api.post("/api/exams/attempts", b),
  saveAnswer:    (id, b) => api.post(`/api/exams/attempts/${id}/answer`, b),
  submitAttempt: (id, b) => api.post(`/api/exams/attempts/${id}/submit`, b),
  attempts:      ()    => api.get("/api/exams/attempts"),
  attempt:       (id)  => api.get(`/api/exams/attempts/${id}`),
  schedule:      ()    => api.get("/api/exams/schedule"),
  addExam:       (b)   => api.post("/api/exams/schedule", b),
  deleteExam:       (id)  => api.delete(`/api/exams/schedule/${id}`),
  uploadPaper:      (id, fd) => api.upload(`/api/exams/papers/${id}/upload-paper`, fd),
  uploadMarkScheme: (id, fd) => api.upload(`/api/exams/papers/${id}/upload-markscheme`, fd),
  deletePaper:      (id) => api.delete(`/api/exams/papers/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard:    () => api.get("/api/analytics/dashboard"),
  memory:       (subjectId) => api.get(`/api/analytics/memory${subjectId ? `?subjectId=${subjectId}` : ""}`),
  xpHistory:    () => api.get("/api/analytics/xp-history"),
  targetGrade:  (b) => api.post("/api/analytics/target-grade", b),
  mistakes:     () => api.get("/api/analytics/common-mistakes"),
  peers:        () => api.get("/api/analytics/peers"),
};

// ── Gamification ──────────────────────────────────────────────────────────────
export const gamificationApi = {
  leaderboard:      (scope) => api.get(`/api/gamification/leaderboard?scope=${scope || "global"}`),
  achievements:     ()  => api.get("/api/gamification/achievements"),
  startPomodoro:    (b) => api.post("/api/gamification/pomodoro/start", b),
  completePomodoro: (id)=> api.post(`/api/gamification/pomodoro/${id}/complete`),
  stats:            ()  => api.get("/api/gamification/stats"),
};

// ── Social ────────────────────────────────────────────────────────────────────
export const socialApi = {
  search:         (q, school) => api.get(`/api/social/users/search?q=${q || ""}&school=${school || ""}`),
  sendRequest:    (b)  => api.post("/api/social/friends/request", b),
  respondRequest: (id, b) => api.put(`/api/social/friends/${id}/respond`, b),
  friends:        ()   => api.get("/api/social/friends"),
  pending:        ()   => api.get("/api/social/friends/pending"),
  conversations:  ()   => api.get("/api/social/messages"),
  messages:       (userId) => api.get(`/api/social/messages/${userId}`),
  sendMessage:    (b)  => api.post("/api/social/messages", b),
  groups:         ()   => api.get("/api/social/groups"),
  createGroup:    (b)  => api.post("/api/social/groups", b),
  joinGroup:      (id) => api.post(`/api/social/groups/${id}/join`),
  leaveGroup:     (id) => api.delete(`/api/social/groups/${id}/leave`),
  forum:          (topicId) => api.get(`/api/social/forum${topicId ? `?topicId=${topicId}` : ""}`),
  createPost:     (b)  => api.post("/api/social/forum", b),
  upvote:         (id) => api.post(`/api/social/forum/${id}/upvote`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  profile:      (id) => api.get(`/api/users/${id}`),
  updateMe:     (b)  => api.put("/api/users/me", b),
  updateSubjects:(b) => api.put("/api/users/me/subjects", b),
  schedule:     ()   => api.get("/api/users/me/schedule"),
  completeTask: (id) => api.post(`/api/users/me/schedule/${id}/complete`),
  notifications:()   => api.get("/api/users/me/notifications"),
  readNotif:    (id) => api.put(`/api/users/me/notifications/${id}/read`),
  revisingNow:  () => api.get("/api/users/revising-now"),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  overview:       () => api.get("/api/admin/overview"),
  users:          (q) => api.get(`/api/admin/users${q ? `?q=${q}` : ""}`),
  updateRole:     (id, b) => api.put(`/api/admin/users/${id}/role`, b),
  deleteUser:     (id) => api.delete(`/api/admin/users/${id}`),
  contentTree:    () => api.get("/api/admin/content/all"),
  drafts:         () => api.get("/api/admin/content/drafts"),
  bulkPublish:    (b) => api.put("/api/admin/content/lessons/bulk-publish", b),
  flagged:        () => api.get("/api/admin/forum/flagged"),
  deletePost:     (id) => api.delete(`/api/admin/forum/${id}`),
  broadcast:      (b) => api.post("/api/admin/notifications/broadcast", b),
};
