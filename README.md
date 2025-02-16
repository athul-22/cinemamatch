# CinemaMatch - AI-Powered Movie Recommendation System

CinemaMatch is an intelligent movie recommendation system that uses advanced AI to suggest similar movies based on plot, themes, and style. The system combines TMDB data, OpenAI embeddings, and ChromaDB for vector similarity search to deliver accurate and context-aware movie recommendations.

![CinemaMatch Demo](demo-screenshot.png)

## 🌟 Features

- Real-time movie similarity analysis
- AI-powered explanation of movie similarities
- Beautiful, responsive UI with modern design
- Genre-based filtering and matching
- Animated loading states and transitions
- Error handling and retry mechanisms

## 🏗 Architecture

```plaintext
Frontend (React + Vite)        Backend (FastAPI)           External Services
     │                              │                              │
     ▼                              ▼                              ▼
┌──────────────┐             ┌──────────────┐            ┌─────────────────┐
│   React UI   │─────REST────▶   FastAPI    │───────────▶│    TMDB API     │
└──────────────┘             └──────────────┘            └─────────────────┘
                                    │                              │
                                    │                     ┌─────────────────┐
                                    └────────────────────▶│   OpenAI API    │
                                    │                     └─────────────────┘
                                    │                              │
                                    └────────────────────▶┌─────────────────┐
                                                         │   ChromaDB      │
                                                         └─────────────────┘
```

## 🚀 Getting Started  
### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- Git

### Backend Setup

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/cinemamatch.git
    cd cinemamatch
    ```

2. Set up Python virtual environment:
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: .\venv\Scripts\activate
    ```

3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Create `.env` file in the backend directory:
    ```env
    TMDB_API_KEY=your_tmdb_api_key
    OPENAI_API_KEY=your_openai_api_key
    CHROMA_API_KEY=your_chroma_api_key
    ```

5. Initialize the ChromaDB database:
    ```bash
    python chroma_init.py
    ```

6. Start the backend server:
    ```bash
    python run.py
    ```

### Frontend Setup
1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create `.env.local` file:
    ```env
    REACT_APP_API_URL=http://localhost:8000
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```
