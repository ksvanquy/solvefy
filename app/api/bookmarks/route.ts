import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const bookmarksPath = path.join(process.cwd(), 'app', 'data', 'user_bookmarks.json');

// GET - Get user bookmarks
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const bookmarksData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));

    if (userId) {
      // Filter bookmarks for specific user
      const userBookmarks = bookmarksData.filter((b: any) => b.userId === userId);
      return NextResponse.json({ bookmarks: userBookmarks });
    }

    return NextResponse.json({ bookmarks: bookmarksData });
  } catch (error) {
    console.error('Error reading bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to read bookmarks' },
      { status: 500 }
    );
  }
}

// POST - Add bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookId } = body;

    if (!userId || !bookId) {
      return NextResponse.json(
        { error: 'Missing required fields (userId, bookId)' },
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
        { error: 'Already bookmarked' },
        { status: 400 }
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
      bookmark: newBookmark 
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to add bookmark' },
      { status: 500 }
    );
  }
}

// DELETE - Remove bookmark
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const bookId = url.searchParams.get('bookId');

    if (!userId || !bookId) {
      return NextResponse.json(
        { error: 'Missing required parameters (userId, bookId)' },
        { status: 400 }
      );
    }

    const bookmarksData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));

    const bookmarkIndex = bookmarksData.findIndex(
      (b: any) => b.userId === userId && b.bookId === bookId
    );

    if (bookmarkIndex === -1) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    bookmarksData.splice(bookmarkIndex, 1);
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarksData, null, 2));

    return NextResponse.json({ 
      success: true,
      message: 'Bookmark removed' 
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    );
  }
}
