import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

/**
 * GET /api/subjects
 * Get all subjects or a specific subject by ID
 * Query params:
 *   - id: subject ID (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const subjectsPath = path.join(dataDir, 'subjects.json');
    const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Get specific subject
    if (id) {
      const subject = subjects.find((s: any) => s._id === id);
      if (!subject) {
        return NextResponse.json(
          { success: false, error: 'Subject not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: subject });
    }

    // Get all subjects
    return NextResponse.json({
      success: true,
      data: subjects,
      meta: {
        total: subjects.length,
      },
    });
  } catch (error) {
    console.error('Error reading subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}
