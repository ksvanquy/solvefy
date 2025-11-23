import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const dataDir = path.join(process.cwd(), 'app', 'data');

/**
 * GET /api/users
 * Get all users or a specific user with stats
 * Query params:
 *   - id: user ID (optional)
 *   - username: filter by username (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const usersPath = path.join(dataDir, 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const username = searchParams.get('username');

    // Get specific user with stats
    if (id) {
      const user = users.find((u: any) => u.id === id);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Get user's progress and bookmarks
      const userProgress = JSON.parse(fs.readFileSync(path.join(dataDir, 'user_progress.json'), 'utf8'));
      const userBookmarks = JSON.parse(fs.readFileSync(path.join(dataDir, 'user_bookmarks.json'), 'utf8'));
      
      const progress = userProgress.filter((p: any) => p.userId === id);
      const bookmarks = userBookmarks.filter((b: any) => b.userId === id);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return NextResponse.json({
        success: true,
        data: {
          user: userWithoutPassword,
          progress,
          bookmarks,
          stats: {
            totalCompleted: progress.filter((p: any) => p.status === 'completed').length,
            totalCorrect: progress.filter((p: any) => p.isCorrect === true).length,
            totalBookmarks: bookmarks.length,
          },
        },
      });
    }

    // Find by username
    if (username) {
      const user = users.find((u: any) => u.username === username);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const { password, ...userWithoutPassword } = user;
      return NextResponse.json({
        success: true,
        data: userWithoutPassword,
      });
    }

    // Return all users (without passwords)
    const usersWithoutPasswords = users.map(({ password, ...user }: any) => user);
    return NextResponse.json({
      success: true,
      data: usersWithoutPasswords,
      meta: { total: usersWithoutPasswords.length },
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Submit an answer to a question
 * Body: { action: 'submit_answer', userId, questionId, userAnswer }
 * @deprecated - This endpoint is deprecated. Use dedicated endpoints instead.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, questionId, userAnswer } = body;

    if (action === 'submit_answer') {
      // Validation
      if (!userId || !questionId || !userAnswer) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: userId, questionId, userAnswer' },
          { status: 400 }
        );
      }

      const answersPath = path.join(dataDir, 'answers.json');
      const answers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
      const correctAnswer = answers.find((a: any) => a.questionId === questionId);

      const isCorrect = correctAnswer && correctAnswer.answer === userAnswer;

      // Create progress entry (would normally be saved to database)
      const progressEntry = {
        id: `up_${Date.now()}`,
        userId,
        questionId,
        status: 'completed',
        userAnswer,
        isCorrect,
        attempts: 1,
        completedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: {
          isCorrect,
          correctAnswer: correctAnswer?.answer,
          explanation: correctAnswer?.explain,
          progress: progressEntry,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Error processing request:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
