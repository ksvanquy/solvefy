# 🚀 KẾ HOẠCH MIGRATION: JSON → NESTJS BACKEND

**Ngày tạo**: 21/11/2025  
**Dự án**: Solvefy - Nền tảng giải bài tập  
**Mục tiêu**: Chuyển đổi từ JSON files sang NestJS backend với MongoDB  

---

## 🎯 TỔNG QUAN MIGRATION

### **Hiện tại (JSON-based)**:
```
📁 app/data/
├── categories.json     - Cấu trúc môn học/lớp/sách/bài học
├── questions.json      - Câu hỏi
├── answers.json        - Câu trả lời  
├── users.json          - Người dùng
├── user_progress.json  - Tiến độ học tập
└── user_bookmarks.json - Sách yêu thích
```

### **Mục tiêu (NestJS + MongoDB + Mongoose)**:
```
🏗️ Backend Architecture:
├── 🎮 Controllers      - API endpoints
├── 🔧 Services         - Business logic
├── 📊 Schemas          - MongoDB Mongoose schemas
├── 🗃️ Models           - Mongoose models
├── 🛡️ Guards           - Authentication & authorization
├── 🔍 DTOs             - Data transfer objects
└── 📋 Validators       - Input validation
```

---

## 📊 DATABASE SCHEMA DESIGN

### **MongoDB Document Structure**:
```
📄 Users Collection
├── _id: ObjectId
├── profile: embedded document
├── progress: [ObjectId] references
└── bookmarks: [ObjectId] references

📄 Subjects Collection
├── _id: ObjectId
├── grades: [embedded documents]
│   ├── books: [embedded documents]
│   │   └── lessons: [ObjectId] references
│   └── ...
└── ...

📄 Lessons Collection
├── _id: ObjectId
├── bookId: ObjectId reference
└── questions: [ObjectId] references

📄 Questions Collection
├── _id: ObjectId
├── lessonId: ObjectId reference
└── answers: [embedded documents]

📄 UserProgress Collection
├── _id: ObjectId
├── userId: ObjectId reference
├── questionId: ObjectId reference
└── stats: embedded document
```

### **Core MongoDB Schemas**:

#### **1. Users Schema**
```typescript
// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ enum: ['student', 'teacher', 'admin'], default: 'student' })
  role: string;

  @Prop({ min: 1, max: 12 })
  grade?: number;

  @Prop({ type: [String], default: [] })
  subjects: string[];

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  // Virtual for progress
  progress: Types.ObjectId[];
  
  // Virtual for bookmarks
  bookmarks: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
```

#### **2. Subjects Schema (Hierarchical with Embedded Documents)**
```typescript
// src/subjects/schemas/subject.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Book subdocument schema
@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop()
  publisher?: string;

  @Prop()
  publicationYear?: number;

  @Prop()
  coverImageUrl?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // References to lessons
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }], default: [] })
  lessons: Types.ObjectId[];
}

const BookSchema = SchemaFactory.createForClass(Book);

// Grade subdocument schema
@Schema({ timestamps: true })
export class Grade {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true, min: 1, max: 12 })
  level: number;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // Embedded books
  @Prop({ type: [BookSchema], default: [] })
  books: Book[];
}

const GradeSchema = SchemaFactory.createForClass(Grade);

// Main Subject schema
export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  icon?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // Embedded grades
  @Prop({ type: [GradeSchema], default: [] })
  grades: Grade[];
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

// Add indexes
SubjectSchema.index({ slug: 1 });
SubjectSchema.index({ name: 1 });
SubjectSchema.index({ 'grades.slug': 1 });
SubjectSchema.index({ 'grades.books.slug': 1 });
```

#### **3. Lessons Schema (Separate Collection)**
```typescript
// src/lessons/schemas/lesson.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonDocument = Lesson & Document;

@Schema({ timestamps: true })
export class Lesson {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop()
  content?: string; // Rich text content

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  // Reference to book (parent)
  @Prop({ type: Types.ObjectId, required: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // References to questions
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] })
  questions: Types.ObjectId[];
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

// Add indexes
LessonSchema.index({ bookId: 1 });
LessonSchema.index({ slug: 1, bookId: 1 }, { unique: true });
LessonSchema.index({ sortOrder: 1 });
```

