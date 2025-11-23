"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import QuestionItem from "../../components/QuestionItem";
import AnswerForm from "../../components/AnswerForm";
import { useAuth } from "../../contexts/AuthContext";

type Question = { id: string; lessonId: string; title: string; content: string; slug: string; createdBy?: string };
type Answer = { id: string; questionId: string; answer: string; explain: string; videoUrl?: string | null; videoType?: string | null; videoDuration?: number | null; videoThumbnail?: string | null; createdBy?: string };
type User = { id: string; username: string; fullName: string; role: string; avatar: string };

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();
  const questionSlug = params.questionSlug as string;
  
  const { user, isAuthenticated } = useAuth();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/solve').then(r => r.json()),
    ])
      .then(([solveData]) => {
        if (solveData.questions && solveData.users) {
          const foundQuestion = solveData.questions.find((q: Question) => q.slug === questionSlug);
          setQuestion(foundQuestion || null);
          setUsers(solveData.users);
          
          if (foundQuestion) {
            fetch(`/api/answers?questionId=${foundQuestion.id}`)
              .then(r => r.json())
              .then(data => {
                setAnswers(data.answers || []);
              })
              .catch(e => console.error(e));
          }
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [questionSlug]);

  const handleDeleteAnswer = async (answerId: string) => {
    if (!user || !confirm('Bạn chắc chắn muốn xóa câu trả lời này?')) return;

    try {
      const response = await fetch(`/api/answers/${answerId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAnswers(prev => prev.filter(a => a.id !== answerId));
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!user || !confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) return;

    try {
      const response = await fetch(`/api/questions/${questionId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-600">Đang tải...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Không tìm thấy câu hỏi</h2>
          <p className="text-zinc-600 mb-4">Câu hỏi này có thể đã bị xóa hoặc không tồn tại</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const questionCreator = question.createdBy ? users.find(u => u.id === question.createdBy) : null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Câu hỏi", href: `/cau-hoi/${question.slug}` },
        ]}
        showMenuButton={false}
      />

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">{question.title}</h1>
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                {questionCreator && (
                  <span className="flex items-center gap-1">
                    {questionCreator.avatar} {questionCreator.fullName}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-zinc-700">{question.content}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              {answers.length} câu trả lời
            </h2>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setSelectedAnswer(null);
                  setShowAnswerForm(true);
                }}
                className="px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Trả lời
              </button>
            )}
          </div>

          {answers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-zinc-600 mb-4">Chưa có câu trả lời nào</p>
              {isAuthenticated && (
                <button
                  onClick={() => setShowAnswerForm(true)}
                  className="px-6 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition font-medium"
                >
                  Trả lời câu hỏi này
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <QuestionItem
                question={question}
                questionCreator={questionCreator}
                answers={answers}
                users={users}
                currentUserId={user?.id}
                isAuthenticated={isAuthenticated}
                onAnswerClick={() => {
                  setSelectedAnswer(null);
                  setShowAnswerForm(true);
                }}
                onEditAnswer={(ans) => {
                  setSelectedAnswer(ans);
                  setShowAnswerForm(true);
                }}
                onDeleteAnswer={handleDeleteAnswer}
                onEditQuestion={() => {}}
                onDeleteQuestion={() => handleDeleteQuestion(question.id)}
              />
            </div>
          )}
        </div>
      </div>

      {showAnswerForm && question && (
        <AnswerForm
          questionId={question.id}
          questionContent={question.content}
          existingAnswer={selectedAnswer}
          onClose={() => {
            setShowAnswerForm(false);
            setSelectedAnswer(null);
          }}
          onSuccess={(newAnswer) => {
            if (newAnswer) {
              if (selectedAnswer) {
                setAnswers(prev => prev.map(a => a.id === selectedAnswer.id ? newAnswer : a));
              } else {
                setAnswers(prev => [...prev, newAnswer]);
              }
            }
          }}
        />
      )}
    </div>
  );
}
