// Sample NestJS Controller cho Subjects với flatten structure
// src/subjects/subjects.controller.ts

import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto, SubjectFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@ApiTags('subjects')
@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách môn học' })
  @ApiResponse({ status: 200, description: 'Danh sách môn học' })
  async findAll(@Query() filterDto: SubjectFilterDto) {
    return this.subjectsService.findAll(filterDto);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo môn học mới' })
  @ApiResponse({ status: 201, description: 'Môn học được tạo thành công' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  async create(
    @Body() createSubjectDto: CreateSubjectDto,
    @CurrentUser() user: User,
  ) {
    return this.subjectsService.create(createSubjectDto, user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết môn học' })
  async findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Lấy danh sách lớp theo môn học' })
  async getGradesBySubject(@Param('id') subjectId: string) {
    return this.subjectsService.getGradesBySubject(subjectId);
  }

  @Get(':id/full-hierarchy')
  @ApiOperation({ summary: 'Lấy cây phân cấp đầy đủ: Subject -> Grades -> Books -> Lessons' })
  async getFullHierarchy(@Param('id') subjectId: string) {
    return this.subjectsService.getFullHierarchy(subjectId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật môn học' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  async update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @CurrentUser() user: User,
  ) {
    return this.subjectsService.update(id, updateSubjectDto, user._id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa môn học' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.subjectsService.remove(id, user._id);
  }
}

// Sample Service để minh họa các query với flatten structure
// src/subjects/subjects.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './schemas/subject.schema';
import { Grade, GradeDocument } from '../grades/schemas/grade.schema';
import { Book, BookDocument } from '../books/schemas/book.schema';
import { Lesson, LessonDocument } from '../lessons/schemas/lesson.schema';
import { CreateSubjectDto, UpdateSubjectDto, SubjectFilterDto } from './dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Grade.name) private gradeModel: Model<GradeDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  async findAll(filterDto: SubjectFilterDto): Promise<Subject[]> {
    const query = this.subjectModel.find({ isActive: true });
    
    if (filterDto.search) {
      query.where({ name: { $regex: filterDto.search, $options: 'i' } });
    }
    
    return query.sort({ sortOrder: 1, name: 1 }).exec();
  }

  async create(createSubjectDto: CreateSubjectDto, createdBy: string): Promise<Subject> {
    const subject = new this.subjectModel({
      ...createSubjectDto,
      createdBy,
    });
    return subject.save();
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  // Lấy danh sách lớp theo môn học (sử dụng flatten structure)
  async getGradesBySubject(subjectId: string): Promise<Grade[]> {
    // Kiểm tra subject tồn tại
    await this.findOne(subjectId);
    
    // Lấy các lớp thuộc subject này
    return this.gradeModel
      .find({ subjectId, isActive: true })
      .sort({ level: 1, sortOrder: 1 })
      .exec();
  }

  // Lấy cây phân cấp đầy đủ với flatten structure
  async getFullHierarchy(subjectId: string) {
    // 1. Lấy subject
    const subject = await this.findOne(subjectId);
    
    // 2. Lấy tất cả grades của subject
    const grades = await this.gradeModel
      .find({ subjectId, isActive: true })
      .sort({ level: 1, sortOrder: 1 })
      .exec();
    
    // 3. Lấy tất cả books của subject
    const books = await this.bookModel
      .find({ subjectId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
    
    // 4. Lấy tất cả lessons của subject
    const lessons = await this.lessonModel
      .find({ subjectId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
    
    // 5. Build hierarchy
    const result = {
      ...subject.toObject(),
      grades: grades.map(grade => ({
        ...grade.toObject(),
        books: books
          .filter(book => book.gradeId === grade._id)
          .map(book => ({
            ...book.toObject(),
            lessons: lessons.filter(lesson => lesson.bookId === book._id)
          }))
      }))
    };
    
    return result;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto, updatedBy: string): Promise<Subject> {
    const subject = await this.subjectModel
      .findByIdAndUpdate(
        id,
        { ...updateSubjectDto, updatedAt: new Date() },
        { new: true }
      )
      .exec();
    
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    
    return subject;
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    // Soft delete
    const result = await this.subjectModel
      .findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      )
      .exec();
    
    if (!result) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    
    // Cascade soft delete grades, books, lessons
    await this.gradeModel.updateMany(
      { subjectId: id },
      { isActive: false, updatedAt: new Date() }
    );
    
    await this.bookModel.updateMany(
      { subjectId: id },
      { isActive: false, updatedAt: new Date() }
    );
    
    await this.lessonModel.updateMany(
      { subjectId: id },
      { isActive: false, updatedAt: new Date() }
    );
  }

  // Utility method: Lấy thống kê môn học
  async getSubjectStats(subjectId: string) {
    const [grades, books, lessons] = await Promise.all([
      this.gradeModel.countDocuments({ subjectId, isActive: true }),
      this.bookModel.countDocuments({ subjectId, isActive: true }),
      this.lessonModel.countDocuments({ subjectId, isActive: true })
    ]);

    return {
      subjectId,
      totalGrades: grades,
      totalBooks: books,
      totalLessons: lessons
    };
  }
}