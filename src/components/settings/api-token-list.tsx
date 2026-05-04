"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

/** Token shape expected by the list component. */
interface Token {
  id: string;
  name: string;
  createdAt: Date;
  lastUsed: Date | null;
  expiresAt: Date | null;
}

/** Props for the ApiTokenList component. */
interface ApiTokenListProps {
  tokens: Token[];
  onDelete: (id: string) => void;
}

/** Formats a date for display, returning "Never" for null values. */
function formatDate(date: Date | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString();
}

/**
 * Displays a list of API tokens with delete confirmation.
 * Renders an empty state when no tokens exist.
 */
export function ApiTokenList({ tokens, onDelete }: ApiTokenListProps) {
  if (tokens.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#564338] py-10 text-center">
        <p className="text-sm text-[#564338]">
          No tokens yet. Create one to start syncing from the extension.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.map((token) => (
        <div
          key={token.id}
          className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.04)] bg-[#1b110c] p-4 transition-colors hover:bg-[#231914]"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-[#f2dfd5]">{token.name}</span>
              {token.expiresAt && new Date(token.expiresAt) < new Date() && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
                  Expired
                </span>
              )}
            </div>
            <div className="text-xs text-[#564338]">
              Created {formatDate(token.createdAt)} · Last used{" "}
              {token.lastUsed ? formatDate(token.lastUsed) : "never"}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#564338] hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialogContent className="border-[rgba(255,255,255,0.06)] bg-[#281d18]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#f2dfd5]">
                  Delete Token
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#a48c7f]">
                  Are you sure you want to delete &quot;{token.name}&quot;? Any
                  extensions using this token will stop working.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-[rgba(255,255,255,0.06)] bg-transparent text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(token.id)}
                  className="rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
