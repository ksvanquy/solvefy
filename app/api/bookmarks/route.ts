import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');
const bookmarksPath = path.join(dataDir, 'user_bookmarks.json');

/**
 * GET /api/bookmarks
 * Get bookmarks, optionally filtered by user
 * Query params:
 *   - userId: filter by user (optional)
 *   - bookId: check if specific book is bookmarked (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const bookmarksData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const bookId = searchParams.get('bookId');

    // Check if specific book is bookmarked by user
    if (userId && bookId) {
      const bookmark = bookmarksData.find(
        (b: any) => b.userId === userId && b.bookId === bookId
      );
      return NextResponse.json({
        success: true,
        data: bookmark || null,
        isBookmarked: !!bookmark,
      });
    }

    // Filter bookmarks for specific user
    if (userId) {
      const userBookmarks = bookmarksData.filter((b: any) => b.userId === userId);
      return NextResponse.json({
        success: true,
        data: userBookmarks,
        meta: { total: userBookmarks.length },
      });
    }

    // Get all bookmarks
    return NextResponse.json({
      success: true,
      data: bookmarksData,
      meta: { total: bookmarksData.length },
    });
  } catch (error) {
    console.error('Error reading bookmarks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * Add a bookmark
 * Body: { userId, bookId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookId } = body;

    // Validation
    if (!userId || !bookId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, bookId' },
        { status: 400 }
      );
    }

    const bookmarksData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));

    // Check if already bookmarked
    const existing = bookmarksData.find(
      (b: any) => b.userId === userId && b.bookId === bookId
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Book already bookmarked' },
        { status: 409 }
      );
    }

    const newBookmark = {
      id: `ub${Date.now()}`,
      userId,
      bookId,
      bookmarkedAt: new Date().toISOString(),
    };

    bookmarksData.push(newBookmark);
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarksData, null, 2));

    return NextResponse.json({
      success: true,
      data: newBookmark,
      message: 'Bookmark added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add bookmark' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookmarks
 * Remove a bookmark
 * Query params: userId, bookId
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const bookId = searchParams.get('bookId');

    // Validation
    if (!userId || !bookId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: userId, bookId' },
        { status: 400 }
      );
    }

    const bookmarksData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));

    const bookmarkIndex = bookmarksData.findIndex(
      (b: any) => b.userId === userId && b.bookId === bookId
    );

    if (bookmarkIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    bookmarksData.splice(bookmarkIndex, 1);
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarksData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove bookmark' },
      { status: 500 }
    );
  }
}
