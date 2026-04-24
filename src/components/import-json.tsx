"use client";

import { useState, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileJson, Loader2 } from "lucide-react";

// LinkedIn post from Savely extension
interface LinkedInPost {
  authorName: string;
  authorProfileURL: string;
  authorJobTitle?: string;
  postURL: string;
  postContent: string;
  postImage?: string;
  timeSincePosted?: string;
  scrapedAt: string;
}

// YouTube video from Savely extension
interface YouTubeVideo {
  title: string;
  channel?: string;
  channelName?: string;
  duration?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  url?: string;
  videoId?: string;
}

function extractLinkedInId(url: string): string {
  const activityMatch = url.match(/activity[:\-](\d+)/);
  if (activityMatch) {
    return `li_${activityMatch[1]}`;
  }
  return `li_${url.split("/").pop()?.slice(0, 16) || Date.now()}`;
}

function extractYouTubeId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match?.[1] || `yt_${Date.now()}`;
}

export function ImportJson() {
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const savePost = useMutation(trpc.posts.save.mutationOptions());

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a JSON file");
      return;
    }

    setIsImporting(true);
    let savedCount = 0;
    let errorCount = 0;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        toast.error("Invalid JSON format - expected an array");
        return;
      }

      const isLinkedIn =
        data[0]?.authorName !== undefined || data[0]?.postURL !== undefined;
      const isYouTube =
        data[0]?.title !== undefined &&
        (data[0]?.videoUrl !== undefined ||
          data[0]?.channel !== undefined ||
          data[0]?.duration !== undefined);

      if (isLinkedIn) {
        for (const post of data as LinkedInPost[]) {
          try {
            const externalId = extractLinkedInId(post.postURL || "");
            await savePost.mutateAsync({
              platform: "linkedin",
              externalId,
              title: post.authorName || "LinkedIn Post",
              description: (post.postContent || post.authorJobTitle)?.slice(
                0,
                2000,
              ),
              url: post.postURL,
              thumbnail: post.postImage || undefined,
              metadata: {
                authorProfileURL: post.authorProfileURL,
                authorJobTitle: post.authorJobTitle,
                authorName: post.authorName,
                scrapedAt: post.scrapedAt,
              },
            });
            savedCount++;
          } catch {
            errorCount++;
          }
        }
      } else if (isYouTube) {
        for (const video of data as YouTubeVideo[]) {
          try {
            const videoUrl = video.videoUrl || video.url || "";
            const videoId = video.videoId || extractYouTubeId(videoUrl);

            await savePost.mutateAsync({
              platform: "youtube",
              externalId: videoId,
              title: video.title,
              url: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail:
                video.thumbnailUrl ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              metadata: {
                channel: video.channel || video.channelName,
                duration: video.duration,
              },
            });
            savedCount++;
          } catch {
            errorCount++;
          }
        }
      } else {
        toast.error(
          "Could not detect platform. Make sure the JSON is from LinkedIn or YouTube.",
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: trpc.posts.getAll.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.posts.counts.queryKey() });

      if (savedCount > 0) {
        toast.success(
          `Imported ${savedCount} posts${errorCount > 0 ? ` (${errorCount} failed)` : ""}`,
        );
      } else {
        toast.error("No posts were imported");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to parse JSON file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.04)] bg-[#281d18] p-6">
      {/* Header */}
      <div className="space-y-1 pb-6">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-[#f2dfd5]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A855F7]/10">
            <FileJson className="h-4 w-4 text-[#A855F7]" />
          </div>
          Import from JSON
        </h2>
        <p className="text-sm text-[#a48c7f]">
          Upload a JSON file exported from Savely or similar extensions
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          dragActive
            ? "border-[#FF8C42] bg-[#FF8C42]/5"
            : "border-[#564338] hover:border-[#a48c7f] hover:bg-[#1b110c]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleChange}
          className="hidden"
          id="json-upload"
        />

        {isImporting ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF8C42]/10">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF8C42]" />
            </div>
            <p className="text-sm text-[#a48c7f]">Importing posts...</p>
          </div>
        ) : (
          <label htmlFor="json-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#332822]">
                <Upload className="h-6 w-6 text-[#a48c7f]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#f2dfd5]">
                  Drop your JSON file here or click to browse
                </p>
                <p className="text-xs text-[#564338]">
                  Supports LinkedIn and YouTube exports from Savely
                </p>
              </div>
            </div>
          </label>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-5 rounded-2xl bg-[#1b110c] p-5 text-sm text-[#a48c7f]">
        <p className="font-medium text-[#ddc1b3] mb-3">
          How to export from Savely:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-[#564338]">
          <li>Open Savely extension on LinkedIn or YouTube</li>
          <li>Click &quot;JSON&quot; to export as JSON format</li>
          <li>Click &quot;Download&quot; to save the file</li>
          <li>Upload the file here</li>
        </ol>
      </div>
    </div>
  );
}
