"use client";

import { PenLine, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import type { PostNote } from "@/types/posts";

/** Props for the PostDetailNotes component. */
interface PostDetailNotesProps {
  postId: string;
  notes: PostNote[];
  onAddNote: (input: { postId: string; content: string }) => void;
  onDeleteNote: (input: { noteId: string }) => void;
  isAdding: boolean;
}

/** Formats a date into a relative "X days ago" string. */
function timeAgo(date: Date | string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/**
 * Notes section for a post detail view. Includes a textarea
 * for adding new notes and a list of existing notes with delete.
 */
export function PostDetailNotes({
  postId,
  notes,
  onAddNote,
  onDeleteNote,
  isAdding,
}: PostDetailNotesProps) {
  const [noteText, setNoteText] = useState("");

  /** Submits the current note text and clears the input on success. */
  function handleSave() {
    onAddNote({ postId, content: noteText.trim() });
    setNoteText("");
  }

  return (
    <>
      {/* Note input */}
      <div className="rounded-3xl bg-[#281d18] p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF8C42]/10">
            <PenLine className="h-4 w-4 text-[#FF8C42]" />
          </div>
          <h3 className="text-base font-semibold text-[#f2dfd5]">Your Notes</h3>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add your reflections or context here..."
          rows={4}
          className="w-full resize-y rounded-2xl bg-[#332822] px-5 py-4 text-sm leading-relaxed text-[#f2dfd5] placeholder:text-[#564338] outline-none transition-all focus:ring-2 focus:ring-[#FF8C42]/20"
        />
        {noteText.trim() && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isAdding}
              className="flex items-center gap-2 rounded-xl bg-[#FFB68D] px-6 py-2.5 text-sm font-semibold text-[#532200] transition-colors hover:bg-[#FFDBC9] disabled:opacity-50"
            >
              {isAdding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Note
            </button>
          </div>
        )}
      </div>

      {/* Saved notes list */}
      {notes.length > 0 && (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-3xl bg-[#231914] p-6">
              <div className="flex gap-4">
                <div className="w-1 shrink-0 rounded-full bg-[#FF8C42]/40" />
                <div className="flex-1 space-y-3">
                  <p className="text-sm italic leading-relaxed text-[#ddc1b3]">
                    &quot;{note.content}&quot;
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#564338]">
                      Drafted {timeAgo(note.createdAt)}
                    </span>
                    <button
                      onClick={() => onDeleteNote({ noteId: note.id })}
                      className="text-xs font-medium text-[#564338] hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
