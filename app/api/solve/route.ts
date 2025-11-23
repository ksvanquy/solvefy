import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');

    const dataDir = path.join(process.cwd(), 'app', 'data');
    const questions = JSON.parse(fs.readFileSync(path.join(dataDir, 'questions.json'), 'utf8'));
    const answers = JSON.parse(fs.readFileSync(path.join(dataDir, 'answers.json'), 'utf8'));
    const subjects = JSON.parse(fs.readFileSync(path.join(dataDir, 'subjects.json'), 'utf8'));
    const grades = JSON.parse(fs.readFileSync(path.join(dataDir, 'grades.json'), 'utf8'));
    const books = JSON.parse(fs.readFileSync(path.join(dataDir, 'books.json'), 'utf8'));
    const lessons = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessons.json'), 'utf8'));
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));

    if (questionId) {
      const question = questions.find((q: any) => q.id === questionId) || null;
      const answer = answers.find((a: any) => a.questionId === questionId) || null;
      return NextResponse.json({ question, answer });
    }

    return NextResponse.json({ questions, subjects, grades, books, lessons, users });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
