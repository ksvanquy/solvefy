"use client";

import React, { useState } from 'react';

interface VideoPlayerProps {
  url: string;
  type: 'youtube' | 'uploaded' | 'vimeo' | null;
  thumbnail?: string | null;
  duration?: number | null;
}

export default function VideoPlayer({ url, type, thumbnail, duration }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  };

  const renderVideoPlayer = () => {
    if (type === 'youtube') {
      return (
        <iframe
          className="w-full h-full rounded-lg"
          src={getYouTubeEmbedUrl(url)}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (type === 'vimeo') {
      return (
        <iframe
          className="w-full h-full rounded-lg"
          src={getVimeoEmbedUrl(url)}
          title="Vimeo video player"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (type === 'uploaded') {
      return (
        <video
          className="w-full h-full rounded-lg"
          controls
          poster={thumbnail || undefined}
        >
          <source src={url} type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ video.
        </video>
      );
    }

    return null;
  };

  if (!isPlaying && thumbnail) {
    return (
      <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden group cursor-pointer">
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors"
        >
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
        {duration && (
          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(duration)}
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {type === 'youtube' && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
              YouTube
            </span>
          )}
          {type === 'vimeo' && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-medium">
              Vimeo
            </span>
          )}
          {type === 'uploaded' && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
              📹 Video
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
      {renderVideoPlayer()}
    </div>
  );
}
