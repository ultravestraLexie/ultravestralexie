"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
  countsByStatus,
  createPipelineItem,
  dnaSourceFromPipeline,
  hasResults,
  loadPipelineState,
  nextStatus,
  prevStatus,
  savePipelineState,
  type PipelineItem,
  type PipelineResults,
  type PipelineStatus,
} from "@/lib/galaxy/pipeline";
import { HOOK_STYLES, fmtCount } from "@/lib/galaxy/dna";
import { toast } from "@/components/galaxy/ui";

/* CONTENT PIPELINE — the demo's "Content plan" board, copied into
 * the Studio (owner's order, 2026-11-23): every video tracked
 * through Scripting → Filming → Scheduled → Posted, with results
 * recorded once posted. Posted videos with results are what
 * Content DNA reads as "Your Ultra Vestra posts". Everything is
 * saved on this device only (localStorage "uv-content-pipeline"),
 * like the Studio draft above it. Nothing here posts anywhere. */

const PLATFORMS = ["TikTok", "Instagram", "YouTube"];

const BOARD_CSS = `
.pl-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:16px}
.pl-col{min-width:0}
.pl-col-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.pl-col-head h3{font-size:13px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-2);margin:0}
.pl-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:99px;background:rgba(255,255,255,.07);font-size:11.5px;font-weight:700;color:var(--ink-2)}
.pl-cards{display:flex;flex-direction:column;gap:10px}
.pl-card{border:1px solid var(--line);border-radius:16px;padding:13px;background:rgba(255,255,255,.03)}
.pl-title{font-weight:650;font-size:14.5px;line-height:1.35;overflow-wrap:anywhere}
.pl-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.pl-meta{font-size:12.5px;color:var(--ink-3);margin-top:8px;line-height:1.45}
.pl-views{font-size:13px;color:var(--ink-2);margin-top:8px}
.pl-views strong{color:var(--ink);font-size:15px}
.pl-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}
.pl-empty{font-size:13px;line-height:1.5;color:var(--ink-3);border:1px dashed var(--line);border-radius:14px;padding:12px}
@media (max-width: 860px){.pl-board{grid-template-columns:minmax(0,1fr)}}
`;

type DealOption = { id: string; label: string };

