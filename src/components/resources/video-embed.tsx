"use client";

import { useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { GuideVideo } from "@/content/resources";

/** A guide's video says why it was picked; a tool's window already says that around the player. */
type Video = Omit<GuideVideo, "caption"> & { caption?: string };

/**
 * A YouTube video that stays a plain panel until someone presses play, so
 * opening a guide sends nothing to YouTube. The player then loads from the
 * no-cookie domain.
 */
export function VideoEmbed({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  function play() {
    setPlaying(true);
    // The button is about to be replaced. Focus goes to the frame around the player, not into
    // the player itself: keys pressed inside YouTube's frame never reach this page, so Escape
    // would stop closing a window the video sits in.
    frame.current?.focus();
  }

  return (
    <figure className="guide-video">
      <div className="guide-video-frame" ref={frame} tabIndex={-1}>
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button type="button" className="guide-video-play" onClick={play} aria-label={`Play video: ${video.title}`}>
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
        {video.caption ? <p>{video.caption}</p> : null}
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
