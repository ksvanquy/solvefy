'use client';

import React from 'react';

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

type AnswerItemProps = {
  answer: Answer;
  answerCreator: User | undefined;
  isUserAnswer: boolean;
  isAuthenticated: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AnswerItem({ 
  answer, 
  answerCreator, 
  isUserAnswer, 
  isAuthenticated,
  onEdit,
  onDelete 
}: AnswerItemProps) {
  return (
    <div 
      className={`rounded-lg border-2 p-4 ${
        isUserAnswer 
          ? 'border-blue-200 bg-blue-50' 
          : 'border-green-200 bg-green-50'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-xl ${isUserAnswer ? 'text-blue-600' : 'text-green-600'}`}>
          {isUserAnswer ? '👤' : '✓'}
        </span>
        <div className="flex-1">
          <div className={`font-semibold mb-2 ${
            isUserAnswer ? 'text-blue-900' : 'text-green-900'
          }`}>
            Đáp án: {answer.answer}
          </div>
          <div className="text-sm text-zinc-700 mb-2">
            <span className="font-medium">Giải thích:</span> {answer.explain}
          </div>
          <div className={`flex items-center justify-between pt-2 border-t ${
            isUserAnswer 
              ? 'border-blue-200' 
              : 'border-green-200'
          }`}>
            {answerCreator && (
              <div className={`flex items-center gap-1 text-xs ${
                isUserAnswer 
                  ? 'text-blue-700' 
                  : 'text-green-700'
              }`}>
                <span>{answerCreator.avatar}</span>
                <span>
                  {isUserAnswer ? 'Bạn đã trả lời' : `Trả lời bởi ${answerCreator.fullName}`}
                </span>
              </div>
            )}
            {isUserAnswer && isAuthenticated && (
              <div className="flex gap-2">
                <button
                  onClick={onEdit}
                  className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Sửa
                </button>
                <button
                  onClick={onDelete}
                  className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