const todayLocal = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const numField = (v: string): number | undefined => {
  if (v.trim() === "") return undefined;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export default function PipelineSection({ deals }: { deals: DealOption[] }) {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const firstSave = useRef(true);

  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<PipelineStatus>("scripting");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [resultsId, setResultsId] = useState<string | null>(null);

  // Restore the board on mount (device-only).
  useEffect(() => {
    setItems(loadPipelineState().items);
    setLoaded(true);
  }, []);

  // Save on every change after the mount restore.
  useEffect(() => {
    if (!loaded) return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    savePipelineState({ v: 1, items });
  }, [items, loaded]);

  const counts = useMemo(() => countsByStatus(items), [items]);
  const dna = useMemo(() => dnaSourceFromPipeline(items), [items]);

  const patch = (id: string, p: Partial<PipelineItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const move = (item: PipelineItem, dir: 1 | -1) => {
    const target = dir === 1 ? nextStatus(item.status) : prevStatus(item.status);
    if (!target) return;
    const p: Partial<PipelineItem> = { status: target };
    if (target === "posted" && !item.postedDate) p.postedDate = todayLocal();
    patch(item.id, p);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editingId === id) setEditingId(null);
    if (resultsId === id) setResultsId(null);
  };

  const add = () => {
    const title = newTitle.trim();
    if (!title) return;
    const item = createPipelineItem(title, newStatus);
    if (newStatus === "posted") item.postedDate = todayLocal();
    setItems((prev) => [...prev, item]);
    setNewTitle("");
    toast("Video added to your pipeline.");
  };

  return (
    <section className="gx-panel" aria-label="Content pipeline" style={{ marginTop: 22 }}>
      <style>{BOARD_CSS}</style>
      <div className="gx-panel-head">
        <h2>Content pipeline</h2>
        <span className="gx-sub" style={{ margin: 0 }}>
          {items.length ? `${items.length} ${items.length === 1 ? "video" : "videos"}` : "Your own content"}
        </span>
      </div>
      <p className="gx-sub" style={{ marginTop: 0 }}>
        Every video you&apos;re making, from scripting to posted. When a video is posted, add its results — posted videos with results
        are what Content DNA reads as your Ultra Vestra posts.
      </p>

      {/* Add a video */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, alignItems: "flex-end" }}
      >
        <label className="gx-field" style={{ flex: "1 1 220px", marginBottom: 0 }}>
          <span>Add a video</span>
          <input
            className="gx-input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Video title"
            aria-label="New video title"
          />
        </label>
        <label className="gx-field" style={{ marginBottom: 0 }}>
          <span>Status</span>
          <select className="gx-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as PipelineStatus)} aria-label="New video status">
            {PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PIPELINE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="gx-btn gx-btn-primary" disabled={!newTitle.trim()}>
          Add video
        </button>
      </form>

      {items.length === 0 ? (
        <p className="pl-empty" style={{ marginTop: 16 }}>
          Nothing planned. Add your first video above and move it along as you script, film, schedule and post it.
        </p>
      ) : (
        <div className="pl-board">
          {PIPELINE_STATUSES.map((status) => {
            const group = items.filter((i) => i.status === status);
            return (
              <div key={status} className="pl-col">
                <div className="pl-col-head">
                  <h3>{PIPELINE_STATUS_LABELS[status]}</h3>
                  <span className="pl-count">{counts[status]}</span>
                </div>
                {group.length === 0 ? (
                  <p className="pl-empty">
                    {status === "posted"
                      ? "No posts in the last 30 days yet. Posted videos show their results here."
                      : `Nothing ${PIPELINE_STATUS_LABELS[status].toLowerCase()} right now.`}
                  </p>
                ) : (
                  <div className="pl-cards">
                    {group.map((item) => (
                      <article key={item.id} className="pl-card">
                        <p className="pl-title">{item.title}</p>
                        {(item.topic || item.format || item.platform) && (
                          <div className="pl-tags">
                            {item.topic && <span className="gx-pill gx-pill-fit">{item.topic}</span>}
                            {item.format && <span className="gx-pill">{item.format}</span>}
                            {item.platform && <span className="gx-pill">{item.platform}</span>}
                          </div>
                        )}
                        {item.dealLabel && <p className="pl-meta">Deal: {item.dealLabel}</p>}
                        {item.status === "posted" &&
                          (hasResults(item) ? (
                            <p className="pl-views">
                              <strong>{fmtCount(item.results?.views ?? 0)}</strong> views
                              {item.postedDate ? ` · posted ${item.postedDate}` : ""}
                            </p>
                          ) : (
                            <p className="pl-meta">
                              No results yet — add them so Content DNA can read this post.
                              {item.postedDate ? ` Posted ${item.postedDate}.` : ""}
                            </p>
                          ))}
                        <div className="pl-actions">
                          {prevStatus(item.status) && (
                            <button type="button" className="gx-btn gx-btn-sm gx-btn-quiet" onClick={() => move(item, -1)}>
                              ← {PIPELINE_STATUS_LABELS[prevStatus(item.status) as PipelineStatus]}
                            </button>
                          )}
                          {nextStatus(item.status) && (
                            <button type="button" className="gx-btn gx-btn-sm" onClick={() => move(item, 1)}>
                              Move to {PIPELINE_STATUS_LABELS[nextStatus(item.status) as PipelineStatus]} →
                            </button>
                          )}
                          {item.status === "posted" && (
                            <button
                              type="button"
                              className="gx-btn gx-btn-sm"
                              onClick={() => {
                                setResultsId(resultsId === item.id ? null : item.id);
                                setEditingId(null);
                              }}
                            >
                              {hasResults(item) ? "Edit results" : "Add results"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="gx-btn gx-btn-sm gx-btn-quiet"
                            onClick={() => {
                              setEditingId(editingId === item.id ? null : item.id);
                              setResultsId(null);
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="gx-btn gx-btn-sm gx-btn-quiet gx-btn-danger" onClick={() => remove(item.id)}>
                            Delete
                          </button>
                        </div>
                        {editingId === item.id && (
                          <EditForm
                            item={item}
                            deals={deals}
                            onCancel={() => setEditingId(null)}
                            onSave={(p) => {
                              patch(item.id, p);
                              setEditingId(null);
                            }}
                          />
                        )}
                        {resultsId === item.id && item.status === "posted" && (
                          <ResultsForm
                            item={item}
                            onCancel={() => setResultsId(null)}
                            onSave={(results, postedDate) => {
                              patch(item.id, { results, postedDate });
                              setResultsId(null);
                              toast("Results saved — Content DNA can read this post now.");
                            }}
                          />
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="gx-sub" style={{ marginTop: 16 }}>
        Saved on this device.
        {dna.enabled
          ? ` ${dna.count} posted ${dna.count === 1 ? "video" : "videos"} with results ${dna.count === 1 ? "is" : "are"} ready for Content DNA.`
          : " Once a posted video has results, Content DNA can read it under \u201CUse my Ultra Vestra posts.\u201D"}
      </p>
    </section>
  );
}

/* ---------- edit details ---------- */

function EditForm({
  item,
  deals,
  onSave,
  onCancel,
}: {
  item: PipelineItem;
  deals: DealOption[];
  onSave: (p: Partial<PipelineItem>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [topic, setTopic] = useState(item.topic);
  const [format, setFormat] = useState(item.format);
  const [platform, setPlatform] = useState(item.platform);
  const [lengthSec, setLengthSec] = useState(item.lengthSec != null ? String(item.lengthSec) : "");
  const [hookStyle, setHookStyle] = useState(item.hookStyle || "");
  const [dealId, setDealId] = useState(item.dealId || "");

  const platforms = PLATFORMS.includes(platform) ? PLATFORMS : [platform, ...PLATFORMS];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const deal = deals.find((d) => d.id === dealId);
        const len = numField(lengthSec);
        onSave({
          title: title.trim() || item.title,
          topic: topic.trim(),
          format: format.trim(),
          platform,
          lengthSec: len !== undefined ? Math.round(len) : null,
          hookStyle: hookStyle || undefined,
          dealId: deal ? deal.id : null,
          dealLabel: deal ? deal.label : undefined,
        });
      }}
      style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}
    >
      <label className="gx-field">
        <span>Title</span>
        <input className="gx-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="gx-row2">
        <label className="gx-field">
          <span>Topic</span>
          <input className="gx-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Skincare" />
        </label>
        <label className="gx-field">
          <span>Format</span>
          <input className="gx-input" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Before & after" />
        </label>
      </div>
      <div className="gx-row2">
        <label className="gx-field">
          <span>Platform</span>
          <select className="gx-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="gx-field">
          <span>Length (seconds)</span>
          <input className="gx-input" inputMode="numeric" value={lengthSec} onChange={(e) => setLengthSec(e.target.value)} placeholder="34" />
        </label>
      </div>
      <div className="gx-row2">
        <label className="gx-field">
          <span>Hook style</span>
          <select className="gx-input" value={hookStyle} onChange={(e) => setHookStyle(e.target.value)}>
            <option value="">Auto — from the title</option>
            {Object.keys(HOOK_STYLES).map((k) => (
              <option key={k} value={k}>
                {HOOK_STYLES[k].label}
              </option>
            ))}
          </select>
        </label>
        <label className="gx-field">
          <span>Brand deal (optional)</span>
          <select className="gx-input" value={dealId} onChange={(e) => setDealId(e.target.value)}>
            <option value="">No deal — my own content</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="gx-btn gx-btn-sm gx-btn-primary">
          Save changes
        </button>
        <button type="button" className="gx-btn gx-btn-sm gx-btn-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------- results (posted items) ---------- */

function ResultsForm({
  item,
  onSave,
  onCancel,
}: {
  item: PipelineItem;
  onSave: (results: PipelineResults, postedDate: string) => void;
  onCancel: () => void;
}) {
  const r = item.results;
  const [views, setViews] = useState(r ? String(r.views) : "");
  const [shares, setShares] = useState(r?.shares != null ? String(r.shares) : "");
  const [saves, setSaves] = useState(r?.saves != null ? String(r.saves) : "");
  const [comments, setComments] = useState(r?.comments != null ? String(r.comments) : "");
  const [likes, setLikes] = useState(r?.likes != null ? String(r.likes) : "");
  const [watchSec, setWatchSec] = useState(r?.watchSec != null ? String(r.watchSec) : "");
  const [clicks, setClicks] = useState(r?.clicks != null ? String(r.clicks) : "");
  const [sales, setSales] = useState(r?.sales != null ? String(r.sales) : "");
  const [postedDate, setPostedDate] = useState(item.postedDate || todayLocal());
  const [err, setErr] = useState("");

  const fields: [string, string, (v: string) => void][] = [
    ["Shares", shares, setShares],
    ["Saves", saves, setSaves],
    ["Comments", comments, setComments],
    ["Likes", likes, setLikes],
    ["Average watch (seconds)", watchSec, setWatchSec],
    ["Clicks", clicks, setClicks],
    ["Sales", sales, setSales],
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = numField(views);
        if (v === undefined) {
          setErr("Views is required — it's the number Content DNA reads first.");
          return;
        }
        const results: PipelineResults = { views: Math.round(v) };
        const put = (key: keyof PipelineResults, raw: string) => {
          const n = numField(raw);
          if (n !== undefined) results[key] = Math.round(n);
        };
        put("shares", shares);
        put("saves", saves);
        put("comments", comments);
        put("likes", likes);
        const w = numField(watchSec);
        if (w !== undefined) results.watchSec = w;
        put("clicks", clicks);
        put("sales", sales);
        onSave(results, postedDate || todayLocal());
      }}
      style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}
    >
      <div className="gx-row2">
        <label className="gx-field">
          <span>Views (required)</span>
          <input className="gx-input" inputMode="numeric" value={views} onChange={(e) => setViews(e.target.value)} placeholder="48200" />
        </label>
        <label className="gx-field">
          <span>Posted date</span>
          <input className="gx-input" type="date" value={postedDate} onChange={(e) => setPostedDate(e.target.value)} />
        </label>
      </div>
      <div className="gx-row2">
        {fields.slice(0, 2).map(([label, val, set]) => (
          <label key={label} className="gx-field">
            <span>{label}</span>
            <input className="gx-input" inputMode="numeric" value={val} onChange={(e) => set(e.target.value)} />
          </label>
        ))}
      </div>
      <div className="gx-row2">
        {fields.slice(2, 4).map(([label, val, set]) => (
          <label key={label} className="gx-field">
            <span>{label}</span>
            <input className="gx-input" inputMode="numeric" value={val} onChange={(e) => set(e.target.value)} />
          </label>
        ))}
      </div>
      <div className="gx-row2">
        {fields.slice(4, 6).map(([label, val, set]) => (
          <label key={label} className="gx-field">
            <span>{label}</span>
            <input className="gx-input" inputMode="numeric" value={val} onChange={(e) => set(e.target.value)} />
          </label>
        ))}
      </div>
      <label className="gx-field" style={{ maxWidth: "calc(50% - 6px)" }}>
        <span>{fields[6][0]}</span>
        <input className="gx-input" inputMode="numeric" value={fields[6][1]} onChange={(e) => fields[6][2](e.target.value)} />
      </label>
      {err && (
        <p style={{ color: "#f87171", fontSize: 13.5, margin: "0 0 10px" }} role="alert">
          {err}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="gx-btn gx-btn-sm gx-btn-primary">
          Save results
        </button>
        <button type="button" className="gx-btn gx-btn-sm gx-btn-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
