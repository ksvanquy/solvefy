'use client';

import React from 'react';
import AnswerItem from './AnswerItem';

type Question = { 
  id: string; 
  lessonId: string; 
  title: string;
  content: string; 
  createdBy?: string 
};

type Answer = { 
  id: string; 
  questionId: string; 
  answer: string; 
  explain: string; 
  createdBy?: string 
};

type User = { 
  id: string; 
  username: string; 
  fullName: string; 
  role: string; 
  avatar: string 
};

type QuestionItemProps = {
  question: Question;
  questionCreator: User | null | undefined;
  answers: Answer[];
  users: User[];
  currentUserId: string | undefined;
  isAuthenticated: boolean;
  onAnswerClick: () => void;
  onEditAnswer: (answer: Answer) => void;
  onDeleteAnswer: (answerId: string) => void;
  onEditQuestion: () => void;
  onDeleteQuestion: () => void;
};

export default function QuestionItem({ 
  question, 
  questionCreator,
  answers,
  users,
  currentUserId,
  isAuthenticated,
  onAnswerClick,
  onEditAnswer,
  onDeleteAnswer,
  onEditQuestion,
  onDeleteQuestion
}: QuestionItemProps) {
  const isUserQuestion = question.createdBy === currentUserId;
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-start gap-2">
          <span className="text-lg">❓</span>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="font-semibold text-zinc-900 text-lg mb-1">
                  {question.title}
                </div>
                <div className="text-sm text-zinc-600">
                  {question.content}
                </div>
              </div>
              {isUserQuestion && isAuthenticated && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={onEditQuestion}
                    className="text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>
                  <button
                    onClick={onDeleteQuestion}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
                </div>
              )}
            </div>
            {questionCreator && (
              <div className="flex items-center gap-1 text-xs text-zinc-600 mb-3">
                <span>{questionCreator.avatar}</span>
                <span>Được hỏi bởi {questionCreator.fullName}</span>
              </div>
            )}

            {/* Hiển thị tất cả câu trả lời (nếu có) */}
            {answers.length > 0 && (
              <div className="space-y-3 mb-3">
                {answers.map((ans) => {
                  const answerCreator = users.find((u) => u.id === ans.createdBy);
                  const isUserAnswer = ans.createdBy === currentUserId;

                  return (
                    <AnswerItem
                      key={ans.id}
                      answer={ans}
                      answerCreator={answerCreator}
                      isUserAnswer={isUserAnswer}
                      isAuthenticated={isAuthenticated}
                      onEdit={() => onEditAnswer(ans)}
                      onDelete={() => onDeleteAnswer(ans.id)}
                    />
                  );
                })}
              </div>
            )}

            {/* Nút Trả lời (hiện khi đã đăng nhập) */}
            {isAuthenticated && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={onAnswerClick}
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Trả lời
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
