import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// PUT: Update existing answer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ answerId: string }> }
) {
  try {
    const { answerId } = await params;
    const body = await request.json();
    const { answer, explain, userId } = body;

    if (!answer || !userId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (answer, userId)' },
        { status: 400 }
      );
    }

    // Read existing answers
    const answersPath = path.join(process.cwd(), 'app', 'data', 'answers.json');
    const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

    // Find the answer to update
    const answerIndex = answers.findIndex((a: any) => a.id === answerId);

    if (answerIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy câu trả lời' },
        { status: 404 }
      );
    }

    // Check if user owns this answer
    if (answers[answerIndex].createdBy !== userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền sửa câu trả lời này' },
        { status: 403 }
      );
    }

    // Update the answer
    const updatedAnswer = {
      ...answers[answerIndex],
      answer: answer.trim(),
      explain: explain?.trim() || '',
      updatedAt: new Date().toISOString(),
    };

    answers[answerIndex] = updatedAnswer;

    // Save to file
    fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2), 'utf-8');

    return NextResponse.json({
      message: 'Cập nhật câu trả lời thành công',
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật câu trả lời' },
      { status: 500 }
    );
  }
}

// DELETE: Delete answer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ answerId: string }> }
) {
  try {
    const { answerId } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const answersPath = path.join(process.cwd(), 'app', 'data', 'answers.json');
    const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
    const answerIndex = answers.findIndex((a: any) => a.id === answerId);

    if (answerIndex === -1) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    if (answers[answerIndex].createdBy !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    answers.splice(answerIndex, 1);
    fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));

    return NextResponse.json({ 
      success: true,
      message: 'Answer deleted' 
    });
  } catch (error) {
    console.error('Error deleting answer:', error);
    return NextResponse.json(
      { error: 'Failed to delete answer' },
      { status: 500 }
    );
  }
}
