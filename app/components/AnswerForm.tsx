'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AnswerFormProps = {
  questionId: string;
  questionContent: string;
  existingAnswer?: { id: string; answer: string; explain: string } | null;
  onClose: () => void;
  onSuccess: (newAnswer?: any) => void;
};

export default function AnswerForm({ questionId, questionContent, existingAnswer, onClose, onSuccess }: AnswerFormProps) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [explain, setExplain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingAnswer) {
      setAnswer(existingAnswer.answer);
      setExplain(existingAnswer.explain);
    }
  }, [existingAnswer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Vui lòng nhập câu trả lời');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isEditMode = existingAnswer && existingAnswer.id;
      const url = isEditMode ? `/api/answers/${existingAnswer.id}` : '/api/answers';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answer: answer.trim(),
          explain: explain.trim(),
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.answer);
        onClose();
      } else {
        setError(data.error || `Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} câu trả lời`);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Có lỗi xảy ra khi gửi câu trả lời');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!existingAnswer;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Sửa câu trả lời' : 'Trả lời câu hỏi'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Câu hỏi:</p>
          <p className="text-gray-900">{questionContent}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="answer-content" className="block text-sm font-medium text-gray-700 mb-2">
              Câu trả lời <span className="text-red-500">*</span>
            </label>
            <textarea
              id="answer-content"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Nhập câu trả lời của bạn..."
              required
            />
          </div>

          <div>
            <label htmlFor="answer-explain" className="block text-sm font-medium text-gray-700 mb-2">
              Giải thích (tùy chọn)
            </label>
            <textarea
              id="answer-explain"
              value={explain}
              onChange={(e) => setExplain(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Giải thích cách giải hoặc lý do cho câu trả lời..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Giải thích chi tiết giúp người hỏi hiểu rõ hơn
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isEditMode 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Gửi câu trả lời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
