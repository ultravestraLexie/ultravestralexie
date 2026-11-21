import type { Metadata } from "next";
import Link from "next/link";
import EmotionLab from "@/components/EmotionLab";
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

      {/* THE LAB */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">The Human Emotion Video Lab</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          The Playbook, turned into tools. Work the four labs, then read the full guide below.
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
        <p style={{ ...body, margin: 0 }}>Use the analytics available on each platform. Metrics and definitions vary between platforms, so compare like with like. The Audience Reaction Lab above turns any of these symptoms into its fix.</p>
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
        <p style={{ ...body, margin: 0 }}><strong>Important:</strong> Creators should disclose affiliate links and paid partnerships clearly, make honest claims, and never invent product results or personal experiences.</p>
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
        <p style={{ ...body, margin: 0 }}>People should eventually recognize the creator before they even see the username. The <Link href="/academy" style={linkStyle}>Creator Academy</Link> turns each of these skills into a working lesson.</p>
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
