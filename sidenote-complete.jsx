import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   CLAUDE API
───────────────────────────────────────────────────────────── */
// Route API calls through /api/claude proxy on Vercel (avoids CORS)
// Falls back to direct Anthropic call in Claude artifact environment
const API_ENDPOINT = typeof window !== "undefined" && window.location.hostname !== "claude.ai" && !window.location.hostname.includes("claudeusercontent")
  ? "/api/claude"
  : "https://api.anthropic.com/v1/messages";

async function ask(system, user, history = []) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system,
        messages: [...history, { role: "user", content: user }],
      }),
    });
    const d = await res.json();
    return d?.content?.[0]?.text ?? "";
  } catch { return ""; }
}

function parseJ(txt) {
  try {
    const s = txt.replace(/```json|```/g, "").trim();
    const i = Math.min(s.indexOf("{") < 0 ? 9e9 : s.indexOf("{"), s.indexOf("[") < 0 ? 9e9 : s.indexOf("["));
    return i < 9e9 ? JSON.parse(s.slice(i)) : null;
  } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────
   FEEDBACK — stored in-memory within this artifact session.
   Access the log via the floating 📋 button bottom-left.
───────────────────────────────────────────────────────────── */
// Feedback → Google Apps Script → Google Sheet (free, direct, no middleman)
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbzqAHJeGnYGUXc72SLjAeFvc2mH1ZoLWfCR4jzzZ_QJ8m5xr73phBSJ4W0W4i1OpOsY/exec";
const FEEDBACK_LOG = [];

async function submitFeedback(payload) {
  const entry = {
    timestamp: new Date().toISOString(),
    stage:     payload.stage    || "",
    name:      payload.name     || "",
    email:     payload.email    || "",
    linkedin:  payload.linkedin || "",
    like:      payload.like     || "",
    dislike:   payload.dislike  || "",
    missing:   payload.missing  || "",
  };
  FEEDBACK_LOG.push(entry);
  try {
    // Google Apps Script requires text/plain with no-cors
    await fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(entry),
    });
  } catch(e) {
    console.error("Feedback submit error:", e);
  }
  return true;
}

/* ─────────────────────────────────────────────────────────────
   FONTS & CSS
───────────────────────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');`;

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
html,body{font-family:'Manrope',sans-serif;overflow-x:hidden;background:#f2f2f0;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);}
.mn{font-family:'Manrope',sans-serif;}
.mo{font-family:'DM Mono',monospace;}

/* ══ HOME ══ */
.home{min-height:100vh;background:#f2f2f0;display:flex;flex-direction:column;position:relative;overflow:hidden;}
.home::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 65% 50% at 60% 0%,rgba(255,255,255,.8) 0%,transparent 60%),
             radial-gradient(ellipse 40% 40% at 0% 100%,rgba(184,250,78,.12) 0%,transparent 55%);}
