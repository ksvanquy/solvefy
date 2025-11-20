import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const progressPath = path.join(process.cwd(), 'app', 'data', 'user_progress.json');

// GET - Get user progress
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const lessonId = url.searchParams.get('lessonId');

    const progressData = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

    if (userId && lessonId) {
      // Get specific lesson progress for user
      const progress = progressData.find(
        (p: any) => p.userId === userId && p.lessonId === lessonId
      );
      return NextResponse.json({ progress: progress || null });
    }

    if (userId) {
      // Get all progress for user
      const userProgress = progressData.filter((p: any) => p.userId === userId);
      return NextResponse.json({ progress: userProgress });
    }

    return NextResponse.json({ progress: progressData });
  } catch (error) {
    console.error('Error reading progress:', error);
    return NextResponse.json(
      { error: 'Failed to read progress' },
      { status: 500 }
    );
  }
}

// POST - Create or update progress (mark lesson as completed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lessonId } = body;

    if (!userId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required fields (userId, lessonId)' },
        { status: 400 }
      );
    }

    const progressData = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

    // Find existing progress
    const existingIndex = progressData.findIndex(
      (p: any) => p.userId === userId && p.lessonId === lessonId
    );

    if (existingIndex !== -1) {
      // Already completed, just update timestamp
      progressData[existingIndex].completedAt = new Date().toISOString();
      fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));

      return NextResponse.json({
        success: true,
        progress: progressData[existingIndex],
      });
    } else {
      // Create new progress (mark as completed)
      const newProgress = {
        id: `up${Date.now()}`,
        userId,
        lessonId,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      progressData.push(newProgress);
      fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));

      return NextResponse.json({
        success: true,
        progress: newProgress,
      });
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
