"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";

type Lesson = { _id: string; bookId: string; gradeId: string; subjectId: string; name: string; slug: string; createdBy?: string; sortOrder: number; isActive: boolean };
type Book = { _id: string; gradeId: string; subjectId: string; name: string; publisher: string; slug: string; createdBy?: string; sortOrder: number; isActive: boolean };
type Grade = { _id: string; subjectId: string; name: string; slug: string; level: number; createdBy?: string; sortOrder: number; isActive: boolean };
type Subject = { _id: string; name: string; slug: string; icon: string; createdBy?: string; sortOrder: number; isActive: boolean };
type User = { id: string; username: string; fullName: string; role: string; avatar: string };

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectSlug = params.subjectSlug as string;
  const gradeSlug = params.gradeSlug as string | undefined;
  
  const { user, isAuthenticated } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [bookmarkedBooks, setBookmarkedBooks] = useState<Set<string>>(new Set());
  
  // Filters from URL params
  const publisher = searchParams.get('publisher');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 12;

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
    if (subjects.length > 0) {
      const subject = subjects.find(s => s.slug === subjectSlug);
      setCurrentSubject(subject || null);
    }
  }, [subjects, subjectSlug]);

  useEffect(() => {
    if (grades.length > 0 && gradeSlug && currentSubject) {
      const grade = grades.find(g => g.slug === gradeSlug && g.subjectId === currentSubject._id);
      setCurrentGrade(grade || null);
    } else {
      setCurrentGrade(null);
    }
  }, [grades, gradeSlug, currentSubject]);

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

  // Filter books
  const filteredBooks = useMemo(() => {
    if (!currentSubject) return [];
    
    let filtered = books.filter(book => {
      const matchSubject = book.subjectId === currentSubject._id;
      const matchGrade = !currentGrade || book.gradeId === currentGrade._id;
      const matchPublisher = !publisher || book.publisher === publisher;
      return matchSubject && matchGrade && matchPublisher;
    });

    return filtered.map(book => {
      const bookLessons = lessons.filter(l => l.bookId === book._id);
      const subject = subjects.find(s => s._id === book.subjectId);
      const grade = grades.find(g => g._id === book.gradeId);
      return {
        ...book,
        id: book._id,
        subjectName: subject?.name || '',
        gradeName: grade?.name || '',
        children: bookLessons.map(l => ({ ...l, id: l._id })),
      };
    });
  }, [books, currentSubject, currentGrade, publisher, subjects, grades, lessons]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = filteredBooks.slice((page - 1) * pageSize, page * pageSize);

  // Available publishers for filter
  const availablePublishers = useMemo(() => {
    const publishers = new Set<string>();
    filteredBooks.forEach(book => {
      if (book.publisher) publishers.add(book.publisher);
    });
    return Array.from(publishers);
  }, [filteredBooks]);

  // Available grades for this subject
  const availableGrades = useMemo(() => {
    if (!currentSubject) return [];
    return grades.filter(g => g.subjectId === currentSubject._id).sort((a, b) => a.level - b.level);
  }, [grades, currentSubject]);

  const handleFilterChange = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page'); // Reset to page 1
    router.push(`?${newParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('page', newPage.toString());
    router.push(`?${newParams.toString()}`);
  };

  if (!currentSubject) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-600">Không tìm thấy môn học...</div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Trang chủ", href: "/" },
    { label: currentSubject.name, href: `/${currentSubject.slug}` },
  ];
  if (currentGrade) {
    breadcrumbs.push({ label: currentGrade.name, href: `/${currentSubject.slug}/${currentGrade.slug}` });
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header breadcrumbs={breadcrumbs} showMenuButton={false} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-5xl">{currentSubject.icon}</span>
            <div>
              <h1 className="text-4xl font-bold text-zinc-900">{currentSubject.name}</h1>
              {currentGrade && (
                <p className="text-xl text-zinc-600 mt-1">{currentGrade.name}</p>
              )}
            </div>
          </div>
          <p className="text-zinc-600">
            {filteredBooks.length} sách giáo khoa
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Grade Filter */}
          {!currentGrade && availableGrades.length > 0 && (
            <div className="flex gap-2">
              <span className="text-sm font-medium text-zinc-700 py-2">Lớp:</span>
              {availableGrades.map(grade => (
                <Link
                  key={grade._id}
                  href={`/${currentSubject.slug}/${grade.slug}`}
                  className="px-4 py-2 bg-white border border-zinc-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-sm"
                >
                  {grade.name}
                </Link>
              ))}
            </div>
          )}

          {/* Publisher Filter */}
          {availablePublishers.length > 1 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-zinc-700">Nhà xuất bản:</span>
              <button
                onClick={() => handleFilterChange('publisher', null)}
                className={`px-4 py-2 rounded-lg transition text-sm ${
                  !publisher
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-zinc-300 hover:border-indigo-500'
                }`}
              >
                Tất cả
              </button>
              {availablePublishers.map(pub => (
                <button
                  key={pub}
                  onClick={() => handleFilterChange('publisher', pub)}
                  className={`px-4 py-2 rounded-lg transition text-sm ${
                    publisher === pub
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-zinc-300 hover:border-indigo-500'
                  }`}
                >
                  {pub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Books Grid */}
        {paginatedBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-zinc-700 mb-2">
              Không tìm thấy sách nào
            </h3>
            <p className="text-zinc-500">
              Thử thay đổi bộ lọc hoặc quay lại trang chủ
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {paginatedBooks.map((book) => {
                const creator = book.createdBy ? getUserInfo(book.createdBy) : null;
                return (
                  <Link
                    key={book._id}
                    href={`/book/${book.slug}`}
                    className="group bg-white border-2 border-zinc-200 rounded-xl p-4 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 relative"
                  >
                    {isAuthenticated && (
                      <button
                        onClick={(e) => handleToggleBookmark(e, book._id)}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                        title={bookmarkedBooks.has(book._id) ? 'Đã lưu' : 'Lưu sách'}
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
                          <div className="text-xs text-zinc-500">
                            {book.publisher}
                          </div>
                          {creator && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <span>{creator.avatar}</span>
                              <span>{creator.fullName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Trước
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-10 h-10 rounded-lg transition ${
                        p === page
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
