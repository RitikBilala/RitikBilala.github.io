const ALLOWED_ORIGINS = [
  "https://ritikbilala.github.io"
];


export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
    // 2. Must be a WebSocket upgrade
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }
    // 3. Validate API key
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("Missing GEMINI_API_KEY", { status: 500 });
    }
    // 4. Connect to Gemini using fetch() + Upgrade (correct Cloudflare Workers pattern)
    const geminiUrl =
      "https://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" +
      apiKey;
    const geminiResp = await fetch(geminiUrl, {
      headers: { Upgrade: "websocket" },
    });
    const geminiWs = geminiResp.webSocket;
    if (!geminiWs) {
      return new Response("Failed to connect to Gemini", { status: 502 });
    }
    geminiWs.accept();
    // 5. Create the client-facing WebSocket pair
    const [client, server] = new WebSocketPair();
    server.accept();
    let setupComplete = false;
    const pendingMessages = [];
    // --- Send Setup to Gemini ---
    const setupMsg = {
      setup: {
        model: "models/gemini-2.5-flash-native-audio-latest",
        systemInstruction: systemInstruction,
        generationConfig: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
        },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            prefixPaddingMs: 200,
            silenceDurationMs: 350,
          },
        },
      },
    };
    geminiWs.send(JSON.stringify(setupMsg));
    console.log("[Worker] Setup message sent");
    // --- Messages FROM Gemini → browser ---
    geminiWs.addEventListener("message", async (event) => {
      try {
        // CF Workers receives Blob from external WebSockets — convert to string
        let data;
        if (typeof event.data === "string") {
          data = event.data;
        } else if (event.data instanceof Blob) {
          data = await event.data.text();
        } else {
          data = String(event.data);
        }
        // Note: removed per-message logging to avoid CF trace limits
        // Detect setup complete
        if (!setupComplete) {
          try {
            const parsed = JSON.parse(data);
            if (
              parsed.setupComplete !== undefined ||
              parsed.setup_complete !== undefined
            ) {
              setupComplete = true;
              console.log("[Worker] Setup complete confirmed");
              // Forward to browser
              server.send(data);
              // Flush buffered messages
              for (const msg of pendingMessages) {
                geminiWs.send(msg);
              }
              pendingMessages.length = 0;
              // Send greeting
              geminiWs.send(
                JSON.stringify({
                  clientContent: {
                    turns: [
                      {
                        role: "user",
                        parts: [
                          {
                            text: "Hey! Please introduce yourself as Aria, Ritik Bilala's assistant. Greet the visitor warmly and ask how you can help. Keep it to one short sentence.",
                          },
                        ],
                      },
                    ],
                    turnComplete: true,
                  },
                })
              );
              console.log("[Worker] Greeting sent");
              return;
            }
          } catch (e) {
            /* not JSON */
          }
        }
        // Forward all other messages to browser
        server.send(data);
      } catch (e) {
        console.error("[Worker] Error forwarding:", e.message);
      }
    });
    // --- Messages FROM browser → Gemini ---
    server.addEventListener("message", (event) => {
      let data = event.data;
      // Drop setup messages from frontend and handle mobile app payload differences
      try {
        const parsed = JSON.parse(data);
        if (parsed.setup) return;
        
        // INTERCEPT: "userContent" payload which causes 1007 Invalid JSON
        if (parsed.userContent !== undefined) {
          if (typeof parsed.userContent === "object" && parsed.userContent.turns) {
             // Structure is already correct, just rename the key
             parsed.clientContent = parsed.userContent;
          } else {
             // Fix simple text objects and unsupported properties into properly structured turns
             const textVal = typeof parsed.userContent === "string" ? parsed.userContent : JSON.stringify(parsed.userContent);
             parsed.clientContent = {
               turns: [{ role: "user", parts: [{ text: textVal }] }],
               turnComplete: true
             };
          }
          delete parsed.userContent;
          data = JSON.stringify(parsed);
        }
      } catch (e) {}

      if (!setupComplete) {
        pendingMessages.push(data);
        return;
      }
      if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(data);
      }
    });
    // --- Connection lifecycle ---
    geminiWs.addEventListener("close", (event) => {
      console.log(`[Worker] Gemini closed: ${event.code} ${event.reason}`);
      try { server.close(1000, "Gemini disconnected"); } catch (e) {}
    });
    geminiWs.addEventListener("error", (event) => {
      console.error("[Worker] Gemini error");
      try { server.close(1011, "Gemini error"); } catch (e) {}
    });
    server.addEventListener("close", () => {
      console.log("[Worker] Client disconnected");
      try { geminiWs.close(1000, "Client disconnected"); } catch (e) {}
    });
    return new Response(null, { status: 101, webSocket: client });
  },
};



