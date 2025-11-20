import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET: Get all questions or filter by parameters
export async function GET(request: NextRequest) {
  try {
    const questionsPath = path.join(process.cwd(), 'app', 'data', 'questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get('lessonId');

    if (lessonId) {
      const filtered = questions.filter((q: any) => q.lessonId === lessonId);
      return NextResponse.json({ questions: filtered });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error reading questions:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tải câu hỏi' },
      { status: 500 }
    );
  }
}

// POST: Create new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, title, content, userId } = body;

    if (!lessonId || !title || !content || !userId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (lessonId, title, content, userId)' },
        { status: 400 }
      );
    }

    // Read existing questions
    const questionsPath = path.join(process.cwd(), 'app', 'data', 'questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

    // Generate new question ID
    const maxId = questions.reduce((max: number, q: any) => {
      const num = parseInt(q.id.substring(1));
      return num > max ? num : max;
    }, 0);
    const newId = `q${maxId + 1}`;

    // Create new question
    const newQuestion = {
      id: newId,
      lessonId,
      content,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    questions.push(newQuestion);

    // Save to file
    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf-8');

    return NextResponse.json({
      message: 'Tạo câu hỏi thành công',
      question: newQuestion,
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo câu hỏi' },
      { status: 500 }
    );
  }
}
