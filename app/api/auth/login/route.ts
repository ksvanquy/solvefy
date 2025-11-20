import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    // Read users data
    const usersPath = path.join(process.cwd(), 'app', 'data', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

    // Find user by username
    const user = usersData.find((u: any) => u.username === username);

    if (!user) {
      return NextResponse.json(
        { error: 'Tên đăng nhập không tồn tại' },
        { status: 401 }
      );
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Đăng nhập thành công',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    );
  }
}
