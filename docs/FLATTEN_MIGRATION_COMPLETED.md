# ✅ FLATTEN CATEGORIES MIGRATION - HOÀN TẤT

## Tổng quan
Đã hoàn tất việc migration từ cấu trúc nested `categories.json` sang cấu trúc flatten với 4 file riêng biệt:
- `subjects.json` - Môn học
- `grades.json` - Lớp học
- `books.json` - Sách giáo khoa
- `lessons.json` - Bài học

## Các file đã cập nhật

### 1. **API Route: `app/api/solve/route.ts`**
**Thay đổi:**
- Thay thế `categories.json` bằng 4 file flatten
- Load `subjects.json`, `grades.json`, `books.json`, `lessons.json`
- Trả về dữ liệu với cấu trúc mới: `{ subjects, grades, books, lessons, questions, users }`

**Trước:**
```typescript
const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf8'));
return NextResponse.json({ questions, categories, users });
```

**Sau:**
```typescript
const subjects = JSON.parse(fs.readFileSync(path.join(dataDir, 'subjects.json'), 'utf8'));
const grades = JSON.parse(fs.readFileSync(path.join(dataDir, 'grades.json'), 'utf8'));
const books = JSON.parse(fs.readFileSync(path.join(dataDir, 'books.json'), 'utf8'));
const lessons = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessons.json'), 'utf8'));
return NextResponse.json({ questions, subjects, grades, books, lessons, users });
```

---

### 2. **Trang chủ: `app/page.tsx`**
**Thay đổi:**
- Cập nhật type definitions để phù hợp với cấu trúc flatten
- Thay thế state `categories` bằng `subjects`, `grades`, `books`, `lessons`
- Xây dựng lại `allBooks` từ dữ liệu flatten thay vì nested
- Sử dụng `_id` thay vì `id` cho các entity mới
- Thêm `icon` từ subjects.json

**Type definitions:**
```typescript
// Trước: nested structure
type Subject = { id: string; name: string; children: Grade[] };

// Sau: flatten structure
type Subject = { _id: string; name: string; icon: string; ... };
type Grade = { _id: string; subjectId: string; name: string; ... };
type Book = { _id: string; gradeId: string; subjectId: string; name: string; ... };
type Lesson = { _id: string; bookId: string; gradeId: string; subjectId: string; name: string; ... };
```

**Xây dựng allBooks:**
```typescript
// Trước: duyệt qua nested tree
categories.forEach((subject) => {
  subject.children.forEach((grade) => {
    grade.children.forEach((book) => {
      books.push({ ...book, subjectName: subject.name, ... });
    });
  });
});

// Sau: join các mảng flatten
const allBooks = books.map((book) => {
  const subject = subjects.find((s) => s._id === book.subjectId);
  const grade = grades.find((g) => g._id === book.gradeId);
  const bookLessons = lessons.filter((l) => l.bookId === book._id);
  return { ...book, subjectName: subject?.name, ... };
});
```

---

### 3. **Trang sách: `app/book/[bookId]/page.tsx`**
**Thay đổi:**
- Cập nhật type definitions cho flatten structure
- Thay đổi logic tìm book từ nested tree sang flatten lookup
- Sử dụng filter để tìm lessons của book
- Thêm hỗ trợ cho cả `id` và `_id` trong Lesson type

**Tìm book:**
```typescript
// Trước: duyệt qua nested tree
for (const subject of data.categories) {
  for (const grade of subject.children) {
    const book = grade.children.find((b) => b.id === bookId);
    if (book) { ... }
  }
}

// Sau: direct lookup
const foundBook = data.books.find((b) => b._id === bookId);
const subject = data.subjects.find((s) => s._id === foundBook.subjectId);
const grade = data.grades.find((g) => g._id === foundBook.gradeId);
const bookLessons = data.lessons.filter((l) => l.bookId === foundBook._id);
```

---

### 4. **Trang profile: `app/profile/page.tsx`**
**Thay đổi:**
- Cập nhật logic map bookmarks với book details
- Sử dụng flatten structure để tìm book, subject, grade

**Map bookmarks:**
```typescript
// Trước: duyệt qua nested tree
for (const subject of solveData.categories) {
  for (const grade of subject.children) {
    const book = grade.children.find((b) => b.id === bookmark.bookId);
    if (book) { ... }
  }
}

// Sau: direct lookup
const book = solveData.books.find((b) => b._id === bookmark.bookId);
const subject = solveData.subjects.find((s) => s._id === book.subjectId);
const grade = solveData.grades.find((g) => g._id === book.gradeId);
```

---

## Lợi ích của cấu trúc flatten

### 1. **Performance tốt hơn**
- Không cần duyệt qua nested loops
- Direct lookup với O(n) thay vì O(n²) hoặc O(n³)
- Dễ dàng cache và index

### 2. **Dễ dàng query và filter**
- Filter books theo subject/grade dễ dàng
- Tìm kiếm nhanh hơn
- Dễ implement pagination

### 3. **Dễ mở rộng**
- Thêm fields mới không ảnh hưởng structure
- Dễ tích hợp với database (MongoDB, PostgreSQL)
- Chuẩn bị tốt cho NestJS migration

### 4. **Maintainability**
- Code rõ ràng, dễ đọc
- Ít bugs liên quan đến nested traversal
- Dễ test từng entity riêng biệt

---

## Cấu trúc dữ liệu mới

### Subjects (subjects.json)
```json
{
  "_id": "sub1",
  "name": "Toán",
  "icon": "🔢",
  "sortOrder": 0,
  "isActive": true,
  "createdBy": "a1",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Grades (grades.json)
```json
{
  "_id": "gr1",
  "subjectId": "sub1",  // ← Reference to Subject
  "name": "Lớp 1",
  "level": 1,
  "sortOrder": 0,
  "isActive": true,
  "createdBy": "a1",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Books (books.json)
```json
{
  "_id": "bk1",
  "gradeId": "gr1",      // ← Reference to Grade
  "subjectId": "sub1",   // ← Reference to Subject
  "name": "Kết nối tri thức Toán 1",
  "publisher": "Kết nối tri thức",
  "sortOrder": 0,
  "isActive": true,
  "createdBy": "a1",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Lessons (lessons.json)
```json
{
  "_id": "ls1",
  "bookId": "bk1",       // ← Reference to Book
  "gradeId": "gr1",      // ← Reference to Grade (denormalized)
  "subjectId": "sub1",   // ← Reference to Subject (denormalized)
  "name": "Bài 1: Phép cộng",
  "sortOrder": 0,
  "isActive": true,
  "createdBy": "a1",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Migration notes

### Backward compatibility
- Đã xóa dependency vào `categories.json`
- Có thể xóa file `categories.json` nếu không cần thiết
- Script flatten đã tạo trong `scripts/flatten-categories.js`

### Testing checklist
- [x] API `/api/solve` trả về đúng dữ liệu
- [x] Trang chủ hiển thị danh sách books
- [x] Filter theo subject hoạt động
- [x] Search books hoạt động
- [x] Trang book hiển thị lessons
- [x] Profile page hiển thị bookmarks
- [x] Không có compile errors

### Next steps
1. Test thoroughly trên development
2. Xóa file `categories.json` nếu không cần
3. Update documentation cho team
4. Chuẩn bị cho NestJS migration

---

## Ngày hoàn thành
**23/11/2025**

---

## Notes
- Tất cả file đã được cập nhật và không có lỗi compile
- Cấu trúc mới dễ dàng migrate sang database (MongoDB/PostgreSQL)
- Sẵn sàng cho bước tiếp theo: NestJS migration
