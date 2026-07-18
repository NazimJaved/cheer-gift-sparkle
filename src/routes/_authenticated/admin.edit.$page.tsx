import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  BLOCK_CATALOG,
  EDITABLE_PAGES,
  defaultBlock,
  loadDraft,
  publishBlocks,
  saveDraft,
  type Block,
  type BlockType,
} from "@/lib/page-blocks";
import { BlockRenderer } from "@/components/editor/block-renderer";
import { Inspector } from "@/components/editor/inspector";

export const Route = createFileRoute("/_authenticated/admin/edit/$page")({
  component: EditPage,
});

function EditPage() {
  const { page } = Route.useParams();
  const meta = EDITABLE_PAGES.find((p) => p.key === page);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadDraft(page).then((b) => setBlocks(b ?? []));
  }, [page]);

  const selectedBlock = useMemo(() => blocks?.find((b) => b.id === selected) ?? null, [blocks, selected]);

  function updateBlock(next: Block) {
    setBlocks((prev) => (prev ? prev.map((b) => (b.id === next.id ? next : b)) : prev));
  }
  function addBlock(type: BlockType) {
    const nb = defaultBlock(type);
    setBlocks((prev) => [...(prev ?? []), nb]);
    setSelected(nb.id);
    setShowAdd(false);
  }
  function removeBlock(id: string) {
    setBlocks((prev) => (prev ? prev.filter((b) => b.id !== id) : prev));
    if (selected === id) setSelected(null);
  }
  function move(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(idx, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }
  async function handleSaveDraft() {
    if (!blocks) return;
    setSaving(true);
    const { error } = await saveDraft(page, blocks);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("ড্রাফট সংরক্ষণ হয়েছে");
  }
  async function handlePublish() {
    if (!blocks) return;
    setPublishing(true);
    const { error } = await publishBlocks(page, blocks);
    setPublishing(false);
    if (error) toast.error(error.message);
    else toast.success("প্রকাশিত হয়েছে");
  }

  if (!meta) {
    return <div className="p-8 text-center text-muted-foreground">অজানা পেজ: {page}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> অ্যাডমিন
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">ভিজ্যুয়াল এডিটর — {meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ড্রাফট
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-60"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} প্রকাশ করুন
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: block list */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">সেকশন</span>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs hover:bg-secondary"
            >
              <Plus className="h-3 w-3" /> যোগ
            </button>
          </div>
          {showAdd ? (
            <div className="border-b border-border p-2">
              {BLOCK_CATALOG.map((b) => (
                <button
                  key={b.type}
                  onClick={() => addBlock(b.type)}
                  className="mb-1 w-full rounded border border-transparent px-2 py-1.5 text-left text-sm hover:border-teal hover:bg-teal/5"
                >
                  <div className="font-medium">{b.label}</div>
                  <div className="text-xs text-muted-foreground">{b.description}</div>
                </button>
              ))}
            </div>
          ) : null}
          <div className="p-2">
            {blocks === null ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> লোড...
              </div>
            ) : blocks.length === 0 ? (
              <div className="p-2 text-center text-xs text-muted-foreground">
                কোনো সেকশন নেই। "+ যোগ" চাপুন।
              </div>
            ) : (
              blocks.map((b, i) => {
                const catItem = BLOCK_CATALOG.find((c) => c.type === b.type);
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelected(b.id)}
                    className={`mb-1 flex items-center gap-1 rounded border px-2 py-1.5 text-sm ${selected === b.id ? "border-teal bg-teal/5" : "border-transparent hover:bg-secondary"}`}
                  >
                    <span className="flex-1 cursor-pointer truncate">{catItem?.label ?? b.type}</span>
                    <button onClick={(e) => { e.stopPropagation(); move(b.id, -1); }} disabled={i === 0} className="text-muted-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); move(b.id, 1); }} disabled={i === blocks.length - 1} className="text-muted-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("এই সেকশনটি মুছবেন?")) removeBlock(b.id); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center: preview */}
        <main className="flex-1 overflow-y-auto bg-muted/30" onClick={() => setSelected(null)}>
          <div className="mx-auto my-4 max-w-6xl overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            {blocks && blocks.length > 0 ? (
              <BlockRenderer blocks={blocks} onSelect={setSelected} selectedId={selected} />
            ) : (
              <div className="grid place-items-center py-32 text-sm text-muted-foreground">
                বাম দিক থেকে সেকশন যোগ করুন
              </div>
            )}
          </div>
        </main>

        {/* Right: inspector */}
        <aside className="w-80 shrink-0 border-l border-border bg-card">
          {selectedBlock ? (
            <Inspector block={selectedBlock} onChange={updateBlock} />
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              প্রিভিউ থেকে একটি সেকশন সিলেক্ট করুন
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}