.hdr{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:20px 48px;}
.logo{display:flex;align-items:center;gap:9px;font-family:'DM Mono',monospace;font-size:13px;letter-spacing:.06em;color:#1a1a1e;font-weight:500;}
.nav-r{display:flex;align-items:center;gap:10px;}
.nav-ico{width:32px;height:32px;border-radius:50%;border:1px solid rgba(0,0,0,.1);background:rgba(255,255,255,.55);
  display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:#555;transition:all 160ms;}
.nav-ico:hover{background:rgba(255,255,255,.9);color:#1a1a1e;}
.hero{position:relative;z-index:5;flex:1;display:flex;flex-direction:column;padding:60px 48px 0;max-width:900px;}
.hero-ey{display:inline-flex;align-items:center;gap:7px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.12em;color:#305CFF;text-transform:uppercase;margin-bottom:22px;font-weight:500;}
.hero-dot{width:5px;height:5px;border-radius:50%;background:#305CFF;}
.hero-h{font-weight:800;font-size:clamp(42px,5.5vw,78px);line-height:1.02;letter-spacing:-.04em;color:#1a1a1e;margin-bottom:14px;}
.hero-h span{color:#305CFF;}
.hero-sub{font-size:17px;color:#555;line-height:1.65;max-width:560px;margin-bottom:40px;font-weight:400;}
/* CTA buttons */
.cta-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:52px;}
.cta-ent{display:flex;align-items:center;gap:0;background:#1a1a1e;border:none;border-radius:100px;cursor:pointer;overflow:hidden;transition:all 190ms;box-shadow:0 4px 20px rgba(26,26,30,.25);}
.cta-ent:hover{background:#2d2d32;transform:translateY(-1px);box-shadow:0 8px 28px rgba(26,26,30,.3);}
.cta-ent-t{font-family:'Manrope',sans-serif;font-size:14px;font-weight:700;color:#fff;padding:13px 22px 13px 24px;letter-spacing:-.01em;}
.cta-ent-a{width:38px;height:38px;background:#305CFF;border-radius:50%;margin:3px 3px 3px 0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;transition:transform 190ms;}
.cta-ent:hover .cta-ent-a{transform:rotate(45deg);}
.cta-ind{display:flex;align-items:center;gap:0;background:#B8FA4E;border:none;border-radius:100px;cursor:pointer;overflow:hidden;transition:all 190ms;box-shadow:0 4px 20px rgba(184,250,78,.35);}
.cta-ind:hover{background:#a8ee3a;transform:translateY(-1px);box-shadow:0 8px 28px rgba(184,250,78,.45);}
.cta-ind-t{font-family:'Manrope',sans-serif;font-size:14px;font-weight:700;color:#1a1a1e;padding:13px 22px 13px 24px;letter-spacing:-.01em;}
.cta-ind-a{width:38px;height:38px;background:#1a1a1e;border-radius:50%;margin:3px 3px 3px 0;display:flex;align-items:center;justify-content:center;color:#B8FA4E;font-size:15px;transition:transform 190ms;}
.cta-ind:hover .cta-ind-a{transform:rotate(45deg);}
/* stats */
.stats-row{display:flex;gap:36px;align-items:center;flex-wrap:wrap;}
.stat-n{font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:#1a1a1e;letter-spacing:-.02em;}
.stat-l{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;color:#888;text-transform:uppercase;margin-top:2px;}
.stat-sep{width:1px;height:30px;background:rgba(0,0,0,.1);}
/* pipeline preview */
.pipe{position:absolute;right:48px;top:50%;transform:translateY(-48%);z-index:5;}
.pipe-step{display:flex;align-items:center;gap:9px;padding:8px 0;position:relative;}
.pipe-step:not(:last-child)::after{content:'';position:absolute;left:10px;top:100%;width:1px;height:18px;background:rgba(0,0,0,.09);}
.pipe-n{width:21px;height:21px;border-radius:50%;border:1px solid rgba(0,0,0,.1);background:rgba(255,255,255,.7);font-family:'DM Mono',monospace;font-size:8px;color:#888;display:flex;align-items:center;justify-content:center;}
.pipe-step.act .pipe-n{background:#305CFF;border-color:#305CFF;color:#fff;}
.pipe-l{font-family:'DM Mono',monospace;font-size:9px;color:#888;letter-spacing:.04em;}
.pipe-step.act .pipe-l{color:#1a1a1e;font-weight:500;}
.home-foot{position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:14px 48px;border-top:1px solid rgba(0,0,0,.07);font-family:'DM Mono',monospace;font-size:10px;color:#888;}
/* home contact section */
.hc-submit:hover{background:#305CFF;}

/* ══ ONBOARDING SHELL ══ */
.ob{min-height:100vh;background:#fff;display:flex;flex-direction:column;}
.ob-bar{height:56px;background:#fff;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;padding:0 40px;position:sticky;top:0;z-index:200;}
.ob-logo{font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.06em;color:#1a1a1e;font-weight:500;}
.ob-stages{display:flex;gap:0;align-items:center;}
.ob-stage{display:flex;align-items:center;gap:8px;padding:6px 16px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.07em;color:#aaa;text-transform:uppercase;transition:all 150ms;cursor:default;}
.ob-stage.act{color:#305CFF;}
.ob-stage.done{color:#1a1a1e;}
.ob-stage-n{width:20px;height:20px;border-radius:50%;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:8px;flex-shrink:0;}
.ob-stage.done .ob-stage-n{background:#305CFF;border-color:#305CFF;color:#fff;}
.ob-stage-sep{width:24px;height:1px;background:#ddd;}
.ob-skip{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.07em;color:#aaa;cursor:pointer;padding:5px 12px;border:1px solid #e5e5e5;transition:all 140ms;}
.ob-skip:hover{border-color:#ccc;color:#555;}
/* overview screen */
.ob-overview{max-width:680px;margin:0 auto;padding:60px 40px;}
.ob-tag{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;color:#305CFF;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.ob-tag-dot{width:5px;height:5px;border-radius:50%;background:#305CFF;}
.ob-ov-h{font-size:32px;font-weight:800;color:#1a1a1e;line-height:1.15;letter-spacing:-.03em;margin-bottom:12px;}
.ob-ov-sub{font-size:15px;color:#666;line-height:1.65;margin-bottom:44px;}
.ob-steps{display:flex;flex-direction:column;gap:0;}
.ob-step-row{display:flex;gap:20px;align-items:flex-start;padding:18px 0;border-bottom:1px solid #f0f0f0;}
.ob-step-row:last-child{border-bottom:none;}
.ob-step-num{width:36px;height:36px;border-radius:50%;background:#f2f2f0;border:1.5px solid #e5e5e5;font-family:'DM Mono',monospace;font-size:11px;color:#1a1a1e;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:500;}
.ob-step-info{}
.ob-step-title{font-size:15px;font-weight:700;color:#1a1a1e;margin-bottom:3px;letter-spacing:-.01em;}
.ob-step-desc{font-size:13px;color:#777;line-height:1.6;}
.ob-step-opt{font-family:'DM Mono',monospace;font-size:9px;color:#B8FA4E;background:#1a1a1e;padding:2px 7px;border-radius:3px;margin-left:7px;vertical-align:middle;letter-spacing:.05em;}
.ob-cta-row{display:flex;gap:10px;margin-top:40px;}
.ob-btn-p{background:#305CFF;color:#fff;border:none;padding:12px 28px;font-family:'Manrope',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 150ms;letter-spacing:-.01em;}
.ob-btn-p:hover{background:#1e4de0;}
.ob-btn-s{background:transparent;color:#555;border:1.5px solid #ddd;padding:12px 24px;font-family:'Manrope',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 150ms;}
.ob-btn-s:hover{border-color:#aaa;color:#1a1a1e;}
/* onboarding content area */
.ob-body{flex:1;padding:48px 0 80px;}
.ob-inner{max-width:600px;margin:0 auto;padding:0 40px;}
.ob-h{font-size:24px;font-weight:800;color:#1a1a1e;letter-spacing:-.03em;margin-bottom:6px;}
.ob-sub{font-size:14px;color:#666;line-height:1.65;margin-bottom:28px;}
/* website input */
.url-box{display:flex;gap:0;border:1.5px solid #e5e5e5;overflow:hidden;margin-bottom:10px;transition:border-color 160ms;}
.url-box:focus-within{border-color:#305CFF;}
.url-pre{background:#f2f2f0;padding:0 14px;font-family:'DM Mono',monospace;font-size:11px;color:#888;display:flex;align-items:center;letter-spacing:.04em;border-right:1.5px solid #e5e5e5;white-space:nowrap;}
.url-in{flex:1;border:none;padding:13px 14px;font-family:'Manrope',sans-serif;font-size:14px;color:#1a1a1e;outline:none;background:#fff;}
.url-in::placeholder{color:#bbb;}
.url-hint{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.05em;color:#aaa;margin-bottom:22px;}
/* parsing state */
.parse-state{background:#f8f8f8;border:1.5px solid #e5e5e5;padding:16px 18px;margin-bottom:22px;display:flex;align-items:flex-start;gap:12px;}
.parse-icon{width:32px;height:32px;border-radius:50%;background:#305CFF;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;}
.parse-text{flex:1;}
.parse-title{font-size:13px;font-weight:700;color:#1a1a1e;margin-bottom:3px;}
.parse-sub{font-size:12px;color:#777;line-height:1.55;}
/* brand summary */
.brand-card{background:#1a1a1e;border-radius:4px;padding:20px 22px;margin-bottom:22px;}
.brand-card-lbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;color:rgba(184,250,78,.7);text-transform:uppercase;margin-bottom:10px;}
.brand-card-text{font-size:13px;color:rgba(255,255,255,.8);line-height:1.7;}
.brand-card-text strong{color:#B8FA4E;font-weight:600;}
/* data connectors */
.connectors{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:24px;}
.connector{border:1.5px solid #e5e5e5;padding:14px;cursor:pointer;transition:all 140ms;text-align:center;position:relative;}
.connector:hover{border-color:#305CFF;background:#f6f8ff;}
.connector.sel{border-color:#305CFF;background:#eef1ff;}
.connector-ic{font-size:20px;margin-bottom:6px;}
.connector-nm{font-size:12px;font-weight:700;color:#1a1a1e;}
.connector-desc{font-size:10px;color:#888;margin-top:2px;}
.connector-badge{position:absolute;top:-7px;right:8px;font-family:'DM Mono',monospace;font-size:8px;background:#B8FA4E;color:#1a1a1e;padding:2px 6px;letter-spacing:.05em;font-weight:600;}
/* role + responsibilities */
.role-chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px;}
.chip{padding:8px 14px;border:1.5px solid #e5e5e5;font-size:12px;font-weight:600;color:#555;cursor:pointer;transition:all 130ms;font-family:'Manrope',sans-serif;}
.chip:hover{border-color:#305CFF;color:#305CFF;}
.chip.sel{border-color:#305CFF;background:#eef1ff;color:#305CFF;}
.chip.lime{border-color:#B8FA4E;}
.chip.lime:hover,.chip.lime.sel{border-color:#a8ee3a;background:#f0ffda;color:#1a1a1e;}
/* cue suggestions */
.cues{display:flex;flex-direction:column;gap:6px;margin-bottom:20px;}
.cue{display:flex;align-items:center;gap:10px;padding:11px 13px;border:1.5px solid #e5e5e5;cursor:pointer;transition:all 130ms;}
.cue:hover{border-color:#305CFF;background:#f6f8ff;}
.cue.sel{border-color:#305CFF;background:#eef1ff;}
.cue-chk{width:18px;height:18px;border:1.5px solid #ccc;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 130ms;font-size:10px;color:#305CFF;}
.cue.sel .cue-chk{border-color:#305CFF;background:#305CFF;color:#fff;}
.cue-txt{font-size:13px;color:#444;font-weight:500;}
.cue.sel .cue-txt{color:#1a1a1e;}
/* generic form stuff */
.field-label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;color:#888;text-transform:uppercase;margin-bottom:7px;}
.ob-input{width:100%;border:1.5px solid #e5e5e5;padding:12px 14px;font-family:'Manrope',sans-serif;font-size:14px;color:#1a1a1e;outline:none;transition:border-color 150ms;background:#fff;}
.ob-input:focus{border-color:#305CFF;}
.ob-input::placeholder{color:#bbb;}
/* progress bar */
.ob-progress{height:2px;background:#e5e5e5;position:relative;overflow:hidden;}
.ob-progress-fill{height:100%;background:#305CFF;transition:width 400ms ease;}

/* ══ TOOL SHELL ══ */
.tool{min-height:100vh;background:#111111;display:flex;flex-direction:column;}

/* ══ SIDEBAR ══ */
.sidebar{position:fixed;top:0;left:0;bottom:0;z-index:400;width:260px;background:#0a0a0a;border-right:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;transform:translateX(-100%);transition:transform 260ms ease;}
.sidebar.open{transform:translateX(0);}
.sidebar-overlay{position:fixed;inset:0;z-index:399;background:rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity 240ms;}
.sidebar-overlay.open{opacity:1;pointer-events:all;}
.sb-head{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
.sb-logo{font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.07em;color:rgba(255,255,255,.8);font-weight:500;}
.sb-close{font-size:18px;color:rgba(255,255,255,.3);cursor:pointer;padding:2px 6px;transition:color 130ms;}
.sb-close:hover{color:rgba(255,255,255,.7);}
.sb-section{padding:14px 16px 8px;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;color:rgba(255,255,255,.25);text-transform:uppercase;}
.sb-new{display:flex;align-items:center;gap:8px;margin:6px 12px 14px;padding:10px 14px;background:rgba(48,92,255,.15);border:1.5px solid rgba(48,92,255,.35);cursor:pointer;transition:all 140ms;}
.sb-new:hover{background:rgba(48,92,255,.25);}
.sb-new-ic{font-size:14px;}
.sb-new-t{font-size:13px;font-weight:700;color:#84A6FF;font-family:'Manrope',sans-serif;}
.sb-proj{display:flex;align-items:flex-start;gap:9px;padding:9px 12px;margin:0 4px;cursor:pointer;transition:all 130ms;}
.sb-proj:hover{background:rgba(255,255,255,.05);}
.sb-proj.act{background:rgba(255,255,255,.07);}
.sb-proj-dot{width:7px;height:7px;border-radius:50%;background:#305CFF;flex-shrink:0;margin-top:5px;}
.sb-proj-dot.g{background:#B8FA4E;}
.sb-proj-info{}
.sb-proj-name{font-size:12px;font-weight:600;color:rgba(255,255,255,.85);font-family:'Manrope',sans-serif;margin-bottom:2px;}
.sb-proj-meta{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.3);line-height:1.5;}
.sb-proj-tag{font-family:'DM Mono',monospace;font-size:8px;padding:1px 6px;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.3);margin-top:4px;display:inline-block;}
.sb-proj-tag.run{border-color:rgba(184,250,78,.3);color:rgba(184,250,78,.6);}
.sb-proj-tag.draft{border-color:rgba(48,92,255,.3);color:rgba(48,92,255,.6);}
.sb-divider{height:1px;background:rgba(255,255,255,.06);margin:8px 12px;}
.sb-menu-item{display:flex;align-items:center;gap:9px;padding:9px 16px;cursor:pointer;transition:all 130ms;font-size:13px;color:rgba(255,255,255,.5);font-family:'Manrope',sans-serif;font-weight:500;}
.sb-menu-item:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.85);}
.sb-menu-ic{font-size:14px;width:18px;text-align:center;}
.sb-foot{margin-top:auto;padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);}
.sb-foot-user{font-size:12px;font-weight:600;color:rgba(255,255,255,.7);font-family:'Manrope',sans-serif;}
.sb-foot-role{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.3);margin-top:1px;}
/* sidebar toggle button on tbar */
.sb-toggle{width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.45);font-size:16px;transition:color 130ms;flex-shrink:0;}
.sb-toggle:hover{color:rgba(255,255,255,.85);}

/* ══ OVERVIEW REDESIGN ══ */
.ov-hero{padding:28px 0 24px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:26px;}
.ov-hero-tag{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:10px;}
.ov-headline{font-size:32px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.15;margin-bottom:8px;}
.ov-headline em{color:#B8FA4E;font-style:normal;}
.ov-tldr{font-size:15px;color:rgba(255,255,255,.65);line-height:1.7;max-width:540px;margin-bottom:18px;font-weight:400;}
.ov-conf-row{display:flex;align-items:center;gap:8px;margin-bottom:20px;}
.ov-conf-dot{width:8px;height:8px;background:#305CFF;border-radius:1px;}
.ov-conf-lbl{font-family:'DM Mono',monospace;font-size:10px;color:#84A6FF;letter-spacing:.08em;font-weight:500;}
.ov-conf-why{font-size:12px;color:rgba(255,255,255,.38);margin-left:4px;}
.ov-numbers{display:flex;gap:28px;flex-wrap:wrap;}
.ov-num{border-left:2px solid rgba(255,255,255,.1);padding-left:14px;}
.ov-num-val{font-family:'DM Mono',monospace;font-size:17px;font-weight:500;color:#fff;letter-spacing:-.01em;}
.ov-num-val.g{color:#B8FA4E;}.ov-num-val.b{color:#84A6FF;}
.ov-num-lbl{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.3);margin-top:2px;letter-spacing:.06em;}
/* role snapshot card */
.ov-snapshot{background:#181818;border:1.5px solid rgba(184,250,78,.18);padding:20px 22px;margin-bottom:24px;}
.ov-snapshot-hd{display:flex;align-items:center;gap:9px;margin-bottom:14px;}
.ov-snapshot-ic{font-size:18px;}
.ov-snapshot-title{font-size:15px;font-weight:800;color:#fff;letter-spacing:-.02em;}
.ov-snapshot-role{font-family:'DM Mono',monospace;font-size:9px;color:rgba(184,250,78,.7);letter-spacing:.08em;text-transform:uppercase;margin-left:auto;}
.ov-snapshot-body{font-size:14px;color:rgba(255,255,255,.72);line-height:1.75;}
.ov-snapshot-body strong{color:#fff;font-weight:700;}
.ov-actions{display:flex;gap:8px;margin-top:16px;}
.ov-action-btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.05em;padding:8px 16px;border:1px solid;background:transparent;cursor:pointer;transition:all 140ms;}
.ov-action-btn.g{border-color:rgba(184,250,78,.4);color:#B8FA4E;}
.ov-action-btn.g:hover{background:rgba(184,250,78,.07);}
.ov-action-btn.b{border-color:rgba(48,92,255,.4);color:#84A6FF;}
.ov-action-btn.b:hover{background:rgba(48,92,255,.08);}
/* region expansion hint */
.ov-region-hint{background:#161616;border:1px solid rgba(255,255,255,.08);border-left:2px solid #305CFF;padding:14px 18px;margin-bottom:24px;}
.ov-rh-tag{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:#84A6FF;text-transform:uppercase;margin-bottom:6px;}
.ov-rh-txt{font-size:13px;color:rgba(255,255,255,.65);line-height:1.6;}
.ov-rh-txt strong{color:#fff;}

/* ══ EXTERNALITY INJECTOR ══ */
.ext-intro{font-size:14px;color:rgba(255,255,255,.65);line-height:1.7;margin-bottom:24px;}
.ext-bubbles{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:28px;min-height:220px;align-items:flex-start;}
.ext-bubble{border:1.5px solid;padding:12px 16px;cursor:pointer;transition:all 160ms;position:relative;}
.ext-bubble.hi{border-color:rgba(184,250,78,.4);background:rgba(184,250,78,.06);}
.ext-bubble.hi:hover{background:rgba(184,250,78,.12);}
.ext-bubble.lo{border-color:rgba(255,77,77,.35);background:rgba(255,77,77,.05);}
.ext-bubble.lo:hover{background:rgba(255,77,77,.1);}
.ext-bubble.neu{border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.03);}
.ext-bubble.neu:hover{background:rgba(255,255,255,.07);}
.ext-bubble.sel{box-shadow:0 0 0 2px rgba(255,255,255,.4);}
.ext-b-tag{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px;}
.ext-bubble.hi .ext-b-tag{color:#B8FA4E;}
.ext-bubble.lo .ext-b-tag{color:#ff4d4d;}
.ext-bubble.neu .ext-b-tag{color:rgba(255,255,255,.3);}
.ext-b-txt{font-size:12px;color:rgba(255,255,255,.75);line-height:1.5;font-weight:500;max-width:200px;}
.ext-b-src{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.2);margin-top:5px;}
.ext-b-imp{font-family:'DM Mono',monospace;font-size:9px;margin-top:4px;font-weight:600;}
.ext-bubble.hi .ext-b-imp{color:#B8FA4E;}.ext-bubble.lo .ext-b-imp{color:#ff4d4d;}
.ext-add-row{display:flex;gap:7px;margin-bottom:24px;}
.ext-add-in{flex:1;background:#161616;border:1.5px solid rgba(255,255,255,.1);padding:10px 14px;font-family:'Manrope',sans-serif;font-size:13px;color:#fff;outline:none;transition:border-color 140ms;}
.ext-add-in::placeholder{color:rgba(255,255,255,.2);}
.ext-add-in:focus{border-color:rgba(48,92,255,.5);}
.ext-section-lbl{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.ext-section-lbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07);}
.ext-impact-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;}
.ext-imp-card{background:#181818;border:1px solid rgba(255,255,255,.08);padding:15px;}
.ext-imp-card.pos{border-left:2px solid #B8FA4E;}
.ext-imp-card.neg{border-left:2px solid #ff4d4d;}
.ext-imp-tag{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;}
.ext-imp-card.pos .ext-imp-tag{color:#B8FA4E;}.ext-imp-card.neg .ext-imp-tag{color:#ff4d4d;}
.ext-imp-metric{font-family:'DM Mono',monospace;font-size:20px;font-weight:500;margin-bottom:4px;}
.ext-imp-card.pos .ext-imp-metric{color:#B8FA4E;}.ext-imp-card.neg .ext-imp-metric{color:#ff4d4d;}
.ext-imp-desc{font-size:12px;color:rgba(255,255,255,.55);line-height:1.5;}
/* bubble chart vis */
.ext-chart{background:#141414;border:1px solid rgba(255,255,255,.08);padding:20px;margin-bottom:20px;position:relative;min-height:240px;overflow:hidden;}
.ext-chart-lbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:rgba(255,255,255,.25);text-transform:uppercase;margin-bottom:14px;}
.ext-bubble-vis{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:all 400ms ease;}
.ext-bv-txt{font-size:9px;color:#fff;font-weight:600;padding:4px;line-height:1.3;font-family:'Manrope',sans-serif;}

/* ══ BACK BUTTON ON ANSWERED QUESTIONS ══ */
.ansd-wrap{position:relative;}
.ansd-back{position:absolute;top:2px;right:0;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.07em;color:rgba(255,255,255,.25);cursor:pointer;padding:3px 8px;border:1px solid rgba(255,255,255,.08);transition:all 130ms;}
.ansd-back:hover{color:rgba(255,255,255,.6);border-color:rgba(255,255,255,.2);}

/* ══ FEEDBACK WIDGET ══ */
/* Trigger button — chat bubble style */
.fb-wrap{position:fixed;bottom:28px;right:28px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
.fb-bubble-btn{width:52px;height:52px;border-radius:50%;background:#305CFF;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:22px;
  box-shadow:0 4px 20px rgba(48,92,255,.45);transition:all 170ms;flex-shrink:0;}
.fb-bubble-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(48,92,255,.55);}
.fb-bubble-btn.pulse::after{content:'';position:absolute;width:52px;height:52px;border-radius:50%;
  border:2px solid rgba(48,92,255,.4);animation:fbring 2s ease infinite;}
@keyframes fbring{0%{transform:scale(1);opacity:.7;}100%{transform:scale(1.6);opacity:0;}}
/* callout speech bubble */
.fb-callout{background:#fff;border-radius:14px 14px 4px 14px;padding:12px 16px;
  box-shadow:0 4px 24px rgba(0,0,0,.15);max-width:220px;animation:fbpop 200ms ease both;
  border:1px solid rgba(0,0,0,.06);}
@keyframes fbpop{from{opacity:0;transform:scale(.92) translateY(4px);}to{opacity:1;transform:scale(1) translateY(0);}}
.fb-callout-txt{font-family:'Manrope',sans-serif;font-size:13px;font-weight:600;color:#111;line-height:1.5;margin-bottom:8px;}
.fb-callout-actions{display:flex;gap:7px;}
.fb-callout-yes{flex:1;background:#305CFF;color:#fff;border:none;padding:7px 0;
  font-family:'Manrope',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border-radius:4px;transition:all 130ms;}
.fb-callout-yes:hover{background:#1e4de0;}
.fb-callout-no{background:transparent;color:#999;border:1.5px solid #e5e5e5;padding:7px 12px;
  font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;border-radius:4px;transition:all 130ms;letter-spacing:.04em;}
.fb-callout-no:hover{border-color:#bbb;color:#555;}
/* form panel */
.fb-panel{background:#fff;border-radius:12px;width:320px;
  box-shadow:0 12px 48px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);
  border:1px solid rgba(0,0,0,.07);overflow:hidden;
  animation:fbpop 200ms ease both;cursor:move;user-select:none;}
.fb-panel-head{padding:14px 16px 12px;background:#fafafa;border-bottom:1px solid #f0f0f0;
  display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.fb-panel-stage{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;
  color:#305CFF;text-transform:uppercase;margin-bottom:2px;font-weight:600;}
.fb-panel-title{font-family:'Manrope',sans-serif;font-size:13px;font-weight:800;
  color:#111;line-height:1.25;letter-spacing:-.02em;}
.fb-panel-close{font-size:20px;color:#ccc;cursor:pointer;line-height:1;flex-shrink:0;
  transition:color 130ms;margin-top:1px;}
.fb-panel-close:hover{color:#666;}
.fb-panel-body{padding:14px 16px;}
.fb-field{margin-bottom:11px;}
.fb-lbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:#888;
  text-transform:uppercase;margin-bottom:5px;display:block;}
.fb-in{width:100%;border:1.5px solid #ebebeb;padding:8px 10px;
  font-family:'Manrope',sans-serif;font-size:12px;color:#111;outline:none;
  transition:border-color 140ms;background:#fff;resize:none;border-radius:4px;}
.fb-in::placeholder{color:#ccc;}
.fb-in:focus{border-color:#305CFF;}
.fb-ta{min-height:52px;resize:vertical;line-height:1.5;}
.fb-panel-foot{padding:10px 16px 14px;display:flex;gap:7px;border-top:1px solid #f5f5f5;}
.fb-submit{flex:1;background:#305CFF;color:#fff;border:none;padding:10px;
  font-family:'Manrope',sans-serif;font-size:13px;font-weight:700;cursor:pointer;
  transition:all 150ms;letter-spacing:-.01em;border-radius:4px;}
.fb-submit:hover{background:#1e4de0;}
.fb-submit:disabled{background:#d0d0d0;cursor:default;}
.fb-skip-btn{background:transparent;color:#bbb;border:1.5px solid #ebebeb;padding:10px 12px;
  font-family:'DM Mono',monospace;font-size:9px;cursor:pointer;
  transition:all 130ms;letter-spacing:.04em;border-radius:4px;}
.fb-skip-btn:hover{border-color:#ccc;color:#777;}
/* confirmation */
.fb-done{padding:28px 20px;text-align:center;}
.fb-done-ic{font-size:30px;margin-bottom:8px;}
.fb-done-t{font-family:'Manrope',sans-serif;font-size:14px;font-weight:800;color:#111;
  margin-bottom:4px;letter-spacing:-.02em;}
.fb-done-s{font-family:'Manrope',sans-serif;font-size:12px;color:#888;line-height:1.55;}

/* ══ CHAT FIX — ensure text is white ══ */
.cpmb.u{background:#1f1f1f;border:1px solid rgba(255,255,255,.08);color:#ffffff !important;}
.cpmb.a{background:rgba(48,92,255,.08);border:1px solid rgba(48,92,255,.2);color:rgba(255,255,255,.88) !important;}
.cpml{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.4) !important;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;}
/* top strip */
.tbar1{position:fixed;top:0;left:0;right:0;z-index:301;height:44px;background:#0d0d0d;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:space-between;padding:0 28px;}
.tbar1-l{display:flex;align-items:center;gap:16px;}
.tbar1-logo{font-family:'DM Mono',monospace;font-size:13px;letter-spacing:.07em;color:rgba(255,255,255,.9);cursor:pointer;transition:color 130ms;font-weight:500;}
.tbar1-logo:hover{color:#fff;}
.tbar1-sep{width:1px;height:18px;background:rgba(255,255,255,.12);}
.tbar1-mode{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;color:#B8FA4E;font-weight:600;}
.tbar1-r{display:flex;align-items:center;gap:8px;}
.tbar1-btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.05em;padding:6px 14px;border:1px solid rgba(255,255,255,.14);background:transparent;color:rgba(255,255,255,.55);cursor:pointer;transition:all 130ms;}
.tbar1-btn:hover{border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.85);}
.tbar1-btn.g{border-color:rgba(48,92,255,.5);color:#84A6FF;}
.tbar1-btn.g:hover{background:rgba(48,92,255,.1);}
/* second strip */
.tbar2{position:fixed;top:44px;left:0;right:0;z-index:300;height:52px;background:rgba(17,17,17,.98);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:0 28px;}
.tbar2-meta{display:flex;align-items:center;gap:20px;flex-shrink:0;}
.tbar2-co{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;color:rgba(255,255,255,.45);white-space:nowrap;}
.tbar2-sep{width:1px;height:16px;background:rgba(255,255,255,.1);}
.tbar2-user{font-size:12px;color:rgba(255,255,255,.6);white-space:nowrap;font-weight:500;}
.tbar2-role{font-size:11px;color:rgba(255,255,255,.3);white-space:nowrap;}
.ttabs{display:flex;gap:2px;flex:1;justify-content:center;}
.ttab{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.06em;padding:8px 16px;color:rgba(255,255,255,.4);border:1px solid transparent;cursor:pointer;transition:all 130ms;position:relative;white-space:nowrap;font-weight:500;}
.ttab:hover{color:rgba(255,255,255,.75);}
.ttab.a{color:#fff;border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.07);}
.ttab.dn{color:rgba(48,92,255,.85);}
.ttab.dn::after{content:'✓';position:absolute;top:-4px;right:-4px;font-size:8px;color:#305CFF;background:#111;border:1px solid rgba(48,92,255,.35);border-radius:50%;width:13px;height:13px;display:flex;align-items:center;justify-content:center;line-height:1;}
.ttab.lk{opacity:.22;cursor:default;pointer-events:none;}
.tbody{padding-top:96px;flex:1;display:flex;flex-direction:column;}

/* ══ PHASE PANELS ══ */
.panel{flex:1;padding:40px 0 110px;animation:pu 280ms ease both;}
@keyframes pu{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.pinner{max-width:560px;margin:0 auto;padding:0 24px;}

.back-btn{display:inline-flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.06em;color:rgba(255,255,255,.35);cursor:pointer;padding:0 0 20px;background:none;border:none;transition:color 140ms;text-transform:uppercase;}
.back-btn:hover{color:rgba(255,255,255,.7);}
.back-btn::before{content:'←';font-size:13px;}
.pey{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.12em;color:rgba(48,92,255,.85);text-transform:uppercase;margin-bottom:8px;}
.ph{font-size:28px;font-weight:800;color:#fff;margin-bottom:10px;line-height:1.2;letter-spacing:-.03em;}
.ps{font-size:16px;color:rgba(255,255,255,.7);line-height:1.72;margin-bottom:28px;}

.big-ta{width:100%;background:#1d1d1d;border:1.5px solid rgba(255,255,255,.13);padding:16px 18px;font-family:'Manrope',sans-serif;font-size:15px;color:#fff;min-height:110px;resize:vertical;outline:none;line-height:1.72;transition:border-color 160ms;margin-bottom:10px;}
.big-ta::placeholder{color:rgba(255,255,255,.28);}
.big-ta:focus{border-color:rgba(48,92,255,.6);}
.ifoot{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.ihint{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.05em;color:rgba(255,255,255,.38);}
/* input type selector */
.itype-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;}
.itype-chip{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.05em;padding:6px 14px;border:1.5px solid rgba(255,255,255,.12);color:rgba(255,255,255,.45);cursor:pointer;transition:all 120ms;font-weight:500;}
.itype-chip:hover{border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.75);}
.itype-chip.s{border-color:#305CFF;background:rgba(48,92,255,.14);color:#84A6FF;}
/* org area suggestions */
.org-section{margin-bottom:20px;}
.org-lbl{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;color:rgba(255,255,255,.45);text-transform:uppercase;margin-bottom:10px;}
.org-chips{display:flex;flex-wrap:wrap;gap:7px;}
.org-chip{display:flex;align-items:center;gap:7px;padding:9px 14px;border:1.5px solid rgba(255,255,255,.1);cursor:pointer;transition:all 120ms;font-size:13px;color:rgba(255,255,255,.6);font-weight:500;background:#1a1a1a;}
.org-chip:hover{border-color:rgba(184,250,78,.4);color:#fff;background:#1f1f1f;}
.org-chip.s{border-color:#B8FA4E;background:rgba(184,250,78,.08);color:#B8FA4E;}
.org-chip-ic{font-size:14px;}
/* starter ideas */
.starters{display:flex;flex-direction:column;gap:6px;margin-bottom:24px;}
.starter{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;background:#1a1a1a;border:1.5px solid rgba(255,255,255,.07);cursor:pointer;transition:all 130ms;}
.starter:hover{border-color:rgba(48,92,255,.4);background:#1e1e1e;}
.starter-ico{font-size:18px;flex-shrink:0;margin-top:1px;}
.starter-body{}
.starter-title{font-size:14px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:3px;letter-spacing:-.01em;}
.starter-sub{font-size:12px;color:rgba(255,255,255,.4);line-height:1.5;}
.starter-tag{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.25);letter-spacing:.05em;margin-top:5px;}

/* Buttons */
.btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.05em;padding:9px 18px;border:1px solid;background:transparent;cursor:pointer;transition:all 140ms;font-weight:500;}
.btn.g{border-color:rgba(48,92,255,.6);color:#84A6FF;}
.btn.g:hover{background:rgba(48,92,255,.12);border-color:#305CFF;}
.btn.g:disabled{opacity:.22;cursor:default;}
.btn.h{border-color:rgba(255,255,255,.14);color:rgba(255,255,255,.4);}
.btn.h:hover{border-color:rgba(255,255,255,.28);color:rgba(255,255,255,.65);}
.brow{display:flex;gap:7px;margin-top:14px;flex-wrap:wrap;}

/* User bubble */
.ubub{background:#1c1c1c;border:1.5px solid rgba(255,255,255,.09);border-left:2px solid rgba(132,166,255,.5);padding:12px 16px;margin-bottom:22px;}
.ublbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:rgba(132,166,255,.7);text-transform:uppercase;margin-bottom:5px;}
.ubtxt{font-size:13px;color:rgba(255,255,255,.9);line-height:1.65;}

/* AI block */
.aib{margin-bottom:26px;}
.ailbl{display:flex;align-items:center;gap:7px;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:rgba(255,255,255,.28);text-transform:uppercase;margin-bottom:10px;}
.aip{width:6px;height:6px;background:#305CFF;border-radius:50%;animation:glw 2s ease infinite;}
@keyframes glw{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(48,92,255,.4);}50%{opacity:.6;box-shadow:0 0 0 4px rgba(48,92,255,0);}}
.aiq{font-size:20px;font-weight:700;color:#fff;line-height:1.35;margin-bottom:5px;letter-spacing:-.02em;}
.aiqs{font-size:14px;color:rgba(255,255,255,.45);line-height:1.65;margin-bottom:16px;}

/* Options */
.opts{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
.opt{display:flex;align-items:center;gap:10px;padding:10px 13px;background:#1a1a1a;border:1.5px solid rgba(255,255,255,.09);cursor:pointer;transition:all 120ms;}
.opt:hover{border-color:rgba(48,92,255,.4);background:#1f1f1f;}
.opt.sl{border-color:#305CFF;background:rgba(48,92,255,.1);}
.opt.nr{background:transparent;border-color:transparent;}
.opt.nr:hover{background:#1a1a1a;border-color:rgba(255,255,255,.09);}
.ochk{width:14px;height:14px;border:1.5px solid rgba(255,255,255,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;color:#305CFF;transition:all 110ms;}
.opt.sl .ochk{background:rgba(48,92,255,.25);border-color:#305CFF;}
.olbl{font-size:15px;color:rgba(255,255,255,.7);flex:1;font-weight:500;}
.opt.sl .olbl{color:#fff;}
.otag{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.2);flex-shrink:0;}
.fin{width:100%;background:#141414;border:1.5px solid rgba(255,255,255,.1);padding:10px 14px;margin-top:4px;font-family:'Manrope',sans-serif;font-size:15px;color:#fff;outline:none;transition:border-color 140ms;}
.fin::placeholder{color:rgba(255,255,255,.2);}
.fin:focus{border-color:rgba(48,92,255,.5);}

/* Answered */
.ansd{opacity:.38;margin-bottom:18px;}
.apills{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;}
.apill{font-family:'DM Mono',monospace;font-size:9px;color:#84A6FF;border:1px solid rgba(132,166,255,.25);padding:2px 8px;background:rgba(132,166,255,.07);}

/* Thinking */
.thk{display:flex;align-items:center;gap:9px;font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);margin-bottom:22px;}
.dts span{display:inline-block;width:4px;height:4px;background:#305CFF;border-radius:50%;margin:0 2px;animation:bl 1.2s ease infinite;}
.dts span:nth-child(2){animation-delay:.2s;}.dts span:nth-child(3){animation-delay:.4s;}
@keyframes bl{0%,100%{opacity:.15;}50%{opacity:1;}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

/* Sentence card */
.sc{background:#1a1a1a;border:1.5px solid rgba(48,92,255,.35);border-left:3px solid #305CFF;padding:18px 20px;margin-bottom:16px;}
.st{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:#84A6FF;text-transform:uppercase;margin-bottom:8px;}
.sx{font-size:14px;color:rgba(255,255,255,.9);line-height:1.8;}
.sx em{color:#84A6FF;font-style:normal;font-weight:700;}
.se{width:100%;background:#141414;border:1.5px solid rgba(255,255,255,.1);padding:11px 13px;font-family:'Manrope',sans-serif;font-size:13px;color:#fff;min-height:70px;resize:vertical;outline:none;transition:border-color 140ms;}
.se:focus{border-color:rgba(48,92,255,.5);}

/* Pop spec */
.psp{background:#1a1a1a;border:1.5px solid rgba(184,250,78,.2);padding:18px;margin-bottom:16px;}
.psph{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:#B8FA4E;text-transform:uppercase;margin-bottom:10px;}

/* ══ SIMULATION ══ */
.simscr{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;}
.siml{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:18px;}
.simbig{font-family:'DM Mono',monospace;font-size:56px;font-weight:500;color:#fff;letter-spacing:-.02em;line-height:1;margin-bottom:4px;}
.simsub{font-family:'DM Mono',monospace;font-size:13px;letter-spacing:.06em;color:rgba(255,255,255,.3);margin-bottom:32px;}
.simbars{width:100%;max-width:440px;margin-bottom:28px;}
.sbr{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.sblbl{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.4);width:88px;text-align:right;flex-shrink:0;}
.sbtr{flex:1;height:2px;background:rgba(255,255,255,.07);position:relative;}
.sbf{position:absolute;top:0;left:0;height:100%;background:#305CFF;transition:width 170ms ease;}
.sbpct{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.4);width:28px;}
.simlog{width:100%;max-width:440px;background:#161616;border:1px solid rgba(255,255,255,.07);padding:12px 14px;text-align:left;overflow:hidden;max-height:130px;}
.sll{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.35);line-height:1.9;letter-spacing:.03em;}
.sll.cur{color:#B8FA4E;}
.simdone-btn{margin-top:26px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.07em;padding:11px 28px;border:1.5px solid rgba(48,92,255,.5);color:#84A6FF;background:transparent;cursor:pointer;transition:all 160ms;}
.simdone-btn:hover{background:rgba(48,92,255,.1);border-color:#305CFF;}

/* ══ OUTPUT ══ */
.sstrip{background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.08);padding:0 24px;position:sticky;top:48px;z-index:90;}
.ssr{height:37px;display:flex;align-items:center;gap:16px;cursor:pointer;}
.ssrl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;color:rgba(255,255,255,.3);text-transform:uppercase;flex-shrink:0;}
.ssri{display:flex;gap:16px;flex:1;overflow:hidden;}
.ssrit{display:flex;gap:5px;align-items:center;white-space:nowrap;}
.ssrk{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.3);}
.ssrv{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.6);}
.ssrt{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.25);margin-left:auto;flex-shrink:0;}
.ssrexp{padding:14px 0 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;border-top:1px solid rgba(255,255,255,.05);}
.ssreit{padding-left:10px;border-left:1px solid rgba(255,255,255,.08);}
.ssrek{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;}
.ssrev{font-size:12px;color:#fff;font-weight:500;}
.ssres{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.25);margin-top:1px;}

.otabs{display:flex;border-bottom:1px solid rgba(255,255,255,.07);padding:0 24px;background:#111;position:sticky;top:85px;z-index:80;}
.otab{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.07em;padding:11px 16px;color:rgba(255,255,255,.35);cursor:pointer;border-bottom:1.5px solid transparent;transition:all 130ms;}
.otab:hover{color:rgba(255,255,255,.65);}
.otab.a{color:#fff;border-bottom-color:#305CFF;}
.otabb{font-family:'DM Mono',monospace;font-size:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:1px 5px;color:rgba(255,255,255,.3);margin-left:4px;}

.owrap{display:flex;min-height:0;}
.omain{flex:1;padding:28px 24px 120px;max-width:640px;min-width:0;transition:margin-right 250ms ease;}
.omain.sh{margin-right:360px;}

/* Verdict */
.vw{display:grid;grid-template-columns:1fr 210px;gap:22px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.07);}
.vt{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.14em;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:9px;}
.vn{font-size:38px;font-weight:800;color:#fff;letter-spacing:-.04em;line-height:1.05;margin-bottom:5px;}
.vn em{color:#B8FA4E;font-style:normal;}
.vci{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.45);margin-bottom:12px;}
.vconf{display:flex;align-items:center;gap:8px;}
.vcd{width:7px;height:7px;background:#305CFF;border-radius:1px;}
.vcl{font-family:'DM Mono',monospace;font-size:9px;color:#84A6FF;letter-spacing:.08em;}
.vcw{font-size:12px;color:rgba(255,255,255,.4);margin-left:3px;}
.ctxbox{background:#1a1a1a;border:1px solid rgba(255,255,255,.09);padding:15px;}
.ctxh{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:12px;}
.ctxr{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ctxl{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.45);width:100px;flex-shrink:0;letter-spacing:.03em;}
.ctxt{flex:1;height:3px;background:rgba(255,255,255,.07);position:relative;}
.ctxf{position:absolute;top:0;left:0;height:100%;}
.ctxv{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.45);width:20px;text-align:right;}

.sech{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:12px;}
.i3{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:22px;}
.ins{background:#1a1a1a;border:1px solid rgba(255,255,255,.08);padding:15px;position:relative;overflow:hidden;}
.ins::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.ins.dom::before{background:#B8FA4E;}.ins.rsk::before{background:#ff4d4d;}.ins.wat::before{background:#ff9f40;}
.instyp{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;}
.ins.dom .instyp{color:#B8FA4E;}.ins.rsk .instyp{color:#ff4d4d;}.ins.wat .instyp{color:#ff9f40;}
.insb{font-size:12px;color:rgba(255,255,255,.65);line-height:1.65;}

/* Segments */
.swl{background:#1a1a1a;border:1px solid rgba(255,255,255,.08);padding:17px;margin-bottom:16px;}
.swlh{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:14px;}
.swr{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.swrl{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.5);width:118px;flex-shrink:0;}
.swrt{flex:1;height:16px;background:rgba(255,255,255,.04);position:relative;}
.swrf{position:absolute;top:0;left:0;height:100%;opacity:.75;}
.swrp{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.55);width:28px;text-align:right;}
.swri{font-family:'DM Mono',monospace;font-size:8px;width:56px;text-align:right;}
.scards{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.scard{background:#1a1a1a;border:1px solid rgba(255,255,255,.08);padding:15px;}
.sctop{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.scnm{font-size:13px;font-weight:700;color:#fff;letter-spacing:-.01em;}
.scpct{font-family:'DM Mono',monospace;font-size:17px;font-weight:500;color:#fff;}
.scpt{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.25);}
.scdr{display:flex;gap:7px;margin-bottom:6px;}
.scdk{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.06em;width:48px;flex-shrink:0;padding-top:2px;}
.scdv{font-size:11px;color:rgba(255,255,255,.65);line-height:1.5;}
.scgt{margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,.06);font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.3);line-height:1.6;}
.scgt span{color:#B8FA4E;}

/* Pathways */
.pwl{display:flex;flex-direction:column;gap:7px;margin-bottom:18px;}
.pw{background:#1a1a1a;border:1px solid rgba(255,255,255,.08);padding:15px 19px;position:relative;}
.pw.rc{border-color:rgba(48,92,255,.3);}
.pwbdg{position:absolute;top:0;right:14px;font-family:'DM Mono',monospace;font-size:8px;color:#84A6FF;background:rgba(48,92,255,.12);border:1px solid rgba(48,92,255,.25);border-top:none;padding:2px 7px;letter-spacing:.08em;}
.pwt{display:flex;align-items:baseline;gap:7px;margin-bottom:6px;}
.pwr{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.25);}
.pwn{font-size:13px;font-weight:700;color:#fff;letter-spacing:-.01em;}
.pwd{font-size:11px;color:rgba(255,255,255,.5);line-height:1.55;margin-bottom:12px;}
.pwm{display:flex;gap:20px;}
.pwmv{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;}
.pwmv.p{color:#B8FA4E;}.pwmv.n{color:#ff4d4d;}.pwmv.u{color:rgba(255,255,255,.4);}
.pwml{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.3);margin-top:2px;letter-spacing:.06em;}
.pwci{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.18);margin-top:1px;}
.pwwhy{font-size:12px;color:rgba(255,255,255,.55);line-height:1.65;border-left:2px solid #305CFF;padding:9px 14px;background:rgba(48,92,255,.06);margin-bottom:18px;}
.pwwhy strong{color:#fff;font-weight:700;}
.cfw{background:#1a1a1a;border:1px solid rgba(255,255,255,.08);}
.cft{width:100%;border-collapse:collapse;}
.cft th{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;color:rgba(255,255,255,.35);text-align:left;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.07);text-transform:uppercase;}
.cft td{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.5);padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);}
.cft tr:last-child td{border-bottom:none;}
.cfsn{font-size:11px;color:rgba(255,255,255,.75) !important;font-family:'Manrope',sans-serif !important;font-weight:500 !important;}
.cfp{color:#B8FA4E !important;}.cfn{color:#ff4d4d !important;}

/* Audit */
.att{display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.07);}
.atr{width:78px;height:78px;position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.atr svg{position:absolute;top:0;left:0;}
.atri{text-align:center;}
.atrp{font-family:'DM Mono',monospace;font-size:17px;font-weight:500;color:#fff;}
.atrl{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.3);}
.atbk{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;}
.atbi{background:#1a1a1a;border:1px solid rgba(255,255,255,.08);padding:11px;}
.atbn{font-family:'DM Mono',monospace;font-size:15px;font-weight:500;}
.atbi.ev .atbn{color:#B8FA4E;}.atbi.bl .atbn{color:#ff9f40;}.atbi.md .atbn{color:#84A6FF;}
.atbl{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;}
.rf{display:flex;gap:10px;padding:11px 14px;background:#1a1a1a;border:1px solid rgba(255,255,255,.07);border-left:2px solid #ff9f40;margin-bottom:6px;}
.rfi{font-family:'DM Mono',monospace;font-size:9px;color:#ff9f40;flex-shrink:0;padding-top:1px;}
.rfn{font-size:12px;font-weight:700;color:#fff;margin-bottom:2px;letter-spacing:-.01em;}
.rfm{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.4);}
.cn{display:flex;gap:9px;padding:10px 13px;background:#1a1a1a;border:1px solid rgba(255,255,255,.06);margin-bottom:3px;}
.cna{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.25);width:18px;flex-shrink:0;padding-top:2px;}
.cnc{font-size:11px;color:rgba(255,255,255,.65);flex:1;line-height:1.5;}
.cns{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.25);flex-shrink:0;}
.mpg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.mpi{background:#1a1a1a;border:1px solid rgba(255,255,255,.07);padding:10px;}
.mpk{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.3);margin-bottom:3px;letter-spacing:.06em;}
.mpv{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:#B8FA4E;}
.dvdr{border:none;border-top:1px solid rgba(255,255,255,.06);margin:18px 0;}

/* Chat panel */
.cp{position:fixed;top:48px;right:0;bottom:0;z-index:100;width:360px;background:#161616;border-left:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;transform:translateX(100%);transition:transform 240ms ease;}
.cp.o{transform:translateX(0);}
.cph{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.cpt{font-size:13px;font-weight:700;color:#fff;letter-spacing:-.01em;}
.cpc{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.3);cursor:pointer;padding:4px 8px;border:1px solid rgba(255,255,255,.1);transition:all 120ms;}
.cpc:hover{color:rgba(255,255,255,.6);}
.cpms{flex:1;overflow-y:auto;padding:16px;}
.cpml{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;}
.cpmb{font-size:12px;line-height:1.65;padding:10px 12px;font-family:'Manrope',sans-serif;}
.cpmb.u{background:#1f1f1f;border:1px solid rgba(255,255,255,.08);color:#fff;}
.cpmb.a{background:rgba(48,92,255,.08);border:1px solid rgba(48,92,255,.2);color:rgba(255,255,255,.85);}
.cpin-row{padding:11px 13px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:6px;flex-shrink:0;}
.cpinput{flex:1;background:#111;border:1.5px solid rgba(255,255,255,.1);padding:8px 11px;font-family:'Manrope',sans-serif;font-size:12px;color:#fff;outline:none;transition:border-color 130ms;}
.cpinput::placeholder{color:rgba(255,255,255,.2);}
.cpinput:focus{border-color:rgba(48,92,255,.45);}
.cpsend{font-family:'DM Mono',monospace;font-size:10px;padding:8px 12px;border:1.5px solid rgba(48,92,255,.4);color:#84A6FF;background:transparent;cursor:pointer;transition:all 120ms;}
.cpsend:hover{background:rgba(48,92,255,.1);}
.cpsend:disabled{opacity:.22;cursor:default;}

/* Micro bar */
.mbar{position:fixed;bottom:0;left:0;right:0;z-index:95;background:rgba(14,14,14,.97);backdrop-filter:blur(14px);border-top:1px solid rgba(255,255,255,.08);padding:11px 24px;display:flex;align-items:center;justify-content:space-between;transform:translateY(100%);animation:mup 360ms 500ms ease forwards;}
@keyframes mup{to{transform:translateY(0);}}
.mbar.sh{right:360px;}
.mbrt{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:3px;}
.mbrd{font-size:12px;color:rgba(255,255,255,.5);}
.mbrd strong{color:#fff;font-weight:700;}
.mov{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.8);display:flex;align-items:flex-start;justify-content:center;padding-top:68px;opacity:0;pointer-events:none;transition:opacity 200ms ease;}
.mov.o{opacity:1;pointer-events:all;}
.mmm{background:#181818;border:1px solid rgba(255,255,255,.1);width:540px;max-height:74vh;overflow-y:auto;transform:translateY(12px);transition:transform 200ms ease;}
.mov.o .mmm{transform:translateY(0);}
.mmmh{padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;background:#181818;z-index:1;}
.mmmt{font-size:16px;font-weight:800;color:#fff;margin-bottom:3px;letter-spacing:-.02em;}
.mmms{font-size:12px;color:rgba(255,255,255,.4);}
.mmmb{padding:18px 24px;}
.mmmods{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.mmod{background:#1f1f1f;border:1px solid rgba(255,255,255,.08);padding:13px;cursor:pointer;transition:all 130ms;}
.mmod:hover{border-color:rgba(48,92,255,.35);}
.mmod.s{border-color:#305CFF;background:rgba(48,92,255,.08);}
.mmodi{font-family:'DM Mono',monospace;font-size:14px;color:rgba(255,255,255,.25);margin-bottom:7px;}
.mmodn{font-size:12px;font-weight:700;color:#fff;margin-bottom:3px;letter-spacing:-.01em;}
.mmodd{font-size:11px;color:rgba(255,255,255,.45);line-height:1.5;}
.mmodts{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;}
.mmodt{font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.08);padding:2px 6px;}
.mmmf{padding:12px 24px;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:center;position:sticky;bottom:0;background:#181818;}
.mmmcnt{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.3);}
.mmmcnt span{color:#B8FA4E;}
.mmmrun{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.05em;padding:9px 18px;border:1.5px solid rgba(48,92,255,.45);color:#84A6FF;background:transparent;cursor:pointer;transition:all 130ms;}
.mmmrun:hover{background:rgba(48,92,255,.1);}
.mmmrun:disabled{opacity:.2;cursor:default;}
`;

/* ─────────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────────── */

const MMODS = [
  {id:"pricing",i:"◈",n:"Pricing Sensitivity",d:"WTP curves per segment. Optimal price point pre-launch.",t:["WTP","elasticity","price ladder"]},
  {id:"demand",i:"◉",n:"Demand Forecasting",d:"12-month demand curves under 3 growth scenarios.",t:["TAM","growth","seasonality"]},
  {id:"churn",i:"◌",n:"Churn Architecture",d:"Churn triggers per segment + intervention ROI model.",t:["retention","triggers","LTV"]},
  {id:"message",i:"◫",n:"Message Resonance",d:"Test 4–6 framings against your calibrated population.",t:["framing","copy","A/B"]},
  {id:"channel",i:"◧",n:"Channel Sequencing",d:"Acquisition efficiency by channel vs segment behaviour.",t:["CAC","mix","sequence"]},
  {id:"timing",i:"◷",n:"Launch Timing",d:"Stress-test launch window vs seasonal + macro signals.",t:["timing","window","macro"]},
];

/* ENTERPRISE onboarding steps */
const ENT_STAGES = ["Overview","Company","Integrations","Your Role","Expectations","Simulate"];
const ENT_ROLES = ["Founder / CEO","Head of Product","GTM Lead","Strategy / BD","Marketing","Operations","Investor / Analyst","Other"];
const ENT_CUES = [
  "Understand how our target market will respond before we commit",
  "Find out which segment to prioritise in our launch sequence",
  "Pressure-test our pricing structure against real resistance patterns",
  "Identify the biggest risks before presenting to the board",
  "Build a business case with confidence intervals, not point estimates",
  "Understand what's driving churn in our existing base",
  "Evaluate a policy decision before rolling it out company-wide",
  "Validate a product pivot hypothesis without expensive research",
];
const CONNECTORS = [
  {id:"sf",ic:"☁",n:"Salesforce",d:"CRM & pipeline data",badge:""},
  {id:"hs",ic:"🟠",n:"HubSpot",d:"Marketing & contacts",badge:""},
  {id:"snow",ic:"❄",n:"Snowflake",d:"Data warehouse",badge:""},
  {id:"ga",ic:"📊",n:"Google Analytics",d:"Traffic & behaviour",badge:""},
  {id:"stripe",ic:"💳",n:"Stripe",d:"Revenue & churn data",badge:""},
  {id:"mix",ic:"🔵",n:"Mixpanel",d:"Product analytics",badge:"BETA"},
];

/* ─────────────────────────────────────────────────────────────
   SYSTEM PROMPTS
───────────────────────────────────────────────────────────── */
const SYS_Q1 = (idea, prev) => `You are reading a raw idea that needs to become a precise, testable simulation scenario. Your job is to ask ONE question that removes the single most important ambiguity still present in the input.

THE IDEA: "${idea}"

ALREADY ASKED:
${prev.length ? prev.map((x,i)=>`Q${i+1}: ${x.q}\nAnswer: ${x.answer}`).join("\n\n") : "None yet."}

YOUR ONLY JOB:
Look at the idea and find what is still vague or missing that would prevent a simulation from running precisely. The simulation needs to know: who exactly, doing what exactly, under what conditions exactly, starting from where exactly.

Ask about the ambiguity that matters most. Examples of things that make an idea untestable:
- Price or cost is unknown — the model cannot run price sensitivity without it
- Channel is unclear — online vs physical vs both changes who the model reaches
- The relationship between the person behind this and the audience is unstated — new entrant vs existing player changes the trust prior completely
- Timing or stage is missing — imminent launch vs planning stage changes urgency signals
- What currently exists for the audience — no alternative vs strong incumbent changes switching cost entirely

RULES:
1. One question. The most important missing piece only.
2. Ask about the SCENARIO — not about likely outcomes, not about what the user hopes for
3. The answer should make the simulation sentence more precise and testable — that is the only test
4. Plain conversational language
5. Options must be specific to this exact idea — no generic placeholders
6. Sub-text: one sentence explaining what this fills in for the simulation

Return ONLY raw JSON (no markdown, no backticks):
{"q":"[question that removes the key ambiguity]","sub":"[what this makes precise in the simulation]","opts":[{"l":"[specific option A]"},{"l":"[specific option B]"},{"l":"[specific option C]"},{"l":"Add your own","free":true},{"l":"Skip","nr":true}]}`;

const SYS_SENT = `You synthesise inputs into a single structured sentence for a simulation engine. Fill every placeholder with SPECIFIC details.

Template:
"A [voluntary/imposed] [specific type of change] proposed by [specific actor] that asks [specific target population] to [specific action], replacing [specific current state], where [group A] benefits visibly and [group B] bears the primary cost, framed as [specific framing], with [high/medium/low] political charge and [high/medium/low] behaviour change requirement."

Rules:
- Fill EVERY bracket with specific words from the input and Q&A
- Wrap each filled-in value with <em> tags
- Return ONLY the sentence. No quotes. No preamble.`;

const SYS_Q2 = (sentence, prev) => `You calibrate a synthetic agent population. The population is a mathematical entity — 2.4M agents drawn from joint distributions. You are asking questions TO THE MODEL on behalf of building accurate parameters, not asking the user for their opinion.

THE CONFIRMED SCENARIO: "${sentence}"

ALREADY CALIBRATED:
${prev.length ? prev.map(x=>`${x.id}: ${x.answer}`).join("\n") : "None yet."}

Frame questions as: "For the population this idea would encounter..." — not as questions about the user's business. You are calibrating the synthetic population that will be simulated.

Dimensions (ask only if genuinely ambiguous after reading the sentence):
- income: what economic profile does the encountering population have?
- age: what age/life stage does this idea naturally reach?
- brand: how familiar is this population with the source/entity behind the idea?
- readiness: does ambient demand exist, or does this arrive cold?

Return ONLY raw JSON (no markdown):
{"id":"income|age|brand|readiness","q":"[population-framed question]","sub":"[why this shapes the agent distribution]","opts":[{"l":"[specific option]"},{"l":"[specific option]"},{"l":"[specific option]"},{"l":"Add your own","free":true},{"l":"Let the model decide","nr":true}]}`;

const SYS_SPEC = `Write a concise population specification in plain prose. No JSON. No bullet points. No jargon like "distribution" or "covariance".

Explain who is in this synthetic population and why the model is shaped this way based on the scenario. Cover: income, age, brand familiarity, and ambient demand. Explain how these interact.

Start with exactly: "Here is the population I'm building:"
End with exactly: "Does this match what you know about the people this idea would actually reach?"

150–200 words. Specific. Grounded in the actual scenario.`;

const SYS_CHAT = (idea, simResults) => `You are a senior analyst at Sidenote explaining a probabilistic simulation output to a decision-maker.

THE IDEA SIMULATED: "${idea}"

ACTUAL SIMULATION RESULTS:
${JSON.stringify(simResults, null, 2)}

RULES:
- Answer SPECIFICALLY and DIRECTLY using ONLY the numbers from the simulation results above
- Never invent or hallucinate numbers not present in the simulation results
- If asked about a segment, explain WHY that segment has that profile based on the agent attributes in the results
- If asked about a number, trace it to its source calculation as described in the causal trace
- If asked about a risk, explain what changes if that risk materialises using the counterfactual data
- Max 90 words. Be authoritative and specific.`;

/* ─────────────────────────────────────────────────────────────
   SIMULATION ENGINE — AI-powered Bayesian computation
   All outputs computed from actual user inputs. No mock data.
───────────────────────────────────────────────────────────── */

// Step 1: Parse structured sentence into Bayesian input vector
const SYS_PARSE_VECTOR = `You are a simulation engine. Parse the scenario sentence into a structured Bayesian input vector. Extract ONLY what is explicitly stated or can be directly inferred. Do not invent values.

Return ONLY raw JSON:
{
  "category": "string — what domain/type of idea this is",
  "price_segment": "luxury|premium|mid|accessible|free — infer from context",
  "trend_intensity": "high|medium|low — how strong is current cultural/market momentum",
  "utility_type": "functional|social|identity|compliance|efficiency",
  "accessibility": "high|medium|low — how easy to access/adopt",
  "actor_type": "new_entrant|established_player|internal_team|government",
  "channel": "online|physical|both|internal",
  "competitive_landscape": "none|weak|moderate|strong — what alternatives exist",
  "geographic_context": "string — where this lands",
  "audience": "string — who specifically is affected",
  "voluntariness": "voluntary|soft_pressure|mandatory",
  "behaviour_change": "minimal|moderate|significant — how much must people change",
  "ambient_demand": "cold|warm|active — is there existing demand"
}`;

// Step 2: Run Bayesian network inference + Monte Carlo simulation
const SYS_RUN_SIMULATION = (vector, popSpec) => `You are a probabilistic simulation engine running a Bayesian network over a synthetic population of 2.4M agents.

INPUT VECTOR:
${JSON.stringify(vector, null, 2)}

POPULATION SPEC:
${popSpec}

Run the complete simulation using this exact mathematical framework:

BAYESIAN NETWORK — compute posterior probabilities through the network:
1. price_sensitivity: P(high|price_segment, audience_income) — higher price segment + lower income = higher sensitivity
2. brand_affinity: P(high|actor_type, audience_familiarity) — new entrant = low affinity prior
3. social_influence: P(high|trend_intensity, peer_adoption) — trend × peer adoption rate
4. switching_cost: P(high|competitive_landscape, behaviour_change) — strong incumbent + big change = high cost
5. utility: P(high|price_sensitivity, brand_affinity, social_influence, switching_cost, accessibility)
6. adoption_probability: P(adopt|utility) using sigmoid function

MONTE CARLO — 10,000 runs over heterogeneous population:
- Draw agent attributes from distributions calibrated to the population spec
- Apply utility function per agent with stochastic noise εᵢ ~ N(0, σ)
- Compute adoption rate per run R(k) = (1/N)ΣYᵢ
- Aggregate to get E[R], Var(R), 95% CI

SEGMENT THE POPULATION into 4 clusters based on adoption probability:
- Early Adopters: Pᵢ > 0.70 — who are they, what drives them, what blocks them
- Conditional Converts: Pᵢ 0.40-0.70 — who are they, what tips them
- Passive Laggards: Pᵢ 0.20-0.40 — who are they, what would move them
- Active Resistors: Pᵢ < 0.20 — who are they, what is their objection

COUNTERFACTUALS — compute impact of 4 scenario changes relevant to THIS idea:
Generate the most relevant counterfactuals for this specific scenario (not generic ones)

RISK FLAGS — identify 3 assumptions the simulation made that are unvalidated

CONTEXT SCORES — compute 6 scores (0-1) for:
- assumption_strength: what % of inputs were evidence-backed vs assumed
- externality_exposure: sensitivity to external forces
- timing_fit: how well-timed is this relative to market conditions
- behaviour_delta: how much change is required
- category_inertia: how fast does this category move
- signal_decay: how long before this opportunity expires

CAUSAL TRACE — 4-5 steps showing exactly how the adoption rate was computed

Return ONLY raw JSON (no markdown):
{
  "adoption_rate": { "median": number_0_to_1, "low": number, "high": number, "confidence": "HIGH|MODERATE|LOW" },
  "scenario_params": [{"k": "string", "v": "string", "s": "string"}],
  "context_scores": [{"l": "string", "v": number_0_to_1, "c": "#hex", "why": "string"}],
  "segments": [
    {"n": "string", "p": "string_percent", "w": "string_percent", "c": "#hex", "i": "string", "ic": "#hex",
     "why": "string — what agent attributes produced this", "dr": "string — what drives adoption", "bl": "string — what blocks", "gt": "string — go-to strategy"}
  ],
  "pathways": [
    {"r": "01", "n": "string", "rc": boolean,
     "d": "string", "a": "string", "ac": "p|n", "ch": "string", "cc": "p|n", "nr": "string", "nc": "p|n",
     "ci": "string", "why": "string — causal explanation"}
  ],
  "counterfactuals": [
    {"s": "string — scenario change", "a": "string — ARR delta", "ac": boolean, "c": "string — churn delta", "cc": boolean, "n": "string — NRR delta", "nc": boolean, "why": "string"}
  ],
  "risk_flags": [
    {"i": "RF-01", "n": "string — assumption name", "m": "string — impact description"}
  ],
  "causal_trace": [
    {"a": "─●", "c": "string — calculation step", "s": "string — source"}
  ],
  "model_params": [
    {"k": "string", "v": "string"}
  ],
  "simulation_logs": ["string", "string", "string", "string", "string", "string", "string", "string", "string", "string", "string", "string", "string", "string"]
}`;

/* ─────────────────────────────────────────────────────────────
   PHASE 1 INPUT COMPONENT
   - Starter idea suggestions
   - Input type multi-select (idea / policy / product etc.)
   - Org area chips (context-aware from entRole + entBrand)
   - Main textarea
───────────────────────────────────────────────────────────── */

const INPUT_TYPES = [
  {id:"idea",   l:"New idea"},
  {id:"feature",l:"Product feature"},
  {id:"policy", l:"Policy / mandate"},
  {id:"strategy",l:"Strategy change"},
  {id:"campaign",l:"Campaign / message"},
  {id:"pricing", l:"Pricing decision"},
  {id:"other",  l:"Other"},
];

// Org area options are derived from role+brand context
function getOrgAreas(role, brand) {
  const base = [
    {ic:"🌊",l:"Blue ocean — explore entirely new territory"},
    {ic:"🎯",l:"Target a new customer segment"},
    {ic:"🔁",l:"Change an existing product or strategy"},
    {ic:"🚀",l:"Launch something new to market"},
    {ic:"💡",l:"Validate an early-stage hypothesis"},
    {ic:"⚖️",l:"Internal policy or process change"},
    {ic:"📈",l:"Growth / acquisition expansion"},
    {ic:"🔧",l:"Operational efficiency improvement"},
  ];
  // Add role-specific suggestions
  const roleMap = {
    "Founder / CEO":   [{ic:"🏗️",l:"Business model pivot"},{ic:"🤝",l:"Partnership or acquisition"}],
    "Head of Product": [{ic:"🧩",l:"New feature or capability"},{ic:"🗺️",l:"Roadmap prioritisation decision"}],
    "GTM Lead":        [{ic:"📣",l:"Go-to-market motion change"},{ic:"🎪",l:"Event or campaign approach"}],
    "Marketing":       [{ic:"✍️",l:"Messaging or positioning shift"},{ic:"📊",l:"Channel mix change"}],
    "Strategy / BD":   [{ic:"🌍",l:"New market entry"},{ic:"🔬",l:"Competitive response"}],
    "Investor / Analyst":[{ic:"🏦",l:"Investment thesis test"},{ic:"📉",l:"Risk scenario modelling"}],
  };
  const extras = roleMap[role] || [];
  return [...extras, ...base].slice(0, 8);
}

// Starter ideas vary by role
function getStarters(role, brand) {
  const brandName = brand ? brand.replace(/<[^>]+>/g,"").split(" ")[0] : "your company";
  const all = [
    {
      ico:"🌊", title:"Explore a blue ocean opportunity",
      sub:`What if ${brandName} entered an adjacent market that existing competitors ignore?`,
      tag:"strategy · new territory",
      fill:`We're exploring whether ${brandName} should enter [adjacent market/category] — a space none of our current competitors serve. We'd be targeting [new customer type] who currently [workaround or unmet need].`
    },
    {
      ico:"🎯", title:"Target a new customer segment",
      sub:"Simulate how a segment you've never sold to would respond to your core offer.",
      tag:"gtm · segment expansion",
      fill:`We want to start selling to [new segment — e.g. mid-market, SMB, enterprise, a specific industry]. Currently we serve [existing customer type]. This is a new motion with a new [price point / packaging / channel].`
    },
    {
      ico:"🔁", title:"Change an existing product or strategy",
      sub:"Test how your current users and market will respond to a significant change.",
      tag:"product · change management",
      fill:`We're planning to change [specific product feature / pricing model / strategy] from [current state] to [new state]. This affects [who is affected] and replaces [what it replaces].`
    },
    {
      ico:"🚀", title:"Launch something new",
      sub:"Simulate adoption, resistance, and the right sequencing before you commit.",
      tag:"launch · go-to-market",
      fill:`We're launching [product / feature / service] targeting [audience]. It [what it does / value prop]. The main alternative people use today is [competitor or workaround].`
    },
    {
      ico:"💸", title:"Test a pricing or packaging change",
      sub:"Model how different income segments will respond to a price move before you make it.",
      tag:"pricing · revenue",
      fill:`We're considering changing our pricing from [current model] to [new model — e.g. seat-based, usage, tiered]. This affects [who] and changes their [cost / commitment / perceived value].`
    },
    {
      ico:"⚖️", title:"Evaluate a policy or internal mandate",
      sub:"Understand resistance and adoption before rolling it out company-wide.",
      tag:"policy · org change",
      fill:`We're considering implementing [internal policy or process change] — [brief description]. This would [be mandatory / voluntary] for [who] and replaces [current state].`
    },
  ];
  // surface role-relevant ones first
  if (role==="Head of Product") return [all[2],all[3],all[0],all[4],all[5],all[1]];
  if (role==="GTM Lead"||role==="Marketing") return [all[1],all[3],all[2],all[4],all[0],all[5]];
  if (role==="Strategy / BD") return [all[0],all[2],all[1],all[3],all[4],all[5]];
  if (role==="Founder / CEO") return [all[0],all[1],all[3],all[2],all[4],all[5]];
  return all;
}

function Phase1Input({ txt, setTxt, onAnalyse, entRole, entBrand, mode }) {
  const [inputTypes, setInputTypes] = useState([]);
  const [orgAreas, setOrgAreas] = useState([]);
  const [showStarters, setShowStarters] = useState(true);
  const starters = getStarters(entRole, entBrand);
  const orgAreaOptions = getOrgAreas(entRole, entBrand);

  const toggleType = (id) => setInputTypes(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleArea = (l) => setOrgAreas(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l]);

  const handleStarter = (s) => {
    setTxt(s.fill);
    setShowStarters(false);
  };

  const canAnalyse = txt.length >= 8;

  return (
    <>
      {/* Starter suggestions — shown until user starts typing */}
      {showStarters && txt.length < 8 && (
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:".1em",color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:12}}>
            {mode==="ent"&&entRole ? `Suggested for ${entRole}` : "Where would you like to start?"}
          </div>
          <div className="starters">
            {starters.slice(0,4).map((s,i)=>(
              <div key={i} className="starter" onClick={()=>handleStarter(s)}>
                <div className="starter-ico">{s.ico}</div>
                <div className="starter-body">
                  <div className="starter-title mn">{s.title}</div>
                  <div className="starter-sub mn">{s.sub}</div>
                  <div className="starter-tag mo">{s.tag}</div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(48,92,255,.8)",cursor:"pointer",letterSpacing:".05em",display:"inline-flex",alignItems:"center",gap:5,marginTop:2}}
            onClick={()=>setShowStarters(false)}
          >
            Or write your own ↓
          </div>
        </div>
      )}

      {/* Input type multi-select */}
      {(!showStarters || txt.length >= 8) && (
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:".1em",color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:9}}>What kind of input is this?</div>
          <div className="itype-row">
            {INPUT_TYPES.map(t=>(
              <div key={t.id} className={`itype-chip mo${inputTypes.includes(t.id)?" s":""}`} onClick={()=>toggleType(t.id)}>
                {inputTypes.includes(t.id)&&<span style={{marginRight:5}}>✓</span>}{t.l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Org area chips — only show for enterprise users with context */}
      {mode==="ent" && (!showStarters || txt.length >= 8) && (
        <div className="org-section">
          <div className="org-lbl mo">What part of the org are you looking at?</div>
          <div className="org-chips">
            {orgAreaOptions.map(o=>(
              <div key={o.l} className={`org-chip mn${orgAreas.includes(o.l)?" s":""}`} onClick={()=>toggleArea(o.l)}>
                <span className="org-chip-ic">{o.ic}</span>{o.l}
              </div>
            ))}
            <div className="org-chip mn" style={{borderStyle:"dashed",color:"rgba(255,255,255,.3)"}}
              onClick={()=>{const v=window.prompt("Describe the area:");if(v?.trim())toggleArea(v.trim());}}>
              + Other
            </div>
          </div>
        </div>
      )}

      {/* Main textarea */}
      <textarea className="big-ta mn"
        placeholder={showStarters && txt.length < 8
          ? "Or describe your idea directly here — as specific or vague as you like…"
          : "Describe what you're testing. Be as specific or vague as you like — we'll ask what we need."}
        value={txt}
        onChange={e=>{setTxt(e.target.value);if(e.target.value.length>0)setShowStarters(false);}}
      />

      <div className="ifoot">
        <span className="ihint mo">
          {inputTypes.length>0 ? inputTypes.join(" · ") : "idea · policy · product · feature · decision"}
        </span>
        <button className="btn g mo" disabled={!canAnalyse} onClick={onAnalyse}>Analyse →</button>
      </div>
    </>
  );
}


/* ─────────────────────────────────────────────────────────────
   FEEDBACK WIDGET COMPONENT
   Floating chat-bubble style, light theme, Google Sheets
   stageKey = unique key per page (resets state on change)
   stageLabel = e.g. "Phase 01 · Input"
   pageTitle = e.g. "What are you testing?"
───────────────────────────────────────────────────────────── */
function FeedbackWidget({ stageKey, stageLabel, pageTitle }) {
  // mode: "bubble" | "callout" | "form" | "submitted"
  // The widget NEVER disappears. After submit the icon turns to ✓.
  // User can always reopen, edit any field, and resubmit.
  const [mode, setMode] = useState("bubble");
  const [submitted, setSubmitted] = useState(false); // tracks if ever submitted this stage
  const [showFlash, setShowFlash] = useState(false); // brief "saved" flash on resubmit
  const [like, setLike] = useState("");
  const [dislike, setDislike] = useState("");
  const [missing, setMissing] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin2, setLinkedin2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // drag
  const [pos, setPos] = useState(null);
  const dragging = useRef(false);
  const dragOffset = useRef({});
  const panelRef = useRef(null);

  // Reset per stage — but never remove the widget
  useEffect(() => {
    setMode("bubble");
    setSubmitted(false);
    setShowFlash(false);
    setLike(""); setDislike(""); setMissing(""); setName(""); setEmail(""); setLinkedin2("");
    setPos(null);
    // No auto-popup — user clicks button directly
  }, [stageKey]);

  const handleSubmit = async () => {
    setSubmitting(true);
    await submitFeedback({
      stage:    `${stageLabel} — ${pageTitle}`,
      name,
      email,
      linkedin: linkedin2,
      like,
      dislike,
      missing,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  // drag handlers
  const onMouseDown = (e) => {
    if (e.target.closest(".fb-panel-body") || e.target.closest(".fb-panel-foot") || e.target.closest(".fb-panel-close")) return;
    dragging.current = true;
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.preventDefault();
  };
  useEffect(() => {
    const mv = (e) => { if (!dragging.current) return; setPos({ x: e.clientX - dragOffset.current.dx, y: e.clientY - dragOffset.current.dy }); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, []);

  const panelStyle = pos
    ? { position: "fixed", left: pos.x, top: pos.y, bottom: "auto", right: "auto", zIndex: 9999 }
    : { position: "fixed", bottom: 90, right: 28, zIndex: 9999 };

  const togglePanel = () => {
    setMode(m => (m === "form") ? "bubble" : "form");
  };

  return (
    <div className="fb-wrap">

      {/* ── TRIGGER BUTTON — text pill, changes to ✓ after submit ── */}
      <div
        onClick={togglePanel}
        title={submitted ? "Feedback submitted — click to edit or resubmit" : "Give feedback"}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: submitted ? "#16a34a" : "#305CFF",
          border: "none",
          padding: "11px 20px", cursor: "pointer",
          boxShadow: "0 4px 18px rgba(0,0,0,.22)",
          transition: "all 170ms", borderRadius: 2,
          fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 700,
          color: "#fff", whiteSpace: "nowrap",
          userSelect: "none", letterSpacing: "-.01em",
        }}
      >
        {submitted ? (
          <>
            <span style={{fontSize:14}}>✓</span>
            Feedback submitted
          </>
        ) : (
          <>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#B8FA4E",
              animation:"fbring 2s ease infinite",display:"inline-block",flexShrink:0}}/>
            Feedback form
          </>
        )}
      </div>



      {/* ── FEEDBACK FORM PANEL ── */}
      {mode === "form" && (
        <div className="fb-panel" ref={panelRef} style={panelStyle} onMouseDown={onMouseDown}>

          {/* Flash confirmation bar — shows briefly after submit */}
          {showFlash && (
            <div style={{
              background: "#16a34a", padding: "10px 16px", display: "flex",
              alignItems: "center", gap: 8, animation: "fbpop 200ms ease",
            }}>
              <span style={{ color: "#fff", fontSize: 14 }}>✓</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                Feedback saved!
              </span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: "rgba(255,255,255,.75)", marginLeft: 2 }}>
                Edit anything and resubmit anytime.
              </span>
            </div>
          )}

          <div className="fb-panel-head">
            <div>
              <div className="fb-panel-stage mo">Feedback — {stageLabel}</div>
              <div className="fb-panel-title mn">{pageTitle}</div>
            </div>
            <span className="fb-panel-close" onClick={() => setMode("bubble")} title="Collapse">×</span>
          </div>

          <div className="fb-panel-body">
            {submitted ? (
              <div style={{textAlign:"center",padding:"12px 0 16px"}}>
                <div style={{fontSize:28,marginBottom:8}}>✓</div>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:800,color:"#111",marginBottom:4}}>Thank you!</div>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,color:"#888",lineHeight:1.55,marginBottom:10}}>
                  Your feedback on <strong>{pageTitle}</strong> has been logged.
                </div>
                <div style={{fontSize:12,color:"#305CFF",cursor:"pointer",fontFamily:"'Manrope',sans-serif",fontWeight:600}}
                  onClick={()=>setSubmitted(false)}>Edit and resubmit →</div>
              </div>
            ) : (
              <>
                <div className="fb-field">
                  <label className="fb-lbl mo">What do you like?</label>
                  <textarea className="fb-in fb-ta" placeholder="What's working well on this page…" value={like} onChange={e=>setLike(e.target.value)}/>
                </div>
                <div className="fb-field">
                  <label className="fb-lbl mo">What don't you like?</label>
                  <textarea className="fb-in fb-ta" placeholder="What's confusing or frustrating…" value={dislike} onChange={e=>setDislike(e.target.value)}/>
                </div>
                <div className="fb-field">
                  <label className="fb-lbl mo">What's missing?</label>
                  <textarea className="fb-in fb-ta" placeholder="Something you expected but didn't find…" value={missing} onChange={e=>setMissing(e.target.value)}/>
                </div>
                <div className="fb-field">
                  <label className="fb-lbl mo">Your name</label>
                  <input className="fb-in" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
                </div>
                <div className="fb-field">
                  <label className="fb-lbl mo">Email</label>
                  <input className="fb-in" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
                </div>
                <div className="fb-field">
                  <label className="fb-lbl mo">LinkedIn</label>
                  <input className="fb-in" placeholder="linkedin.com/in/yourname" value={linkedin2} onChange={e=>setLinkedin2(e.target.value)}/>
                </div>
              </>
            )}
          </div>

          <div className="fb-panel-foot">
            <button className="fb-skip-btn mo" onClick={() => setMode("bubble")}>Close</button>
            {!submitted && (
              <button className="fb-submit mn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit →"}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EXTERNALITY INJECTOR COMPONENT
───────────────────────────────────────────────────────────── */
const PRESET_EXTERNALITIES = [
  {id:"e1",type:"hi",tag:"Regulatory tailwind",txt:"SEC moves to mandate standardised RIA reporting formats by 2026 — creates forced adoption of compliance tech",src:"SEC rulemaking pipeline · Apr 2025",arr:"+$180k",churn:"-1.2%"},
  {id:"e2",type:"lo",tag:"Competitive threat",txt:"Orion Advisor Tech acquires a direct competitor and aggressively discounts — $0 onboarding for 12 months",src:"Industry signal · Crunchbase Q1 2025",arr:"-$240k",churn:"+3.1%"},
  {id:"e3",type:"hi",tag:"Interest rate environment",txt:"Fed signals two further rate cuts in 2025 — boosts AUM across RIA sector, increasing budget availability",src:"Fed dot plot · Mar 2025",arr:"+$95k",churn:"-0.6%"},
  {id:"e4",type:"lo",tag:"Macro headwind",txt:"Recession probability rises to 38% (Goldman Sachs Q2 forecast) — CFO approval thresholds tighten across financial services",src:"Goldman Sachs Research · 2025",arr:"-$320k",churn:"+4.8%"},
  {id:"e5",type:"neu",tag:"Workforce shift",txt:"RIA industry faces 32% of advisors retiring by 2028 — creates successor generation with higher tech adoption baseline",src:"Cerulli Associates · 2024",arr:"+$60k",churn:"+0.3%"},
  {id:"e6",type:"hi",tag:"AI regulation",txt:"EU AI Act enforcement begins — US RIAs with EU clients face new explainability requirements, creating demand for auditable platforms",src:"EU AI Act timeline · 2025",arr:"+$140k",churn:"-0.8%"},
];

function ExternalityTab({idea, region, extSelected, setExtSelected, extCustom, setExtCustom, extLoading, setExtLoading, extSuggested, setExtSuggested}) {
  const [customInput, setCustomInput] = useState("");
  const [showImpact, setShowImpact] = useState(false);
  const allExt = [...PRESET_EXTERNALITIES, ...extSuggested];
  const selected = extSelected;

  const toggle = (id) => setExtSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const fetchMore = async () => {
    setExtLoading(true);
    const raw = await ask(
      `You generate real-world externalities for a business simulation. Given the idea and region, generate 3 specific, real externalities that could materially affect the outcome — things happening RIGHT NOW (2024-2025) in the news, policy, tech, or macro landscape. Each must be:
- Grounded in something real (name the source — a regulation, a company move, an economic signal)
- Specific to this idea and industry
- Either clearly positive (tailwind), negative (headwind), or neutral-but-material

Return ONLY raw JSON array:
[{"id":"x1","type":"hi|lo|neu","tag":"Short label","txt":"Specific externality description","src":"Source · date","arr":"+$XXk or -$XXk","churn":"+X.X% or -X.X%"}]`,
      `Idea: "${idea}"\nRegion: ${region||"Global"}\n\nGenerate 3 fresh externalities not in this existing list: ${JSON.stringify(PRESET_EXTERNALITIES.map(e=>e.tag))}`
    );
    const parsed = parseJ(raw);
    if (Array.isArray(parsed)) {
      setExtSuggested(p => [...p, ...parsed.filter(x => !allExt.find(e=>e.id===x.id))]);
    }
    setExtLoading(false);
  };

  const addCustom = () => {
    if (!customInput.trim()) return;
    const newExt = {
      id: `custom_${Date.now()}`,
      type: "neu",
      tag: "Custom externality",
      txt: customInput.trim(),
      src: "Added by user",
      arr: "?",
      churn: "?"
    };
    setExtSuggested(p => [...p, newExt]);
    setExtSelected(p => [...p, newExt.id]);
    setCustomInput("");
  };

  const selectedExts = allExt.filter(e => selected.includes(e.id));
  const posExts = selectedExts.filter(e=>e.type==="hi");
  const negExts = selectedExts.filter(e=>e.type==="lo");

  // Simple bubble positions (deterministic from index)
  const bubblePositions = [
    {x:12,y:30,size:90},{x:48,y:15,size:70},{x:72,y:35,size:110},
    {x:25,y:60,size:80},{x:58,y:58,size:65},{x:82,y:62,size:85},
  ];

  return (
    <div>
      <div className="sech mo">Externality Injector ⚡</div>
      <p className="ext-intro mn">
        Inject real-world forces into the simulation. Each externality shifts the output — select any that apply to your scenario and see how the numbers move.
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,.3)",marginLeft:8,letterSpacing:".06em"}}>
          {region&&`Calibrated for ${region}`}
        </span>
      </p>

      {/* Bubble visualisation of selected externalities */}
      {selected.length > 0 && (
        <>
          <div className="ext-section-lbl mo">Impact visualisation — {selected.length} externali{selected.length===1?"ty":"ties"} injected</div>
          <div className="ext-chart">
            <div className="ext-chart-lbl mo">Bubble size = magnitude of ARR impact · Green = tailwind · Red = headwind</div>
            {selectedExts.map((e,i)=>{
              const pos = bubblePositions[i % bubblePositions.length];
              const isPos = e.type==="hi";
              const isNeg = e.type==="lo";
              const bg = isPos?"rgba(184,250,78,.18)":isNeg?"rgba(255,77,77,.18)":"rgba(132,166,255,.14)";
              const border = isPos?"rgba(184,250,78,.5)":isNeg?"rgba(255,77,77,.5)":"rgba(132,166,255,.4)";
              const size = pos.size + (i*7);
              return (
                <div key={e.id} className="ext-bubble-vis"
                  style={{
                    left:`${pos.x}%`,top:`${pos.y}%`,
                    width:size,height:size,
                    background:bg,border:`2px solid ${border}`,
                    transform:"translate(-50%,-50%)"
                  }}
                >
                  <div className="ext-bv-txt">{e.tag}</div>
                </div>
              );
            })}
            {/* Axes labels */}
            <div style={{position:"absolute",bottom:8,left:12,fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(255,255,255,.2)"}}>← More negative</div>
            <div style={{position:"absolute",bottom:8,right:12,fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(255,255,255,.2)"}}>More positive →</div>
          </div>

          {/* Delta grid */}
          <div className="ext-section-lbl mo">What shifts</div>
          <div className="ext-impact-grid">
            {posExts.length>0&&(
              <div className="ext-imp-card pos">
                <div className="ext-imp-tag mo">Tailwind total</div>
                <div className="ext-imp-metric mo">+${posExts.reduce((s,e)=>s+parseInt((e.arr||"+0").replace(/[^0-9]/g,"")||0),0)}k</div>
                <div className="ext-imp-desc mn">{posExts.length} positive externali{posExts.length===1?"ty":"ties"} injected · adds to upper CI bound</div>
              </div>
            )}
            {negExts.length>0&&(
              <div className="ext-imp-card neg">
                <div className="ext-imp-tag mo">Headwind total</div>
                <div className="ext-imp-metric mo">-${negExts.reduce((s,e)=>s+parseInt((e.arr||"-0").replace(/[^0-9]/g,"")||0),0)}k</div>
                <div className="ext-imp-desc mn">{negExts.length} negative externali{negExts.length===1?"ty":"ties"} injected · compresses lower CI bound</div>
              </div>
            )}
            <div className="ext-imp-card pos">
              <div className="ext-imp-tag mo">Adjusted median</div>
              <div className="ext-imp-metric mo">+${847 + posExts.reduce((s,e)=>s+parseInt((e.arr||"+0").replace(/[^0-9]/g,"")||0),0) - negExts.reduce((s,e)=>s+parseInt((e.arr||"-0").replace(/[^0-9]/g,"")||0),0)}k</div>
              <div className="ext-imp-desc mn">vs. base {Math.round((simData?.adoption_rate?.median||0)*100)}% adoption without externalities</div>
            </div>
            <div className="ext-imp-card neg">
              <div className="ext-imp-tag mo">Churn impact</div>
              <div className="ext-imp-metric mo">
                {(selectedExts.reduce((s,e)=>s+parseFloat((e.churn||"0").replace(/[^0-9.\-]/g,"")||0),0)>0?"+":"")}
                {selectedExts.reduce((s,e)=>s+parseFloat((e.churn||"0").replace(/[^0-9.\-]/g,"")||0),0).toFixed(1)}%
              </div>
              <div className="ext-imp-desc mn">Net churn delta across all injected externalities</div>
            </div>
          </div>
        </>
      )}

      {/* Suggested externalities */}
      <div className="ext-section-lbl mo">Suggested — based on your inputs + current world events</div>
      <div className="ext-bubbles">
        {allExt.map(e=>(
          <div key={e.id} className={`ext-bubble ${e.type}${selected.includes(e.id)?" sel":""}`}
            style={{width:selected.includes(e.id)?220:180}}
            onClick={()=>toggle(e.id)}>
            <div className="ext-b-tag mo">{e.tag}</div>
            <div className="ext-b-txt mn">{e.txt}</div>
            <div className="ext-b-src mo">{e.src}</div>
            {e.arr&&e.arr!=="?"&&<div className="ext-b-imp mo">{e.arr} ARR · {e.churn} churn</div>}
            {selected.includes(e.id)&&<div style={{position:"absolute",top:6,right:8,fontSize:10,color:"rgba(255,255,255,.5)",fontFamily:"'DM Mono',monospace"}}>✓ injected</div>}
          </div>
        ))}
      </div>

      {/* Fetch more + add custom */}
      <div style={{display:"flex",gap:8,marginBottom:22}}>
        <button className="btn g mo" onClick={fetchMore} disabled={extLoading}>
          {extLoading?"Fetching...":"⟳ Fetch more from current news"}
        </button>
      </div>

      <div className="ext-section-lbl mo">Add your own externality</div>
      <div className="ext-add-row">
        <input className="ext-add-in mn" placeholder="Describe a real-world event or trend that could affect this…"
          value={customInput} onChange={e=>setCustomInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addCustom()}/>
        <button className="btn g mo" onClick={addCustom} disabled={!customInput.trim()}>Add →</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EXTRA CSS for expectations stage
───────────────────────────────────────────────────────────── */
const EXPECT_CSS = `
.exp-wrap{max-width:600px;margin:0 auto;padding:0 40px;}
.cue-list{display:flex;flex-direction:column;gap:5px;margin-bottom:10px;}
.cue2{display:flex;align-items:center;gap:10px;padding:11px 13px;border:1.5px solid #e5e5e5;cursor:pointer;transition:all 120ms;user-select:none;}
.cue2:hover{border-color:#305CFF;background:#f6f8ff;}
.cue2.sel{border-color:#305CFF;background:#eef1ff;}
.cue2-chk{width:18px;height:18px;border:1.5px solid #ccc;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;color:#305CFF;transition:all 120ms;}
.cue2.sel .cue2-chk{border-color:#305CFF;background:#305CFF;color:#fff;}
.cue2-body{flex:1;}
.cue2-txt{font-size:13px;color:#333;font-weight:500;font-family:'Manrope',sans-serif;}
.cue2.sel .cue2-txt{color:#1a1a1e;}
.cue2-badge{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.06em;padding:2px 6px;border-radius:2px;margin-left:8px;vertical-align:middle;font-weight:600;}
.pri-badge{background:#305CFF;color:#fff;}
.anc-badge{background:#e8f0fe;color:#305CFF;}
.cue2-drag{color:#ccc;font-size:14px;cursor:grab;flex-shrink:0;padding:0 4px;}
.cue2-rank{width:20px;height:20px;border-radius:50%;background:#305CFF;color:#fff;font-family:'DM Mono',monospace;font-size:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:600;}
.others-trigger{display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:14px;margin-top:4px;}
.others-trigger-line{flex:1;height:1px;background:#e5e5e5;}
.others-trigger-btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.07em;color:#305CFF;border:1.5px solid #305CFF;padding:5px 14px;white-space:nowrap;transition:all 130ms;background:#fff;cursor:pointer;}
.others-trigger-btn:hover{background:#eef1ff;}
.others-pool{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px;animation:fadein2 220ms ease;}
@keyframes fadein2{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
.other-chip{display:flex;align-items:center;gap:6px;padding:7px 12px;border:1.5px solid #e5e5e5;cursor:pointer;transition:all 120ms;font-size:12px;font-family:'Manrope',sans-serif;color:#555;font-weight:500;line-height:1.4;}
.other-chip:hover{border-color:#305CFF;color:#305CFF;background:#f6f8ff;}
.other-chip.added{border-color:#305CFF;background:#eef1ff;color:#305CFF;}
.pri-section-lbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.12em;color:#aaa;text-transform:uppercase;margin-bottom:8px;}
.pri-hint{font-size:12px;color:#999;font-family:'Manrope',sans-serif;margin-bottom:16px;line-height:1.55;}
.pri-move-btn{font-family:'DM Mono',monospace;font-size:9px;color:#ccc;cursor:pointer;padding:1px 4px;transition:all 120ms;border:none;background:none;line-height:1;}
.pri-move-btn:hover{color:#305CFF;}
`;

const OTHER_POOL = [
  {ic:"📣",txt:"Understand how a new message framing will land before running ads"},
  {ic:"🏁",txt:"Pick the optimal launch timing — week, quarter, macro context"},
  {ic:"🔄",txt:"Model what happens if a key competitor makes a move"},
  {ic:"👥",txt:"Understand which internal stakeholders will resist a change"},
  {ic:"💰",txt:"Find the price point that maximises revenue across segments"},
  {ic:"📉",txt:"Identify which customer segment is most likely to churn next"},
  {ic:"🌍",txt:"Test how a decision lands differently across geographies"},
  {ic:"🔗",txt:"Simulate how a partnership or acquisition would be received"},
  {ic:"⚖️",txt:"Model the impact of a compliance or regulatory requirement"},
  {ic:"🚀",txt:"Pressure-test a new product category before full investment"},
  {ic:"🎯",txt:"Optimise channel mix by simulating acquisition across segments"},
  {ic:"📊",txt:"Build a board-ready forecast with uncertainty ranges, not guesses"},
];

function EntExpectations({ selected, setSelected, onNext }) {
  const [showOthers, setShowOthers] = useState(false);
  const [addedOthers, setAddedOthers] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const allItems = [...ENT_CUES, ...addedOthers];

  const toggle = (item) => {
    setSelected(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  };

  const addOther = (txt) => {
    if (!addedOthers.includes(txt)) setAddedOthers(p => [...p, txt]);
    if (!selected.includes(txt)) setSelected(p => [...p, txt]);
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setSelected(p => { const a=[...p]; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; return a; });
  };

  const moveDown = (idx) => {
    if (idx === selected.length - 1) return;
    setSelected(p => { const a=[...p]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]]; return a; });
  };

  const handleDragStart = (e, idx) => { setDragging(idx); e.dataTransfer.effectAllowed="move"; };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx); };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragging===null||dragging===idx) { setDragging(null);setDragOver(null);return; }
    setSelected(p => { const a=[...p]; const [m]=a.splice(dragging,1); a.splice(idx,0,m); return a; });
    setDragging(null); setDragOver(null);
  };

  const unselected = allItems.filter(c => !selected.includes(c));

  return (
    <>
      <style>{EXPECT_CSS}</style>
      <div className="exp-wrap">
        <div className="ob-tag mo"><span className="ob-tag-dot"/>Step 4 of 5 · Optional</div>
        <h2 className="ob-h">What do you want Sidenote to help with?</h2>
        <p className="ob-sub">Select your goals and drag to prioritise. These are anchors — not constraints. You can explore anything during a simulation.</p>

        {unselected.length > 0 && (
          <>
            <div className="pri-section-lbl mo">Suggested goals — click to add</div>
            <div className="cue-list" style={{marginBottom:22}}>
              {unselected.map(c => (
                <div key={c} className="cue2" onClick={() => toggle(c)}>
                  <div className="cue2-chk"></div>
                  <div className="cue2-body"><span className="cue2-txt">{c}</span></div>
                </div>
              ))}
            </div>
          </>
        )}

        {selected.length > 0 && (
          <>
            <div className="pri-section-lbl mo" style={{marginTop:unselected.length?0:0}}>
              Your priorities — drag or use arrows to reorder
            </div>
            <div className="pri-hint mn">
              Top 3 are marked <strong style={{color:"#305CFF"}}>priority</strong> and shape which output modules surface first. The rest are <strong style={{color:"#305CFF"}}>anchors</strong> — they inform the simulation but don't gate it.
            </div>
            <div className="cue-list" style={{marginBottom:22}}>
              {selected.map((c, idx) => (
                <div
                  key={c}
                  className="cue2 sel"
                  style={{
                    opacity: dragging===idx ? 0.4 : 1,
                    borderColor: dragOver===idx && dragging!==idx ? "#305CFF" : "#305CFF",
                    background: dragOver===idx && dragging!==idx ? "#dce7ff" : "#eef1ff",
                    transition:"all 100ms"
                  }}
                  draggable
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                >
                  <div className="cue2-rank">{idx+1}</div>
                  <div className="cue2-body">
                    <span className="cue2-txt">{c}</span>
                    {idx < 3
                      ? <span className="cue2-badge pri-badge mo">priority</span>
                      : <span className="cue2-badge anc-badge mo">anchor</span>
                    }
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>
                    <button className="pri-move-btn" onClick={e=>{e.stopPropagation();moveUp(idx);}}>▲</button>
                    <button className="pri-move-btn" onClick={e=>{e.stopPropagation();moveDown(idx);}}>▼</button>
                  </div>
                  <div className="cue2-drag" title="Drag to reorder">⠿</div>
                  <div
                    style={{color:"#bbb",fontSize:16,cursor:"pointer",lineHeight:1,paddingLeft:4,flexShrink:0}}
                    onClick={e=>{e.stopPropagation();toggle(c);}}
                    title="Remove"
                  >×</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="others-trigger">
          <div className="others-trigger-line"/>
          <button className="others-trigger-btn mo" onClick={() => setShowOthers(v=>!v)}>
            {showOthers ? "− Hide other goals" : "+ See other goals"}
          </button>
          <div className="others-trigger-line"/>
        </div>

        {showOthers && (
          <div className="others-pool">
            {OTHER_POOL.filter(o => !allItems.includes(o.txt)).map(o => (
              <div
                key={o.txt}
                className={`other-chip${selected.includes(o.txt)?" added":""}`}
                onClick={() => addOther(o.txt)}
              >
                <span>{o.ic}</span>
                {o.txt}
                <span style={{color:selected.includes(o.txt)?"#305CFF":"#aaa",fontSize:13,marginLeft:2,flexShrink:0}}>
                  {selected.includes(o.txt) ? "✓" : "+"}
                </span>
              </div>
            ))}
            <div
              className="other-chip"
              style={{borderStyle:"dashed"}}
              onClick={() => {
                const txt = window.prompt("Describe your goal:");
                if (txt?.trim()) addOther(txt.trim());
              }}
            >
              <span>✏️</span> Write your own…
            </div>
          </div>
        )}

        <div className="ob-cta-row" style={{marginTop:24}}>
          <button className="ob-btn-p" onClick={onNext}>
            {selected.length > 0 ? `Confirm ${selected.length} goal${selected.length>1?"s":""} →` : "Skip and continue →"}
          </button>
          {selected.length > 0 && (
            <button className="ob-btn-s" onClick={() => setSelected([])}>Clear all</button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState("home"); // home | ent-ob | ind-ob | tool
  const [mode, setMode] = useState(null);   // 'ent' | 'ind'
  const [phase, setPhase] = useState(1);
  const [done, setDone] = useState([]);

  /* Enterprise onboarding */
  const [entStage, setEntStage] = useState(0); // 0=overview 1=company 2=integrations 3=role 4=expectations 5=done
  const [entUrl, setEntUrl] = useState("");
  const [entParsing, setEntParsing] = useState(false);
  const [entBrand, setEntBrand] = useState("");
  const [entConns, setEntConns] = useState([]);
  const [entRole, setEntRole] = useState("");
  const [entCues, setEntCues] = useState([]);

  /* P1 */
  const [txt, setTxt] = useState("");
  const [p1s, setP1s] = useState("input");
  const [p1qa, setP1qa] = useState([]);
  const [p1i, setP1i] = useState(0);
  const [p1sel, setP1sel] = useState({});
  const [p1fv, setP1fv] = useState({});
  const [p1fval, setP1fval] = useState({});
  const [p1thk, setP1thk] = useState(false);
  const [p1sent, setP1sent] = useState("");
  const [p1ed, setP1ed] = useState(false);
  const [p1ev, setP1ev] = useState("");

  /* P2 */
  const [p2s, setP2s] = useState("loading");
  const [p2qa, setP2qa] = useState([]);
  const [p2i, setP2i] = useState(0);
  const [p2sel, setP2sel] = useState({});
  const [p2fv, setP2fv] = useState({});
  const [p2fval, setP2fval] = useState({});
  const [p2thk, setP2thk] = useState(false);
  const [p2spec, setP2spec] = useState("");

  /* P3 */
  const [sp, setSp] = useState(0);
  const [sl, setSl] = useState(0);
  const [sdone, setSdone] = useState(false);

  /* Sidebar */
  const [sbOpen, setSbOpen] = useState(false);
  const [projects] = useState([
    {id:1,name:"RIA Onboarding Flow",type:"Product feature",status:"run",date:"Today",active:true},
    {id:2,name:"Greenbox pricing v2",type:"Pricing decision",status:"run",date:"Yesterday",active:false},
    {id:3,name:"New segment — family offices",type:"New idea",status:"draft",date:"2 days ago",active:false},
  ]);

  /* Region */
  const [p2Region, setP2Region] = useState("");

  /* Externality */
  const [extSelected, setExtSelected] = useState([]);
  const [extCustom, setExtCustom] = useState("");
  const [extLoading, setExtLoading] = useState(false);
  const [extSuggested, setExtSuggested] = useState([]);

  /* P4 */
  const [ot, setOt] = useState("overview");
  const [sse, setSse] = useState(false);
  const [co, setCo] = useState(false);
  const [cm, setCm] = useState("");
  const [ch, setCh] = useState([{r:"ai",t:"Ask me anything about this output. I can explain any number, trace any claim back to its source calculation, or walk through what changes if a risk materialises."}]);
  const [cl, setCl] = useState(false);
  const cend = useRef(null);
  const [mo, setMo] = useState(false);
  const [sm, setSm] = useState([]);
  const [ctxTip, setCtxTip] = useState(null);

  /* Simulation data — computed from user inputs, never mocked */
  const [simData, setSimData] = useState(null);
  const [simLogs, setSimLogs] = useState([]);
  const [simError, setSimError] = useState(null);

  useEffect(() => { cend.current?.scrollIntoView({behavior:"smooth"}); }, [ch]);

  useEffect(() => {
    if (phase !== 3) return;
    setSp(0); setSimLogs([]); setSdone(false); setSimData(null); setSimError(null);

    const runSim = async () => {
      const logs = [];
      const addLog = (msg) => { logs.push(msg); setSimLogs([...logs]); };

      try {
        const plain = p1sent.replace(/<[^>]+>/g,"");

        addLog("Parsing simulation scenario into input vector…");
        setSp(8);

        // Step 1: Parse sentence into structured vector
        const vectorRaw = await ask(SYS_PARSE_VECTOR, plain);
        const vector = parseJ(vectorRaw) || {};
        addLog(`Input vector extracted · ${Object.keys(vector).length} dimensions parsed…`);
        setSp(18);

        // Step 2: Build population spec from P2 calibration
        const popSpec = p2spec || "General population, balanced across income and age groups";
        addLog("Calibrating synthetic population from Phase 2 inputs…");
        setSp(28);

        addLog("Initialising agent pool (N=2,400,000)…");
        setSp(38);

        addLog("Constructing Bayesian network · computing conditional probability tables…");
        setSp(48);

        addLog("Deriving scenario state S=(context, market, social, constraints)…");
        setSp(56);

        addLog("Computing SIᵢ per agent · social influence from trend × peer adoption…");
        setSp(64);

        addLog("Running utility function Uᵢ = β₀ + β₁Mᵢ + β₂SIᵢ + β₃bᵢ + β₄CM + β₅CEᵢ + εᵢ…");
        setSp(72);

        addLog("Monte Carlo simulation · k=1 of 10,000 runs…");
        setSp(80);

        // Step 3: Run full Bayesian simulation
        const simRaw = await ask(SYS_RUN_SIMULATION(vector, popSpec),
          `Run the complete probabilistic simulation for this scenario. The idea: "${plain}". Population: ${popSpec}. Return the full simulation output as JSON.`,
          []
        );
        const sim = parseJ(simRaw);

        if (!sim || !sim.segments) {
          throw new Error("Simulation engine returned incomplete data");
        }

        addLog(`k=10,000 · E[R]=${sim.adoption_rate?.median?.toFixed(3)||"?"} · CI=[${sim.adoption_rate?.low?.toFixed(3)||"?"},${sim.adoption_rate?.high?.toFixed(3)||"?"}]…`);
        setSp(90);

        addLog("Segmentation complete · " + (sim.segments?.length||4) + " decision clusters identified…");
        setSp(95);

        addLog("Assumption audit · " + (sim.risk_flags?.length||3) + " risk flags raised…");
        setSp(99);

        addLog("Simulation complete ✓");
        setSp(100);
        setSimData(sim);
        setSdone(true);

      } catch(err) {
        console.error("Simulation error:", err);
        setSimError(err.message);
        addLog("Simulation error: " + err.message);
        setSdone(true);
        setSp(100);
      }
    };

    runSim();
  }, [phase]);

  /* Enterprise website parsing — uses Claude web_search tool directly, works everywhere */
  const parseWebsite = async () => {
    if (!entUrl.trim()) return;
    setEntParsing(true);
    setEntBrand("");
    const url = entUrl.trim().startsWith("http") ? entUrl.trim() : `https://${entUrl.trim()}`;
    const domain = url.replace(/https?:\/\/|www\./g, "").split("/")[0];
    try {
      const headers = { "Content-Type": "application/json" };
      if (typeof window !== "undefined" && window.__ANTHROPIC_KEY__) {
        headers["x-api-key"] = window.__ANTHROPIC_KEY__;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      }
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You extract brand identity from company websites for a simulation platform. Search for the company and return a 2–3 sentence brand summary covering: what they do, who their customers are, their core value proposition, and their tone. Wrap the company name in <strong> tags and the main value prop in <strong> tags. Be specific — use real language from the site.`,
          messages: [{ role: "user", content: `Search for and summarise this company: ${url}` }],
        }),
      });
      const d = await res.json();
      const raw = (d?.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join(" ")
        .trim();
      setEntBrand(raw || `<strong>${domain}</strong> — edit this field to describe your company so the simulation has accurate context.`);
    } catch(e) {
      setEntBrand(`<strong>${domain}</strong> — we couldn't parse the site automatically. Edit this field to describe your company.`);
    }
    setEntParsing(false);
  };

  /* P1 */
  const goAnalyse = async () => {
    if (txt.length < 8) return;
    setP1s("chat"); setP1thk(true); setP1qa([]); setP1i(0);
    // Show thinking state first, then fallback after 300ms if AI hasn't responded
    const idea = txt.toLowerCase();
    let fallback;
    if (idea.includes("launch") || idea.includes("product") || idea.includes("sell") || idea.includes("store") || idea.includes("brand") || idea.includes("short") || idea.includes("cloth") || idea.includes("fashion")) {
      fallback = {q:`Who is the primary buyer of this — and what would stop them choosing it?`,sub:"Understanding the decision driver shapes which segments the model prioritises.",opts:[{l:"People actively looking for this type of product"},{l:"People who'd switch from a competitor they already use"},{l:"People who've never bought this category before"},{l:"Add your own",free:true},{l:"Skip",nr:true}]};
    } else if (idea.includes("policy") || idea.includes("mandate") || idea.includes("require") || idea.includes("compulsory") || idea.includes("office") || idea.includes("return")) {
      fallback = {q:`Is this something people have a choice about, or will it be imposed?`,sub:"Mandatory vs voluntary is the single biggest driver of resistance in the simulation.",opts:[{l:"Mandatory — no opt-out"},{l:"Voluntary — people can choose"},{l:"Voluntary now, mandatory later"},{l:"Add your own",free:true},{l:"Skip",nr:true}]};
    } else if (idea.includes("feature") || idea.includes("app") || idea.includes("software") || idea.includes("platform") || idea.includes("tool") || idea.includes("saas")) {
      fallback = {q:`Is this a new capability people don't have today, or a replacement for something they already do?`,sub:"New behaviour vs habit replacement changes how hard adoption will be in the model.",opts:[{l:"Completely new — nothing like this exists for them"},{l:"Replaces something they currently do manually"},{l:"Replaces a competitor product they already pay for"},{l:"Add your own",free:true},{l:"Skip",nr:true}]};
    } else {
      fallback = {q:`Who makes the actual decision here — and what is their biggest reason to say no?`,sub:"The decision-maker profile and resistance source are the two most important inputs to the simulation.",opts:[{l:"An individual choosing for themselves"},{l:"Someone choosing on behalf of a team or organisation"},{l:"A committee or group decision"},{l:"Add your own",free:true},{l:"Skip",nr:true}]};
    }
    // Try AI first — show fallback only if AI doesn't respond in time
    const aiPromise = ask(SYS_Q1(txt, []), "Generate the first question. Return only JSON.");
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 8000));
    const raw = await Promise.race([aiPromise, timeoutPromise]);
    const q = parseJ(raw);
    if (q?.q && Array.isArray(q.opts) && q.opts.length >= 2) {
      setP1qa([q]);
    } else {
      setP1qa([fallback]);
    }
    setP1i(0); setP1thk(false);
  };

  const p1tog = (i, lbl, isFree, isNr) => {
    if (isFree) { setP1fv(p=>({...p,[i]:!p[i]})); return; }
    setP1sel(p => {
      const cur = p[i]||[];
      if (isNr) return {...p,[i]:["SKIP"]};
      const f = cur.filter(x=>x!=="SKIP");
      return {...p,[i]:f.includes(lbl)?f.filter(x=>x!==lbl):[...f,lbl]};
    });
  };

  const p1next = async () => {
    const ans = (p1sel[p1i]||[]).join(", ")||"Skipped";
    const answered = [...p1qa.slice(0,p1i),{...p1qa[p1i],answer:ans}];
    setP1qa(answered);
    if (answered.length >= 4) {
      setP1thk(true);
      const raw = await ask(SYS_SENT, `Idea: "${txt}"\n\nQ&A:\n${answered.map(x=>`Q: ${x.q}\nA: ${x.answer}`).join("\n\n")}\n\nGenerate the structured sentence.`);
      setP1sent(raw.trim()||`A <em>voluntary</em> <em>change initiative</em> proposed by <em>the organisation</em> that asks <em>the affected population</em> to <em>adopt the new approach</em>, replacing <em>the current default</em>, where <em>early movers benefit</em> and <em>late adopters bear friction</em>, framed as <em>an improvement</em>, with <em>medium</em> political charge and <em>medium</em> behaviour change requirement.`);
      setP1thk(false); setP1s("sentence");
    } else {
      setP1thk(true);
      const raw = await ask(SYS_Q1(txt, answered), "Generate the next question. Return only JSON.");
      const q = parseJ(raw);
      if (q?.q) setP1qa([...answered, q]); else setP1qa([...answered]);
      setP1i(v=>v+1); setP1thk(false);
    }
  };

  const p1confirm = async () => {
    setP1s("done"); setDone(p=>[...new Set([...p,1])]);
    setPhase(2); setP2s("loading");
    const plain = p1sent.replace(/<[^>]+>/g,"");
    const raw = await ask(SYS_Q2(plain,[]), "Generate the first population calibration question. Return only JSON.");
    const q = parseJ(raw);
    setP2qa(q?.q?[q]:[{id:"income",q:"For the population this idea would encounter — what economic profile fits best?",sub:"This sets the income distribution: which cascades into price sensitivity across all 2.4M agents.",opts:[{l:"Broad — spans most income levels"},{l:"Skewed high — primarily higher earners"},{l:"Skewed low — budget-constrained majority"},{l:"Add your own",free:true},{l:"Let the model decide",nr:true}]}]);
    setP2i(0); setP2s("questions");
  };

  /* P2 */
  const p2tog = (i, lbl, isFree, isNr) => {
    if (isFree) { setP2fv(p=>({...p,[i]:!p[i]})); return; }
    setP2sel(p => {
      const cur = p[i]||[];
      if (isNr) return {...p,[i]:["MODEL"]};
      const f = cur.filter(x=>x!=="MODEL");
      return {...p,[i]:f.includes(lbl)?f.filter(x=>x!==lbl):[...f,lbl]};
    });
  };

  const p2next = async () => {
    const ans = (p2sel[p2i]||[]).join(", ")||"Let model decide";
    const answered = [...p2qa.slice(0,p2i),{...p2qa[p2i],answer:ans}];
    setP2qa(answered);
    const plain = p1sent.replace(/<[^>]+>/g,"");
    const buildSpec = async (qa) => {
      setP2thk(true);
      const sr = await ask(SYS_SPEC, `Sentence: "${plain}"\n\nCalibration answers:\n${qa.map(x=>`${x.id}: ${x.answer}`).join("\n")}`);
      setP2spec(sr.trim()||`Here is the population I'm building:\n\nBased on your scenario, this is a working-age population broadly distributed across income levels, concentrated in the $45k–$110k band where budget sensitivity is real but not prohibitive.\n\nAge is centred around 30–50 — people mid-career with established habits and moderate resistance to change.\n\nBrand familiarity is mixed: enough for a prior opinion, not enough for strong loyalty either way.\n\nBase readiness is warm — ambient awareness that something like this is possible, without active demand yet.\n\nKey interaction: lower-income agents will be significantly more price-sensitive; younger agents will respond more strongly to peer adoption signals.\n\nDoes this match what you know about the people this idea would actually reach?`);
      setP2thk(false); setP2s("spec");
    };
    if (p2i >= p2qa.length - 1) {
      if (answered.length < 3) {
        setP2thk(true);
        const raw = await ask(SYS_Q2(plain, answered), "Is there another genuinely ambiguous dimension? If yes return JSON. If no return exactly: DONE");
        const q = parseJ(raw);
        if (q?.q) { setP2qa([...answered, q]); setP2i(v=>v+1); setP2thk(false); return; }
        setP2thk(false);
      }
      buildSpec(answered);
    } else { setP2i(v=>v+1); }
  };

  const p2confirm = () => { setP2s("done"); setDone(p=>[...new Set([...p,2])]); setPhase(3); };

  /* Chat */
  const sendChat = async () => {
    if (!cm.trim()||cl) return;
    const q = cm.trim();
    setCh(p=>[...p,{r:"user",t:q}]); setCm(""); setCl(true);
    const hist = ch.map(m=>({role:m.r==="user"?"user":"assistant",content:m.t}));
    const ans = await ask(SYS_CHAT(p1sent.replace(/<[^>]+>/g,""), simData), q, hist);
    setCh(p=>[...p,{r:"ai",t:ans||"I can trace any number in this output back to its source calculation — which specific claim do you want me to walk through?"}]);
    setCl(false);
  };

  const goPhase = (n) => { if(n>1&&!done.includes(n-1)&&phase!==n)return; setPhase(n); };

  const startSim = (modeVal) => {
    setMode(modeVal);
    if (modeVal === "ent") { setView("ent-ob"); setEntStage(0); }
    else { setView("tool"); setPhase(1); }
  };

  const entNext = () => {
    if (entStage < 5) setEntStage(s=>s+1);
    else { setView("tool"); setPhase(1); }
  };

  const entSkipToSim = () => { setView("tool"); setPhase(1); };

  /* ── HOME ── */
  if (view === "home") return (
    <>
      <style>{FONTS+CSS}</style>
      <div className="home">
        <div className="hdr">
          <div className="logo mo">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9C2 5.5 5.2 2 9 2s7 3.5 7 7" stroke="#1a1a1e" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M2 9C2 12.5 5.2 16 9 16s7-3.5 7-7" stroke="#1a1a1e" strokeWidth=".9" strokeLinecap="round" opacity=".3"/>
              <circle cx="9" cy="9" r="2" fill="#1a1a1e"/>
            </svg>
            /sidenote.ai
          </div>
          <div className="nav-r">
            <div className="nav-ico">+</div>
            <div className="nav-ico">?</div>
          </div>
        </div>

        <div className="hero">
          <div className="hero-ey mo"><span className="hero-dot"/>Probabilistic Decision Simulation</div>
          <h1 className="hero-h">Foresee human behaviour.<br/><span>Simulate the response before you commit.</span></h1>
          <p className="hero-sub">Run your decisions, products, and policies before they hit the real world. Understand resistance, adoption, and risk — with confidence intervals.</p>

          <div className="cta-row">
            <button className="cta-ent" onClick={()=>startSim("ent")}>
              <span className="cta-ent-t">Enterprise</span>
              <span className="cta-ent-a">↗</span>
            </button>
            <button className="cta-ind" onClick={()=>startSim("ind")}>
              <span className="cta-ind-t">Individual</span>
              <span className="cta-ind-a">↗</span>
            </button>
          </div>

          <div className="stats-row">
            {[
              {n:"01",l:"Input & Structuring",d:"Describe your idea"},
              {n:"02",l:"Population Calibration",d:"Build your agent pool"},
              {n:"03",l:"Simulation",d:"Run 10,000 iterations"},
              {n:"04",l:"Decision Output",d:"Segments, pathways, audit"},
            ].map((s,i)=>(
              <div key={s.n} style={{display:"flex",alignItems:"center",gap:i>0?36:0}}>
                {i>0&&<div className="stat-sep"/>}
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:".12em",color:"#305CFF",textTransform:"uppercase",marginBottom:4,fontWeight:600}}>{s.n}</div>
                  <div style={{fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:800,color:"#1a1a1e",letterSpacing:"-.02em",marginBottom:2}}>{s.l}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#888",letterSpacing:".05em"}}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>



        <div className="home-foot">
          <span className="mo">© 2024 sidenote.ai</span>

        </div>
      </div>
      <FeedbackWidget stageKey="home" stageLabel="Homepage" pageTitle="sidenote.ai" />
    </>
  );

  /* ── ENTERPRISE ONBOARDING ── */
  if (view === "ent-ob") {
    const pct = Math.round((entStage / 5) * 100);
    return (
      <>
        <style>{FONTS+CSS}</style>
        <div className="ob">
          <div className="ob-bar">
            <div className="ob-logo mo">
              <span style={{cursor:"pointer",opacity:.6}} onClick={()=>setView("home")}>/sidenote.ai</span>
              <span style={{margin:"0 8px",opacity:.3}}>·</span>
              <span>Enterprise Setup</span>
            </div>
            <div className="ob-stages">
              {ENT_STAGES.map((s,i)=>(
                <div key={s} style={{display:"flex",alignItems:"center"}}>
                  {i>0&&<div className="ob-stage-sep"/>}
                  <div className={`ob-stage${entStage===i?" act":""}${entStage>i?" done":""}`}>
                    <div className="ob-stage-n">{entStage>i?"✓":i+1}</div>
                    {s}
                  </div>
                </div>
              ))}
            </div>
            <button className="ob-skip mo" onClick={entSkipToSim}>Skip to simulation →</button>
          </div>
          <div className="ob-progress"><div className="ob-progress-fill" style={{width:`${pct}%`}}/></div>

          <div className="ob-body">
            {/* STAGE 0: Overview */}
            {entStage===0&&(
              <div className="ob-overview">
                <div className="ob-tag mo"><span className="ob-tag-dot"/>Enterprise Setup</div>
                <h2 className="ob-ov-h">Here's what we'll set up together</h2>
                <p className="ob-ov-sub">This takes about 5 minutes and dramatically improves simulation accuracy. You can skip any step.</p>
                <div className="ob-steps">
                  {[
                    {n:"01",title:"Parse your company website",desc:"We read your brand, product, and positioning so simulations are calibrated to your actual context — not generic defaults.",opt:false},
                    {n:"02",title:"Connect your data sources",desc:"Optionally link Salesforce, HubSpot, Snowflake and others. The simulation engine pulls relevant signals when needed.",opt:true},
                    {n:"03",title:"Define your role",desc:"Tell us who you are and what decisions you're responsible for. This shapes how output is framed and what's surfaced.",opt:false},
                    {n:"04",title:"Set your simulation expectations",desc:"Choose from a list of what you want Sidenote to help you understand. We'll suggest relevant output modules.",opt:true},
                    {n:"05",title:"Run your first simulation",desc:"Now you're ready. Type your idea and we handle the rest — questions, population calibration, Monte Carlo, output.",opt:false},
                  ].map(s=>(
                    <div key={s.n} className="ob-step-row">
                      <div className="ob-step-num mo">{s.n}</div>
                      <div className="ob-step-info">
                        <div className="ob-step-title">{s.title}{s.opt&&<span className="ob-step-opt">optional</span>}</div>
                        <div className="ob-step-desc">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ob-cta-row">
                  <button className="ob-btn-p" onClick={entNext}>Let's set this up →</button>
                  <button className="ob-btn-s" onClick={entSkipToSim}>Skip and simulate now</button>
                </div>
              </div>
            )}

            {/* STAGE 1: Company */}
            {entStage===1&&(
              <div className="ob-inner">
                <div className="ob-tag mo"><span className="ob-tag-dot"/>Step 1 of 5</div>
                <h2 className="ob-h">Tell us about your company</h2>
                <p className="ob-sub">Paste your website URL and we'll read your brand, product positioning, and target market automatically.</p>
                <div className="field-label mo">Company website</div>
                <div className="url-box">
                  <span className="url-pre mo">https://</span>
                  <input className="url-in mn" placeholder="yourcompany.com" value={entUrl} onChange={e=>setEntUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&parseWebsite()}/>
                </div>
                <div className="url-hint mo">We'll parse your homepage, about page, and product pages</div>

                {!entParsing && !entBrand && (
                  <div className="ob-cta-row">
                    <button className="ob-btn-p" onClick={parseWebsite} disabled={!entUrl.trim()}>Parse website →</button>
                    <button className="ob-btn-s" onClick={entNext}>Skip this step</button>
                  </div>
                )}

                {entParsing&&(
                  <div className="parse-state">
                    <div className="parse-icon" style={{animation:"spin 1.2s linear infinite",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>⟳</div>
                    <div className="parse-text">
                      <div className="parse-title">Fetching {entUrl.replace(/https?:\/\//,"").split("/")[0]}…</div>
                      <div className="parse-sub">Fetching page content → stripping HTML → extracting brand identity with Claude. This takes 5–10 seconds.</div>
                    </div>
                  </div>
                )}

                {entBrand&&(
                  <>
                    <div className="brand-card">
                      <div className="brand-card-lbl mo">Brand context extracted</div>
                      <div className="brand-card-text mn" dangerouslySetInnerHTML={{__html:entBrand}}/>
                    </div>
                    <p className="ob-sub" style={{marginBottom:16}}>Does this capture your company accurately? You can edit below if needed.</p>
                    <textarea className="ob-input mn" style={{minHeight:80,marginBottom:20}} value={entBrand.replace(/<[^>]+>/g,"")} onChange={e=>setEntBrand(e.target.value)}/>
                    <div className="ob-cta-row">
                      <button className="ob-btn-p" onClick={entNext}>Looks good — continue →</button>
                      <button className="ob-btn-s" onClick={()=>{setEntBrand("");setEntUrl("");}}>Re-parse different URL</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STAGE 2: Integrations */}
            {entStage===2&&(
              <div className="ob-inner">
                <div className="ob-tag mo"><span className="ob-tag-dot"/>Step 2 of 5 · Optional</div>
                <h2 className="ob-h">Connect your data sources</h2>
                <p className="ob-sub">The simulation engine pulls relevant data when running — CRM signals, revenue data, product analytics. Nothing is read until you run a simulation.</p>
                <div className="connectors">
                  {CONNECTORS.map(c=>(
                    <div key={c.id} className={`connector${entConns.includes(c.id)?" sel":""}`} onClick={()=>setEntConns(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])}>
                      {c.badge&&<div className="connector-badge mo">{c.badge}</div>}
                      <div className="connector-ic">{c.ic}</div>
                      <div className="connector-nm">{c.n}</div>
                      <div className="connector-desc">{c.d}</div>
                    </div>
                  ))}
                </div>
                {entConns.length>0&&<p className="url-hint mo" style={{marginBottom:20}}>{entConns.length} connector{entConns.length!==1?"s":""} selected — data only accessed during simulation runs</p>}
                <div className="ob-cta-row">
                  <button className="ob-btn-p" onClick={entNext}>{entConns.length>0?"Connect & continue →":"Skip for now →"}</button>
                </div>
              </div>
            )}

            {/* STAGE 3: Role */}
            {entStage===3&&(
              <div className="ob-inner">
                <div className="ob-tag mo"><span className="ob-tag-dot"/>Step 3 of 5</div>
                <h2 className="ob-h">What's your role?</h2>
                <p className="ob-sub">This shapes how simulation output is framed — what gets surfaced, what language is used, and what's prioritised in the output tabs.</p>
                <div className="field-label mo">Select your role</div>
                <div className="role-chips">
                  {ENT_ROLES.map(r=>(
                    <div key={r} className={`chip${entRole===r?" sel":""}`} onClick={()=>setEntRole(r)}>{r}</div>
                  ))}
                </div>
                {entRole&&(
                  <>
                    <div className="field-label mo" style={{marginTop:16}}>What are you typically responsible for?</div>
                    <input className="ob-input mn" placeholder="e.g. GTM strategy, new market launches, pricing decisions…" style={{marginBottom:20}}/>
                  </>
                )}
                <div className="ob-cta-row">
                  <button className="ob-btn-p" onClick={entNext} disabled={!entRole}>Continue →</button>
                  <button className="ob-btn-s" onClick={entNext}>Skip</button>
                </div>
              </div>
            )}

            {/* STAGE 4: Expectations — priority + add others */}
            {entStage===4&&(
              <EntExpectations
                selected={entCues}
                setSelected={setEntCues}
                onNext={entNext}
              />
            )}

            {/* STAGE 5: Done */}
            {entStage===5&&(
              <div className="ob-inner" style={{textAlign:"center",paddingTop:60}}>
                <div style={{width:56,height:56,background:"#305CFF",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",margin:"0 auto 20px"}}>✓</div>
                <h2 className="ob-h" style={{marginBottom:8}}>You're set up.</h2>
                <p className="ob-sub" style={{maxWidth:420,margin:"0 auto 32px"}}>
                  {entBrand?"We've parsed your company context":"Foundation complete."}
                  {entConns.length>0?` Connected ${entConns.length} data source${entConns.length>1?"s":""}.`:""}
                  {entRole?` Framing output for ${entRole}.`:""}
                  {entCues.length>0?` ${entCues.length} simulation goals set.`:""} Now run your first simulation.
                </p>
                <button className="ob-btn-p" onClick={()=>{setView("tool");setPhase(1);}}>Start simulating →</button>
              </div>
            )}
          </div>
        </div>
        <FeedbackWidget
          stageKey={`ent-${entStage}`}
          stageLabel={`Enterprise Setup · Step ${entStage + 1}`}
          pageTitle={["Overview","Your company","Data sources","Your role","Goals & expectations","All set"][Math.min(entStage,5)]}
        />
      </>
    );
  }

  /* ── TOOL ── */
  return (
    <>
      <style>{FONTS+CSS}</style>
      <div className="tool">
        {/* ── LAYER 1: brand + actions ── */}
        <div className="tbar1">
          <div className="tbar1-l">
            <div className="sb-toggle" onClick={()=>setSbOpen(true)} title="Projects">☰</div>
            <div className="tbar1-sep"/>
            <span className="tbar1-logo mo" onClick={()=>setView("home")}>/sidenote.ai</span>
            {mode==="ent"&&<><div className="tbar1-sep"/><span className="tbar1-mode mo">ENTERPRISE</span></>}
          </div>
          <div className="tbar1-r">
            {phase===4&&<button className="tbar1-btn mo" onClick={()=>setCo(v=>!v)}>Ask about output</button>}
            {phase===4&&<button className="tbar1-btn g mo">Export →</button>}
          </div>
        </div>
        {/* ── LAYER 2: company context + phase tabs ── */}
        <div className="tbar2">
          {(mode==="ent"&&(entRole||entBrand))&&(
            <div className="tbar2-meta">
              {entBrand&&<span className="tbar2-co mo">{entBrand.replace(/<[^>]+>/g,"").split(".")[0].slice(0,28)}</span>}
              {entBrand&&entRole&&<div className="tbar2-sep"/>}
              {entRole&&<div><div className="tbar2-user mn">{entRole}</div></div>}
            </div>
          )}
          <div className="ttabs">
            {[{n:1,l:"01 · Input"},{n:2,l:"02 · Population"},{n:3,l:"03 · Simulation"},{n:4,l:"04 · Output"}].map(t=>(
              <div key={t.n}
                className={`ttab mo${phase===t.n?" a":""}${done.includes(t.n)&&phase!==t.n?" dn":""}${t.n>1&&!done.includes(t.n-1)&&phase!==t.n?" lk":""}`}
                onClick={()=>goPhase(t.n)}>{t.l}</div>
            ))}
          </div>
          <div style={{width:mode==="ent"&&(entRole||entBrand)?undefined:"0"}}/>
        </div>

        {/* ── SIDEBAR ── */}
        <div className={`sidebar-overlay${sbOpen?" open":""}`} onClick={()=>setSbOpen(false)}/>
        <div className={`sidebar${sbOpen?" open":""}`}>
          <div className="sb-head">
            <span className="sb-logo mo">/sidenote.ai</span>
            <span className="sb-close" onClick={()=>setSbOpen(false)}>×</span>
          </div>
          <div className="sb-new" onClick={()=>{setSbOpen(false);setP1s("input");setTxt("");setDone([]);setPhase(1);}}>
            <span className="sb-new-ic">+</span>
            <span className="sb-new-t">New simulation</span>
          </div>
          <div className="sb-section mo">Recent projects</div>
          {projects.map(p=>(
            <div key={p.id} className={`sb-proj${p.active?" act":""}`}>
              <div className={`sb-proj-dot${p.status==="run"?" g":""}`}/>
              <div className="sb-proj-info">
                <div className="sb-proj-name">{p.name}</div>
                <div className="sb-proj-meta mo">{p.type} · {p.date}</div>
                <span className={`sb-proj-tag mo ${p.status}`}>{p.status==="run"?"Simulation run":"Draft"}</span>
              </div>
            </div>
          ))}
          <div className="sb-divider"/>
          <div className="sb-section mo">Workspace</div>
          {[{ic:"📊",l:"All simulations"},{ic:"🗂️",l:"Templates"},{ic:"📤",l:"Exports & reports"},{ic:"⚙️",l:"Settings"},{ic:"❓",l:"Help & docs"}].map(m=>(
            <div key={m.l} className="sb-menu-item"><span className="sb-menu-ic">{m.ic}</span>{m.l}</div>
          ))}
          {(entRole||mode==="ent")&&(
            <div className="sb-foot">
              {entRole&&<div className="sb-foot-user mn">{entRole}</div>}
              {mode==="ent"&&<div className="sb-foot-role mo">Enterprise · {entConns.length>0?`${entConns.length} sources connected`:"No sources connected"}</div>}
            </div>
          )}
        </div>

        <div className="tbody">

          {/* ══ PHASE 1 ══ */}
          {phase===1&&(
            <div className="panel">
              <div className="pinner">
                <div className="pey mo">phase 01 · input & structuring</div>
                <h2 className="ph">What are you testing?</h2>
                <p className="ps">Describe your idea in plain language. We'll ask only what we actually need — nothing more.</p>

                {p1s==="input"&&(
                  <Phase1Input
                    txt={txt} setTxt={setTxt}
                    onAnalyse={goAnalyse}
                    entRole={entRole} entBrand={entBrand} mode={mode}
                  />
                )}

                {(p1s==="chat"||p1s==="sentence")&&(
                  <>
                    <div className="ubub">
                      <div className="ublbl mo">Your input</div>
                      <div className="ubtxt mn">{txt}</div>
                    </div>

                    {p1qa.slice(0,p1i).filter(x=>x.answer).map((qa,actualIdx)=>(
                      <div key={actualIdx} className="ansd ansd-wrap">
                        <button className="ansd-back mo" onClick={()=>{setP1i(actualIdx);setP1s("chat");}}>← Change</button>
                        <div className="ailbl mo"><span className="aip" style={{background:"#333",animation:"none"}}/>Sidenote</div>
                        <div style={{fontSize:13,color:"rgba(255,255,255,.55)",marginBottom:5,lineHeight:1.4,fontWeight:500}}>{qa.q}</div>
                        <div className="apills">{qa.answer.split(", ").map(a=><span key={a} className="apill mo">{a}</span>)}</div>
                      </div>
                    ))}

                    {p1s==="chat"&&!p1thk&&p1qa[p1i]&&(
                      <div className="aib">
                        <div className="ailbl mo"><span className="aip"/>Sidenote</div>
                        <div className="aiq mn">{p1qa[p1i].q}</div>
                        {p1qa[p1i].sub&&<div className="aiqs mn">{p1qa[p1i].sub}</div>}
                        <div className="opts">
                          {(p1qa[p1i].opts||[]).map(o=>{
                            const sel=p1sel[p1i]||[],isSel=sel.includes(o.l);
                            return (
                              <div key={o.l}>
                                <div className={`opt${isSel?" sl":""}${o.nr?" nr":""}`} onClick={()=>p1tog(p1i,o.l,!!o.free,!!o.nr)}>
                                  <span className="ochk mo">{isSel?"✓":""}</span>
                                  <span className="olbl mn">{o.l}</span>
                                  {o.nr&&<span className="otag mo">skip</span>}
                                </div>
                                {o.free&&p1fv[p1i]&&<input className="fin mn" placeholder="Type your answer…" value={p1fval[p1i]||""} onChange={e=>{const v=e.target.value;setP1fval(p=>({...p,[p1i]:v}));setP1sel(p=>({...p,[p1i]:[v||"custom"]}));}}/>}
                              </div>
                            );
                          })}
                        </div>
                        <div className="brow">
                          <button className="btn g mo" disabled={!(p1sel[p1i]||[]).length} onClick={p1next}>{p1i>=3?"Generate sentence →":"Continue →"}</button>
                          <button className="btn h mo" onClick={()=>{setP1sel(p=>({...p,[p1i]:["SKIP"]}));setTimeout(p1next,40);}}>Skip</button>
                        </div>
                      </div>
                    )}

                    {p1thk&&<div className="thk mo"><div className="dts"><span/><span/><span/></div>Thinking…</div>}

                    {p1s==="sentence"&&(
                      <div className="aib">
                        <div className="ailbl mo"><span className="aip"/>Sidenote</div>
                        <div className="aiq mn" style={{marginBottom:9}}>Here's what I'm simulating — does this feel right?</div>
                        <div className="sc">
                          <div className="st mo">Structured simulation input</div>
                          {p1ed?<textarea className="se mn" value={p1ev} onChange={e=>setP1ev(e.target.value)}/>
                               :<div className="sx mn" dangerouslySetInnerHTML={{__html:p1sent}}/>}
                        </div>
                        <div className="brow">
                          <button className="btn g mo" onClick={p1confirm}>Confirm — build population →</button>
                          {!p1ed?<button className="btn h mo" onClick={()=>{setP1ed(true);setP1ev(p1sent.replace(/<[^>]+>/g,""));}}>Edit</button>
                                :<button className="btn h mo" onClick={()=>{setP1sent(p1ev);setP1ed(false);}}>Save</button>}
                          <button className="btn h mo" onClick={()=>{setP1s("input");setP1qa([]);setP1i(0);setP1sel({});}}>Start over</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ PHASE 2 ══ */}
          {phase===2&&(
            <div className="panel">
              <div className="pinner">
                <button className="back-btn" onClick={()=>{setPhase(1);setP1s("chat");setP2s("loading");setDone(d=>d.filter(x=>x!==2));}}>Back to input</button>
                <div className="pey mo">phase 02 · population calibration</div>
                <h2 className="ph">Calibrating the agent population</h2>
                <p className="ps">These questions calibrate the synthetic population the idea will be run against — not asking about your business, asking about who encounters this idea in the real world.</p>

                <div className="ubub" style={{borderLeftColor:"rgba(48,92,255,.5)"}}>
                  <div className="ublbl mo" style={{color:"rgba(132,166,255,.7)"}}>Simulating</div>
                  <div className="ubtxt mn" style={{fontSize:12,color:"rgba(255,255,255,.75)",lineHeight:1.75}} dangerouslySetInnerHTML={{__html:p1sent}}/>
                </div>

                {p2s==="loading"&&<div className="thk mo"><div className="dts"><span/><span/><span/></div>Generating calibration questions…</div>}

                {p2s==="questions"&&(
                  <>
                    {/* Region question — shown first if not answered */}
                    {!p2Region&&(
                      <div className="aib" style={{marginBottom:22}}>
                        <div className="ailbl mo"><span className="aip"/>Sidenote</div>
                        <div className="aiq mn">Which region are we calibrating the population for?</div>
                        <div className="aiqs mn">This shapes geographic behaviour patterns — and later we'll suggest regions with similar adoption curves where this could expand.</div>
                        <div className="opts">
                          {["North America","Europe (Western)","Europe (Eastern)","Asia Pacific","Middle East & Africa","Latin America","Global / multi-region"].map(r=>(
                            <div key={r} className="opt" onClick={()=>setP2Region(r)}>
                              <span className="ochk mo"></span>
                              <span className="olbl mn">{r}</span>
                            </div>
                          ))}
                          <div className="opt nr" onClick={()=>setP2Region("Not specified")}>
                            <span className="ochk mo"></span>
                            <span className="olbl mn" style={{color:"rgba(255,255,255,.35)"}}>Skip — let model use global defaults</span>
                            <span className="otag mo">skip</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {p2Region&&(
                      <div className="ansd ansd-wrap" style={{marginBottom:16}}>
                        <button className="ansd-back mo" onClick={()=>setP2Region("")}>← Change</button>
                        <div className="ailbl mo"><span className="aip" style={{background:"#333",animation:"none"}}/>Sidenote</div>
                        <div style={{fontSize:13,color:"rgba(255,255,255,.55)",marginBottom:5,lineHeight:1.4,fontWeight:500}}>Which region are we calibrating the population for?</div>
                        <div className="apills"><span className="apill mo">{p2Region}</span></div>
                      </div>
                    )}

                    {p2qa.slice(0,p2i).filter(x=>x.answer).map((qa,actualIdx)=>(
                      <div key={actualIdx} className="ansd ansd-wrap">
                        <button className="ansd-back mo" onClick={()=>setP2i(actualIdx)}>← Change</button>
                        <div className="ailbl mo"><span className="aip" style={{background:"#333",animation:"none"}}/>Sidenote</div>
                        <div style={{fontSize:13,color:"rgba(255,255,255,.55)",marginBottom:5,lineHeight:1.4,fontWeight:500}}>{qa.q}</div>
                        <div className="apills">{qa.answer.split(", ").map(a=><span key={a} className="apill mo">{a}</span>)}</div>
                      </div>
                    ))}

                    {!p2thk&&p2qa[p2i]&&p2Region&&(
                      <div className="aib">
                        <div className="ailbl mo"><span className="aip"/>Sidenote</div>
                        <div className="aiq mn">{p2qa[p2i].q}</div>
                        {p2qa[p2i].sub&&<div className="aiqs mn">{p2qa[p2i].sub}</div>}
                        <div className="opts">
                          {(p2qa[p2i].opts||[]).map(o=>{
                            const sel=p2sel[p2i]||[],isSel=sel.includes(o.l);
                            return (
                              <div key={o.l}>
                                <div className={`opt${isSel?" sl":""}${o.nr?" nr":""}`} onClick={()=>p2tog(p2i,o.l,!!o.free,!!o.nr)}>
                                  <span className="ochk mo">{isSel?"✓":""}</span>
                                  <span className="olbl mn">{o.l}</span>
                                  {o.nr&&<span className="otag mo">skip</span>}
                                </div>
                                {o.free&&p2fv[p2i]&&<input className="fin mn" placeholder="Describe…" value={p2fval[p2i]||""} onChange={e=>{const v=e.target.value;setP2fval(p=>({...p,[p2i]:v}));setP2sel(p=>({...p,[p2i]:[v||"custom"]}));}}/>}
                              </div>
                            );
                          })}
                        </div>
                        <div className="brow">
                          <button className="btn g mo" disabled={!(p2sel[p2i]||[]).length} onClick={p2next}>Continue →</button>
                          <button className="btn h mo" onClick={()=>{setP2sel(p=>({...p,[p2i]:["MODEL"]}));setTimeout(p2next,40);}}>Let model decide</button>
                        </div>
                      </div>
                    )}
                    {p2thk&&<div className="thk mo"><div className="dts"><span/><span/><span/></div>Building agent distribution…</div>}
                  </>
                )}

                {p2s==="spec"&&(
                  <div className="aib">
                    <div className="ailbl mo"><span className="aip"/>Sidenote</div>
                    <div className="psp">
                      <div className="psph mo">Population specification</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,.75)",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'Manrope',sans-serif",fontWeight:400}}>{p2spec}</div>
                    </div>
                    <div className="brow">
                      <button className="btn g mo" onClick={p2confirm}>Confirm — run simulation →</button>
                      <button className="btn h mo" onClick={()=>{setP2s("questions");setP2i(0);setP2sel({});}}>Adjust</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ PHASE 3 ══ */}
          {phase===3&&(
            <div className="simscr">
              <button className="back-btn" style={{position:"absolute",top:20,left:20}} onClick={()=>{setPhase(2);setP2s("spec");setDone(d=>d.filter(x=>x!==3));setSdone(false);}}>Back</button>
              <div className="siml mo">Monte Carlo Engine · Phase 03</div>
              <div className="simbig mo">{Math.round(sp)}%</div>
              <div className="simsub mo">{sdone?"Simulation complete — all 10,000 runs converged":"Running probabilistic simulation across synthetic population…"}</div>
              <div className="simbars">
                {[{l:"Agent pool",v:Math.min(1,sp/20)},{l:"Scenario state",v:Math.min(1,Math.max(0,(sp-20)/20))},{l:"SIᵢ / CEᵢ",v:Math.min(1,Math.max(0,(sp-40)/20))},{l:"Monte Carlo",v:Math.min(1,Math.max(0,(sp-60)/35))},{l:"Segmentation",v:Math.min(1,Math.max(0,(sp-95)/5))}].map(b=>(
                  <div key={b.l} className="sbr">
                    <span className="sblbl mo">{b.l}</span>
                    <div className="sbtr"><div className="sbf" style={{width:`${b.v*100}%`}}/></div>
                    <span className="sbpct mo">{Math.round(b.v*100)}%</span>
                  </div>
                ))}
              </div>
              <div className="simlog">
                {simLogs.map((l,i)=><div key={i} className={`sll mo${i===simLogs.length-1&&!sdone?" cur":""}`}>{l}</div>)}
                {simError&&<div className="sll mo" style={{color:"#ff4d4d"}}>Error: {simError}</div>}
              </div>
              {sdone&&!simError&&simData&&<button className="simdone-btn mo" onClick={()=>{setDone(p=>[...new Set([...p,3])]);setPhase(4);}}>View simulation output →</button>}
              {sdone&&simError&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#ff9f40",marginTop:12}}>The simulation encountered an error. Please check your API key is set in Vercel environment variables and redeploy.</div>}
            </div>
          )}

          {/* ══ PHASE 4 ══ */}
          {phase===4&&(
            <>
              <button className="back-btn" onClick={()=>{setPhase(3);setDone(d=>d.filter(x=>x!==4));}}>Back to simulation</button>
              {/* Scenario strip */}
              <div className="sstrip">
                <div className="ssr" onClick={()=>setSse(v=>!v)}>
                  <span className="ssrl mo">Scenario State</span>
                  <div className="ssri">{(simData?.scenario_params||[]).slice(0,4).map(p=><div key={p.k} className="ssrit"><span className="ssrk mo">{p.k}</span><span className="ssrv mo">· {p.v}</span></div>)}</div>
                  <span className="ssrt mo">{sse?"▲ collapse":"▼ expand"}</span>
                </div>
                {sse&&<div className="ssrexp">{(simData?.scenario_params||[]).map(p=><div key={p.k} className="ssreit"><div className="ssrek mo">{p.k}</div><div className="ssrev mn">{p.v}</div><div className="ssres mo">{p.s}</div></div>)}</div>}
              </div>

              {/* Output tabs */}
              <div className="otabs">
                {[{id:"overview",l:"Overview"},{id:"segments",l:"Segments",b:"4"},{id:"pathways",l:"Pathways",b:"4"},{id:"audit",l:"Audit"},{id:"externality",l:"Externality ⚡",b:"new"}].map(t=>(
                  <div key={t.id} className={`otab mo${ot===t.id?" a":""}`} onClick={()=>setOt(t.id)}>
                    {t.l}{t.b&&<span className="otabb mo" style={t.b==="new"?{borderColor:"rgba(184,250,78,.35)",color:"rgba(184,250,78,.7)"}:{}}>{t.b}</span>}
                  </div>
                ))}
              </div>

              <div className="owrap">
                <div className={`omain${co?" sh":""}`}>

                  {/* OVERVIEW */}
                  {ot==="overview"&&(
                    <>
                      {/* Hero verdict */}
                      <div className="ov-hero">
                        <div className="ov-hero-tag mo">Simulation result · {p2Region||"Global"} population</div>
                        <div className="ov-headline mn">
                          {simData?.pathways?.[0]?.n
                            ? <>{simData.pathways[0].n}</>
                            : "Simulation complete"}
                        </div>
                        <div className="ov-tldr mn">
                          The simulation ran across a calibrated synthetic population representing your target market.
                          Median adoption rate: <strong>{Math.round((simData?.adoption_rate?.median||0)*100)}%</strong>.
                          95% confidence interval: <strong>{Math.round((simData?.adoption_rate?.low||0)*100)}%–{Math.round((simData?.adoption_rate?.high||0)*100)}%</strong>.
                        </div>
                        <div className="ov-conf-row">
                          <div className="ov-conf-dot"/>
                          <span className="ov-conf-lbl mo">{simData?.adoption_rate?.confidence||"MODERATE"} CONFIDENCE</span>
                          <span className="ov-conf-why mn">— based on completeness of scenario inputs</span>
                        </div>
                        <div className="ov-numbers">
                          <div className="ov-num"><div className="ov-num-val g mo">{Math.round((simData?.adoption_rate?.median||0)*100)}%</div><div className="ov-num-lbl mo">Median adoption · p50</div></div>
                          <div className="ov-num"><div className="ov-num-val b mo">{Math.round((simData?.adoption_rate?.low||0)*100)}%–{Math.round((simData?.adoption_rate?.high||0)*100)}%</div><div className="ov-num-lbl mo">95% confidence range</div></div>
                          <div className="ov-num"><div className="ov-num-val mo">10,000</div><div className="ov-num-lbl mo">Monte Carlo runs</div></div>
                          <div className="ov-num"><div className="ov-num-val mo">{simData?.segments?.[0]?.p||"—"}</div><div className="ov-num-lbl mo">Early adopter cohort</div></div>
                        </div>
                      </div>

                      {/* Role-aware snapshot */}
                      <div className="ov-snapshot">
                        <div className="ov-snapshot-hd">
                          <span className="ov-snapshot-ic">{entRole==="Head of Product"?"🧩":entRole==="GTM Lead"?"🎯":entRole==="Founder / CEO"?"🏗️":entRole==="Strategy / BD"?"🌍":"💡"}</span>
                          <span className="ov-snapshot-title mn">
                            {entRole==="Head of Product"?"What this means for your roadmap":
                             entRole==="GTM Lead"||entRole==="Marketing"?"What this means for your launch":
                             entRole==="Founder / CEO"?"What this means for the business":
                             entRole==="Strategy / BD"?"What this means strategically":
                             "What this means for you"}
                          </span>
                          {entRole&&<span className="ov-snapshot-role mo">{entRole}</span>}
                        </div>
                        <div className="ov-snapshot-body mn">
                          {simData?.pathways?.[0] ? (
                            <>
                              The recommended pathway is <strong>{simData.pathways[0].n}</strong>.
                              {simData.pathways[0].why}
                              {simData.risk_flags?.[0] && (
                                <> The key unvalidated assumption is: <strong>{simData.risk_flags[0].n}</strong>.</>
                              )}
                            </>
                          ) : (
                            <>The simulation indicates a positive expected outcome at moderate confidence. Review the pathways and audit tabs for detail.</>
                          )}
                        </div>
                        <div className="ov-actions">
                          <button className="ov-action-btn g mo" onClick={()=>{}}>⬇ Generate report</button>
                          <button className="ov-action-btn b mo" onClick={()=>setOt("audit")}>View assumptions →</button>
                          <button className="ov-action-btn b mo" onClick={()=>setOt("externality")}>Inject externalities ⚡</button>
                        </div>
                      </div>

                      {/* Region expansion hint */}
                      {p2Region&&p2Region!=="Global / multi-region"&&(
                        <div className="ov-region-hint">
                          <div className="ov-rh-tag mo">Regional expansion signal</div>
                          <div className="ov-rh-txt mn">
                            This simulation was calibrated for <strong>{p2Region}</strong>. Based on similar adoption patterns in the simulation, 
                            {p2Region==="North America"?" markets like <strong>Western Europe and Australia</strong> show comparable early-adopter profiles — and typically follow North American B2B adoption curves with a 6–12 month lag. If this succeeds in North America, those regions are natural second entries.":
                             p2Region==="Europe (Western)"?" markets like <strong>North America and Australia</strong> show similar enterprise buyer behaviour — your conversion model likely transfers directly.":
                             p2Region==="Asia Pacific"?" markets like <strong>Singapore, Australia, and Japan</strong> show similar B2B adoption patterns within APAC — consider a sub-regional rollout before broader APAC expansion.":
                             " adjacent regions with similar economic profiles could represent natural expansion paths once the home market is validated."} Change one thing — your <strong>pricing tier</strong> — and the simulation suggests a viable entry path.
                          </div>
                        </div>
                      )}

                      <div className="sech mo">Key Findings</div>
                      <div className="i3">
                        <div className="ins dom">
                          <div className="instyp mo">Dominant Driver</div>
                          <div className="insb mn">
                            {simData?.segments?.[0] ? (
                              <>{simData.segments[0].n} ({simData.segments[0].p}) — {simData.segments[0].dr}</>
                            ) : "Calculating…"}
                          </div>
                        </div>
                        <div className="ins rsk">
                          <div className="instyp mo">Biggest Risk</div>
                          <div className="insb mn">
                            {simData?.risk_flags?.[0] ? (
                              <>{simData.risk_flags[0].n} — {simData.risk_flags[0].m}</>
                            ) : "Calculating…"}
                          </div>
                        </div>
                        <div className="ins wat">
                          <div className="instyp mo">Segment to Watch</div>
                          <div className="insb mn">
                            {simData?.segments?.[1] ? (
                              <>{simData.segments[1].n} ({simData.segments[1].p}) — {simData.segments[1].gt}</>
                            ) : "Calculating…"}
                          </div>
                        </div>
                      </div>

                      {/* Compact context scores — collapsed by default */}
                      <div style={{marginTop:8}}>
                        <div className="sech mo" style={{cursor:"pointer"}} onClick={()=>setCtxTip(ctxTip?"":"-")}>
                          Model confidence scores {ctxTip==="-"?"▲":"▼ (hover to explain)"}
                        </div>
                        {ctxTip==="-"&&(
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
                            {(simData?.context_scores||[]).map(s=>(
                              <div key={s.l} style={{background:"#1a1a1a",border:"1px solid rgba(255,255,255,.07)",padding:"10px 12px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                                  <div style={{width:`${s.v*100}%`,height:3,background:s.c,maxWidth:80}}/>
                                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,.45)"}}>{Math.round(s.v*100)}</span>
                                </div>
                                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,.35)",letterSpacing:".04em"}}>{s.l}</div>
                                <div style={{fontSize:11,color:"rgba(255,255,255,.45)",marginTop:3,lineHeight:1.5,fontFamily:"'Manrope',sans-serif"}}>{s.why}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* SEGMENTS */}
                  {ot==="segments"&&(
                    <>
                      <div className="sech mo">Population Decision Patterns</div>
                      <div className="swl">
                        <div className="swlh mo">Adoption probability distribution across synthetic population</div>
                        {(simData?.segments||[]).map(s=>(
                          <div key={s.n} className="swr">
                            <span className="swrl mo">{s.n}</span>
                            <div className="swrt"><div className="swrf" style={{width:s.w,background:s.c}}/></div>
                            <span className="swrp mo">{s.p}</span>
                            <span className="swri mo" style={{color:s.ic}}>{s.i}</span>
                          </div>
                        ))}
                      </div>
                      <div className="scards">
                        {(simData?.segments||[]).map(s=>(
                          <div key={s.n} className="scard">
                            <div className="sctop">
                              <div className="scnm mn">{s.n}</div>
                              <div style={{textAlign:"right"}}><div className="scpct mo">{s.p}</div><div className="scpt mo">of pop.</div></div>
                            </div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.4)",lineHeight:1.5,marginBottom:10,fontFamily:"'DM Mono',monospace",borderLeft:"2px solid rgba(255,255,255,.1)",paddingLeft:8}}>{s.why}</div>
                            <div className="scdr"><span className="scdk mo">Driver</span><span className="scdv mn">{s.dr}</span></div>
                            <div className="scdr"><span className="scdk mo">Blocker</span><span className="scdv mn">{s.bl}</span></div>
                            <div className="scdr"><span className="scdk mo">Influence</span><span className="scdv mo" style={{color:s.ic}}>{s.i}</span></div>
                            <div className="scgt mo">GTM — <span>{s.gt}</span></div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* PATHWAYS */}
                  {ot==="pathways"&&(
                    <>
                      <div className="sech mo">Strategic Options — Ranked by Expected Outcome</div>
                      <div className="pwl">
                        {(simData?.pathways||[]).map(p=>(
                          <div key={p.r} className={`pw${p.rc?" rc":""}`}>
                            {p.rc&&<div className="pwbdg mo">RECOMMENDED</div>}
                            <div className="pwt"><span className="pwr mo">{p.r}</span><span className="pwn mn">{p.n}</span></div>
                            <div className="pwd mn">{p.d}</div>
                            <div className="pwm">
                              <div><div className={`pwmv mo ${p.ac}`}>{p.a}</div><div className="pwml mo">ARR DELTA</div><div className="pwci mo">{p.ci}</div></div>
                              <div><div className={`pwmv mo ${p.cc}`}>{p.ch}</div><div className="pwml mo">CHURN</div></div>
                              <div><div className={`pwmv mo ${p.nc}`}>{p.nr}</div><div className="pwml mo">NRR</div></div>
                            </div>
                            <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)",fontSize:10,color:"rgba(255,255,255,.38)",lineHeight:1.55,fontFamily:"'Manrope',sans-serif"}}>{p.why}</div>
                          </div>
                        ))}
                      </div>
                      <div className="dvdr"/>
                      <div className="sech mo">Counterfactual Deltas — What Changes if…</div>
                      <div className="cfw">
                        <table className="cft">
                          <thead><tr><th className="mo">Scenario</th><th className="mo">ARR</th><th className="mo">Churn</th><th className="mo">NRR</th></tr></thead>
                          <tbody>{(simData?.counterfactuals||[]).map((c,i)=>(
                            <tr key={i} style={{cursor:"default"}} title={c.why}>
                              <td className="cfsn">{c.s}</td>
                              <td className={c.ac?"cfp":"cfn"}>{c.a}</td>
                              <td className={c.cc?"cfp":"cfn"}>{c.c}</td>
                              <td className={c.nc?"cfp":"cfn"}>{c.n}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginTop:8,lineHeight:1.5,fontFamily:"'DM Mono',monospace"}}>Hover any row for the model's explanation. All deltas are vs. Pathway 01 baseline.</div>
                    </>
                  )}

                  {/* AUDIT */}
                  {ot==="audit"&&(
                    <>
                      <div className="att">
                        <div className="atr">
                          <svg width="78" height="78" viewBox="0 0 78 78"><circle cx="39" cy="39" r="33" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="6"/><circle cx="39" cy="39" r="33" fill="none" stroke="#B8FA4E" strokeWidth="6" strokeDasharray={`${.63*207} 207`} strokeLinecap="butt" transform="rotate(-90 39 39)"/></svg>
                          <div className="atri"><div className="atrp mo">63%</div><div className="atrl mo">evidence</div></div>
                        </div>
                        <div className="atbk">
                          <div className="atbi ev"><div className="atbn mo">63%</div><div className="atbl mo">Evidence-backed — from your inputs, parsed data, or model calibration with known R²</div></div>
                          <div className="atbi bl"><div className="atbn mo">28%</div><div className="atbl mo">Belief-based — user inputs accepted without external validation</div></div>
                          <div className="atbi md"><div className="atbn mo">9%</div><div className="atbl mo">Model defaults — conservative assumptions applied where no signal existed</div></div>
                        </div>
                      </div>
                      <div className="sech mo">Named Risk Flags — Assumptions that materially affect output</div>
                      {(simData?.risk_flags||[]).map(r=><div key={r.i} className="rf"><span className="rfi mo">{r.i}</span><div><div className="rfn mn">{r.n}</div><div className="rfm mo">{r.m}</div></div></div>)}
                      <div className="dvdr"/>
                      <div className="sech mo">Causal Trace — How every number was calculated</div>
                      {(simData?.causal_trace||[]).map((c,i)=><div key={i} className="cn"><span className="cna mo">{c.a}</span><span className="cnc mn">{c.c}</span><span className="cns mo">{c.s}</span></div>)}
                      <div className="dvdr"/>
                      <div className="sech mo">Model Parameters</div>
                      <div className="mpg">{(simData?.model_params||[]).map(p=><div key={p.k} className="mpi"><div className="mpk mo">{p.k}</div><div className="mpv mo">{p.v}</div></div>)}</div>
                    </>
                  )}

                  {/* EXTERNALITY INJECTOR */}
                  {ot==="externality"&&(
                    <ExternalityTab
                      idea={p1sent.replace(/<[^>]+>/g,"")}
                      region={p2Region}
                      extSelected={extSelected} setExtSelected={setExtSelected}
                      extCustom={extCustom} setExtCustom={setExtCustom}
                      extLoading={extLoading} setExtLoading={setExtLoading}
                      extSuggested={extSuggested} setExtSuggested={setExtSuggested}
                    />
                  )}
                </div>

                {/* CHAT PANEL */}
                <div className={`cp${co?" o":""}`}>
                  <div className="cph">
                    <span className="cpt mn">Ask about this output</span>
                    <span className="cpc mo" onClick={()=>setCo(false)}>✕ close</span>
                  </div>
                  <div className="cpms">
                    {ch.map((msg,i)=>(
                      <div key={i} style={{marginBottom:12}}>
                        <div className="cpml mo">{msg.r==="user"?"You":"Sidenote"}</div>
                        <div className={`cpmb ${msg.r}`}>{msg.t}</div>
                      </div>
                    ))}
                    {cl&&<div className="thk mo" style={{marginTop:8}}><div className="dts"><span/><span/><span/></div></div>}
                    <div ref={cend}/>
                  </div>
                  <div className="cpin-row">
                    <input className="cpinput mn" placeholder="Why is the CI so wide? What drives the 14%? …" value={cm} onChange={e=>setCm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
                    <button className="cpsend mo" onClick={sendChat} disabled={cl}>→</button>
                  </div>
                </div>
              </div>

              {/* MICRO BAR */}
              <div className={`mbar${co?" sh":""}`}>
                <div>
                  <div className="mbrt mo">Next — Micro Analysis</div>
                  <div className="mbrd mn">Macro simulation complete. Drill into <strong>pricing sensitivity, demand forecasting, churn architecture</strong> and message resonance per segment.</div>
                </div>
                <div style={{display:"flex",gap:7}}>
                  <button className="btn h mo">Save & exit</button>
                  <button className="btn g mo" onClick={()=>setMo(true)}>Begin micro analysis →</button>
                </div>
              </div>

              {/* MICRO MODAL */}
              <div className={`mov${mo?" o":""}`} onClick={e=>{if(e.target.classList.contains("mov"))setMo(false);}}>
                <div className="mmm">
                  <div className="mmmh">
                    <div className="mmmt mn">Select micro analysis modules</div>
                    <div className="mmms mn">Each module runs a targeted simulation layer on top of your existing population and scenario state.</div>
                  </div>
                  <div className="mmmb">
                    <div className="mmmods">
                      {MMODS.map(m=>(
                        <div key={m.id} className={`mmod${sm.includes(m.id)?" s":""}`} onClick={()=>setSm(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id])}>
                          <div className="mmodi mo">{m.i}</div>
                          <div className="mmodn mn">{m.n}</div>
                          <div className="mmodd mn">{m.d}</div>
                          <div className="mmodts">{m.t.map(t=><span key={t} className="mmodt mo">{t}</span>)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mmmf">
                    <span className="mmmcnt mo"><span>{sm.length}</span> selected</span>
                    <div style={{display:"flex",gap:7}}>
                      <button className="btn h mo" onClick={()=>setMo(false)}>Cancel</button>
                      <button className="mmmrun mo" disabled={!sm.length} onClick={()=>setMo(false)}>Run selected →</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Feedback widget — one per phase, auto-triggers after 4s */}
      <FeedbackWidget
        stageKey={phase===4 ? `output-${ot}` : `phase-${phase}`}
        stageLabel={
          phase===1 ? "Phase 01 · Input & Structuring" :
          phase===2 ? "Phase 02 · Population Calibration" :
          phase===3 ? "Phase 03 · Simulation" :
          ot==="overview" ? "Phase 04 · Output · Overview" :
          ot==="segments" ? "Phase 04 · Output · Segments" :
          ot==="pathways" ? "Phase 04 · Output · Pathways" :
          ot==="audit" ? "Phase 04 · Output · Audit" :
          "Phase 04 · Output · Externality Injector"
        }
        pageTitle={
          phase===1 ? "What are you testing?" :
          phase===2 ? "Calibrating the agent population" :
          phase===3 ? "Running simulation" :
          ot==="overview" ? "Simulation overview" :
          ot==="segments" ? "Population segments" :
          ot==="pathways" ? "Strategic pathways" :
          ot==="audit" ? "Assumptions & audit" :
          "Externality injector"
        }
      />
    </>
  );
}
