'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

interface UserStats {
  completedQuestions: number;
  totalQuestions: number;
  bookmarkedBooks: number;
  questionsCreated?: number;
  answersProvided?: number;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    completedQuestions: 0,
    totalQuestions: 0,
    bookmarkedBooks: 0,
  });
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user progress
      const progressResponse = await fetch(`/api/progress?userId=${user?.id}`);
      const progressData = await progressResponse.json();
      
      // Fetch user bookmarks
      const bookmarksResponse = await fetch(`/api/bookmarks?userId=${user?.id}`);
      const bookmarksData = await bookmarksResponse.json();
      
      // Fetch categories to get book names
      const solveResponse = await fetch('/api/solve');
      const solveData = await solveResponse.json();
      
      // Map bookmarks with book details
      const bookmarksWithDetails = bookmarksData.bookmarks?.map((bookmark: any) => {
        let bookDetails = null;
        if (solveData.categories) {
          for (const subject of solveData.categories) {
            for (const grade of subject.children) {
              const book = grade.children.find((b: any) => b.id === bookmark.bookId);
              if (book) {
                bookDetails = {
                  ...bookmark,
                  bookName: book.name,
                  subject: subject.name,
                  grade: grade.name,
                };
                break;
              }
            }
            if (bookDetails) break;
          }
        }
        return bookDetails || bookmark;
      }) || [];

      // Map progress with question details
      const progressWithDetails = progressData.progress?.map((prog: any) => {
        const question = solveData.questions?.find((q: any) => q.id === prog.questionId);
        return {
          ...prog,
          questionTitle: question?.title || prog.questionId,
          questionContent: question?.content,
        };
      }) || [];

      const completedCount = progressData.progress?.filter((p: any) => p.status === 'completed').length || 0;

      setStats({
        completedQuestions: completedCount,
        totalQuestions: solveData.questions?.length || 0,
        bookmarkedBooks: bookmarksData.bookmarks?.length || 0,
      });
      setUserProgress(progressWithDetails);
      setBookmarks(bookmarksWithDetails);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student':
        return '👨‍🎓 Học sinh';
      case 'teacher':
        return '👨‍🏫 Giáo viên';
      case 'admin':
        return '👨‍💼 Quản trị viên';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-700';
      case 'teacher':
        return 'bg-green-100 text-green-700';
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        showMenuButton={false}
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Hồ sơ cá nhân' },
        ]}
      />

      <div className="max-w-6xl mx-auto p-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.avatar || user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
                <p className="text-gray-500 mt-1">@{user.username}</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                  {user.grade && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      Lớp {user.grade}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>

          {user.email && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user.email}
              </p>
            </div>
          )}

          {user.subjects && user.subjects.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-600">
                <span className="font-medium">Môn dạy:</span> {user.subjects.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Câu hỏi đã giải</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.completedQuestions}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Sách đã lưu</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.bookmarkedBooks}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  {user.role === 'teacher' || user.role === 'admin' ? 'Câu hỏi đã tạo' : 'Tỷ lệ hoàn thành'}
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {user.role === 'teacher' || user.role === 'admin'
                    ? stats.questionsCreated || 0
                    : stats.totalQuestions > 0
                    ? `${Math.round((stats.completedQuestions / stats.totalQuestions) * 100)}%`
                    : '0%'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">
                  {user.role === 'teacher' || user.role === 'admin' ? '📝' : '📊'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {userProgress.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
            <div className="space-y-3">
              {userProgress.slice(0, 10).map((progress: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      progress.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <span className="text-lg">
                        {progress.status === 'completed' ? '✓' : '⏱'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{progress.questionTitle}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>
                          {progress.completedAt 
                            ? new Date(progress.completedAt).toLocaleDateString('vi-VN')
                            : 'Chưa hoàn thành'}
                        </span>
                        {progress.isCorrect !== null && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            progress.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {progress.isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        )}
                        <span className="text-xs">• {progress.attempts} lần thử</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${
                    progress.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {progress.status === 'completed' ? 'Đã hoàn thành' : 'Đang làm'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarked Books */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sách đã lưu</h2>
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bookmark: any, index: number) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/book/${bookmark.bookId}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 flex-1">{bookmark.bookName || bookmark.bookId}</p>
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  {bookmark.subject && bookmark.grade && (
                    <p className="text-xs text-gray-500 mb-2">
                      {bookmark.subject} • {bookmark.grade}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Đã lưu: {new Date(bookmark.bookmarkedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p>Chưa có sách nào được lưu</p>
              <p className="text-sm mt-2">Hãy khám phá và lưu những sách yêu thích của bạn!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
