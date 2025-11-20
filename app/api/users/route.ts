import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const dataDir = path.join(process.cwd(), 'app', 'data');
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));

    if (userId) {
      const user = users.find((u: any) => u.id === userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get user's progress
      const userProgress = JSON.parse(fs.readFileSync(path.join(dataDir, 'user_progress.json'), 'utf8'));
      const userBookmarks = JSON.parse(fs.readFileSync(path.join(dataDir, 'user_bookmarks.json'), 'utf8'));
      
      const progress = userProgress.filter((p: any) => p.userId === userId);
      const bookmarks = userBookmarks.filter((b: any) => b.userId === userId);

      return NextResponse.json({ 
        user, 
        progress,
        bookmarks,
        stats: {
          totalCompleted: progress.filter((p: any) => p.status === 'completed').length,
          totalCorrect: progress.filter((p: any) => p.isCorrect === true).length,
          totalBookmarks: bookmarks.length
        }
      });
    }

    // Return all users
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, questionId, userAnswer } = body;

    if (action === 'submit_answer') {
      const dataDir = path.join(process.cwd(), 'app', 'data');
      const answers = JSON.parse(fs.readFileSync(path.join(dataDir, 'answers.json'), 'utf8'));
      const correctAnswer = answers.find((a: any) => a.questionId === questionId);

      const isCorrect = correctAnswer && correctAnswer.answer === userAnswer;

      // In a real app, you would save this to database
      const progressEntry = {
        id: `up_${Date.now()}`,
        userId,
        questionId,
        status: 'completed',
        userAnswer,
        isCorrect,
        attempts: 1,
        completedAt: new Date().toISOString()
      };

      return NextResponse.json({ 
        success: true, 
        isCorrect,
        correctAnswer: correctAnswer?.answer,
        explanation: correctAnswer?.explain,
        progress: progressEntry
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
