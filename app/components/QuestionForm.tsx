'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Question = { id: string; lessonId: string; title: string; content: string; createdBy?: string };

type QuestionFormProps = {
  lessonId: string;
  lessonName: string;
  onClose: () => void;
  onSuccess: () => void;
  existingQuestion?: Question | null;
};

export default function QuestionForm({ lessonId, lessonName, onClose, onSuccess, existingQuestion }: QuestionFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(existingQuestion?.title || '');
  const [content, setContent] = useState(existingQuestion?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề câu hỏi');
      return;
    }
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isEditMode = existingQuestion && existingQuestion.id;
      const url = isEditMode ? `/api/questions/${existingQuestion.id}` : '/api/questions';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          title: title.trim(),
          content: content.trim(),
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Có lỗi xảy ra khi tạo câu hỏi');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      setError('Có lỗi xảy ra khi tạo câu hỏi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingQuestion ? 'Sửa câu hỏi' : 'Đặt câu hỏi mới'}
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

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Bài học:</span> {lessonName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="question-title" className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề câu hỏi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="question-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Ví dụ: Tính tổng 1 + 1 = ?"
              required
            />
          </div>

          <div>
            <label htmlFor="question-content" className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              id="question-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Mô tả chi tiết câu hỏi của bạn..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mô tả rõ ràng câu hỏi của bạn để nhận được câu trả lời tốt nhất
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : (existingQuestion ? 'Cập nhật' : 'Đặt câu hỏi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