#### **4. Questions & Answers Schema**
```typescript
// src/questions/schemas/question.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Answer subdocument schema
@Schema({ timestamps: true })
export class Answer {
  @Prop({ required: true })
  content: string;

  @Prop()
  explanation?: string;

  @Prop({ default: false })
  isCorrect: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

const AnswerSchema = SchemaFactory.createForClass(Answer);

// Main Question schema
export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty: string;

  @Prop({ 
    enum: ['multiple_choice', 'fill_blank', 'essay', 'true_false'], 
    default: 'multiple_choice' 
  })
  questionType: string;

  @Prop({ default: 1, min: 1 })
  points: number;

  @Prop({ min: 0 })
  timeLimit?: number; // seconds

  @Prop({ type: [String], default: [] })
  hints: string[];

  @Prop()
  explanation?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isActive: boolean;

  // Reference to lesson
  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true })
  lessonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // Embedded answers
  @Prop({ type: [AnswerSchema], default: [] })
  answers: Answer[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Add indexes
QuestionSchema.index({ lessonId: 1 });
QuestionSchema.index({ title: 'text', content: 'text' });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ questionType: 1 });
```

#### **5. User Progress & Bookmarks Schema**
```typescript
// src/progress/schemas/user-progress.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProgressDocument = UserProgress & Document;

@Schema({ timestamps: true })
export class UserProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lesson' })
  lessonId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ 
    enum: ['not_started', 'in_progress', 'completed', 'reviewed'], 
    default: 'not_started' 
  })
  status: string;

  @Prop()
  userAnswer?: string;

  @Prop()
  isCorrect?: boolean;

  @Prop({ default: 0, min: 0 })
  attempts: number;

  @Prop({ default: 0, min: 0 })
  timeSpent: number; // seconds

  @Prop({ default: 0, min: 0 })
  score: number;

  @Prop()
  completedAt?: Date;
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);

// Add indexes
UserProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });
UserProgressSchema.index({ userId: 1, status: 1 });
UserProgressSchema.index({ lessonId: 1 });
UserProgressSchema.index({ completedAt: 1 });

// src/bookmarks/schemas/user-bookmark.schema.ts
export type UserBookmarkDocument = UserBookmark & Document;

@Schema({ timestamps: true })
export class UserBookmark {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Store bookId as string since books are embedded in subjects
  @Prop({ required: true })
  bookId: string;

  @Prop()
  notes?: string;

  // Additional metadata for easier querying
  @Prop()
  subjectId?: string;

  @Prop()
  gradeLevel?: number;

  @Prop()
  bookName?: string;
}

export const UserBookmarkSchema = SchemaFactory.createForClass(UserBookmark);

// Add indexes
UserBookmarkSchema.index({ userId: 1, bookId: 1 }, { unique: true });
UserBookmarkSchema.index({ userId: 1 });
UserBookmarkSchema.index({ subjectId: 1 });
```

---

## 🏗️ NESTJS PROJECT STRUCTURE

### **Project Setup**:
```bash
# 1. Create NestJS project
npm i -g @nestjs/cli
nest new solvefy-backend

# 2. Install dependencies
npm install @nestjs/mongoose mongoose
npm install @nestjs/passport passport passport-jwt
npm install @nestjs/jwt @nestjs/config
npm install bcryptjs class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install helmet compression

# 3. Development dependencies
npm install -D @types/mongoose @types/bcryptjs @types/passport-jwt
npm install -D mongodb-memory-server # For testing
```

### **Folder Structure**:
```
src/
├── 📁 auth/                    # Authentication module
│   ├── guards/
│   ├── strategies/
│   ├── decorators/
│   └── dto/
├── 📁 users/                   # User management
│   ├── schemas/
│   ├── dto/
│   └── services/
├── 📁 subjects/                # Subject management (with embedded grades/books)
│   ├── schemas/
│   ├── dto/
│   └── services/
├── 📁 lessons/                 # Lesson management
│   ├── schemas/
│   ├── dto/
│   └── services/
├── 📁 questions/               # Question management (with embedded answers)
│   ├── schemas/
│   ├── dto/
│   └── services/
├── 📁 progress/                # User progress tracking
│   ├── schemas/
│   ├── dto/
│   └── services/
├── 📁 bookmarks/               # User bookmarks
│   ├── schemas/
│   ├── dto/
│   └── services/
├── 📁 common/                  # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── 📁 config/                  # Configuration
├── 📁 database/                # Database connection config
└── 📄 main.ts                  # Application entry point
```

