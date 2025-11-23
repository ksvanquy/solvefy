const fs = require('fs');
const path = require('path');

/**
 * Generate URL-friendly slug from Vietnamese text
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate slug with ID suffix for uniqueness
 */
function generateSlugWithId(name, id) {
  const slug = generateSlug(name);
  return `${slug}-${id}`;
}

/**
 * Add slugs to subjects
 */
function addSlugsToSubjects() {
  const filePath = path.join(__dirname, '../app/data/subjects.json');
  const subjects = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  subjects.forEach(subject => {
    subject.slug = generateSlug(subject.name);
  });
  
  fs.writeFileSync(filePath, JSON.stringify(subjects, null, 2), 'utf8');
  console.log('✅ Added slugs to subjects.json');
}

/**
 * Add slugs to grades
 */
function addSlugsToGrades() {
  const filePath = path.join(__dirname, '../app/data/grades.json');
  const grades = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  grades.forEach(grade => {
    grade.slug = generateSlug(grade.name);
  });
  
  fs.writeFileSync(filePath, JSON.stringify(grades, null, 2), 'utf8');
  console.log('✅ Added slugs to grades.json');
}

/**
 * Add slugs to books
 */
function addSlugsToBooks() {
  const filePath = path.join(__dirname, '../app/data/books.json');
  const books = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  books.forEach(book => {
    book.slug = generateSlugWithId(book.name, book._id);
  });
  
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2), 'utf8');
  console.log('✅ Added slugs to books.json');
}

/**
 * Add slugs to lessons
 */
function addSlugsToLessons() {
  const filePath = path.join(__dirname, '../app/data/lessons.json');
  const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  lessons.forEach(lesson => {
    lesson.slug = generateSlugWithId(lesson.name, lesson._id);
  });
  
  fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
  console.log('✅ Added slugs to lessons.json');
}

/**
 * Add slugs to questions
 */
function addSlugsToQuestions() {
  const filePath = path.join(__dirname, '../app/data/questions.json');
  const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  questions.forEach(question => {
    const shortTitle = question.title.substring(0, 50);
    question.slug = generateSlugWithId(shortTitle, question.id);
  });
  
  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf8');
  console.log('✅ Added slugs to questions.json');
}

// Run all
console.log('🚀 Generating slugs for all entities...\n');
addSlugsToSubjects();
addSlugsToGrades();
addSlugsToBooks();
addSlugsToLessons();
addSlugsToQuestions();
console.log('\n✅ All slugs generated successfully!');
