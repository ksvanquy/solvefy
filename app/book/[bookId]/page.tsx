"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "../../components/Header";
import QuestionForm from "../../components/QuestionForm";
import AnswerForm from "../../components/AnswerForm";
import QuestionItem from "../../components/QuestionItem";
import { useAuth } from "../../contexts/AuthContext";

type Question = { id: string; lessonId: string; title: string; content: string; createdBy?: string };
type Answer = { id: string; questionId: string; answer: string; explain: string; createdBy?: string };
type Lesson = { id: string; name: string; createdBy?: string };
type Book = { id: string; name: string; children: Lesson[]; createdBy?: string };
type User = { id: string; username: string; fullName: string; role: string; avatar: string };

export default function BookPage() {
  const params = useParams();
  const bookId = params.bookId as string;
  const { user, isAuthenticated } = useAuth();
  
  const [bookInfo, setBookInfo] = useState<{ book: Book | null; subject: string; grade: string; bookCreator?: User | null }>({
    book: null,
    subject: "",
    grade: "",
    bookCreator: null,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<string, Answer[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetch("/api/solve")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories && data.questions && data.users) {
          // Find book in categories tree
          let foundBook: Book | null = null;
          let subjectName = "";
          let gradeName = "";

          for (const subject of data.categories) {
            for (const grade of subject.children) {
              const book = grade.children.find((b: Book) => b.id === bookId);
              if (book) {
                foundBook = book;
                subjectName = subject.name;
                gradeName = grade.name;
                break;
              }
            }
            if (foundBook) break;
          }

          const bookCreator = foundBook?.createdBy 
            ? data.users.find((u: User) => u.id === foundBook.createdBy) 
            : null;

          setBookInfo({ book: foundBook, subject: subjectName, grade: gradeName, bookCreator });
          setQuestions(data.questions);
          setUsers(data.users);
          
          // Auto-select first lesson
          if (foundBook && foundBook.children.length > 0) {
            setSelectedLessonId(foundBook.children[0].id);
          }
        }
      })
      .catch((e) => console.error(e));
  }, [bookId]);

  const getUserInfo = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!user || !confirm('Đề bạn chắc chắn muốn xóa câu trả lời này?')) return;

    try {
      const response = await fetch(`/api/answers/${answerId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload answers for affected question
        const questionId = Object.keys(answersMap).find(qId => 
          answersMap[qId].some(ans => ans.id === answerId)
        );
        if (questionId) {
          handleSolve(questionId);
        }
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!user || !confirm('Đề bạn chắc chắn muốn xóa câu hỏi này và tất cả câu trả lời?')) return;

    try {
      const response = await fetch(`/api/questions/${questionId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload questions
        fetch('/api/solve')
          .then((r) => r.json())
          .then((data) => {
            if (data.questions) {
              setQuestions(data.questions);
            }
          });
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleSolve = async (qid: string) => {
    setLoadingId(qid);
    try {
      const res = await fetch(`/api/answers?questionId=${qid}`);
      const json = await res.json();
      setAnswersMap((s) => ({ ...s, [qid]: json.answers || [] }));
    } catch (err) {
      console.error(err);
      setAnswersMap((s) => ({ ...s, [qid]: [] }));
    } finally {
      setLoadingId(null);
    }
  };

  const getLessonQuestions = (lessonId: string) =>
    questions.filter((q) => q.lessonId === lessonId);

  const selectedLesson = bookInfo.book?.children.find((l) => l.id === selectedLessonId);
  const selectedQuestions = selectedLessonId ? getLessonQuestions(selectedLessonId) : [];

  // Auto-load all answers when lesson is selected
  useEffect(() => {
    if (selectedQuestions.length > 0) {
      selectedQuestions.forEach((q) => {
        if (!answersMap[q.id]) {
          handleSolve(q.id);
        }
      });
    }
  }, [selectedLessonId, selectedQuestions.length]);

  if (!bookInfo.book) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      <Header
        showMenuButton={true}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: bookInfo.book.name },
        ]}
        subtitle={`${bookInfo.subject} → ${bookInfo.grade}${
          bookInfo.bookCreator ? ` • ${bookInfo.bookCreator.avatar} Created by ${bookInfo.bookCreator.fullName}` : ""
        }`}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Danh sách bài học */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white border-r flex flex-col transition-transform duration-300 ease-in-out`}
        >
          <div className="p-4 border-b bg-zinc-50">
            <h2 className="font-semibold text-zinc-900">Danh sách bài học</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {bookInfo.book.children.length} bài học
            </p>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-2">
            {bookInfo.book.children.map((lesson) => {
              const lessonQuestions = getLessonQuestions(lesson.id);
              const isActive = selectedLessonId === lesson.id;
              const lessonCreator = lesson.createdBy ? getUserInfo(lesson.createdBy) : null;
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setSidebarOpen(false); // Close sidebar on mobile after selection
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? "bg-indigo-50 border-2 border-indigo-500"
                      : "hover:bg-zinc-50 border-2 border-transparent"
                  }`}
                >
                  <div className={`font-medium ${isActive ? "text-indigo-700" : "text-zinc-800"}`}>
                    {lesson.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {lessonQuestions.length} câu hỏi
                  </div>
                  {lessonCreator && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                      <span className="text-xs">{lessonCreator.avatar}</span>
                      <span>{lessonCreator.fullName}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content - Câu hỏi và đáp án */}
        <main className="flex-1 overflow-y-auto">
          {selectedLesson ? (
            <div className="max-w-4xl mx-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-900">{selectedLesson.name}</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {selectedQuestions.length} câu hỏi
                  </p>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowQuestionForm(true)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-200 transition font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Đặt câu hỏi
                  </button>
                )}
              </div>

              {selectedQuestions.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <p>Chưa có câu hỏi nào cho bài học này</p>
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowQuestionForm(true)}
                      className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-200 transition font-medium"
                    >
                      Đặt câu hỏi đầu tiên
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedQuestions.map((q) => {
                    const questionCreator = q.createdBy ? getUserInfo(q.createdBy) : null;
                    const answers = answersMap[q.id] || [];
                    
                    return (
                      <QuestionItem
                        key={q.id}
                        question={q}
                        questionCreator={questionCreator}
                        answers={answers}
                        users={users}
                        currentUserId={user?.id}
                        isAuthenticated={isAuthenticated}
                        onAnswerClick={() => {
                          setSelectedQuestion(q);
                          setSelectedAnswer(null);
                          setShowAnswerForm(true);
                        }}
                        onEditAnswer={(ans) => {
                          setSelectedQuestion(q);
                          setSelectedAnswer(ans);
                          setShowAnswerForm(true);
                        }}
                        onDeleteAnswer={handleDeleteAnswer}
                        onEditQuestion={() => {
                          setEditingQuestion(q);
                          setShowQuestionForm(true);
                        }}
                        onDeleteQuestion={() => handleDeleteQuestion(q.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Chọn một bài học từ sidebar bên trái
            </div>
          )}
        </main>
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && selectedLesson && (
        <QuestionForm
          lessonId={selectedLesson.id}
          lessonName={selectedLesson.name}
          onClose={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
          onSuccess={() => {
            // Reload questions
            fetch("/api/solve")
              .then((r) => r.json())
              .then((data) => {
                if (data.questions) {
                  setQuestions(data.questions);
                }
              });
          }}
          existingQuestion={editingQuestion}
        />
      )}

      {/* Answer Form Modal */}
      {showAnswerForm && selectedQuestion && (() => {
        return (
          <AnswerForm
            questionId={selectedQuestion.id}
            questionContent={selectedQuestion.content}
            existingAnswer={selectedAnswer || null}
            onClose={() => {
              setShowAnswerForm(false);
              setSelectedQuestion(null);
              setSelectedAnswer(null);
            }}
            onSuccess={(newAnswer) => {
              // Update answersMap immediately with the new answer
              if (newAnswer && selectedQuestion) {
                setAnswersMap((prev) => {
                  const existingAnswers = prev[selectedQuestion.id] || [];
                  
                  let updatedAnswers;
                  if (selectedAnswer) {
                    // Update existing answer (edit mode)
                    const answerIndex = existingAnswers.findIndex(a => a.id === selectedAnswer.id);
                    if (answerIndex >= 0) {
                      updatedAnswers = [...existingAnswers];
                      updatedAnswers[answerIndex] = newAnswer;
                    } else {
                      updatedAnswers = existingAnswers;
                    }
                  } else {
                    // Add new answer
                    updatedAnswers = [...existingAnswers, newAnswer];
                  }
                  
                  return {
                    ...prev,
                    [selectedQuestion.id]: updatedAnswers,
                  };
                });
              }
              // Also reload questions in background
              fetch("/api/solve")
                .then((r) => r.json())
                .then((data) => {
                  if (data.questions) {
                    setQuestions(data.questions);
                  }
                });
            }}
          />
        );
      })()}
    </div>
  );
}