---

## 🔧 NESTJS ENTITIES & DTOS

### **1. User Schema (Updated for Mongoose)**
```typescript
// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ 
  timestamps: true, 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class User {
  @Prop({ required: true, unique: true, trim: true, maxlength: 50 })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false }) // Don't include in queries by default
  passwordHash: string;

  @Prop({ required: true, trim: true, maxlength: 255 })
  fullName: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ 
    enum: ['student', 'teacher', 'admin'], 
    default: 'student',
    index: true
  })
  role: string;

  @Prop({ min: 1, max: 12, index: true })
  grade?: number;

  @Prop({ type: [String], default: [], index: true })
  subjects: string[];

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  // Virtual fields for relationships
  progress?: Types.ObjectId[];
  bookmarks?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add compound indexes
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ role: 1, subjects: 1 });

// Add virtual populate for progress
UserSchema.virtual('userProgress', {
  ref: 'UserProgress',
  localField: '_id',
  foreignField: 'userId'
});

// Add virtual populate for bookmarks
UserSchema.virtual('userBookmarks', {
  ref: 'UserBookmark',
  localField: '_id',
  foreignField: 'userId'
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  const bcrypt = require('bcryptjs');
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.passwordHash);
};
```

### **2. Subject Schema (Updated for Mongoose)**
```typescript
// src/subjects/schemas/subject.schema.ts - Already updated above
// This was updated in the hierarchical section with embedded documents
// No changes needed here as it's already included above
```

### **3. DTOs**
```typescript
// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.STUDENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiProperty({ example: ['math', 'vietnamese'], required: false })
  @IsOptional()
  @IsArray()
  subjects?: string[];
}

// src/questions/dto/create-question.dto.ts
export class CreateQuestionDto {
  @ApiProperty({ example: 'lesson-uuid' })
  @IsString()
  lessonId: string;

  @ApiProperty({ example: '1 + 1 = ?' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Tính tổng của 1 và 1' })
  @IsString()
  content: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiProperty({ example: ['basic-math', 'addition'] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
```

---

## 🎮 API CONTROLLERS & ENDPOINTS

