/**
 * Legacy API Compatibility Layer
 * 
 * @deprecated This endpoint is deprecated and will be removed in a future version.
 * 
 * Please migrate to using the new RESTful endpoints:
 * - GET /api/subjects - Get all subjects
 * - GET /api/grades - Get all grades
 * - GET /api/books - Get all books with filtering
 * - GET /api/lessons - Get all lessons with filtering
 * - GET /api/questions - Get all questions with filtering
 * - GET /api/users - Get all users
 * 
 * Benefits of new API:
 * - Reduced payload size (fetch only what you need)
 * - Better caching support
 * - Pagination for large datasets
 * - Filtering and query parameters
 * - RESTful conventions
 * 
 * See /API_DOCUMENTATION.md for complete API reference.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const dataDir = path.join(process.cwd(), 'app', 'data');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get('questionId');

    // Load all data files
    const questions = JSON.parse(fs.readFileSync(path.join(dataDir, 'questions.json'), 'utf8'));
    const answers = JSON.parse(fs.readFileSync(path.join(dataDir, 'answers.json'), 'utf8'));
    const subjects = JSON.parse(fs.readFileSync(path.join(dataDir, 'subjects.json'), 'utf8'));
    const grades = JSON.parse(fs.readFileSync(path.join(dataDir, 'grades.json'), 'utf8'));
    const books = JSON.parse(fs.readFileSync(path.join(dataDir, 'books.json'), 'utf8'));
    const lessons = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessons.json'), 'utf8'));
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));

    // Legacy support: Get specific question and answer
    if (questionId) {
      const question = questions.find((q: any) => q.id === questionId) || null;
      const answer = answers.find((a: any) => a.questionId === questionId) || null;
      return NextResponse.json({ question, answer });
    }

    // Return all data (legacy format for backward compatibility)
    return NextResponse.json({
      questions,
      subjects,
      grades,
      books,
      lessons,
      users,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
