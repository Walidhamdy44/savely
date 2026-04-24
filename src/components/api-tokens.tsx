"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2, Check } from "lucide-react";

export function ApiTokens() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: tokens, isLoading } = useQuery(trpc.tokens.list.queryOptions());

  const createToken = useMutation(
    trpc.tokens.create.mutationOptions({
      onSuccess: (data) => {
        setCreatedToken(data.token);
        queryClient.invalidateQueries({
          queryKey: trpc.tokens.list.queryKey(),
        });
        toast.success("Token created successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteToken = useMutation(
    trpc.tokens.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tokens.list.queryKey(),
        });
        toast.success("Token deleted");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleCreate = () => {
    if (!newTokenName.trim()) return;
    createToken.mutate({ name: newTokenName.trim() });
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
    toast.success("Token copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setNewTokenName("");
    setCreatedToken(null);
    setCopied(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.04)] bg-[#281d18] p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-[#f2dfd5]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF8C42]/10">
              <Key className="h-4 w-4 text-[#FF8C42]" />
            </div>
            API Tokens
          </h2>
          <p className="text-sm text-[#a48c7f]">
            Create tokens to sync data from the browser extension
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 rounded-xl bg-[#FF8C42] text-[#532200] font-semibold hover:bg-[#FFB68D]">
                <Plus className="h-4 w-4" />
                New Token
              </Button>
            }
          />
          <DialogContent className="border-[rgba(255,255,255,0.06)] bg-[#281d18]">
            <DialogHeader>
              <DialogTitle className="text-[#f2dfd5]">
                Create API Token
              </DialogTitle>
              <DialogDescription className="text-[#a48c7f]">
                Create a new token to use with the browser extension. You will
                only see the token once.
              </DialogDescription>
            </DialogHeader>

            {!createdToken ? (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-[#a48c7f]">
                      Token Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Chrome Extension"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#1b110c] text-[#f2dfd5] placeholder:text-[#564338] focus:border-[#FF8C42]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={handleCloseCreate}
                    className="rounded-xl border-[rgba(255,255,255,0.06)] bg-transparent text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newTokenName.trim() || createToken.isPending}
                    className="rounded-xl bg-[#FF8C42] text-[#532200] font-semibold hover:bg-[#FFB68D]"
                  >
                    {createToken.isPending ? "Creating..." : "Create Token"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="rounded-2xl bg-[#1b110c] p-5">
                    <p className="text-sm text-[#a48c7f] mb-3">
                      Copy this token now. You won&apos;t be able to see it
                      again!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-[#332822] text-[#FFB68D] p-3 rounded-xl border border-[rgba(255,255,255,0.06)] break-all font-mono">
                        {createdToken}
                      </code>
                      <Button
                        size="icon"
                        onClick={handleCopy}
                        className="h-10 w-10 shrink-0 rounded-xl bg-[#FF8C42]/10 text-[#FF8C42] hover:bg-[#FF8C42]/20"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCloseCreate}
                    className="rounded-xl bg-[#FF8C42] text-[#532200] font-semibold hover:bg-[#FFB68D]"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Token list */}
      {isLoading ? (
        <p className="text-sm text-[#564338]">Loading tokens...</p>
      ) : tokens?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#564338] py-10 text-center">
          <p className="text-sm text-[#564338]">
            No tokens yet. Create one to start syncing from the extension.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens?.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.04)] bg-[#1b110c] p-4 transition-colors hover:bg-[#231914]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-medium text-[#f2dfd5]">
                    {token.name}
                  </span>
                  {token.expiresAt &&
                    new Date(token.expiresAt) < new Date() && (
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
                      Are you sure you want to delete &quot;{token.name}
                      &quot;? Any extensions using this token will stop working.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-[rgba(255,255,255,0.06)] bg-transparent text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteToken.mutate({ id: token.id })}
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
      )}
    </div>
  );
}
