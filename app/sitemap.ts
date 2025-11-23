import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://solvefy.vercel.app' // Change to your domain
  
  // Read data files
  const dataDir = path.join(process.cwd(), 'app', 'data')
  const subjects = JSON.parse(fs.readFileSync(path.join(dataDir, 'subjects.json'), 'utf8'))
  const grades = JSON.parse(fs.readFileSync(path.join(dataDir, 'grades.json'), 'utf8'))
  const books = JSON.parse(fs.readFileSync(path.join(dataDir, 'books.json'), 'utf8'))
  const lessons = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessons.json'), 'utf8'))
  const questions = JSON.parse(fs.readFileSync(path.join(dataDir, 'questions.json'), 'utf8'))

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Add subject pages
  subjects.forEach((subject: any) => {
    sitemap.push({
      url: `${baseUrl}/${subject.slug}`,
      lastModified: new Date(subject.updatedAt || subject.createdAt),
      changeFrequency: 'weekly',
      priority: 0.9,
    })
    
    // Add grade pages for this subject
    const subjectGrades = grades.filter((g: any) => g.subjectId === subject._id)
    subjectGrades.forEach((grade: any) => {
      sitemap.push({
        url: `${baseUrl}/${subject.slug}/${grade.slug}`,
        lastModified: new Date(grade.updatedAt || grade.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })
  })

  // Add book pages
  books.forEach((book: any) => {
    sitemap.push({
      url: `${baseUrl}/book/${book.slug}`,
      lastModified: new Date(book.updatedAt || book.createdAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
    
    // Add lesson pages for this book
    const bookLessons = lessons.filter((l: any) => l.bookId === book._id)
    bookLessons.forEach((lesson: any) => {
      sitemap.push({
        url: `${baseUrl}/book/${book.slug}/${lesson.slug}`,
        lastModified: new Date(lesson.updatedAt || lesson.createdAt),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    })
  })

  // Add question pages
  questions.forEach((question: any) => {
    sitemap.push({
      url: `${baseUrl}/cau-hoi/${question.slug}`,
      lastModified: new Date(question.updatedAt || question.createdAt),
      changeFrequency: 'daily',
      priority: 0.5,
    })
  })

  return sitemap
}
