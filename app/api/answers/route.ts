import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

/**
 * GET /api/answers
 * Get all answers or filter by question
 * Query params:
 *   - id: answer ID (optional)
 *   - questionId: filter by question (optional)
 *   - userId: filter by user (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const answersPath = path.join(dataDir, 'answers.json');
    const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const questionId = searchParams.get('questionId');
    const userId = searchParams.get('userId');

    // Get specific answer by ID
    if (id) {
      const answer = answers.find((a: any) => a.id === id);
      if (!answer) {
        return NextResponse.json(
          { success: false, error: 'Answer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: answer });
    }

    // Apply filters
    let filteredAnswers = answers;
    const filters: any = {};

    if (questionId) {
      filteredAnswers = filteredAnswers.filter((a: any) => a.questionId === questionId);
      filters.questionId = questionId;
    }

    if (userId) {
      filteredAnswers = filteredAnswers.filter((a: any) => a.createdBy === userId);
      filters.userId = userId;
    }

    return NextResponse.json({
      success: true,
      data: filteredAnswers,
      meta: {
        total: filteredAnswers.length,
        filters,
      },
    });
  } catch (error) {
    console.error('Error reading answers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch answers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/answers
 * Create a new answer
 * Body: { questionId, answer, explain, videoUrl, videoType, userId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answer, explain, videoUrl, videoType, userId } = body;

    // Validation
    if (!questionId || !answer || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: questionId, answer, userId' },
        { status: 400 }
      );
    }

    const answersPath = path.join(dataDir, 'answers.json');
    const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

    // Generate new answer ID
    const maxId = answers.reduce((max: number, a: any) => {
      const num = parseInt(a.id.substring(1));
      return num > max ? num : max;
    }, 0);
    const newId = `a${maxId + 1}`;

    // Auto-generate thumbnail for YouTube videos
    let videoThumbnail = null;
    let videoDuration = null;
    if (videoUrl && videoType === 'youtube') {
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (videoId) {
        videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // Create new answer
    const newAnswer = {
      id: newId,
      questionId,
      answer,
      explain: explain || '',
      videoUrl: videoUrl || null,
      videoType: videoType || null,
      videoDuration,
      videoThumbnail,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    answers.push(newAnswer);
    fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      data: newAnswer,
      message: 'Answer created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create answer' },
      { status: 500 }
    );
  }
}
