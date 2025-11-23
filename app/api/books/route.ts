import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

/**
 * GET /api/books
 * Get all books or filter by subject/grade/publisher
 * Query params:
 *   - id: book ID (optional)
 *   - slug: book slug (optional)
 *   - subjectId: filter by subject (optional)
 *   - gradeId: filter by grade (optional)
 *   - publisher: filter by publisher (optional)
 *   - page: page number for pagination (default: 1)
 *   - limit: items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const booksPath = path.join(dataDir, 'books.json');
    const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const subjectId = searchParams.get('subjectId');
    const gradeId = searchParams.get('gradeId');
    const publisher = searchParams.get('publisher');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get specific book by ID
    if (id) {
      const book = books.find((b: any) => b._id === id);
      if (!book) {
        return NextResponse.json(
          { success: false, error: 'Book not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: book });
    }

    // Get specific book by slug
    if (slug) {
      const book = books.find((b: any) => b.slug === slug);
      if (!book) {
        return NextResponse.json(
          { success: false, error: 'Book not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: book });
    }

    // Apply filters
    let filteredBooks = books;
    const filters: any = {};

    if (subjectId) {
      filteredBooks = filteredBooks.filter((b: any) => b.subjectId === subjectId);
      filters.subjectId = subjectId;
    }

    if (gradeId) {
      filteredBooks = filteredBooks.filter((b: any) => b.gradeId === gradeId);
      filters.gradeId = gradeId;
    }

    if (publisher) {
      filteredBooks = filteredBooks.filter((b: any) => 
        b.publisher.toLowerCase().includes(publisher.toLowerCase())
      );
      filters.publisher = publisher;
    }

    // Pagination
    const total = filteredBooks.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedBooks = filteredBooks.slice(start, end);

    return NextResponse.json({
      success: true,
      data: paginatedBooks,
      meta: {
        total,
        page,
        limit,
        totalPages,
        filters,
      },
    });
  } catch (error) {
    console.error('Error reading books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
