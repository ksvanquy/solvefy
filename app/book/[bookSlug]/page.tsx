"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type Lesson = { _id: string; bookId: string; name: string; slug: string; sortOrder: number };
type Book = { _id: string; name: string; slug: string };

export default function BookRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const bookSlug = params.bookSlug as string;

  useEffect(() => {
    // Fetch data to find the first lesson for this book
    fetch("/api/solve")
      .then((r) => r.json())
      .then((data) => {
        if (data.books && data.lessons) {
          const foundBook = data.books.find((b: Book) => b.slug === bookSlug);
          
          if (foundBook) {
            const bookLessons = data.lessons
              .filter((l: Lesson) => l.bookId === foundBook._id)
              .sort((a: Lesson, b: Lesson) => a.sortOrder - b.sortOrder);
            
            if (bookLessons.length > 0) {
              // Redirect to the first lesson
              router.replace(`/book/${bookSlug}/${bookLessons[0].slug}`);
            } else {
              // No lessons found for this book
              console.error("No lessons found for book:", bookSlug);
            }
          } else {
            // Book not found
            console.error("Book not found:", bookSlug);
          }
        }
      })
      .catch((e) => console.error(e));
  }, [bookSlug, router]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-zinc-600">Đang chuyển hướng...</div>
    </div>
  );
}
