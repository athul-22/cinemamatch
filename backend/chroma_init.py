import chromadb
from chromadb.config import Settings
from openai import OpenAI
import os
import tmdbsimple as tmdb
from dotenv import load_dotenv
import sys
import requests
from requests.exceptions import Timeout, ConnectionError
from tenacity import retry, stop_after_attempt, wait_exponential
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Checkpoint 1: Environment setup
try:
    print("Checkpoint 1: Loading environment variables...")
    load_dotenv()
    
    # Verify API keys are loaded
    tmdb_key = os.getenv("TMDB_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    chroma_key = os.getenv("CHROMA_API_KEY")
    
    if not all([tmdb_key, openai_key, chroma_key]):
        raise ValueError("Missing required API keys in .env file")
    
    print("✓ Environment variables loaded successfully")
except Exception as e:
    print(f"❌ Error loading environment: {str(e)}")
    sys.exit(1)

# Checkpoint 2: Initialize API clients
try:
    print("\nCheckpoint 2: Initializing API clients...")
    tmdb.API_KEY = tmdb_key
    client = OpenAI(api_key=openai_key)
    print("✓ API clients initialized successfully")
except Exception as e:
    print(f"❌ Error initializing API clients: {str(e)}")
    sys.exit(1)

# Checkpoint 3: Connecting to Chroma...
try:
    print("\nCheckpoint 3: Connecting to Chroma...")
    chroma_client = chromadb.HttpClient(
        ssl=True,
        host='api.trychroma.com',
        tenant='5931c629-c2af-42da-b3c9-589bc968cc0a',
        database='movie',
        headers={
            'x-chroma-token': os.getenv("CHROMA_API_KEY")
        }
    )
    print("✓ Connected to Chroma successfully")
except Exception as e:
    print(f"❌ Error connecting to Chroma: {str(e)}")
    sys.exit(1)

# Checkpoint 4: Create or get collection
try:
    print("\nCheckpoint 4: Creating collection...")
    try:
        # Try to get existing collection first
        collection = chroma_client.get_or_create_collection(
            name="movies",
            metadata={"description": "Movie embeddings collection"}
        )
        print("✓ Collection created/retrieved successfully")
    except Exception as collection_error:
        print(f"❌ Error with collection: {str(collection_error)}")
        sys.exit(1)
except Exception as e:
    print(f"❌ Error in collection operation: {str(e)}")
    sys.exit(1)

# Preload 20 movies
movies = [
    "Inception", "The Dark Knight", "Interstellar", "The Matrix",
    "Pulp Fiction", "Fight Club", "Forrest Gump", "Gladiator",
    "The Godfather", "Titanic", "Jurassic Park", "Avatar",
    "Star Wars: A New Hope", "The Avengers", "Casablanca",
    "The Shawshank Redemption", "The Lion King", "Back to the Future",
    "E.T. the Extra-Terrestrial", "The Social Network"
]

def setup_requests_session():
    session = requests.Session()
    retry_strategy = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

# Initialize the session
session = setup_requests_session()

@retry(
    stop=stop_after_attempt(7),  # Increased from 5 to 7 attempts
    wait=wait_exponential(multiplier=2, min=4, max=30),  # Increased wait times
    reraise=True
)
def fetch_tmdb_data(title):
    try:
        session = requests.Session()  # Create a session for better connection handling
        search = tmdb.Search()
        results = search.movie(query=title)["results"]
        if not results:
            raise ValueError(f"No results found for {title}")
        movie = results[0]
        details = tmdb.Movies(movie["id"]).info()
        return movie, details
    except Exception as e:
        print(f"Error in fetch_tmdb_data: {str(e)}")
        raise

# Checkpoint 5: Process movies
print("\nCheckpoint 5: Processing movies...")
for index, title in enumerate(movies, 1):
    try:
        print(f"\nProcessing movie {index}/20: {title}")
        
        # Search movie and get details
        try:
            print("- Searching TMDB...")
            movie, details = fetch_tmdb_data(title)
        except ConnectionError as e:
            print(f"Network error while processing {title}: {str(e)}")
            continue
        except Timeout as e:
            print(f"Timeout while processing {title}: {str(e)}")
            continue
        
        # Generate embedding
        print("- Generating embedding...")
        embedding = client.embeddings.create(
            input=details["overview"],
            model="text-embedding-3-small"
        ).data[0].embedding
        
        # Before adding to Chroma, check if the ID exists
        try:
            print("- Adding to Chroma...")
            movie_id = str(movie["id"])
            existing_ids = collection.get(ids=[movie_id])
            
            if not existing_ids["ids"]:  # If ID doesn't exist
                # Truncate genres string to avoid quota issues
                genres = ", ".join([g["name"] for g in details["genres"]])
                if len(genres) > 30:  # Limit genres string length
                    genres = genres[:27] + "..."
                    
                collection.add(
                    ids=[movie_id],
                    embeddings=[embedding],
                    documents=[details["overview"][:500]],  # Limit overview length
                    metadatas=[{
                        "title": details["title"][:50],  # Limit title length
                        "genres": genres
                    }]
                )
            else:
                print(f"- Movie {title} already exists in database, skipping...")
        
        except Exception as e:
            print(f"❌ Error adding to Chroma: {str(e)}")
            continue
        
        print(f"✓ Successfully processed {title}")
        
    except Exception as e:
        print(f"❌ Error processing {title}: {str(e)}")
        continue
    
    time.sleep(2)  # 2 second delay between requests

print("\nVerifying database contents...")
try:
    collection = chroma_client.get_collection(name="movies")
    results = collection.get()
    print(f"Total movies in database: {len(results['ids'])}")
    for i, (id, title) in enumerate(zip(results['ids'], [m['title'] for m in results['metadatas']]), 1):
        print(f"{i}. {title} (ID: {id})")
except Exception as e:
    print(f"Error verifying database: {str(e)}")

print("\nScript completed!")