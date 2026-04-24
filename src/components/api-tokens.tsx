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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Tokens
            </CardTitle>
            <CardDescription>
              Create tokens to sync data from the browser extension
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-2" />
              New Token
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Token</DialogTitle>
                <DialogDescription>
                  Create a new token to use with the browser extension. You will
                  only see the token once.
                </DialogDescription>
              </DialogHeader>

              {!createdToken ? (
                <>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Token Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Chrome Extension"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseCreate}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!newTokenName.trim() || createToken.isPending}
                    >
                      {createToken.isPending ? "Creating..." : "Create Token"}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <div className="space-y-4 py-4">
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Copy this token now. You won&apos;t be able to see it
                        again!
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background p-2 rounded border break-all">
                          {createdToken}
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCopy}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseCreate}>Done</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading tokens...</p>
        ) : tokens?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tokens yet. Create one to start syncing from the extension.
          </p>
        ) : (
          <div className="space-y-3">
            {tokens?.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.name}</span>
                    {token.expiresAt &&
                      new Date(token.expiresAt) < new Date() && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {formatDate(token.createdAt)} · Last used{" "}
                    {token.lastUsed ? formatDate(token.lastUsed) : "never"}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="icon" />}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Token</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{token.name}
                        &quot;? Any extensions using this token will stop
                        working.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteToken.mutate({ id: token.id })}
                        variant="destructive"
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
      </CardContent>
    </Card>
  );
}