### **API Endpoints Overview**:
```
🔐 AUTH ENDPOINTS:
POST   /auth/register          - Đăng ký tài khoản
POST   /auth/login             - Đăng nhập
POST   /auth/logout            - Đăng xuất
POST   /auth/refresh           - Refresh token
GET    /auth/profile           - Thông tin user hiện tại

👥 USER ENDPOINTS:
GET    /users                  - Danh sách users (admin)
GET    /users/:id              - Chi tiết user
PUT    /users/:id              - Cập nhật user
DELETE /users/:id              - Xóa user
GET    /users/:id/progress     - Tiến độ học tập của user
GET    /users/:id/bookmarks    - Sách yêu thích của user

📚 CONTENT ENDPOINTS:
GET    /subjects               - Danh sách môn học
POST   /subjects               - Tạo môn học (admin/teacher)
GET    /subjects/:id           - Chi tiết môn học
PUT    /subjects/:id           - Cập nhật môn học
DELETE /subjects/:id           - Xóa môn học

GET    /subjects/:id/grades    - Danh sách lớp theo môn học
POST   /grades                 - Tạo lớp học
GET    /grades/:id             - Chi tiết lớp học
PUT    /grades/:id             - Cập nhật lớp học

GET    /grades/:id/books       - Danh sách sách theo lớp
POST   /books                  - Tạo sách
GET    /books/:id              - Chi tiết sách
PUT    /books/:id              - Cập nhật sách

GET    /books/:id/lessons      - Danh sách bài học theo sách
POST   /lessons                - Tạo bài học
GET    /lessons/:id            - Chi tiết bài học
PUT    /lessons/:id            - Cập nhật bài học

❓ QUESTION & ANSWER ENDPOINTS:
GET    /lessons/:id/questions  - Danh sách câu hỏi theo bài học
POST   /questions              - Tạo câu hỏi
GET    /questions/:id          - Chi tiết câu hỏi
PUT    /questions/:id          - Cập nhật câu hỏi
DELETE /questions/:id          - Xóa câu hỏi

GET    /questions/:id/answers  - Danh sách câu trả lời
POST   /answers                - Tạo câu trả lời
PUT    /answers/:id            - Cập nhật câu trả lời
DELETE /answers/:id            - Xóa câu trả lời

📊 PROGRESS & INTERACTION ENDPOINTS:
POST   /progress               - Lưu tiến độ học tập
GET    /progress/:userId       - Tiến độ theo user
PUT    /progress/:id           - Cập nhật tiến độ

POST   /bookmarks              - Thêm bookmark
DELETE /bookmarks/:id          - Xóa bookmark
GET    /bookmarks/user/:userId - Bookmarks của user

🔍 SEARCH & FILTER ENDPOINTS:
GET    /search/questions       - Tìm kiếm câu hỏi
GET    /search/books           - Tìm kiếm sách
GET    /search/content         - Tìm kiếm tổng hợp

📈 ANALYTICS ENDPOINTS (Admin):
GET    /analytics/users        - Thống kê users
GET    /analytics/content      - Thống kê nội dung
GET    /analytics/progress     - Thống kê tiến độ học tập
```

### **Sample Controller Implementation**:
```typescript
// src/questions/questions.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('questions')
@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo câu hỏi mới' })
  @ApiResponse({ status: 201, description: 'Câu hỏi được tạo thành công' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.questionsService.create(createQuestionDto, user.id);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi theo bài học' })
  async findByLesson(
    @Param('lessonId') lessonId: string,
    @Query() filterDto: QuestionFilterDto,
  ) {
    return this.questionsService.findByLesson(lessonId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết câu hỏi' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật câu hỏi' })
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.questionsService.update(id, updateQuestionDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa câu hỏi' })
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.questionsService.remove(id, user.id);
  }
}
```

---

## 🔄 MIGRATION ROADMAP

### **PHASE 1: SETUP & INFRASTRUCTURE (Tuần 1)**

#### **Week 1.1: Project Setup (2 ngày)**
- [ ] **Day 1**: 
  - [ ] Create NestJS project
  - [ ] Setup PostgreSQL database
  - [ ] Configure TypeORM
  - [ ] Setup basic project structure
  
- [ ] **Day 2**:
  - [ ] Configure authentication (JWT)
  - [ ] Setup Swagger documentation
  - [ ] Configure environment variables
  - [ ] Setup basic middleware (helmet, compression, cors)

#### **Week 1.2: Core Entities (3 ngày)**
- [ ] **Day 3**: Create User entity & authentication
- [ ] **Day 4**: Create Subject/Grade/Book/Lesson entities
- [ ] **Day 5**: Create Question/Answer entities

#### **Week 1.3: Basic CRUD (2 ngày)**
- [ ] **Day 6**: Implement Users & Auth controllers
- [ ] **Day 7**: Implement basic CRUD for content entities

### **PHASE 2: CORE FEATURES (Tuần 2)**

#### **Week 2.1: Content Management (3 ngày)**
- [ ] **Day 1**: Complete Subjects & Grades APIs
- [ ] **Day 2**: Complete Books & Lessons APIs  
- [ ] **Day 3**: Complete Questions & Answers APIs

#### **Week 2.2: User Features (2 ngày)**
- [ ] **Day 4**: Implement Progress tracking APIs
- [ ] **Day 5**: Implement Bookmarks APIs

#### **Week 2.3: Advanced Features (2 ngày)**
- [ ] **Day 6**: Search & Filter functionality
- [ ] **Day 7**: File upload & image handling

### **PHASE 3: DATA MIGRATION (Tuần 3)**

