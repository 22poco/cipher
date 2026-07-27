import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const API = "http://127.0.0.1:8000";
const APP = "http://127.0.0.1:3000";
const OUT = "/private/tmp/claude-501/-Users-koizumirisa-Documents-Projects-cipher/ae849d97-0993-4e8b-856d-398a8cd3e020/scratchpad/shots";
mkdirSync(OUT, { recursive: true });

async function login(email, pw) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: pw }),
  });
  return r.json();
}

async function missionsFor(token) {
  const r = await fetch(`${API}/missions`, { headers: { authorization: `Bearer ${token}` } });
  const d = await r.json();
  const flat = d.groups.flatMap((g) => g.missions);
  return {
    network: flat.find((m) => m.title.startsWith("Network Segmentation")).id,
    phishing: flat.find((m) => m.title === "Phishing Triage").id,
    log: flat.find((m) => m.title.startsWith("Log Analysis")).id,
  };
}

const errors = [];
const IGNORE = [/favicon/i, /Download the React DevTools/i, /manifest/i];

const run = async () => {
  const auth = await login("alex@baisedu.org", "cipher-dev-2026");
  const ids = await missionsFor(auth.access_token);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(
    ([t, u]) => {
      localStorage.setItem("cipher_token", t);
      localStorage.setItem("cipher_user", u);
    },
    [auth.access_token, JSON.stringify(auth.user)],
  );
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`PAGEERROR ${page.url()} :: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORE.some((re) => re.test(m.text())))
      errors.push(`CONSOLE ${page.url()} :: ${m.text()}`);
  });

  async function shot(path, name, waitFor) {
    await page.goto(`${APP}${path}`, { waitUntil: "networkidle" });
    if (waitFor) {
      try { await page.getByText(waitFor, { exact: false }).first().waitFor({ timeout: 8000 }); }
      catch { errors.push(`MISSING TEXT "${waitFor}" on ${path}`); }
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log(`  shot ${name} (${path})`);
  }

  await shot("/attempts", "01-attempts", "My Attempts");
  await shot("/support", "02-support", "Support Timeline");
  await shot("/ai", "03-ai", "AI Tutor");
  await shot("/resources", "04-resources", "Resources");
  await shot("/units", "05-units", "AP Cybersecurity Units");
  await shot(`/units/3`, "06-unit-detail", "Securing Networks");

  // MCQ workspace + auto-check
  await page.goto(`${APP}/missions/${ids.phishing}`, { waitUntil: "networkidle" });
  await page.getByText("Questions", { exact: false }).first().waitFor({ timeout: 8000 }).catch(() => errors.push("MCQ: no Questions"));
  // pick first option of first question
  await page.locator("button", { hasText: "Urgency" }).first().click().catch(() => {});
  await page.getByRole("button", { name: /Check my work/i }).click().catch(() => errors.push("MCQ: no Check my work button"));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/07-mcq-autocheck.png`, fullPage: true });
  console.log("  shot 07-mcq-autocheck");

  // Network sim workspace + AI tutor (this attempt is in-progress => tutor enabled)
  await page.goto(`${APP}/missions/${ids.network}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/09-network.png`, fullPage: true });
  console.log("  shot 09-network");
  try {
    const input = page.getByPlaceholder("Ask the tutor a question…");
    await input.waitFor({ timeout: 6000 });
    await input.fill("Where should I start with these firewall rules?");
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByText(/rule|packet|notice|evidence|walk me through/i).last().waitFor({ timeout: 8000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/08-ai-tutor.png`, fullPage: true });
    console.log("  shot 08-ai-tutor");
  } catch (e) {
    errors.push("AI tutor send failed: " + e.message);
  }

  // Teacher: review Taylor MCQ (auto-check tab) + Jordan AI tab
  const teacher = await login("teacher@baisedu.org", "cipher-dev-2026");
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await tctx.addInitScript(([t, u]) => {
    localStorage.setItem("cipher_token", t);
    localStorage.setItem("cipher_user", u);
  }, [teacher.access_token, JSON.stringify(teacher.user)]);
  const tp = await tctx.newPage();
  tp.on("pageerror", (e) => errors.push(`PAGEERROR ${tp.url()} :: ${e.message}`));
  const qr = await fetch(`${API}/teacher/review-queue`, { headers: { authorization: `Bearer ${teacher.access_token}` } }).then((r) => r.json());
  const taylor = qr.queue.find((i) => i.student === "Taylor Smith");
  const jordan = qr.queue.find((i) => i.student === "Jordan Lee");
  await tp.goto(`${APP}/teacher/attempts/${taylor.attempt_id}`, { waitUntil: "networkidle" });
  await tp.getByRole("button", { name: "Auto-Check Results" }).click().catch(() => {});
  await tp.waitForTimeout(800);
  await tp.screenshot({ path: `${OUT}/10-teacher-autocheck.png`, fullPage: true });
  await tp.goto(`${APP}/teacher/attempts/${jordan.attempt_id}`, { waitUntil: "networkidle" });
  await tp.getByRole("button", { name: "AI Feedback" }).click().catch(() => {});
  await tp.waitForTimeout(800);
  await tp.screenshot({ path: `${OUT}/11-teacher-ai.png`, fullPage: true });
  console.log("  shot 10-teacher-autocheck, 11-teacher-ai");

  await browser.close();

  console.log("\n=== console/page errors ===");
  if (errors.length === 0) console.log("  none");
  else [...new Set(errors)].forEach((e) => console.log("  " + e));
};

run().catch((e) => { console.error(e); process.exit(1); });
