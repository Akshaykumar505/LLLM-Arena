🏆 LLM Arena

Ask one question, get answers from 3 AI models at once, and let a 4th AI "judge" model pick the best response.

Live demo: [Add your Render URL here]

Features


3 AI models compete on every question, answering in parallel
AI judge evaluates all three responses and picks a winner (with bias mitigation — response order is shuffled before judging to avoid favoring the first answer)
Star ratings across 5 criteria (accuracy, clarity, depth, relevance, completeness)
History — every question and its winner is saved locally in the browser
Leaderboard — tracks win count and win rate per model
Analytics — aggregate stats across all questions asked
Responsive UI — sliding sidebar menu, works on desktop and mobile
Enter to submit — no need to click the button


Tech Stack


Backend: Node.js + Express
AI Models: OpenRouter (free-tier models)
Frontend: Vanilla HTML/CSS/JavaScript (no framework, no build step)
Storage: Browser localStorage for history/stats (no database needed)


Project Structure

llm-arena/
├── server.js          # Express backend — calls the 3 models + judge
├── public/
│   └── index.html      # Frontend UI (single file, inline CSS/JS)
├── package.json
├── .env.example         # Template for your API key
├── .gitignore
└── README.md

Setup (Local Development)

1. Clone the repository

bashgit clone https://github.com/YOUR_USERNAME/llm-arena.git
cd llm-arena

2. Install dependencies

bashnpm install

3. Get a free OpenRouter API key


Sign up at openrouter.ai
Go to openrouter.ai/keys and create a new key


4. Set up environment variables

bashcp .env.example .env

Open .env and add your key:

OPENROUTER_API_KEY=sk-or-v1-your-key-here

5. Run the server

bashnpm start

Open http://localhost:3000 in your browser.

Configuring Models

The three contestant models are set in server.js:

javascriptconst MODELS = [
  { label: "A", model: "openrouter/free" },
  { label: "B", model: "openrouter/free" },
  { label: "C", model: "openrouter/free" },
];

Swap "openrouter/free" for any specific free model from openrouter.ai/models?max_price=0 to compare specific models instead of the auto-router.

Deployment

This project is deployed on Render:


Push your code to GitHub (make sure .env is in .gitignore — never commit API keys)
Create a new Web Service on Render, connect your GitHub repo
Set:

Build Command: npm install
Start Command: node server.js



Add an environment variable: OPENROUTER_API_KEY = your key
Deploy — Render gives you a live URL


Any future git push to main automatically triggers a redeploy.

Notes on Free Tier Usage


OpenRouter's free models have rate limits — if a model fails, it's usually temporary (wait a bit and retry)
Render's free web service tier sleeps after 15 minutes of inactivity; the first request after that takes 30–60 seconds to wake up (cold start)


License

Free to use and modify for personal/educational purposes.