#### **Week 3.1: Migration Scripts (3 ngày)**
- [ ] **Day 1**: Create migration script for users.json
- [ ] **Day 2**: Create migration script for categories.json
- [ ] **Day 3**: Create migration script for questions/answers.json

#### **Week 3.2: Data Validation (2 ngày)**
- [ ] **Day 4**: Validate migrated data
- [ ] **Day 5**: Fix data inconsistencies

#### **Week 3.3: Frontend Integration (2 ngày)**
- [ ] **Day 6**: Update Next.js to use new APIs
- [ ] **Day 7**: Testing & bug fixes

### **PHASE 4: OPTIMIZATION & DEPLOYMENT (Tuần 4)**

#### **Week 4.1: Performance (3 ngày)**
- [ ] **Day 1**: Database indexing & optimization
- [ ] **Day 2**: API caching implementation
- [ ] **Day 3**: Performance testing

#### **Week 4.2: Security (2 ngày)**
- [ ] **Day 4**: Security audit & fixes
- [ ] **Day 5**: Rate limiting & validation

#### **Week 4.3: Deployment (2 ngày)**
- [ ] **Day 6**: Setup production environment
- [ ] **Day 7**: Deploy & monitor

---

## 📋 MIGRATION SCRIPTS

### **Data Migration Script**:
```typescript
// scripts/migrate-data.ts
import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import { Subject, SubjectDocument } from '../src/subjects/schemas/subject.schema';
import { Question, QuestionDocument } from '../src/questions/schemas/question.schema';
import { Lesson, LessonDocument } from '../src/lessons/schemas/lesson.schema';
import { UserProgress, UserProgressDocument } from '../src/progress/schemas/user-progress.schema';
import { UserBookmark, UserBookmarkDocument } from '../src/bookmarks/schemas/user-bookmark.schema';

export class DataMigration {
  constructor(
    private userModel: Model<UserDocument>,
    private subjectModel: Model<SubjectDocument>,
    private lessonModel: Model<LessonDocument>,
    private questionModel: Model<QuestionDocument>,
    private progressModel: Model<UserProgressDocument>,
    private bookmarkModel: Model<UserBookmarkDocument>,
  ) {}

  async migrate() {
    console.log('🚀 Starting MongoDB data migration...');
    
    try {
      // Clear existing data (optional - be careful in production)
      await this.clearCollections();
      
      await this.migrateUsers();
      await this.migrateCategories();
      await this.migrateLessons();
      await this.migrateQuestions();
      await this.migrateProgress();
      await this.migrateBookmarks();
      
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    }
  }

  private async clearCollections() {
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      this.userModel.deleteMany({}),
      this.subjectModel.deleteMany({}),
      this.lessonModel.deleteMany({}),
      this.questionModel.deleteMany({}),
      this.progressModel.deleteMany({}),
      this.bookmarkModel.deleteMany({}),
    ]);
    console.log('✅ Collections cleared');
  }

  private async migrateUsers() {
    console.log('👥 Migrating users...');
    const usersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../app/data/users.json'), 'utf8')
    );

    const users = [];
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      users.push({
        _id: userData.id, // Preserve original ID
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        fullName: userData.fullName,
        avatarUrl: userData.avatar || undefined,
        role: userData.role,
        grade: userData.grade || undefined,
        subjects: userData.subjects || [],
        permissions: userData.permissions || [],
        isActive: true,
        emailVerified: true,
      });
    }
    
    await this.userModel.insertMany(users);
    console.log(`✅ Migrated ${users.length} users`);
  }

  private async migrateCategories() {
    console.log('📚 Migrating categories (subjects with embedded grades/books)...');
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../app/data/categories.json'), 'utf8')
    );

    const subjects = [];
    for (const categoryData of categoriesData) {
      const subject = {
        _id: categoryData.id,
        name: categoryData.name,
        slug: this.slugify(categoryData.name),
        description: categoryData.description || undefined,
        icon: this.getSubjectIcon(categoryData.name),
        sortOrder: 0,
        isActive: true,
        createdBy: categoryData.createdBy || undefined,
        grades: []
      };

      // Process grades (embedded documents)
      if (categoryData.children && Array.isArray(categoryData.children)) {
        for (const gradeData of categoryData.children) {
          const grade = {
            _id: gradeData.id,
            name: gradeData.name,
            slug: this.slugify(gradeData.name),
            level: this.extractGradeLevel(gradeData.name),
            description: gradeData.description || undefined,
            sortOrder: 0,
            isActive: true,
            createdBy: gradeData.createdBy || undefined,
            books: []
          };

          // Process books (embedded in grades)
          if (gradeData.children && Array.isArray(gradeData.children)) {
            for (const bookData of gradeData.children) {
              const book = {
                _id: bookData.id,
                name: bookData.name,
                slug: this.slugify(bookData.name),
                description: bookData.description || undefined,
                publisher: this.extractPublisher(bookData.name),
                coverImageUrl: undefined,
                sortOrder: 0,
                isActive: true,
                createdBy: bookData.createdBy || undefined,
                lessons: [] // Will be populated after lessons migration
              };
              
              grade.books.push(book);
            }
          }
          
          subject.grades.push(grade);
        }
      }
      
      subjects.push(subject);
    }
    
    await this.subjectModel.insertMany(subjects);
    console.log(`✅ Migrated ${subjects.length} subjects with embedded grades and books`);
  }

  private async migrateLessons() {
    console.log('📖 Migrating lessons...');
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../app/data/categories.json'), 'utf8')
    );

    const lessons = [];
    const bookLessonMap = new Map(); // To track lessons per book

    for (const categoryData of categoriesData) {
      if (categoryData.children) {
        for (const gradeData of categoryData.children) {
          if (gradeData.children) {
            for (const bookData of gradeData.children) {
              if (bookData.children) {
                for (const lessonData of bookData.children) {
                  const lesson = {
                    _id: lessonData.id,
                    name: lessonData.name,
                    slug: this.slugify(lessonData.name),
                    description: lessonData.description || undefined,
                    content: lessonData.content || undefined,
                    sortOrder: 0,
                    isActive: true,
                    bookId: bookData.id,
                    createdBy: lessonData.createdBy || undefined,
                    questions: [] // Will be populated after questions migration
                  };
                  
                  lessons.push(lesson);
                  
                  // Track lessons for each book
                  if (!bookLessonMap.has(bookData.id)) {
                    bookLessonMap.set(bookData.id, []);
                  }
                  bookLessonMap.get(bookData.id).push(lessonData.id);
                }
              }
            }
          }
        }
      }
    }
    
    await this.lessonModel.insertMany(lessons);
    console.log(`✅ Migrated ${lessons.length} lessons`);

    // Update books with lesson references
    for (const [bookId, lessonIds] of bookLessonMap) {
      await this.subjectModel.updateOne(
        { 'grades.books._id': bookId },
        { $set: { 'grades.$.books.$[book].lessons': lessonIds } },
        { arrayFilters: [{ 'book._id': bookId }] }
      );
    }
    console.log('✅ Updated books with lesson references');
  }

  // Helper methods
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single
      .trim();
  }

  private getSubjectIcon(subjectName: string): string {
    const icons = {
      'Toán': '🔢',
      'Tiếng Việt': '📖',
      'Tiếng Anh': '🇺🇸',
      'Khoa học': '🔬',
    };
    return icons[subjectName] || '📚';
  }

  private extractGradeLevel(gradeName: string): number {
    const match = gradeName.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }

  private extractPublisher(bookName: string): string {
    if (bookName.includes('Kết nối tri thức')) return 'Kết nối tri thức';
    if (bookName.includes('Chân trời sáng tạo')) return 'Chân trời sáng tạo';
    if (bookName.includes('Cánh diều')) return 'Cánh diều';
    return 'Unknown';
  }
}

// Main migration function
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const subjectModel = app.get<Model<SubjectDocument>>(getModelToken(Subject.name));
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken(Lesson.name));
  const questionModel = app.get<Model<QuestionDocument>>(getModelToken(Question.name));
  const progressModel = app.get<Model<UserProgressDocument>>(getModelToken(UserProgress.name));
  const bookmarkModel = app.get<Model<UserBookmarkDocument>>(getModelToken(UserBookmark.name));

  const migration = new DataMigration(
    userModel,
    subjectModel,
    lessonModel,
    questionModel,
    progressModel,
    bookmarkModel,
  );

  await migration.migrate();
  await app.close();
}

bootstrap().catch(console.error);
```
```

### **Environment Configuration**:
```typescript
// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/solvefy',
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4, skip trying IPv6
}));

