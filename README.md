🏆 LLM Arena

A full-stack GenAI application that demonstrates the self-consistency technique: a user's question is sent to 3 independent AI models in parallel, and a 4th evaluator model analyzes all three responses to produce one refined, synthesized final answer — rather than simply picking a winner.

Live demo: https://lllm-arena.onrender.com/

How It Works


User signs up / logs in
User submits a question
The same prompt is sent in parallel to three models: OpenAI, Google Gemini, and Meta Llama
All three responses are collected (with graceful error handling if any model fails)
The responses are passed to an evaluator model, which combines their strongest parts into a new synthesized answer — response order is randomized before evaluation to avoid position bias
The final answer, individual model responses, and quality ratings are shown to the user


Features


Multi-model orchestration — 3 AI models called in parallel via Promise.allSettled
Answer synthesis, not selection — the evaluator writes a new combined answer instead of copying one model's response
Bias mitigation — response order shown to the evaluator is shuffled each time
Authentication — signup/login with bcrypt-hashed passwords, session-based auth, MongoDB-backed persistent accounts
Daily rate limiting — 5 questions per user per day, with a live "X/5 used" counter; only successful responses count against the quota
Responsive UI — sliding sidebar navigation (push on desktop, overlay on mobile), History, Analytics, and Models pages
Loading and error states throughout


Tech Stack


Backend: Node.js, Express
Frontend: Vanilla HTML/CSS/JavaScript (no framework, no build step)
AI Models: OpenAI & Meta Llama via OpenRouter (free tier), Google Gemini via Google AI Studio (free tier)
Database: MongoDB Atlas (user accounts)
Auth: express-session, bcryptjs
Deployment: Render (auto-deploys from GitHub on push)


Project Structure

llm-arena/
├── server.js            # Express backend — models, evaluator, auth, rate limiting
├── models/
│   └── User.js           # Mongoose schema for user accounts
├── public/
│   └── index.html         # Frontend UI (single file, inline CSS/JS)
├── package.json
├── .env.example
├── .gitignore
└── README.md

Setup (Local Development)

1. Clone and install

bashgit clone https://github.com/Akshaykumar505/LLLM-Arena.git
cd LLLM-Arena
npm install

2. Get API keys


OpenRouter: sign up at openrouter.ai → openrouter.ai/keys
Gemini: get a free key at aistudio.google.com
MongoDB: create a free M0 cluster at MongoDB Atlas, get your connection string, and allow access from anywhere (0.0.0.0/0) under Network Access


3. Configure environment variables

bashcp .env.example .env

Fill in .env:

OPENROUTER_API_KEY=your_openrouter_key
GEMINI_API_KEY=your_gemini_key
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=any_random_string

4. Run

bashnpm start

Open http://localhost:3000, sign up, and start asking questions.

API Endpoints

MethodEndpointPurposePOST/api/signupCreate a new accountPOST/api/loginLog inPOST/api/logoutEnd sessionGET/api/meCheck login statusGET/api/usageGet today's usage countPOST/api/testRun the full multi-model + synthesis pipeline

Deployment

Deployed on Render as a Node.js web service, connected to this GitHub repo. Every push to main triggers an automatic rebuild and redeploy. All secrets (API keys, DB connection string, session secret) are set as environment variables in Render — never committed to source control.

Known Limitations


Free-tier AI models occasionally hit rate limits; failures are handled gracefully without crashing the request
The evaluator uses Google Gemini (no free tier exists for Claude at the time of writing)
Render's free tier sleeps after inactivity, causing a slower first response (cold start)
