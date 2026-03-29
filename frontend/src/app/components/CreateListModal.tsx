import { useState, useEffect } from "react";
import { X, Loader2, List } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (listId: string) => void;
}

export function CreateListModal({ isOpen, onClose, onCreated }: CreateListModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setTitle(""); setDescription(""); setError(null); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          createdBy: user?.displayName ?? "Anonymous",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create list");
      onCreated(data.list.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] w-full max-w-md mx-4 z-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-[#5b9dd9]" />
            <span className="text-white font-bold text-base">Create a List</span>
          </div>
          <button onClick={onClose} className="text-[#666666] hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-[#999999] uppercase tracking-wide">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My favourite jazz albums"
              required
              maxLength={120}
              className="bg-[#252525] border-[#333333] text-white placeholder:text-[#555555] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#999999] uppercase tracking-wide">
              Description <span className="text-[#555555]">(optional)</span>
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this list about?"
              rows={3}
              maxLength={500}
              className="w-full bg-[#252525] border border-[#333333] text-white placeholder:text-[#555555] text-sm px-3 py-2 rounded-sm resize-none outline-none focus:border-[#5b9dd9] transition-colors"
            />
            <p className="text-[10px] text-[#444444] text-right">{description.length}/500</p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#333333] text-[#999999] hover:text-white hover:bg-[#252525] rounded-sm h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-9 font-medium disabled:opacity-40"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
              ) : "Create List"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