// src/config/mongodb.config.ts
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export const getMongoConfig = (configService: ConfigService): MongooseModuleOptions => ({
  uri: configService.get<string>('database.uri'),
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  // Connection events
  connectionFactory: (connection) => {
    connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });
    connection.on('disconnected', () => {
      console.log('❌ MongoDB disconnected');
    });
    connection.on('error', (error) => {
      console.error('💥 MongoDB connection error:', error);
    });
    return connection;
  },
});
```
```

---

## 🔍 TESTING STRATEGY

### **Testing Levels**:
```
🧪 Unit Tests (Services, Guards, Pipes)
🔗 Integration Tests (Controllers + Services)
🌐 E2E Tests (Full API workflows)
📊 Performance Tests (Load testing)
```

### **Test Files Structure**:
```
src/
├── users/
│   ├── users.service.spec.ts
│   ├── users.controller.spec.ts
│   └── users.e2e-spec.ts
├── questions/
│   ├── questions.service.spec.ts
│   └── questions.controller.spec.ts
└── test/
    ├── fixtures/
    ├── helpers/
    └── e2e/
```

---

## 📈 SUCCESS METRICS

### **Performance Targets**:
```
🎯 API Response Time: < 200ms (95th percentile)
🎯 Database Query Time: < 50ms average
🎯 Concurrent Users: 1000+ simultaneous
🎯 Uptime: 99.9%
🎯 Data Migration: 100% data integrity
```

