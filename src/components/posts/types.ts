import type { SavedPost, PostNote } from "@/types/posts";

/** Props shared by all platform-specific detail view components. */
export interface PlatformViewProps {
  post: SavedPost;
  notes: PostNote[];
  onDelete: () => void;
  onAddNote: (input: { postId: string; content: string }) => void;
  onDeleteNote: (input: { noteId: string }) => void;
  isAddingNote: boolean;
}
