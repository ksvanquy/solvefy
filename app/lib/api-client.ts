/**
 * API Client Utilities
 * Helper functions for consuming Solvefy RESTful API
 */

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    filters?: Record<string, any>;
  };
  message?: string;
  error?: string;
  isBookmarked?: boolean;
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Subjects
  async getSubjects() {
    return this.request<any[]>('/subjects');
  }

  async getSubject(id: string) {
    return this.request<any>(`/subjects?id=${id}`);
  }

  // Grades
  async getGrades(subjectId?: string) {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return this.request<any[]>(`/grades${query}`);
  }

  async getGrade(id: string) {
    return this.request<any>(`/grades?id=${id}`);
  }

  // Books
  async getBooks(params?: {
    subjectId?: string;
    gradeId?: string;
    publisher?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.subjectId) queryParams.append('subjectId', params.subjectId);
    if (params?.gradeId) queryParams.append('gradeId', params.gradeId);
    if (params?.publisher) queryParams.append('publisher', params.publisher);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/books${query ? `?${query}` : ''}`);
  }

  async getBook(slugOrId: string, bySlug: boolean = true) {
    const param = bySlug ? `slug=${slugOrId}` : `id=${slugOrId}`;
    return this.request<any>(`/books?${param}`);
  }

  // Lessons
  async getLessons(params?: {
    bookId?: string;
    subjectId?: string;
    gradeId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.bookId) queryParams.append('bookId', params.bookId);
    if (params?.subjectId) queryParams.append('subjectId', params.subjectId);
    if (params?.gradeId) queryParams.append('gradeId', params.gradeId);

    const query = queryParams.toString();
    return this.request<any[]>(`/lessons${query ? `?${query}` : ''}`);
  }

  async getLesson(slugOrId: string, bySlug: boolean = true) {
    const param = bySlug ? `slug=${slugOrId}` : `id=${slugOrId}`;
    return this.request<any>(`/lessons?${param}`);
  }

  // Questions
  async getQuestions(params?: {
    lessonId?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.lessonId) queryParams.append('lessonId', params.lessonId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/questions${query ? `?${query}` : ''}`);
  }

  async getQuestion(slugOrId: string, bySlug: boolean = true) {
    const param = bySlug ? `slug=${slugOrId}` : `id=${slugOrId}`;
    return this.request<any>(`/questions?${param}`);
  }

  async createQuestion(data: {
    lessonId: string;
    title: string;
    content: string;
    userId: string;
  }) {
    return this.request<any>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Answers
  async getAnswers(params?: { questionId?: string; userId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.questionId) queryParams.append('questionId', params.questionId);
    if (params?.userId) queryParams.append('userId', params.userId);

    const query = queryParams.toString();
    return this.request<any[]>(`/answers${query ? `?${query}` : ''}`);
  }

  async createAnswer(data: {
    questionId: string;
    answer: string;
    explain?: string;
    videoUrl?: string;
    videoType?: string;
    userId: string;
  }) {
    return this.request<any>('/answers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bookmarks
  async getBookmarks(userId: string) {
    return this.request<any[]>(`/bookmarks?userId=${userId}`);
  }

  async checkBookmark(userId: string, bookId: string) {
    return this.request<any>(`/bookmarks?userId=${userId}&bookId=${bookId}`);
  }

  async addBookmark(userId: string, bookId: string) {
    return this.request<any>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ userId, bookId }),
    });
  }

  async removeBookmark(userId: string, bookId: string) {
    return this.request<any>(`/bookmarks?userId=${userId}&bookId=${bookId}`, {
      method: 'DELETE',
    });
  }

  // Progress
  async getProgress(userId: string, lessonId?: string) {
    const query = lessonId
      ? `?userId=${userId}&lessonId=${lessonId}`
      : `?userId=${userId}`;
    return this.request<any[]>(`/progress${query}`);
  }

  async markLessonComplete(userId: string, lessonId: string) {
    return this.request<any>('/progress', {
      method: 'POST',
      body: JSON.stringify({ userId, lessonId }),
    });
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUser(id: string) {
    return this.request<any>(`/users?id=${id}`);
  }

  async getUserByUsername(username: string) {
    return this.request<any>(`/users?username=${username}`);
  }

  // Auth
  async login(username: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request<any>('/auth/logout', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for custom instances
export default ApiClient;

// Type exports
export type { ApiResponse };