const RITIK_KNOWLEDGE_BASE = `

### Ritik Bilala — Product Manager | B2B APIs & Enterprise Data Platforms

**Product Manager — Fintech & B2B APIs**
Building Enterprise Data Platforms at Scale

Product Manager at American Express, owning the real-time B2B data sharing platform that serves 20,000+ enterprise clients and processes 4M+ daily transactions. IIT Bombay engineering graduate.

---

### Core Stats
* **5+ Years in Product**
* **4M+ Daily Transactions**
* **20K+ Enterprise Clients**

---

### About
Product Thinker, Builder, Strategist. Over the past 5 years at American Express, I've owned the end-to-end product lifecycle for real-time B2B data sharing platforms that serve 20,000+ enterprise clients globally, processing 4 million transactions daily at sub-second latency.

I sit at the intersection of technical architecture and business strategy — fluent in API schema design, data tokenization, and system health monitoring, while equally comfortable building go-to-market playbooks, aligning 14+ cross-functional stakeholders, and presenting to senior leadership.

Beyond AMEX, I'm actively exploring AI applications in construction tech and ERP systems, having built an MVP for a construction company covering attendance, vehicle, and fuel management. I'm drawn to roles where I can take 0-to-1 ownership of API platforms, data products, or AI-driven enterprise tools.

---

### Experience

#### American Express — Product Manager
*May 2024 — Present*
* Own the product strategy and roadmap for AMEX's enterprise-grade real-time data sharing API platform, serving 20,000+ commercial clients globally.
* Lead a portfolio of B2B APIs enabling real-time expense data authorization, file delivery, and ERP integration for Fortune 500 clients and fintech partners.
* Orchestrate execution across 14+ engineering, compliance, design, and business stakeholder teams using SAFe Agile at enterprise scale.
* Make technical trade-off decisions on API schema design, data tokenization, and sandbox environments.

#### American Express — Sr. Associate Product Manager
*Sep 2022 — May 2024*
* Designed and launched a unified servicing platform enabling commercial clients to self-configure data connections with third-party expense management and ERP systems.
* Reduced partner onboarding time from 90 days to 30 days.
* Decreased file servicing support requests by 80%, saving ~2,000 manual support hours annually.
* Led 50+ client/partner interviews and data analysis to identify unmet needs.

#### American Express — Product Analyst
*Apr 2021 — Aug 2022*
* First PM-track hire on the Data Sharing team; built the operational intelligence layer from scratch.
* Designed a system health monitoring framework tracking data delivery across all enterprise client connections.
* Built a Splunk + Tableau analytics dashboard providing real-time visibility into performance, error rates, and SLA compliance.

#### upGrad — DevOps Content Strategist
*Oct 2020 — Mar 2021*
* Designed a DevOps specialization curriculum covering AWS, Docker, Kubernetes, and CI/CD.

#### Hindustan Coca-Cola Beverages — Supply Chain Innovation Intern
*May 2019 — Jul 2019*
* Developed 6 IoT use-cases and demonstrated POCs on the production line at the Bangalore plant using ESP-32, NodeMCU, and Arduino.

---

### Skills

* **Product Management**: Strategy, Roadmapping, PRD Writing, User Research, GTM Strategy, A/B Testing, OKRs, SAFe Agile.
* **Domain Expertise**: B2B SaaS, API Design, Enterprise Software, Fintech, Expense Management, Data Platforms, Real-Time Systems.
* **Technical**: Python, Django, JavaScript, React, SQL, PostgreSQL, AWS, Docker, Kubernetes.
* **Tools & Analytics**: Tableau, Splunk, Jira, Confluence, Figma, Git/GitHub.
* **Leadership**: Cross-Functional Leadership, Stakeholder Management, System Design, Executive Communication, Mentoring.

---

### Education

#### Indian Institute of Technology, Bombay
*B.Tech in Mechanical Engineering — Minor in Electrical Engineering*
* CPI: 8.9 / 10 (2016 — 2020)
* Panasonic Ratti Chattr Scholarship — Top 30 across all IITs
* Mood Indigo Coordinator, E-Cell Organizer, Ham Radio Club Co-founder

---

### Certifications
* Certified SAFe 6 Agile Product Manager (Scaled Agile, Inc. — 2025)
* Agentic AI Fundamentals (LinkedIn Learning — 2026)
* NLP with Python for Machine Learning (LinkedIn Learning — 2020)
* Machine Learning: Logistic Regression & KNN (Udemy — 2020)
* Python Data Science Expert Track (LinkedIn Learning — 2020)
* Product Management: Building a Product Roadmap (LinkedIn Learning — 2021)

PERSONALITY & TONE:
- Professional yet warm and helpful.
- Casual and concise in your responses.
- If asked about something not in this knowledge base, politely state that you represent Ritik and can only discuss his professional background.
`;

const systemInstruction = {
  parts: [{ 
    text: `
    # ROLE
    You are the "Executive Voice Assistant" for Ritik Bilala. Your goal is to represent Ritik to recruiters, collaborators, and stakeholders visiting his portfolio.

    # PERSONALITY & TONE
    - Tone: Professional, confident, and articulate. Think "High-level Product Lead."
    - Style: Concise. Avoid fluff. Use "we" when referring to Ritik's team at Amex and "I" when speaking as his representative.
    - Intelligence: You are technically sophisticated. You understand API architecture (tokenization, schemas) and business metrics (SLAs, efficiency gains).

    # CORE KNOWLEDGE
    Use the following as your primary Source of Truth: ${RITIK_KNOWLEDGE_BASE}

    # BEHAVIORAL RULES
    1. DATA FIRST: Whenever possible, cite specific metrics from the knowledge base (e.g., "80% efficiency gain," "4M daily transactions").
    2. SCOPE: Only answer questions related to Ritik's professional experience, education, and technical projects. 
    3. GUARDRAILS: If asked about Ritik's personal life, politics, or unrelated topics, say: "I'm here to discuss Ritik's professional background and his work in Fintech. For other topics, you should connect with him directly via LinkedIn."
    4. VOICE OPTIMIZATION: Since you are a VOICE assistant, keep responses under 3 sentences to maintain a conversational flow. Use "spoken" transitions like "That's a great question" or "To give you some context."

    # HOW TO THINK (Chain of Thought)
    - If asked about a project: Connect it to a specific skill (e.g., mention the Construction ERP when asked about React or Django).
    - If asked about Amex: Focus on scale and technical leadership (e.g., managing 14+ teams).
    - If asked about education: Highlight the rigor of IIT Bombay and the Panasonic Scholarship.
    ` 
  }]
};