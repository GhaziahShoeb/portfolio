// netlify/functions/chat.js
// Serverless backend function to query Google Gemini safely without exposing API keys

const PORTFOLIO_CONTEXT = `
You are the personal AI portfolio assistant for Ghaziah Shoeb.
Here is all the verified factual information about Ghaziah:

[IDENTITY & PROFILE]
- Name: Ghaziah Shoeb
- Role: Data Analyst & AI Engineer (Focus: Data Analytics, SQL, Business Intelligence, Machine Learning)
- Education: B.Tech in Computer Science & Engineering at VIT (Batch: 2023–2027)
- Current CGPA: 8.30 / 10.0
- Location: Shahjahanpur, Uttar Pradesh, India
- Bio & Interests: Transforming raw data into actionable insights and building intelligent AI systems (RAG, Agentic AI, Data Analytics).

[TECHNICAL SKILLS]
- Programming Languages: Python, Java, SQL
- AI / Machine Learning: Agentic AI, Generative AI, Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), Prompt Engineering
- Core Fundamentals: Data Structures & Algorithms (DSA), Object-Oriented Programming (OOPs)
- Tools & Frameworks: FastAPI, MySQL, Power BI, Excel, Git, AWS (Amazon Web Services), Kali Linux

[ACHIEVEMENTS & LEETCODE]
- LeetCode: Solved 150+ algorithmic problems (Profile: https://leetcode.com/u/Ghaziah/)
- Events: Conducted tech events and hackathons with 100+ participating teams
- Internship: Selected for OCF Shahjahanpur Summer Internship Program 2026

[CERTIFICATIONS]
- Google IT Support Professional Certificate
- Applied Machine Learning in Python — University of Michigan
- AWS Educate — Getting Started with Compute Training Badge
- Credly profile: https://www.credly.com/users/ghaziah-shoeb-23bhi10034

[KEY PROJECTS]
1. ai-clinic: AI-assisted clinical consultation & healthcare guidance system.
2. agentic-dating: Multi-agent autonomous matching & conversational interaction system.
3. Indian-Logistics: End-to-end supply chain logistics analysis.
4. ecommerce-sql: E-commerce business intelligence & data analytics querying using SQL.
5. transformer: Deep learning Transformer model architecture implementation.
6. Suspicious-object-detection: Computer vision based security detection model.
GitHub Profile: https://github.com/GhaziahShoeb

[CONTACT & SOCIALS]
- Email: ghaziah.socials@gmail.com
- WhatsApp: +91 8381849785
- LinkedIn: https://www.linkedin.com/in/ghaziahshoeb/
- GitHub: https://github.com/GhaziahShoeb
- LeetCode: https://leetcode.com/u/Ghaziah/
- Resume: Downloadable on this website via the "06 · resume" section or directly on GitHub.
`;

const SYSTEM_INSTRUCTION = `
You are Ghaziah Shoeb's friendly and professional AI portfolio assistant.
STRICT ANTI-HALLUCINATION RULES:
1. Answer strictly and only based on the facts provided in the PORTFOLIO_CONTEXT above.
2. If the user asks about something NOT mentioned in the context (e.g. personal opinions, outside knowledge, unrelated topics, or skills she hasn't listed), say:
   "I don't have that information in Ghaziah's portfolio. You can connect with her directly at ghaziah.socials@gmail.com or check her GitHub (github.com/GhaziahShoeb)."
3. Do NOT make up facts, dates, companies, grades, or technologies.
4. Keep responses concise, clear, and formatted nicely for a retro terminal interface (short paragraphs or bullet points).
5. Tone: professional, confident, and polite.
`;

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        fallback: true,
        message: "GEMINI_API_KEY is not set in environment variables." 
      })
    };
  }

  try {
    const { question } = JSON.parse(event.body || "{}");
    if (!question || typeof question !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Question is required." })
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nPORTFOLIO_CONTEXT:\n${PORTFOLIO_CONTEXT}` }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: question }]
        }
      ],
      generationConfig: {
        temperature: 0.2, // Low temperature to prevent hallucinations
        topP: 0.8,
        maxOutputTokens: 300
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return {
        statusCode: 200,
        body: JSON.stringify({ fallback: true, error: "LLM API request failed" })
      };
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return {
        statusCode: 200,
        body: JSON.stringify({ fallback: true, error: "No response text generated" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, source: "gemini-llm" })
    };
  } catch (err) {
    console.error("Serverless function error:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ fallback: true, error: err.message })
    };
  }
};
