import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET: Get all answers or filter by questionId
export async function GET(request: NextRequest) {
  try {
    const answersPath = path.join(process.cwd(), 'app', 'data', 'answers.json');
    const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get('questionId');

    if (questionId) {
      const filtered = answers.filter((a: any) => a.questionId === questionId);
      return NextResponse.json({ answers: filtered });
    }

    return NextResponse.json({ answers });
  } catch (error) {
    console.error('Error reading answers:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tải câu trả lời' },
      { status: 500 }
    );
  }
}

// POST: Create new answer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answer, explain, userId } = body;

    if (!questionId || !answer || !userId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (questionId, answer, userId)' },
        { status: 400 }
      );
    }

    // Read existing answers
    const answersPath = path.join(process.cwd(), 'app', 'data', 'answers.json');
    const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

    // Generate new answer ID
    const maxId = answers.reduce((max: number, a: any) => {
      const num = parseInt(a.id.substring(1));
      return num > max ? num : max;
    }, 0);
    const newId = `a${maxId + 1}`;

    // Create new answer
    const newAnswer = {
      id: newId,
      questionId,
      answer,
      explain: explain || '',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    answers.push(newAnswer);

    // Save to file
    fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2), 'utf-8');

    return NextResponse.json({
      message: 'Tạo câu trả lời thành công',
      answer: newAnswer,
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo câu trả lời' },
      { status: 500 }
    );
  }
}