### **Monitoring & Alerting**:
- **Health Checks**: Database, Redis, External services
- **Performance Monitoring**: Response times, memory usage
- **Error Tracking**: Sentry integration
- **Logging**: Structured logging with Winston

---

## 🚀 DEPLOYMENT ARCHITECTURE

### **Production Stack**:
```
🌐 Load Balancer (Nginx)
    ↓
🐳 NestJS App (Docker containers)
    ↓
🍃 MongoDB Atlas/Self-hosted (Replica Set)
    ↓
🔴 Redis (Caching + Sessions)
    ↓
📁 S3/MinIO (File storage)
```

### **CI/CD Pipeline**:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm install
          npm run test
          npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          docker build -t solvefy-backend .
          docker push registry/solvefy-backend
          # Deploy commands
```

---

## 📞 NEXT STEPS & ACTION ITEMS

### **Immediate Actions (This Week)**:
1. 🚨 **Setup development environment**
2. 🚨 **Create database schema**
3. 🚨 **Initialize NestJS project**
4. 🚨 **Setup basic authentication**

### **Week-by-Week Checklist**:

#### **Week 1 Deliverables**:
- [ ] ✅ Working NestJS application
- [ ] ✅ Database connected & configured
- [ ] ✅ Basic CRUD operations
- [ ] ✅ Authentication system
- [ ] ✅ Swagger documentation

#### **Week 2 Deliverables**:
- [ ] ✅ All API endpoints implemented
- [ ] ✅ Data validation & error handling
- [ ] ✅ File upload functionality
- [ ] ✅ Search & filtering

#### **Week 3 Deliverables**:
- [ ] ✅ Data migration completed
- [ ] ✅ Frontend integration done
- [ ] ✅ All features working end-to-end

#### **Week 4 Deliverables**:
- [ ] ✅ Performance optimized
- [ ] ✅ Security implemented
- [ ] ✅ Production deployment ready
- [ ] ✅ Monitoring & logging setup

---

**📝 Ghi chú**: Plan này có thể điều chỉnh dựa trên tình hình thực tế và feedback trong quá trình development.

**🔄 Lần cập nhật cuối**: 21/11/2025  
**👤 Người phụ trách**: Backend Development Team  
**📅 Review lần tiếp theo**: 28/11/2025  
**🎯 Target Go-Live**: 19/12/2025