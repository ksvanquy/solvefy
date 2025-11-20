import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const questionsPath = path.join(process.cwd(), 'app', 'data', 'questions.json');
const answersPath = path.join(process.cwd(), 'app', 'data', 'answers.json');

// PUT - Update question
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await context.params;
    const body = await request.json();
    const { title, content, userId } = body;

    if (!title || !content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
    const questionIndex = questionsData.findIndex((q: any) => q.id === questionId);

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (questionsData[questionIndex].createdBy !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update question
    questionsData[questionIndex].title = title;
    questionsData[questionIndex].content = content;
    questionsData[questionIndex].updatedAt = new Date().toISOString();
    fs.writeFileSync(questionsPath, JSON.stringify(questionsData, null, 2));

    return NextResponse.json({ 
      success: true, 
      question: questionsData[questionIndex] 
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE - Delete question and its answers
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await context.params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
    const questionIndex = questionsData.findIndex((q: any) => q.id === questionId);

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (questionsData[questionIndex].createdBy !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete question
    questionsData.splice(questionIndex, 1);
    fs.writeFileSync(questionsPath, JSON.stringify(questionsData, null, 2));

    // Delete all answers for this question
    const answersData = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
    const filteredAnswers = answersData.filter((a: any) => a.questionId !== questionId);
    fs.writeFileSync(answersPath, JSON.stringify(filteredAnswers, null, 2));

    return NextResponse.json({ 
      success: true,
      message: 'Question and related answers deleted' 
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
