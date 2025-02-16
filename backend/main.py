from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import chromadb
from openai import OpenAI
import os
import tmdbsimple as tmdb
from dotenv import load_dotenv
import logging
from typing import List, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import time
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
OPEN_AI_API_KEY = os.getenv("OPENAI_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")

if not all([OPEN_AI_API_KEY, TMDB_API_KEY, CHROMA_API_KEY]):
    logger.error("Missing required environment variables")
    sys.exit(1)

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients with retry mechanism
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def init_chroma_client():
    try:
        client = chromadb.HttpClient(
            ssl=True,
            host='api.trychroma.com',
            tenant='5931c629-c2af-42da-b3c9-589bc968cc0a',
            database='movie',
            headers={'x-chroma-token': CHROMA_API_KEY}
        )
        # Test the connection
        client.heartbeat()
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Chroma client: {str(e)}")
        raise

# Initialize clients
try:
    logger.info("Initializing clients...")
    tmdb.API_KEY = TMDB_API_KEY
    openai_client = OpenAI(api_key=OPEN_AI_API_KEY)
    chroma_client = init_chroma_client()
    collection = chroma_client.get_collection("movies")
    logger.info("Clients initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize clients: {str(e)}")
    raise

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def fetch_movie_data(movie_title: str) -> Dict:
    """Fetch movie data from TMDB with retry logic"""
    try:
        search = tmdb.Search()
        response = search.movie(query=movie_title)
        
        if not response["results"]:
            raise HTTPException(status_code=404, detail=f"Movie '{movie_title}' not found")
        
        movie_id = response["results"][0]["id"]
        return tmdb.Movies(movie_id).info()
    except Exception as e:
        logger.error(f"Error fetching movie data: {str(e)}")
        raise

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def generate_embedding(text: str) -> List[float]:
    """Generate embedding with retry logic"""
    try:
        response = openai_client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def query_similar_movies(embedding: List[float]) -> Dict:
    """Query Chroma for similar movies with retry logic"""
    try:
        return collection.query(
            query_embeddings=[embedding],
            n_results=3,
            include=["metadatas", "distances"]
        )
    except Exception as e:
        logger.error(f"Error querying similar movies: {str(e)}")
        raise

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def generate_explanation(movie1: str, movie2: str) -> str:
    """Generate similarity explanation with retry logic"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user",
                "content": f"Explain in one sentence why '{movie1}' and '{movie2}' might be similar in terms of plot, themes, or style."
            }],
            max_tokens=100,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating explanation: {str(e)}")
        return "Similar in themes and style."

@app.get("/analyze")
@app.post("/analyze")
async def analyze_movie(movie_title: str):
    try:
        logger.info(f"Starting analysis for movie: {movie_title}")
        
        # Fetch movie data
        movie = await fetch_movie_data(movie_title)
        logger.info(f"Successfully fetched data for: {movie['title']}")
        
        # Generate embedding
        embedding = await generate_embedding(movie["overview"])
        logger.info("Successfully generated embedding")
        
        # Query similar movies
        results = await query_similar_movies(embedding)
        logger.info("Successfully queried similar movies")
        
        # Process results
        similar_movies = []
        for idx, (metadata, distance) in enumerate(zip(results["metadatas"][0], results["distances"][0])):
            try:
                similarity_score = round(100 - (distance * 25), 1)
                explanation = await generate_explanation(movie['title'], metadata['title'])
                
                similar_movies.append({
                    "title": metadata["title"],
                    "genres": metadata["genres"],
                    "similarity": similarity_score,
                    "justification": explanation,
                    "shared_genres": list(set(metadata["genres"].split(", ")) & 
                                       set(g["name"] for g in movie["genres"]))
                })
            except Exception as e:
                logger.error(f"Error processing similar movie {metadata['title']}: {str(e)}")
                continue
        
        # Prepare response
        response_data = {
            "query_movie": {
                "id": str(movie["id"]),
                "title": movie["title"],
                "overview": movie["overview"],
                "release_date": movie["release_date"],
                "genres": ", ".join(g["name"] for g in movie["genres"]),
                "rating": movie["vote_average"],
                "runtime": f"{movie['runtime']}min" if movie["runtime"] else "N/A"
            },
            "similar_movies": similar_movies
        }
        
        logger.info("Analysis completed successfully")
        return response_data
        
    except HTTPException as he:
        logger.error(f"HTTP Exception: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Get port from environment variable for Render compatibility
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        workers=4
    )