"use client";

import { useState } from "react";
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
import { Copy, Plus, Check } from "lucide-react";
import { toast } from "sonner";

/** Props for the ApiTokenCreateDialog component. */
interface ApiTokenCreateDialogProps {
  onCreate: (name: string) => Promise<{ token: string }>;
  isPending: boolean;
}

/**
 * Dialog for creating a new API token with copy-to-clipboard support.
 * Shows the token value once after creation and allows copying.
 */
export function ApiTokenCreateDialog({
  onCreate,
  isPending,
}: ApiTokenCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /** Resets dialog state on close. */
  function handleClose() {
    setIsOpen(false);
    setTokenName("");
    setCreatedToken(null);
    setCopied(false);
  }

  /** Creates a token and stores the result for display. */
  async function handleCreate() {
    if (!tokenName.trim()) return;
    const result = await onCreate(tokenName.trim());
    setCreatedToken(result.token);
  }

  /** Copies the created token to the clipboard. */
  async function handleCopy() {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
    toast.success("Token copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <DialogTitle className="text-[#f2dfd5]">Create API Token</DialogTitle>
          <DialogDescription className="text-[#a48c7f]">
            Create a new token to use with the browser extension. You will only
            see the token once.
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
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#1b110c] text-[#f2dfd5] placeholder:text-[#564338] focus:border-[#FF8C42]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-xl border-[rgba(255,255,255,0.06)] bg-transparent text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!tokenName.trim() || isPending}
                className="rounded-xl bg-[#FF8C42] text-[#532200] font-semibold hover:bg-[#FFB68D]"
              >
                {isPending ? "Creating..." : "Create Token"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-2xl bg-[#1b110c] p-5">
                <p className="text-sm text-[#a48c7f] mb-3">
                  Copy this token now. You won&apos;t be able to see it again!
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
                onClick={handleClose}
                className="rounded-xl bg-[#FF8C42] text-[#532200] font-semibold hover:bg-[#FFB68D]"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
