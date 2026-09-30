"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { GuideVideo } from "@/content/resources";

/**
 * A YouTube video that stays a plain panel until someone presses play, so
 * opening a guide sends nothing to YouTube. The player then loads from the
 * no-cookie domain.
 */
export function VideoEmbed({ video }: { video: GuideVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="guide-video">
      <div className="guide-video-frame">
        {playing ? (
          <iframe
            // Focus follows the press, so the keyboard lands on the player that replaced the button.
            ref={(frame) => frame?.focus()}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button type="button" className="guide-video-play" onClick={() => setPlaying(true)} aria-label={`Play video: ${video.title}`}>
            <span className="guide-video-button" aria-hidden="true">
              <Play className="size-6" />
            </span>
            <span className="guide-video-title">{video.title}</span>
            <span className="guide-video-meta">
              {video.channel}, {video.length}
            </span>
          </button>
        )}
      </div>
      <figcaption>
        <p>{video.caption}</p>
        <p className="guide-video-source">
          Plays from YouTube, which is only contacted once you press play.{" "}
          <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="careers-inline-link">
            Watch on YouTube
            <ExternalLink className="ml-1 inline size-3.5" aria-hidden />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </figcaption>
    </figure>
  );
}
