import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');
const progressPath = path.join(dataDir, 'user_progress.json');

/**
 * GET /api/progress
 * Get user progress
 * Query params:
 *   - userId: filter by user (optional)
 *   - lessonId: filter by lesson (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const progressData = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const lessonId = searchParams.get('lessonId');

    // Get specific lesson progress for user
    if (userId && lessonId) {
      const progress = progressData.find(
        (p: any) => p.userId === userId && p.lessonId === lessonId
      );
      return NextResponse.json({
        success: true,
        data: progress || null,
      });
    }

    // Get all progress for user
    if (userId) {
      const userProgress = progressData.filter((p: any) => p.userId === userId);
      return NextResponse.json({
        success: true,
        data: userProgress,
        meta: { total: userProgress.length },
      });
    }

    // Get all progress
    return NextResponse.json({
      success: true,
      data: progressData,
      meta: { total: progressData.length },
    });
  } catch (error) {
    console.error('Error reading progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/progress
 * Create or update progress (mark lesson as completed)
 * Body: { userId, lessonId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lessonId } = body;

    // Validation
    if (!userId || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, lessonId' },
        { status: 400 }
      );
    }

    const progressData = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

    // Find existing progress
    const existingIndex = progressData.findIndex(
      (p: any) => p.userId === userId && p.lessonId === lessonId
    );

    if (existingIndex !== -1) {
      // Already completed, update timestamp
      progressData[existingIndex].completedAt = new Date().toISOString();
      fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));

      return NextResponse.json({
        success: true,
        data: progressData[existingIndex],
        message: 'Progress updated successfully',
      });
    }

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
      data: newProgress,
      message: 'Progress created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
