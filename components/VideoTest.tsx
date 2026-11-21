"use client";

import { useRef, useState } from "react";
import Link from "next/link";

/* THE FIVE BUYER TEST — VIDEO MODE (client).
 *
 * The owner's distinction, made real: the core Buyer Brain is a
 * script simulator. Here the creator brings the ACTUAL VIDEO.
 * Frames are extracted in the browser with canvas — the video file
 * itself never leaves the device; only 8 sampled still frames are
 * sent, and the creator sees the exact frame strip the five buyers
 * will "see" before anything is submitted. Transparency is part of
 * the feature.
 *
 * Honesty contract (matches the API): the buyers react to sampled
 * frames + the supplied script/transcript. No face-emotion
 * tracking, no retention prediction, no audio analysis. Without a
 * script, the buyers react to visuals only — and the UI says so. */

const FRAME_COUNT = 8;
const FRAME_MAX_WIDTH = 512;
const FRAME_QUALITY = 0.72;
/** Stay under the API's ~12MB payload ceiling. */
const MAX_PAYLOAD_CHARS = 11_500_000;

const buyerColors = [
  "from-fuchsia-500/20 to-transparent",
  "from-blue-500/20 to-transparent",
  "from-amber-500/20 to-transparent",
  "from-emerald-500/20 to-transparent",
  "from-violet-500/20 to-transparent",
];

const buyerIcons = ["♥", "◈", "⌕", "⚡", "✦"];

/* Static persona profiles — the owner's canon core questions,
 * identical to the script simulator's cards. */
const PERSONA_PROFILES: {
  match: string;
  question: string;
  who: string;
  cares: string;
  decides: string;
}[] = [
  {
    match: "emotional",
    question: "Will this make my life better?",
    who: "Buys the feeling first — the product is a path to a better version of their life.",
    cares: "Story, feeling, identity, transformation — they want to see themselves in the outcome.",
    decides: "Emotional payoff, backed by honest social proof.",
  },
  {
    match: "logical",
    question: "Does this actually work, and is it worth the price?",
    who: "Compares before they commit — value has to survive the math.",
    cares: "Specs, comparisons, value math, durability — what it does, and what it costs over time.",
    decides: "Evidence, plus a price that feels justified.",
  },
  {
    match: "skeptical",
    question: "Why should I believe you?",
    who: "Assumes every claim is marketing until it is proven otherwise.",
    cares: "Proof, reviews, guarantees, the fine print — everything a pitch might be hiding.",
    decides: "When the risk feels removed.",
  },
  {
    match: "impulse",
    question: "Do I want this right now?",
    who: "Decides in seconds — if it is not instantly clear, it is gone.",
    cares: "Novelty, simplicity, immediate benefit — the payoff has to land now.",
    decides: "Fast, when friction is low.",
  },
  {
    match: "conscious",
    question: "Do I really need this, and is it the right choice?",
    who: "Buys deliberately — every purchase has to earn its place.",
    cares: "Ingredients, sourcing, sustainability, long-term value — what it is, and what it costs the world.",
    decides: "Alignment with their values, plus transparency.",
  },
];

type Frame = { src: string; t: number };

type Persona = {
  name: string;
  personality: string;
  firstReaction: string;
  innerThought: string;
  interestScore: number;
  trustScore: number;
  desireScore: number;
  biggestObjection: string;
  missingEvidence: string;
  improvementSuggestion: string;
  outcome: string;
};

type VideoReport = {
  visualRead: {
    firstFrame: string;
    productVisibility: string;
    demonstrationClarity: string;
    onScreenText: string;
    pacingNotes: string;
    trustCues: string;
    callToAction: string;
  };
  personas: Persona[];
  overall: {
    biggestConversionBarrier: string;
    strongestElement: string;
    oneChangeFirst: string;
  };
};

function profileFor(name: string) {
  const n = name.toLowerCase();
  return PERSONA_PROFILES.find((p) => n.includes(p.match));
}

/* Per-buyer diagnostic lenses (owner's canon) — same as the script
 * simulator. Emotional has no separate lens by design. */
function lensFor(buyer: Persona): { lens: string; value: string } | null {
  const n = buyer.name.toLowerCase();
  if (n.includes("logical"))
    return { lens: "What information is missing", value: buyer.missingEvidence };
  if (n.includes("skeptical"))
    return { lens: "What proof is needed", value: buyer.missingEvidence };
  if (n.includes("impulse"))
    return { lens: "What grabs immediate attention", value: buyer.firstReaction };
  if (n.includes("conscious"))
    return { lens: "What could stop the purchase", value: buyer.biggestObjection };
  return null;
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("seek-timeout")),
      5000
    );
    const onSeeked = () => {
      clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}

