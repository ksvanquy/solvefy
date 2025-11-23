import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

/**
 * GET /api/questions
 * Get all questions or filter by lesson
 * Query params:
 *   - id: question ID (optional)
 *   - slug: question slug (optional)
 *   - lessonId: filter by lesson (optional)
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const questionsPath = path.join(dataDir, 'questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const lessonId = searchParams.get('lessonId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get specific question by ID
    if (id) {
      const question = questions.find((q: any) => q.id === id);
      if (!question) {
        return NextResponse.json(
          { success: false, error: 'Question not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: question });
    }

    // Get specific question by slug
    if (slug) {
      const question = questions.find((q: any) => q.slug === slug);
      if (!question) {
        return NextResponse.json(
          { success: false, error: 'Question not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: question });
    }

    // Filter by lessonId
    let filteredQuestions = questions;
    const filters: any = {};

    if (lessonId) {
      filteredQuestions = filteredQuestions.filter((q: any) => q.lessonId === lessonId);
      filters.lessonId = lessonId;
    }

    // Pagination
    const total = filteredQuestions.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedQuestions = filteredQuestions.slice(start, end);

    return NextResponse.json({
      success: true,
      data: paginatedQuestions,
      meta: {
        total,
        page,
        limit,
        totalPages,
        filters,
      },
    });
  } catch (error) {
    console.error('Error reading questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questions
 * Create a new question
 * Body: { lessonId, title, content, userId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, title, content, userId } = body;

    // Validation
    if (!lessonId || !title || !content || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: lessonId, title, content, userId' },
        { status: 400 }
      );
    }

    const questionsPath = path.join(dataDir, 'questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

    // Generate new question ID
    const maxId = questions.reduce((max: number, q: any) => {
      const num = parseInt(q.id.substring(1));
      return num > max ? num : max;
    }, 0);
    const newId = `q${maxId + 1}`;

    // Generate slug from title
    const generateSlug = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    // Create new question
    const newQuestion = {
      id: newId,
      lessonId,
      title,
      content,
      slug: `${generateSlug(title)}-${newId}`,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    questions.push(newQuestion);
    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      data: newQuestion,
      message: 'Question created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
