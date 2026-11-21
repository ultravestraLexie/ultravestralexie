import type { Metadata } from "next";
import Link from "next/link";
import EmotionLab from "@/components/EmotionLab";
import HumanFirstCreator from "@/components/HumanFirstCreator";
import {
  FOUNDATION_QUESTIONS,
  AUDIENCE_SEGMENTS,
  DISCOVERY_ENGINE,
  OUTCOME_TYPES,
  CHAIN_EXAMPLE,
  QC_CHECKLIST,
} from "@/lib/humanfirst";
import {
  EMOTIONS,
  TEN_SECOND_STRUCTURE,
  OPENING_LINES,
  CONCEPTS,
  FORMULAS,
  CONVERSATION_TRIGGERS,
  COMMENT_LOOP,
  WATCH_TIME_TECHNIQUES,
  BUYING_JOURNEY,
  PRODUCT_VIDEO_IDEAS,
  SERIES,
  CREATOR_IDENTITY,
  CHALLENGE,
  SCORECARD,
  IMPROVEMENT_RULES,
  IDEA_GENERATOR,
  IDEA_PROMPTS,
  GOLDEN_RULES,
} from "@/lib/playbook";
import {
  FIRST_3_SECONDS,
  SELLING_FORMULA,
  FOUR_C,
  READY_SCRIPT,
  VIDEO_TIMELINE,
  KILLS_THE_SALE,
  MAKES_THE_SALE,
  LINE_FIXES,
  APP_PICKS_WINNERS,
  TESTING_LOOP,
  SHARE_REASONS,
  FEELINGS_TABLE,
  TROJAN_HORSE,
} from "@/lib/viralbase";

/* THE HUMAN EMOTION VIDEO PLAYBOOK — UltraVestra's signature resource.
 * People don't watch videos only because they want information. They
 * watch because they feel something. This page teaches creators how to
 * turn human emotions into videos people watch, finish, talk about,
 * share, remember and buy from — without manipulating viewers or
 * sacrificing trust. The interactive Lab sits up top; the complete
 * guide follows, structured under the ten search-friendly headings.
 * Source document: content/human-emotion-video-playbook.md. */

export const metadata: Metadata = {
  title: "The Ultimate Video Engagement Guide: Hooks, Emotions, Views, Comments & Sales | UltraVestra",
  description:
    "Learn how to make engaging videos people watch, enjoy, comment on, share, and buy from. Explore emotional storytelling, viral video hooks, product video ideas, watch-time strategies, creator engagement, and sales-focused content tips with UltraVestra.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/human-emotion-video-playbook",
  },
  openGraph: {
    title: "The Ultimate Video Engagement Guide: Hooks, Emotions, Views, Comments & Sales | UltraVestra",
    description:
      "Learn how to make engaging videos people watch, enjoy, comment on, share, and buy from. Explore emotional storytelling, viral video hooks, product video ideas, watch-time strategies, creator engagement, and sales-focused content tips with UltraVestra.",
    url: "https://ultra-vestra.vercel.app/creator-growth/human-emotion-video-playbook",
    type: "article",
  },
};

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const h2style: React.CSSProperties = { fontSize: 28, margin: "0 0 8px", letterSpacing: 0.4, fontWeight: 800 };
const h3style: React.CSSProperties = { fontSize: 20, margin: "22px 0 6px", fontWeight: 800, color: "#f0abfc" };
const sub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15.5 };
const body: React.CSSProperties = { color: "#f3e8ff", fontSize: 15.5, margin: "0 0 12px" };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };

const CONCEPT_GROUPS = [...new Set(CONCEPTS.map((c) => c.group))];