/** Extract FRAME_COUNT stills, evenly across the duration, entirely
 * in the browser. The video file is never uploaded. */
async function extractFrames(
  file: File
): Promise<{ frames: Frame[]; duration: number }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("load-timeout")), 20000);
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () =>
        reject(new Error("This video format could not be read in the browser."));
    });

    const duration = video.duration;
    if (!duration || !isFinite(duration) || !video.videoWidth) {
      throw new Error("This video could not be read. Try an MP4 (H.264) export.");
    }

    const scale = Math.min(1, FRAME_MAX_WIDTH / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(2, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");

    const frames: Frame[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t = Math.min(
        (duration * (i + 0.5)) / FRAME_COUNT,
        Math.max(0, duration - 0.05)
      );
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({ src: canvas.toDataURL("image/jpeg", FRAME_QUALITY), t });
    }
    return { frames, duration };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function VideoTest() {
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(0);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [script, setScript] = useState("");

  const [report, setReport] = useState<VideoReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const runIdRef = useRef(0);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    const runId = ++runIdRef.current;
    setExtracting(true);
    setExtractError("");
    setError("");
    setReport(null);
    setFrames([]);
    setFileName(file.name);
    try {
      const { frames: extracted, duration: d } = await extractFrames(file);
      if (runId !== runIdRef.current) return; // superseded by a newer pick
      const payloadChars = extracted.reduce((s, f) => s + f.src.length, 0);
      if (payloadChars > MAX_PAYLOAD_CHARS) {
        setExtractError(
          "Those frames are too large to send. Please use a shorter or lower-resolution export of the video."
        );
        return;
      }
      setFrames(extracted);
      setDuration(d);
    } catch (e) {
      if (runId !== runIdRef.current) return;
      setExtractError(
        e instanceof Error
          ? e.message
          : "We couldn't pull frames from that video. Try an MP4 (H.264) export."
      );
    } finally {
      if (runId === runIdRef.current) setExtracting(false);
    }
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/buyer-brain/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          audience,
          price: price || "Not provided",
          script: script.trim(),
          durationSeconds: duration,
          frames: frames.map((f) => f.src),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (data && data.error) || "The video test could not be completed."
        );
      }
      setReport(data.report as VideoReport);
      setExpanded(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const visualRows: [string, string][] = report
    ? [
        ["THE OPENING SECONDS", report.visualRead.firstFrame],
        ["THE PRODUCT ON SCREEN", report.visualRead.productVisibility],
        ["THE DEMONSTRATION", report.visualRead.demonstrationClarity],
        ["CAPTIONS & ON-SCREEN TEXT", report.visualRead.onScreenText],
        ["PACING", report.visualRead.pacingNotes],
        ["TRUST CUES IN THE FOOTAGE", report.visualRead.trustCues],
        ["THE CALL TO ACTION", report.visualRead.callToAction],
      ]
    : [];

  const canRun =
    !loading &&
    !extracting &&
    frames.length > 0 &&
    product.trim().length >= 2 &&
    audience.trim().length >= 2;

  return (
    <div>
      {/* STEP 1 — THE VIDEO */}
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
        <div className="text-cyan-400 text-xs tracking-widest mb-3">
          STEP 01 / YOUR VIDEO
        </div>
        <h2 className="text-2xl font-bold mb-3">Bring the actual video.</h2>
        <p className="text-gray-400 mb-6 max-w-2xl">
          Pick your video file and we pull {FRAME_COUNT} still frames from it —
          right here in your browser. <strong className="text-gray-200">Your
          video file is never uploaded.</strong> Only the frames below are sent
          to the five buyers, exactly as you see them.
        </p>

        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a video file"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragOver
              ? "border-fuchsia-400 bg-fuchsia-500/10"
              : "border-white/20 hover:border-cyan-400/60 bg-black/30"
          }`}
        >
          <div className="text-4xl mb-3 text-cyan-300">▣</div>
          <p className="font-semibold">
            {fileName ? fileName : "Drop your video here, or click to choose"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            MP4 or WebM · frames are sampled evenly across the whole video
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {extracting && (
          <p className="text-cyan-300 text-sm mt-4 animate-pulse">
            Pulling frames from your video…
          </p>
        )}
        {extractError && (
          <p role="alert" className="text-red-400 text-sm mt-4">
            {extractError}
          </p>
        )}

        {frames.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <div className="text-xs tracking-widest text-cyan-400">
                THE FRAME STRIP — WHAT THE BUYERS WILL SEE
              </div>
              <div className="text-xs text-gray-500">
                {fileName} · {formatTime(duration)} long · {frames.length} frames
              </div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {frames.map((f, i) => (
                <figure key={i} className="rounded-lg overflow-hidden border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.src}
                    alt={`Frame ${i + 1} at ${formatTime(f.t)}`}
                    className="w-full h-auto block"
                  />
                  <figcaption className="text-[10px] text-gray-500 text-center py-1">
                    {i === 0 ? "OPENING · " : ""}
                    {formatTime(f.t)}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              These are stills, not the whole video — the buyers cannot hear
              your voice, music, or tone. What they react to is what is visible
              here, plus any script you add below.
            </p>
          </div>
        )}
      </section>

      {/* STEP 2 — CONTEXT */}
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-8">
        <div className="text-cyan-400 text-xs tracking-widest mb-3">
          STEP 02 / THE CONTEXT
        </div>
        <h2 className="text-2xl font-bold mb-6">Tell the buyers what this is.</h2>

        <div className="grid md:grid-cols-3 gap-5">
          <label className="text-sm text-gray-300">
            Product or service
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="What are you selling?"
              className="mt-2 w-full bg-[#020008] border border-white/10 rounded-xl p-4 text-white"
            />
          </label>
          <label className="text-sm text-gray-300">
            Target audience
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Who would buy this?"
              className="mt-2 w-full bg-[#020008] border border-white/10 rounded-xl p-4 text-white"
            />
          </label>
          <label className="text-sm text-gray-300">
            Product price
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Example: $29.99"
              className="mt-2 w-full bg-[#020008] border border-white/10 rounded-xl p-4 text-white"
            />
          </label>
        </div>

        <label className="block mt-7 text-sm text-gray-300">
          Script or transcript <span className="text-gray-500">(optional)</span>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={6}
            maxLength={8000}
            placeholder="Paste what is said in the video — voiceover, dialogue, your pitch…"
            className="mt-2 w-full bg-[#020008] border border-white/10 rounded-xl p-4 resize-y text-white"
          />
          <span className="block text-xs text-gray-500 mt-2">
            Without a script, the buyers react to your visuals only — they
            can&rsquo;t hear what you say. {script.length}/8000
          </span>
        </label>

        {error && (
          <p role="alert" className="text-red-400 text-sm mt-4">
            {error}
          </p>
        )}

        <button
          onClick={analyze}
          disabled={!canRun}
          className="neon-btn mt-6 w-full rounded-xl p-5 font-bold text-black bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 hover:opacity-90 disabled:opacity-40 transition"
        >
          {loading
            ? "THE FIVE BUYERS ARE WATCHING…"
            : frames.length === 0
              ? "ADD A VIDEO TO BEGIN"
              : "PUT IT IN FRONT OF THE FIVE BUYERS →"}
        </button>
      </section>

      {loading && (
        <div className="text-center py-16">
          <div className="text-4xl animate-pulse mb-4">◈</div>
          <h3 className="text-xl font-bold">The panel is watching your frames</h3>
          <p className="text-gray-400 mt-2">
            Five buyers, five different reactions…
          </p>
        </div>
      )}

      {report && (
        <section className="mt-12 space-y-8">
          {/* VISUAL VIDEO ANALYSIS */}
          <div>
            <div className="text-cyan-400 text-xs tracking-widest">
              THE REPORT / WHAT THE CAMERA SHOWED
            </div>
            <h2 className="text-3xl md:text-4xl font-black mt-3">
              VISUAL VIDEO ANALYSIS
            </h2>
            <p className="text-gray-400 mt-3 max-w-2xl">
              Before the buyers speak, here is what is actually in the footage —
              the opening seconds, the demonstration, the captions, the pacing,
              and the call to action.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {visualRows.map(([title, content]) => (
              <div
                key={title}
                className={`glass-card rounded-2xl border bg-white/[.04] p-5 ${
                  title === "THE CALL TO ACTION"
                    ? "border-cyan-400/40 md:col-span-2"
                    : "border-white/10"
                }`}
              >
                <div className="text-cyan-400 text-xs tracking-widest mb-3">
                  {title}
                </div>
                <p className="text-gray-200 leading-6">{content}</p>
              </div>
            ))}
          </div>

          {/* THE FIVE BUYERS */}
          <div>
            <div className="text-cyan-400 text-xs tracking-widest">
              THE REPORT / FIVE BUYERS, ONE VIDEO
            </div>
            <h2 className="text-3xl md:text-4xl font-black mt-3">
              THE FIVE BUYER MINDS — ON YOUR FOOTAGE
            </h2>
          </div>

          <div className="space-y-4">
            {report.personas.map((buyer, i) => (
              <div
                key={buyer.name}
                className={`rounded-2xl border border-white/10 bg-gradient-to-r ${buyerColors[i]} bg-[#111827] overflow-hidden`}
              >
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl text-cyan-300">{buyerIcons[i]}</div>
                    <div>
                      <h3 className="text-lg font-bold">{buyer.name}</h3>
                      <p className="text-sm text-gray-400">{buyer.personality}</p>
                      {lensFor(buyer) && (
                        <p className="text-xs text-cyan-300 mt-1">
                          Lens: {lensFor(buyer)?.lens}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-cyan-300 text-xl">
                    {expanded === i ? "−" : "+"}
                  </span>
                </button>

                {expanded === i && (
                  <div className="px-5 pb-6 space-y-5">
                    {(() => {
                      const prof = profileFor(buyer.name);
                      const lens = lensFor(buyer);
                      if (!prof) return null;
                      return (
                        <div className="p-4 rounded-xl bg-black/30">
                          <div className="text-xs text-cyan-300 mb-2">
                            THEIR CORE QUESTION
                          </div>
                          <p className="font-semibold text-gray-100 mb-3">
                            &ldquo;{prof.question}&rdquo;
                          </p>
                          <p className="text-sm text-gray-300 mb-3">{prof.who}</p>
                          <p className="text-sm text-gray-400">
                            <strong className="text-gray-200">
                              What they care about:
                            </strong>{" "}
                            {prof.cares}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            <strong className="text-gray-200">
                              What makes them decide:
                            </strong>{" "}
                            {prof.decides}
                          </p>
                          {lens && (
                            <p className="text-sm text-gray-300 mt-3 border-t border-white/10 pt-3">
                              <strong className="text-cyan-300">
                                Lens — {lens.lens}:
                              </strong>{" "}
                              {lens.value}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    <div className="p-4 rounded-xl bg-black/30">
                      <div className="text-xs text-cyan-300 mb-2">
                        FIRST REACTION TO YOUR VIDEO
                      </div>
                      {buyer.firstReaction}
                    </div>

                    <div className="p-4 rounded-xl bg-black/30">
                      <div className="text-xs text-cyan-300 mb-2">
                        INSIDE THEIR HEAD
                      </div>
                      <p className="italic text-gray-200">
                        &ldquo;{buyer.innerThought}&rdquo;
                      </p>
                    </div>

                    {(
                      [
                        ["INTEREST", buyer.interestScore],
                        ["TRUST", buyer.trustScore],
                        ["DESIRE", buyer.desireScore],
                      ] as [string, number][]
                    ).map(([label, score]) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-2">
                          <span>{label}</span>
                          <span className="text-cyan-300">{score}/100</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="space-y-3 text-sm">
                      <p>
                        <strong>Biggest objection:</strong> {buyer.biggestObjection}
                      </p>
                      <p>
                        <strong>Missing evidence:</strong> {buyer.missingEvidence}
                      </p>
                      <p>
                        <strong>What to change:</strong>{" "}
                        {buyer.improvementSuggestion}
                      </p>
                      <p>
                        <strong>Possible next action:</strong>{" "}
                        {buyer.outcome.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* OVERALL */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/[.04] border border-white/10 rounded-2xl p-5">
              <div className="text-cyan-400 text-xs tracking-widest mb-3">
                STRONGEST ELEMENT
              </div>
              <p className="text-gray-200">{report.overall.strongestElement}</p>
            </div>
            <div className="bg-white/[.04] border border-white/10 rounded-2xl p-5">
              <div className="text-cyan-400 text-xs tracking-widest mb-3">
                BIGGEST BARRIER
              </div>
              <p className="text-gray-200">
                {report.overall.biggestConversionBarrier}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-6">
            <div className="text-cyan-300 text-xs tracking-widest mb-3">
              THE ONE CHANGE TO MAKE FIRST
            </div>
            <p className="text-xl font-semibold text-gray-100">
              {report.overall.oneChangeFirst}
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Simulated buyer reactions based on sampled frames from your video
            and the script you provided — not real customer research or
            guaranteed sales predictions.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setReport(null);
                setExpanded(0);
              }}
              className="flex-1 border border-white/20 rounded-xl p-4 hover:bg-white/5"
            >
              RUN IT AGAIN
            </button>
            <Link
              href="/buyer-brain/conversion-lab"
              className="flex-1 text-center rounded-xl p-4 font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition"
            >
              TEST NEW VERSIONS IN THE CONVERSION LAB →
            </Link>
          </div>
        </section>
      )}

      {!report && (
        <p className="text-xs text-gray-500 text-center mt-8">
          Simulated buyer reactions based on sampled frames from your video and
          the script you provided — not real customer research or guaranteed
          sales predictions.
        </p>
      )}
    </div>
  );
}
