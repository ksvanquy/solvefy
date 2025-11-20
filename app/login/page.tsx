'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Đăng nhập thất bại');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
            <span className="text-white text-3xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập Solvefy</h1>
          <p className="text-gray-500 mt-2">Giải bài tập một cách dễ dàng</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3 font-medium">Tài khoản demo:</p>
          <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span>👨‍🎓 Học sinh:</span>
              <code className="bg-white px-2 py-1 rounded font-mono">hoctro1</code>
            </div>
            <div className="flex items-center justify-between">
              <span>👨‍🏫 Giáo viên:</span>
              <code className="bg-white px-2 py-1 rounded font-mono">giaovien1</code>
            </div>
            <div className="flex items-center justify-between">
              <span>👨‍💼 Quản trị:</span>
              <code className="bg-white px-2 py-1 rounded font-mono">admin1</code>
            </div>
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
              💡 Mật khẩu giống với tên đăng nhập
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