export default function PlaybookPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRAVESTRA CREATOR GROWTH CENTER · SIGNATURE RESOURCE
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Human Emotion Video Playbook
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 19, fontWeight: 700, margin: "0 auto 10px", maxWidth: 720 }}>
          Don&rsquo;t just make videos. Make people feel something.
        </p>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 700, fontSize: 16 }}>
          People don&rsquo;t watch videos only because they want information. They watch because they feel
          curiosity, excitement, surprise, happiness, desire, nostalgia, belonging — or the need to solve a
          problem. This Playbook is UltraVestra&rsquo;s complete system for how to make engaging videos:
          videos people want to watch, finish, talk about, share, remember, and sometimes buy from —
          without manipulating viewers or sacrificing trust.
        </p>
      </section>

      {/* HUMAN-FIRST — THE FIRST WORKING SCREEN */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE HUMAN-FIRST VIDEO INTELLIGENCE SYSTEM
        </span>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "12px 0 6px" }}>The human comes before the hook.</p>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 680, fontSize: 15.5 }}>
          Before UltraVestra helps anyone create a video, it helps them understand the human being they are
          trying to reach. Not just what product they are promoting, not just what platform they are posting
          on, not just what hook they want to use. First question, every time: who is this for, and what
          should that person get from watching?
        </p>
      </section>
      <HumanFirstCreator />

      {/* THE LAB */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">The Human Emotion Video Lab</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          The Playbook, turned into tools. Work the five labs, then read the full guide below.
        </p>
      </div>
      <EmotionLab />

      {/* 1 — THE BIG IDEA */}
      <section style={panel}>
        <h2 style={h2style}>How Human Emotions Make Videos More Engaging</h2>
        <p style={body}>A video can show a product and still be forgettable. A video can explain something and still lose people&rsquo;s attention. A video can have beautiful editing and still make nobody care. Why? Because people are human before they are viewers, customers, followers, or potential fans.</p>
        <p style={body}>People laugh. They wonder. They get hungry. They feel proud. They remember their childhood. They want to belong. They worry about wasting money. They love discovering something first. They want to feel understood. They want to see something beautiful, surprising, satisfying, useful, or genuinely funny.</p>
        <p style={body}><strong>The secret is not to put a product in front of people. The secret is to give people a reason to care about what they are watching.</strong> UltraVestra teaches creators to build videos around human emotions and human behavior. The goal is content that encourages people to:</p>
        <ol style={{ margin: "0 0 12px", paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {["Stop scrolling.", "Become curious.", "Keep watching.", "Smile, laugh, react, or feel something.", "Comment and join the conversation.", "Share the video with someone.", "Remember the creator.", "Trust the recommendation.", "Take action when the product or idea genuinely fits their needs.", "Return because they enjoy the creator's content."].map((item) => <li key={item}>{item}</li>)}
        </ol>
        <p style={{ ...body, margin: 0 }}>
          There is no guaranteed formula for viral views. But if you want to learn how to get more views on
          videos people actually finish, start with the human being on the other side of the screen. This
          Playbook lives inside the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>,
          alongside the Video Intelligence Lab that diagnoses your real videos.
        </p>

        <h3 style={h3style}>The first question: who are you making this for?</h3>
        <p style={body}>UltraVestra never treats an audience as simply &ldquo;everybody.&rdquo; A video about a skincare product, for example, could serve very different groups:</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>Audience group</th>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>What they may want</th>
              </tr>
            </thead>
            <tbody>
              {AUDIENCE_SEGMENTS.map((s) => (
                <tr key={s.label}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", fontWeight: 700, color: "#f3e8ff" }}>{s.label}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" }}>{s.want}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, marginTop: 12 }}>These are possible audience segments, not assumptions about every person in those groups. The creator must understand that the same product can require completely different stories for different audiences.</p>

        <h3 style={h3style}>The ten foundation questions</h3>
        <p style={body}>Before UltraVestra helps anyone create a video, it asks:</p>
        <ol style={{ margin: "0 0 12px", paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {FOUNDATION_QUESTIONS.map((q) => <li key={q}>{q}</li>)}
        </ol>

        <h3 style={h3style}>The Audience Emotion Discovery Engine</h3>
        <p style={body}>This identifies the human motivation behind the audience. For each audience, UltraVestra investigates:</p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {DISCOVERY_ENGINE.map((d) => <li key={d.area}><strong style={{ color: "#f0abfc" }}>{d.area}:</strong> {d.question}</li>)}
        </ul>
        <p style={body}>This becomes the foundation for the video.</p>

        <h3 style={h3style}>The Viewer Outcome Architect</h3>
        <p style={body}>Before writing a script, ask: what do you want the viewer to get from this video? There are different types of outcomes:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OUTCOME_TYPES.map((o) => (
            <p key={o.label} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{o.label}.</strong> <span style={{ color: "#f3e8ff" }}>{o.description}</span>
            </p>
          ))}
        </div>
        <p style={{ ...body, marginTop: 12 }}>A video can have several outcomes, but it should have one primary outcome.</p>

        <h3 style={h3style}>The Emotion-to-Outcome Connection</h3>
        <p style={body}>This is the heart of the system. UltraVestra connects:</p>
        <p style={{ ...card, textAlign: "center", fontWeight: 800, fontSize: 16.5, color: "#f0abfc" }}>
          Audience → Human need → Emotion → Video experience → Viewer outcome → Next action
        </p>
        <p style={{ ...body, marginTop: 14 }}>{CHAIN_EXAMPLE.intro}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {([
            ["Audience", CHAIN_EXAMPLE.audience],
            ["Human need", CHAIN_EXAMPLE.humanNeed],
            ["Emotion", CHAIN_EXAMPLE.emotions],
            ["Video experience", CHAIN_EXAMPLE.videoExperience],
            ["Viewer outcome", CHAIN_EXAMPLE.viewerOutcome],
            ["Next action", CHAIN_EXAMPLE.nextAction],
          ] as [string, string][]).map(([k, v]) => (
            <p key={k} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#67e8f9" }}>{k}:</strong> <span style={{ color: "#f3e8ff" }}>{v}</span>
            </p>
          ))}
        </div>
        <p style={{ ...body, marginTop: 12 }}>This is much stronger than simply saying, &ldquo;Make a video about this kitchen appliance.&rdquo; The Human-First Video Creator at the top of this page builds exactly this chain from your answers.</p>

        <h3 style={h3style}>Quality control: never generate a video before understanding its purpose</h3>
        <p style={body}>Before a script is generated, UltraVestra checks:</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>Question</th>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>What a strong answer looks like</th>
              </tr>
            </thead>
            <tbody>
              {QC_CHECKLIST.map(([q, strong]) => (
                <tr key={q}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", fontWeight: 700, color: "#f3e8ff" }}>{q}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" }}>{strong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul style={{ margin: "12px 0 0", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>If the creator says &ldquo;everyone,&rdquo; UltraVestra helps narrow the audience.</li>
          <li>If the creator says &ldquo;get views,&rdquo; UltraVestra asks what kind of viewers they want to attract and what those viewers should gain.</li>
          <li>If the creator says &ldquo;make them buy,&rdquo; UltraVestra asks what information would help those people make an informed decision.</li>
        </ul>

        <h3 style={h3style}>The signature UltraVestra philosophy</h3>
        <p style={body}><strong>The human comes before the hook.</strong></p>
        <p style={body}>A hook without an audience is just a sentence. An emotion without a purpose is just a feeling. A video without a viewer benefit is just content. UltraVestra connects all three.</p>
        <p style={body}><strong>Understand the person. Understand the purpose. Design the experience. Deliver the value.</strong></p>
        <p style={{ ...body, margin: 0 }}>This is the rule behind the Emotion DNA Scanner, the Attention Mastery Lab, the Script Studio, the Retention Repair Shop, and every video-generation feature: the first question in every UltraVestra video tool is, &ldquo;Who is this for, and what should that person get from watching?&rdquo;</p>
      </section>

      {/* 2 — THE 15 EMOTIONS */}
      <section style={panel}>
        <h2 style={h2style}>15 Emotions That Make People Connect With Videos</h2>
        <p style={sub}>A strong creator learns to recognize emotions and turn them into creative ideas. Each emotion below comes with video ideas, the creator technique behind it, and the comment invitation that starts the conversation.</p>
        {EMOTIONS.map((e, i) => (
          <div key={e.name}>
            <h3 style={h3style}>{i + 1}. {e.name}: {e.tagline}</h3>
            <p style={body}>{e.why}</p>
            <p style={{ ...body, marginBottom: 6 }}><strong style={{ color: "#67e8f9" }}>Video ideas:</strong></p>
            <ul style={{ margin: "0 0 10px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
              {e.videoIdeas.map((idea) => <li key={idea}>{idea}</li>)}
            </ul>
            <p style={body}><strong style={{ color: "#f0abfc" }}>Creator technique:</strong> {e.technique}</p>
            <p style={{ ...body, marginBottom: 4 }}><strong style={{ color: "#f0abfc" }}>Comment invitation:</strong> &ldquo;{e.commentInvitation}&rdquo;</p>
          </div>
        ))}
      </section>

      {/* 3 — STOP SCROLLING */}
      <section style={panel}>
        <h2 style={h2style}>How to Make People Stop Scrolling</h2>
        <p style={body}>The opening seconds should give viewers a reason to stop scrolling. A creator does not need to shout, dance, or use exaggerated reactions — the opening needs to create a meaningful reason to watch. The Playbook calls it the 10-Second Attention Engine:</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {TEN_SECOND_STRUCTURE.map(([step, text]) => (
            <div key={step} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14.5, color: "#67e8f9" }}>{step}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#f3e8ff" }}>{text}</p>
            </div>
          ))}
        </div>

        <h3 style={h3style}>The First 3 Seconds Decide the Video</h3>
        <p style={body}>The tactical layer comes from Lexie Viral Base 1, a study of 27 real selling videos — and it is even stricter: what you do in the first 3 seconds makes or breaks the video. Plan these 3 seconds before anything else.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {FIRST_3_SECONDS.steps.map(([step, text]) => (
            <div key={step} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14.5, color: "#67e8f9" }}>{step}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#f3e8ff" }}>{text}</p>
            </div>
          ))}
        </div>
        <p style={{ ...body, marginTop: 14 }}><strong>{FIRST_3_SECONDS.rule}</strong></p>
        <p style={body}>{FIRST_3_SECONDS.lesson}</p>
        <p style={{ ...body, marginBottom: 6 }}><strong style={{ color: "#67e8f9" }}>From the videos — what the winners do in their own first 3 seconds:</strong></p>
        <ul style={{ margin: "0 0 10px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {FIRST_3_SECONDS.patterns.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <p style={{ ...body, margin: 0 }}>{FIRST_3_SECONDS.movementRule}</p>
      </section>

      {/* 4 — 25 HOOKS */}
      <section style={panel}>
        <h2 style={h2style}>25 Video Hooks That Create Curiosity</h2>
        <p style={body}>The best video hooks for creators are the ones that open a question, promise an answer, and start proving it within seconds. Here are the Playbook&rsquo;s 25 powerful opening lines — draw one in the Hook Laboratory above, then make it yours:</p>
        <ol style={{ margin: 0, paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 6 }}>
          {OPENING_LINES.map((line) => <li key={line}>&ldquo;{line}&rdquo;</li>)}
        </ol>
      </section>

      {/* 5 — 30 IDEAS + FORMULAS + IDEA GENERATOR */}
      <section style={panel}>
        <h2 style={h2style}>30 Creative Video Ideas for Content Creators</h2>
        <p style={sub}>These concepts are designed to help creators move beyond ordinary product presentations — six studios of video ideas for content creators who want to be remembered, not just watched.</p>
        {CONCEPT_GROUPS.map((group) => (
          <div key={group}>
            <h3 style={h3style}>{group}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CONCEPTS.filter((c) => c.group === group).map((c, i) => (
                <p key={c.title} style={{ margin: 0, fontSize: 15.5 }}>
                  <strong style={{ color: "#f0abfc" }}>{CONCEPTS.indexOf(c) + 1}. {c.title}.</strong>{" "}
                  <span style={{ color: "#f3e8ff" }}>{c.description}</span>
                </p>
              ))}
            </div>
          </div>
        ))}

        <h3 style={h3style}>The UltraVestra Video Formulas</h3>
        <p style={body}>A creator should not have to guess how to turn an idea into a complete video. Use these five repeatable structures — then build the finished script in the <Link href="/studio" style={linkStyle}>Video Script Studio</Link>.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FORMULAS.map((f) => (
            <div key={f.id} style={card}>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 16, color: "#f0abfc" }}>{f.name}</p>
              <ol style={{ margin: "0 0 10px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 3 }}>
                {f.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
              <p style={{ margin: 0, fontSize: 15, whiteSpace: "pre-line", color: "#ddd0ff" }}><strong style={{ color: "#67e8f9" }}>Example:</strong>{"\n"}{f.example}</p>
            </div>
          ))}
        </div>

        <h3 style={h3style}>The UltraVestra Creator Idea Generator</h3>
        <p style={body}>Before filming, use this creative formula:</p>
        <p style={{ ...card, textAlign: "center", fontWeight: 800, fontSize: 17, color: "#f0abfc" }}>{IDEA_GENERATOR.formula}</p>
        {IDEA_GENERATOR.examples.map((ex, i) => (
          <div key={i} style={{ marginTop: 12 }}>
            {ex.map(([k, v]) => (
              <p key={k} style={{ margin: "0 0 3px", fontSize: 15.5 }}><strong style={{ color: "#67e8f9" }}>{k}:</strong> <span style={{ color: "#f3e8ff" }}>{v}</span></p>
            ))}
          </div>
        ))}
        <p style={{ ...body, marginTop: 16 }}><strong>20 creative prompts for the next video:</strong></p>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {IDEA_PROMPTS.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>

      {/* 6 — WATCH TIME + SCORECARD + IMPROVEMENT RULE */}
      <section style={panel}>
        <h2 style={h2style}>How to Increase Video Watch Time</h2>
        <p style={body}>A video needs more than a strong opening — it needs a reason to keep watching. Watch time is retention by another name, and how to improve video retention is mostly the discipline of giving viewers a fresh reason to stay in every section. The Playbook&rsquo;s 12 techniques:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {WATCH_TIME_TECHNIQUES.map(([name, text], i) => (
            <p key={name} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{i + 1}. {name}.</strong> <span style={{ color: "#f3e8ff" }}>{text}</span>
            </p>
          ))}
        </div>

        <h3 style={h3style}>The UltraVestra Video Performance Scorecard</h3>
        <p style={body}>Creators should learn to measure the right things:</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>Goal</th>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>What to examine</th>
              </tr>
            </thead>
            <tbody>
              {SCORECARD.map(([goal, examine]) => (
                <tr key={goal}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", fontWeight: 700, color: "#f3e8ff" }}>{goal}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" }}>{examine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={h3style}>The improvement rule</h3>
        <p style={body}>Don&rsquo;t change everything after every upload. Identify one weakness and test one improvement:</p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {IMPROVEMENT_RULES.map(([symptom, fix]) => <li key={symptom}><strong>{symptom},</strong> {fix.charAt(0).toLowerCase() + fix.slice(1)}</li>)}
        </ul>
        <p style={body}>Use the analytics available on each platform. Metrics and definitions vary between platforms, so compare like with like. The Audience Reaction Lab above turns any of these symptoms into its fix.</p>

        <h3 style={h3style}>How the App Picks Winners</h3>
        <p style={body}>{APP_PICKS_WINNERS.intro} The Viral Base breaks the mechanism into three steps:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {APP_PICKS_WINNERS.steps.map(([name, text], i) => (
            <p key={name} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{i + 1}. {name}.</strong> <span style={{ color: "#f3e8ff" }}>{text}</span>
            </p>
          ))}
        </div>
        <p style={{ ...body, marginTop: 12 }}>{APP_PICKS_WINNERS.trend}</p>
        <p style={{ ...body, margin: 0 }}><strong>Watch two numbers:</strong> {TESTING_LOOP.watchNumbers[0].toLowerCase()} — and {TESTING_LOOP.watchNumbers[1].toLowerCase()}. Find your strongest hooks and make more like them.</p>

        <h3 style={h3style}>Test Small Changes Until One Jumps</h3>
        <p style={body}>{TESTING_LOOP.intro}</p>
        <ol style={{ margin: "0 0 12px", paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 5 }}>
          {TESTING_LOOP.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {TESTING_LOOP.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </section>

      {/* 7 — COMMENTS */}
      <section style={panel}>
        <h2 style={h2style}>How to Get More Meaningful Comments</h2>
        <p style={body}>A comment is more likely when a video gives someone something meaningful to respond to. Don&rsquo;t just say &ldquo;comment below&rdquo; — give viewers a real reason to join. The Playbook&rsquo;s 20 conversation triggers:</p>
        <ol style={{ margin: "0 0 6px", paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 6 }}>
          {CONVERSATION_TRIGGERS.map((t) => <li key={t}>&ldquo;{t}&rdquo;</li>)}
        </ol>
        <h3 style={h3style}>The comment-to-content loop</h3>
        <p style={body}>This is one of the best ways to build a community:</p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {COMMENT_LOOP.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <p style={{ ...body, margin: 0 }}>The audience starts to feel that its participation matters. A creator is no longer simply broadcasting — the creator is building a conversation.</p>
      </section>

      {/* 8 — TRUST / BUYING */}
      <section style={panel}>
        <h2 style={h2style}>How to Make Product Videos That Build Trust</h2>
        <p style={body}>Selling should not feel like interrupting the viewer with an advertisement. The best product videos help someone understand whether a product is right for them — that is how to make product videos that sell: through helpfulness, not pressure. Start with a product worth trusting: research it in <Link href="/brands" style={linkStyle}>Brand Intelligence</Link> and find your next opportunity in the <Link href="/discover" style={linkStyle}>Opportunity Finder</Link>. Then walk the viewer through the 7-stage trust-based buying journey:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BUYING_JOURNEY.map(([stage, text], i) => (
            <p key={stage} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>Stage {i + 1}: {stage}.</strong> <span style={{ color: "#f3e8ff" }}>{text}</span>
            </p>
          ))}
        </div>
        <h3 style={h3style}>10 product video ideas that sell through helpfulness</h3>
        <ol style={{ margin: "0 0 12px", paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 6 }}>
          {PRODUCT_VIDEO_IDEAS.map((idea) => <li key={idea}>&ldquo;{idea}&rdquo;</li>)}
        </ol>

        <h3 style={h3style}>The Selling Formula: Stop the Scroll, Show the Value, Give the Cue</h3>
        <p style={body}>Helpfulness earns the click; structure earns the sale. Lexie Viral Base 1 — built from 27 real selling videos — gives every product video three parts, each with one job, in this order:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {SELLING_FORMULA.map((s) => (
            <div key={s.stage} style={card}>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 16, color: "#f0abfc" }}>{s.stage}. {s.name} <span style={{ color: "#67e8f9", fontWeight: 700 }}>— {s.aka}</span></p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
                {s.tactics.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ ...card, marginTop: 14, fontWeight: 700, color: "#f0abfc" }}>On urgency, the Viral Base rule matches ours word for word: a real reason to act now — low stock, a live discount, a coupon that ends soon — <strong>only if it is true.</strong></p>

        <h3 style={h3style}>The 4 C Check</h3>
        <p style={body}>Run every selling video through the four Cs before you post:</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {FOUR_C.map(([name, text]) => (
            <div key={name} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14.5, color: "#67e8f9" }}>{name}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#f3e8ff" }}>{text}</p>
            </div>
          ))}
        </div>

        <h3 style={h3style}>A Ready Script: I Was Skeptical, But…</h3>
        <p style={body}>One script the selling videos return to again and again — doubt first, proof second, a clear cue last:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {READY_SCRIPT.parts.map(([name, text], i) => (
            <p key={name} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{i + 1}. {name}.</strong> <span style={{ color: "#f3e8ff" }}>{text}</span>
            </p>
          ))}
        </div>
        <p style={{ ...body, marginTop: 12 }}><strong style={{ color: "#67e8f9" }}>From the videos — two product videos that do all three:</strong> {READY_SCRIPT.examples}</p>

        <h3 style={h3style}>One Video, Start to Finish</h3>
        <p style={body}>The same three parts with rough timings, for a 30 to 45 second video. Bend it to fit the product:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {VIDEO_TIMELINE.map(([time, name, text]) => (
            <p key={time} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#67e8f9" }}>{time} — {name}.</strong> <span style={{ color: "#f3e8ff" }}>{text}</span>
            </p>
          ))}
        </div>

        <h3 style={h3style}>What Kills the Sale, What Makes It</h3>
        <p style={body}>Several of the 27 videos compare a video that sells with one that doesn&rsquo;t. Side by side, the difference looks like this:</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          <div style={card}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 15, color: "#fda4af" }}>✕ What kills the sale</p>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 4 }}>
              {KILLS_THE_SALE.map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>
          <div style={card}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 15, color: "#6ee7b7" }}>✓ What makes the sale</p>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 4 }}>
              {MAKES_THE_SALE.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        </div>

        <h3 style={h3style}>Fix a Weak Line</h3>
        <p style={body}>One clip was nothing but swaps like these. Another put it in one line: the hook is not about you, it is about the viewer.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>Skip this</th>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>Say this</th>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>The move</th>
              </tr>
            </thead>
            <tbody>
              {LINE_FIXES.map(([skip, say, move]) => (
                <tr key={skip}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" }}>&ldquo;{skip}&rdquo;</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", fontWeight: 700, color: "#f3e8ff" }}>&ldquo;{say}&rdquo;</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" }}>{move}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ ...body, margin: "16px 0 0" }}><strong>Important:</strong> Creators should disclose affiliate links and paid partnerships clearly, make honest claims, and never invent product results or personal experiences.</p>
      </section>

      {/* 9 — FANS / SERIES */}
      <section style={panel}>
        <h2 style={h2style}>How to Turn Viewers Into Loyal Fans</h2>
        <p style={body}>One video can earn attention. A recognizable series gives people a reason to return. The Playbook&rsquo;s 15 series that can turn viewers into fans:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SERIES.map(([name, text], i) => (
            <p key={name} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{i + 1}. {name}:</strong> <span style={{ color: "#f3e8ff" }}>{text}</span>
            </p>
          ))}
        </div>
        <h3 style={h3style}>How to build a recognizable creator identity</h3>
        <p style={body}>Choose a repeatable style:</p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {CREATOR_IDENTITY.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <p style={body}>People should eventually recognize the creator before they even see the username. The <Link href="/academy" style={linkStyle}>Creator Academy</Link> turns each of these skills into a working lesson.</p>

        <h3 style={h3style}>Why People Hit Share</h3>
        <p style={body}><strong>When we care, we share.</strong> The Viral Base borrows the six reasons people pass things on from Jonah Berger&rsquo;s <em>Contagious</em> — the same forces that turn a viewer into someone who brings you new viewers:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SHARE_REASONS.map((r) => (
            <p key={r.name} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{r.name} — &ldquo;{r.quote}&rdquo;</strong> <span style={{ color: "#f3e8ff" }}>{r.text}</span>
            </p>
          ))}
        </div>
        <p style={{ ...body, marginTop: 12 }}><strong>Feelings first.</strong> Curiosity gets the click. Frustration makes them see the problem. Amazement makes the fix stick, and makes them share it:</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>What the viewer feels</th>
                <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" }}>What the viewer thinks</th>
              </tr>
            </thead>
            <tbody>
              {FEELINGS_TABLE.map(([feeling, thought]) => (
                <tr key={feeling}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", fontWeight: 700, color: "#f3e8ff" }}>{feeling}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" }}>&ldquo;{thought}&rdquo;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, marginTop: 12 }}><strong>The biggest mistake:</strong> working hard on the message and forgetting the feeling. If a video makes people feel nothing, nobody shares it. And yes — bad feelings work too: people share more in a good mood and in a bad mood, because sharing is one way people deal with what they feel. The goal is not just a view. The goal is &ldquo;I never thought about it that way!&rdquo;</p>

        <h3 style={h3style}>Hide the Brand Inside a Story</h3>
        <p style={body}>{TROJAN_HORSE.intro}</p>
        <p style={{ ...body, marginBottom: 6 }}><strong style={{ color: "#67e8f9" }}>From the videos — how the best-selling ones do it:</strong></p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {TROJAN_HORSE.tactics.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p style={{ ...card, margin: 0, fontWeight: 700, color: "#f0abfc" }}>{TROJAN_HORSE.trustLine}</p>
      </section>

      {/* 10 — CHALLENGE + GOLDEN RULES + FINAL MESSAGE */}
      <section style={panel}>
        <h2 style={h2style}>The 7-Day Video Creation Challenge</h2>
        <p style={sub}>A practical challenge for creators who want to improve — one emotion, one video, every day.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CHALLENGE.days.map(([day, title, task]) => (
            <p key={day} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{day} — {title}.</strong> <span style={{ color: "#f3e8ff" }}>{task}</span>
            </p>
          ))}
        </div>
        <h3 style={h3style}>The challenge review</h3>
        <p style={body}>After seven days, compare:</p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
          {CHALLENGE.review.map((q) => <li key={q}>{q}</li>)}
        </ul>
        <p style={body}>Do not judge everything by views alone. The right audience, meaningful conversations, trust, and returning viewers matter too.</p>

        <h3 style={h3style}>The UltraVestra Golden Rules</h3>
        <ol style={{ margin: "0 0 6px", paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 5 }}>
          {GOLDEN_RULES.map((r) => <li key={r}>{r}</li>)}
        </ol>

        <h3 style={h3style}>The Final UltraVestra Message</h3>
        <p style={body}>A great creator does more than show people something. A great creator makes someone curious enough to stop. Makes someone smile when they needed it. Makes someone laugh at a moment they recognize. Makes someone hungry to try something. Makes someone feel understood. Makes someone think differently. Makes someone confident enough to try. Makes someone trust a recommendation. And sometimes, makes someone discover a product that genuinely improves their life.</p>
        <p style={body}><strong>Views bring people to the video. Emotion gives them a reason to care. Value gives them a reason to trust. Community gives them a reason to return.</strong></p>
        <p style={{ ...body, margin: 0 }}>
          That is the UltraVestra approach: <strong>Don&rsquo;t just create content people see. Create
          experiences people feel, remember, discuss, and want to come back to.</strong> Have a question
          about your next video? <Link href="/ask" style={linkStyle}>Ask UltraVestra</Link>.
        </p>
      </section>
    </div>
  );
}
