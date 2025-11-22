// Script để flatten categories.json thành 4 collections riêng biệt
// Chạy: node scripts/flatten-categories.js

const fs = require('fs');
const path = require('path');

// Đọc categories.json
const categoriesPath = path.join(__dirname, '../app/data/categories.json');
const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// Helper functions
function getSubjectIcon(subjectName) {
  const icons = {
    'Toán': '🔢',
    'Tiếng Việt': '📖',
    'Tiếng Anh': '🇺🇸',
    'Khoa học': '🔬',
  };
  return icons[subjectName] || '📚';
}

function extractGradeLevel(gradeName) {
  const match = gradeName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function extractPublisher(bookName) {
  if (bookName.includes('Kết nối tri thức')) return 'Kết nối tri thức';
  if (bookName.includes('Chân trời sáng tạo')) return 'Chân trời sáng tạo';
  if (bookName.includes('Cánh diều')) return 'Cánh diều';
  return 'Unknown';
}

// Arrays để lưu các collections
const subjects = [];
const grades = [];
const books = [];
const lessons = [];

console.log('🚀 Flattening categories.json...');

// Flatten nested structure
for (const subject of categoriesData) {
  // Level 1: Subjects
  subjects.push({
    _id: subject.id,
    name: subject.name,
    description: subject.description || undefined,
    icon: getSubjectIcon(subject.name),
    sortOrder: 0,
    isActive: true,
    createdBy: subject.createdBy,
    createdAt: new Date(subject.createdAt),
    updatedAt: new Date(subject.updatedAt || subject.createdAt)
  });

  // Level 2: Grades
  if (subject.children) {
    for (const grade of subject.children) {
      grades.push({
        _id: grade.id,
        subjectId: subject.id,
        name: grade.name,
        level: extractGradeLevel(grade.name),
        description: grade.description || undefined,
        sortOrder: 0,
        isActive: true,
        createdBy: grade.createdBy,
        createdAt: new Date(grade.createdAt),
        updatedAt: new Date(grade.updatedAt || grade.createdAt)
      });

      // Level 3: Books
      if (grade.children) {
        for (const book of grade.children) {
          books.push({
            _id: book.id,
            gradeId: grade.id,
            subjectId: subject.id,
            name: book.name,
            publisher: extractPublisher(book.name),
            description: book.description || undefined,
            coverImageUrl: book.coverImageUrl || undefined,
            publicationYear: book.publicationYear || undefined,
            sortOrder: 0,
            isActive: true,
            createdBy: book.createdBy,
            createdAt: new Date(book.createdAt),
            updatedAt: new Date(book.updatedAt || book.createdAt)
          });

          // Level 4: Lessons
          if (book.children) {
            for (const lesson of book.children) {
              lessons.push({
                _id: lesson.id,
                bookId: book.id,
                gradeId: grade.id,
                subjectId: subject.id,
                name: lesson.name,
                content: lesson.content || undefined,
                description: lesson.description || undefined,
                sortOrder: 0,
                isActive: true,
                createdBy: lesson.createdBy,
                createdAt: new Date(lesson.createdAt),
                updatedAt: new Date(lesson.updatedAt || lesson.createdAt)
              });
            }
          }
        }
      }
    }
  }
}

// Tạo output directory nếu chưa có
const outputDir = path.join(__dirname, '../app/data/flattened');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Ghi các file JSON riêng biệt
fs.writeFileSync(
  path.join(outputDir, 'subjects.json'), 
  JSON.stringify(subjects, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'grades.json'), 
  JSON.stringify(grades, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'books.json'), 
  JSON.stringify(books, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'lessons.json'), 
  JSON.stringify(lessons, null, 2)
);

console.log('✅ Flattening completed!');
console.log(`📊 Results:`);
console.log(`   - Subjects: ${subjects.length} items`);
console.log(`   - Grades: ${grades.length} items`);
console.log(`   - Books: ${books.length} items`);
console.log(`   - Lessons: ${lessons.length} items`);
console.log(`📁 Files saved to: app/data/flattened/`);

// Hiển thị sample data
console.log('\n📄 Sample Subject:');
console.log(JSON.stringify(subjects[0], null, 2));

console.log('\n📄 Sample Grade:');
console.log(JSON.stringify(grades[0], null, 2));

console.log('\n📄 Sample Book:');
console.log(JSON.stringify(books[0], null, 2));

console.log('\n📄 Sample Lesson:');
console.log(JSON.stringify(lessons[0], null, 2));

// Validate relationships
console.log('\n🔍 Validating relationships...');
let validationErrors = 0;

// Check grades have valid subjects
for (const grade of grades) {
  const subject = subjects.find(s => s._id === grade.subjectId);
  if (!subject) {
    console.error(`❌ Grade ${grade._id} references non-existent subject ${grade.subjectId}`);
    validationErrors++;
  }
}

// Check books have valid grades and subjects
for (const book of books) {
  const grade = grades.find(g => g._id === book.gradeId);
  const subject = subjects.find(s => s._id === book.subjectId);
  
  if (!grade) {
    console.error(`❌ Book ${book._id} references non-existent grade ${book.gradeId}`);
    validationErrors++;
  }
  
  if (!subject) {
    console.error(`❌ Book ${book._id} references non-existent subject ${book.subjectId}`);
    validationErrors++;
  }
}

// Check lessons have valid books, grades and subjects
for (const lesson of lessons) {
  const book = books.find(b => b._id === lesson.bookId);
  const grade = grades.find(g => g._id === lesson.gradeId);
  const subject = subjects.find(s => s._id === lesson.subjectId);
  
  if (!book) {
    console.error(`❌ Lesson ${lesson._id} references non-existent book ${lesson.bookId}`);
    validationErrors++;
  }
  
  if (!grade) {
    console.error(`❌ Lesson ${lesson._id} references non-existent grade ${lesson.gradeId}`);
    validationErrors++;
  }
  
  if (!subject) {
    console.error(`❌ Lesson ${lesson._id} references non-existent subject ${lesson.subjectId}`);
    validationErrors++;
  }
}

if (validationErrors === 0) {
  console.log('✅ All relationships are valid!');
} else {
  console.log(`❌ Found ${validationErrors} validation errors!`);
}

console.log('\n🎯 Ready for MongoDB migration!');