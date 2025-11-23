import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

/**
 * GET /api/grades
 * Get all grades or filter by subject
 * Query params:
 *   - id: grade ID (optional)
 *   - subjectId: filter by subject (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const gradesPath = path.join(dataDir, 'grades.json');
    const grades = JSON.parse(fs.readFileSync(gradesPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const subjectId = searchParams.get('subjectId');

    // Get specific grade
    if (id) {
      const grade = grades.find((g: any) => g._id === id);
      if (!grade) {
        return NextResponse.json(
          { success: false, error: 'Grade not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: grade });
    }

    // Filter by subject
    let filteredGrades = grades;
    if (subjectId) {
      filteredGrades = grades.filter((g: any) => g.subjectId === subjectId);
    }

    return NextResponse.json({
      success: true,
      data: filteredGrades,
      meta: {
        total: filteredGrades.length,
        filters: subjectId ? { subjectId } : {},
      },
    });
  } catch (error) {
    console.error('Error reading grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}
