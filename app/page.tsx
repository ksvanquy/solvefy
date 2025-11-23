"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Header from "./components/Header";
import { useAuth } from "./contexts/AuthContext";

type Lesson = { _id: string; bookId: string; gradeId: string; subjectId: string; name: string; createdBy?: string; sortOrder: number; isActive: boolean };
type Book = { _id: string; gradeId: string; subjectId: string; name: string; publisher: string; createdBy?: string; sortOrder: number; isActive: boolean };
type Grade = { _id: string; subjectId: string; name: string; level: number; createdBy?: string; sortOrder: number; isActive: boolean };
type Subject = { _id: string; name: string; icon: string; createdBy?: string; sortOrder: number; isActive: boolean };
type User = { id: string; username: string; fullName: string; role: string; avatar: string };

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarkedBooks, setBookmarkedBooks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/solve')
      .then((r) => r.json())
      .then((data) => {
        if (data.subjects) setSubjects(data.subjects);
        if (data.grades) setGrades(data.grades);
        if (data.books) setBooks(data.books);
        if (data.lessons) setLessons(data.lessons);
        if (data.users) setUsers(data.users);
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`/api/bookmarks?userId=${user.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.bookmarks) {
            const bookIds = new Set<string>(data.bookmarks.map((b: any) => b.bookId as string));
            setBookmarkedBooks(bookIds);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [user]);

  const getUserInfo = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const handleToggleBookmark = async (e: React.MouseEvent, bookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    try {
      const isBookmarked = bookmarkedBooks.has(bookId);
      
      if (isBookmarked) {
        const response = await fetch(`/api/bookmarks?userId=${user.id}&bookId=${bookId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setBookmarkedBooks((prev) => {
            const next = new Set(prev);
            next.delete(bookId);
            return next;
          });
        }
      } else {
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, bookId }),
        });
        if (response.ok) {
          setBookmarkedBooks((prev) => new Set(prev).add(bookId));
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Enrich books with subject and grade information
  const allBooks = useMemo(() => {
    return books.map((book) => {
      const subject = subjects.find((s) => s._id === book.subjectId);
      const grade = grades.find((g) => g._id === book.gradeId && g.subjectId === book.subjectId);
      const bookLessons = lessons.filter((l) => l.bookId === book._id);
      return {
        ...book,
        id: book._id,
        subjectName: subject?.name || '',
        gradeName: grade?.name || '',
        children: bookLessons.map(l => ({ ...l, id: l._id })),
      };
    });
  }, [books, subjects, grades, lessons]);

  // Filter books based on search and subject
  const filteredBooks = useMemo(() => {
    return allBooks.filter((book) => {
      const matchesSearch = searchTerm === "" || 
        book.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === "all" || book._id.startsWith('bk') && book.subjectId === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [allBooks, searchTerm, selectedSubject]);

  // Group filtered books by subject and grade
  const groupedBooks = useMemo(() => {
    const groups: Record<string, Record<string, typeof filteredBooks>> = {};
    filteredBooks.forEach((book) => {
      if (!groups[book.subjectId]) groups[book.subjectId] = {};
      if (!groups[book.subjectId][book.gradeId]) groups[book.subjectId][book.gradeId] = [];
      groups[book.subjectId][book.gradeId].push(book);
    });
    return groups;
  }, [filteredBooks]);

  const toggleGrade = (gradeId: string) => {
    setCollapsedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(gradeId)) next.delete(gradeId);
      else next.add(gradeId);
      return next;
    });
  };

  const totalBooks = allBooks.length;

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      <Header
        showMenuButton={true}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalBooks={totalBooks}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Môn học */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r flex flex-col transition-transform duration-300 ease-in-out mt-[57px] lg:mt-0`}
        >
          <div className="p-4 border-b">
            <h2 className="font-semibold text-zinc-900 text-sm uppercase tracking-wide">Môn học</h2>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-2">
            <button
              onClick={() => {
                setSelectedSubject("all");
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors flex items-center justify-between ${
                selectedSubject === "all"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📚</span>
                <span className="font-medium">Tất cả</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedSubject === "all" 
                  ? "bg-indigo-500" 
                  : "bg-zinc-200 text-zinc-600"
              }`}>
                {allBooks.length}
              </span>
            </button>

            <div className="my-2 border-t"></div>

            {subjects.map((subject) => {
              const count = allBooks.filter((b) => b.subjectId === subject._id).length;
              const isActive = selectedSubject === subject._id;
              const icon = subject.icon || (subject.name === "Toán" ? "🔢" : subject.name === "Tiếng Việt" ? "📖" : "📚");
              
              return (
                <button
                  key={subject._id}
                  onClick={() => {
                    setSelectedSubject(subject._id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors flex items-center justify-between ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive 
                      ? "bg-indigo-500" 
                      : "bg-zinc-200 text-zinc-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden mt-[57px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
          {/* Mobile search */}
          <div className="sm:hidden mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-zinc-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-zinc-700 mb-2">
                Không tìm thấy sách nào
              </h3>
              <p className="text-zinc-500">
                Thử tìm kiếm với từ khóa khác hoặc chọn môn học khác
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {subjects.map((subject) => {
                if (!groupedBooks[subject._id]) return null;
                
                const subjectGrades = grades.filter((g) => g.subjectId === subject._id);
                
                return (
                  <div key={subject._id}>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <span className="text-3xl">
                        {subject.icon || (subject.name === "Toán" ? "🔢" : "📖")}
                      </span>
                      {subject.name}
                    </h2>

                    {subjectGrades.map((grade) => {
                      if (!groupedBooks[subject._id][grade._id]) return null;
                      
                      const isCollapsed = collapsedGrades.has(grade._id);
                      const gradeBooks = groupedBooks[subject._id][grade._id];

                      return (
                        <div key={grade._id} className="mb-6">
                          <button
                            onClick={() => toggleGrade(grade._id)}
                            className="flex items-center gap-2 mb-3 hover:text-indigo-600 transition-colors group"
                          >
                            <span className="text-lg group-hover:scale-110 transition-transform">
                              {isCollapsed ? "▶" : "▼"}
                            </span>
                            <h3 className="text-lg font-semibold text-zinc-700">
                              {grade.name}
                            </h3>
                            <span className="text-sm text-zinc-500">
                              ({gradeBooks.length} sách)
                            </span>
                          </button>

                          {!isCollapsed && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                              {gradeBooks.map((book) => {
                                const creator = book.createdBy ? getUserInfo(book.createdBy) : null;
                                return (
                                  <Link
                                    key={book._id}
                                    href={`/book/${book._id}`}
                                    className="group bg-white border-2 border-zinc-200 rounded-xl p-4 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 relative"
                                  >
                                    {isAuthenticated && (
                                      <button
                                        onClick={(e) => handleToggleBookmark(e, book._id)}
                                        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                                        title={bookmarkedBooks.has(book.id) ? 'Đã lưu' : 'Lưu sách'}
                                      >
                                        <svg 
                                          className={`w-5 h-5 ${
                                            bookmarkedBooks.has(book._id)
                                              ? 'text-amber-500 fill-amber-500'
                                              : 'text-zinc-400 hover:text-amber-500'
                                          } transition-colors`}
                                          fill={bookmarkedBooks.has(book._id) ? 'currentColor' : 'none'}
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                      </button>
                                    )}
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                                        📚
                                      </div>
                                      <div className="flex-1 min-w-0 pr-6">
                                        <h4 className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                                          {book.name}
                                        </h4>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                                              {book.children.length} bài học
                                            </span>
                                          </div>
                                          {creator && (
                                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                              <span>{creator.avatar}</span>
                                              <span>Created by {creator.fullName}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
