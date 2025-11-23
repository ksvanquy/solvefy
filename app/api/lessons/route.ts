import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

/**
 * GET /api/lessons
 * Get all lessons or filter by book
 * Query params:
 *   - id: lesson ID (optional)
 *   - slug: lesson slug (optional)
 *   - bookId: filter by book (optional)
 *   - subjectId: filter by subject (optional)
 *   - gradeId: filter by grade (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const lessonsPath = path.join(dataDir, 'lessons.json');
    const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const bookId = searchParams.get('bookId');
    const subjectId = searchParams.get('subjectId');
    const gradeId = searchParams.get('gradeId');

    // Get specific lesson by ID
    if (id) {
      const lesson = lessons.find((l: any) => l._id === id);
      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: lesson });
    }

    // Get specific lesson by slug
    if (slug) {
      const lesson = lessons.find((l: any) => l.slug === slug);
      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: lesson });
    }

    // Apply filters
    let filteredLessons = lessons;
    const filters: any = {};

    if (bookId) {
      filteredLessons = filteredLessons.filter((l: any) => l.bookId === bookId);
      filters.bookId = bookId;
    }

    if (subjectId) {
      filteredLessons = filteredLessons.filter((l: any) => l.subjectId === subjectId);
      filters.subjectId = subjectId;
    }

    if (gradeId) {
      filteredLessons = filteredLessons.filter((l: any) => l.gradeId === gradeId);
      filters.gradeId = gradeId;
    }

    // Sort by sortOrder
    filteredLessons.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

    return NextResponse.json({
      success: true,
      data: filteredLessons,
      meta: {
        total: filteredLessons.length,
        filters,
      },
    });
  } catch (error) {
    console.error('Error reading lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
