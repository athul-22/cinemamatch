import React, { useState, useEffect } from 'react';
import { Loader, XCircle, Search } from "lucide-react";

// Enhanced animations
const animations = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes medalSpin {
    0% { transform: rotateY(0deg) scale(0.8); }
    50% { transform: rotateY(180deg) scale(1.1); }
    100% { transform: rotateY(360deg) scale(1); }
  }

  @keyframes slideIn {
    from { transform: translateX(70px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

// Enhanced MedalBadge component
const MedalBadge = ({ rank }) => {
  const medals = {
    0: { color: '#FFD700', label: 'Perfect Match', gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', shadow: '0 0 20px rgba(255, 215, 0, 0.3)' },
    1: { color: '#C0C0C0', label: 'Excellent Match', gradient: 'linear-gradient(135deg, #E0E0E0, #B0B0B0)', shadow: '0 0 15px rgba(192, 192, 192, 0.3)' },
    2: { color: '#CD7F32', label: 'Great Match', gradient: 'linear-gradient(135deg, #CD7F32, #8B4513)', shadow: '0 0 15px rgba(205, 127, 50, 0.3)' }
  };

  const medal = medals[rank];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '30px',
      backdropFilter: 'blur(10px)',
      animation: 'medalSpin 1.2s ease-out'
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: medal.gradient,
        boxShadow: medal.shadow,
        animation: 'pulse 2s infinite'
      }} />
      <span style={{
        color: medal.color,
        fontWeight: '700',
        fontSize: '0.95rem',
        textShadow: `0 2px 4px rgba(0,0,0,0.1)`
      }}>
        {medal.label}
      </span>
    </div>
  );
};

function App() {
  const [movie, setMovie] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const analyzeMovie = async (e) => {
    e.preventDefault();
    if (!movie.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null); // Clear previous results
    
    try {
      const queryParams = new URLSearchParams({
        movie_title: movie.trim()
      }).toString();
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/analyze?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze movie');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults(null); // Clear results on error
      console.error('Error analyzing movie:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f6f8ff 0%, #ffffff 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{animations}</style>

      <div style={{
        maxWidth: '1300px',
        width: '100%',
        margin: '0 auto',
        padding: width <= 768 ? '24px' : '48px'
      }}>
        {/* Enhanced Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '70px',
          animation: 'fadeIn 1s ease-out'
        }}>
          <h1 style={{
            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #6B21A8 0%, #9333EA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px',
            letterSpacing: '-0.02em'
          }}>
            CinemaMatch
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
            color: '#4B5563',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            Discover your perfect movie matches through our advanced AI recommendations
          </p>
        </div>

        {/* Enhanced Search Form */}
        <form onSubmit={analyzeMovie} style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto 50px',
          animation: 'fadeIn 0.8s ease-out 0.3s backwards'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: width <= 640 ? 'column' : 'row',
            gap: '20px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <input
              type="text"
              style={{
                flex: '1',
                padding: '22px 28px',
                fontSize: '1.2rem',
                border: '2px solid #E5E7EB',
                borderRadius: '18px',
                backgroundColor: '#ffffff',
                color: '#1a1a1a',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                outline: 'none',
                width: width <= 640 ? '100%' : 'auto',
                '&:focus': {
                  borderColor: '#9333EA',
                  boxShadow: '0 0 0 3px rgba(147, 51, 234, 0.2)'
                }
              }}
              placeholder="Enter a movie title to find similar films..."
              value={movie}
              onChange={(e) => setMovie(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              style={{
                padding: '22px 48px',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#9333EA',
                border: 'none',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                width: width <= 640 ? '100%' : 'auto',
                opacity: loading ? 0.7 : 1,
                transform: loading ? 'scale(0.98)' : 'scale(1)',
                '&:hover': {
                  backgroundColor: '#7C2DD3',
                  transform: 'translateY(-2px)'
                }
              }}
              disabled={loading || !movie.trim()}
            >
              {loading ? 'Searching...' : 'Discover Movies'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 40px',
            padding: '16px',
            backgroundColor: '#FEE2E2',
            borderRadius: '12px',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'shake 0.5s ease-in-out'
          }}>
            <XCircle size={24} />
            <p style={{ flex: 1 }}>
              {error.includes('RetryError') || error.includes('ConnectionError') 
                ? 'Connection error. Please try again.' 
                : error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)', // Updated for white theme
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              textAlign: 'center',
              color: '#6B21A8' // Updated color
            }}>
              <Loader 
                size={48} 
                style={{
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }}
              />
              <p style={{ fontSize: '1.25rem' }}>Analyzing...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ 
            width: '100%',
            margin: '0 auto',
            padding: '0 20px',
            animation: 'slideIn 0.5s ease-out' 
          }}>
            {/* Query Movie */}
            <div style={{
              margin: '0 auto 40px',
              padding: '24px',
              backgroundColor: '#F8F9FA',   // Changed from rgba(255, 255, 255, 0.05)
              borderRadius: '20px',
              border: '1px solid rgba(147, 51, 234, 0.2)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                marginBottom: '16px',
                color: '#1a1a1a',          // Changed from #FFFFFF
                fontWeight: '600'
              }}>
                Analyzing: {results.query_movie.title}
              </h2>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.875rem',
                color: '#6B21A8'           // Changed from #D8B4FE
              }}>
                <span>{results.query_movie.release_date}</span>
                <span>•</span>
                <span>{results.query_movie.runtime}</span>
                <span>•</span>
                <span>Rating: {results.query_movie.rating}/10</span>
              </div>
            </div>

            {/* Similar Movies */}
            <div style={{
              display: 'grid',
              gap: '24px'
            }}>
              {results.similar_movies.map((result, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#F3F4F6', // Light gray background
                    borderRadius: '20px',
                    padding: '24px',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.3s ease',
                    animation: `fadeIn 0.5s ease-out ${index * 0.2}s backwards`,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.backgroundColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#111827', // Darker text for contrast
                        marginBottom: '8px'
                      }}>
                        {result.title}
                      </h3>
                      <MedalBadge rank={index} />
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: '#EDE9FE',
                      borderRadius: '999px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6B21A8'
                    }}>
                      {result.similarity}% Match
                    </div>
                  </div>

                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#F8F9FA',    // Changed from rgba(255, 255, 255, 0.03)
                    borderRadius: '12px'
                  }}>
                    <p style={{
                      color: '#4B5563',            // Changed from #D8B4FE
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    }}>
                      {result.justification}
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      fontSize: '0.875rem',
                      color: '#6B21A8',             // Changed from #D8B4FE
                      marginBottom: '12px',
                      fontWeight: '500'
                    }}>
                      Shared Genres
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {result.shared_genres.map((genre, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#F3F4F6',
                            color: '#6B21A8',
                            borderRadius: '999px',
                            fontSize: '0.875rem'
                          }}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{
                      fontSize: '0.875rem',
                      color: '#6B21A8',             // Changed from #D8B4FE
                      marginBottom: '12px',
                      fontWeight: '500'
                    }}>
                      All Genres
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {result.genres.split(', ').map((genre, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#EDE9FE',  // Changed from rgba(255, 255, 255, 0.03)
                            color: '#6B21A8',           // Changed from #D8B4FE
                            borderRadius: '999px',
                            fontSize: '0.875rem'
                          }}
                          >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !results && !error && (
          <div style={{
            width: '100%',
            margin: '40px auto',
            padding: '0 20px', // responsive horizontal padding
            textAlign: 'center',
            color: '#6B21A8',             // Changed from #D8B4FE
            animation: 'fadeIn 0.8s ease-out'
          }}>
            <Search size={48} style={{
              margin: '0 auto 20px',
              opacity: 0.5
            }} />
            <p style={{ fontSize: '1.125rem' }}>
              Enter a movie title to discover similar films
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          padding: '20px',
          color: '#6B21A8',             // Changed from #D8B4FE
          fontSize: '0.875rem'
        }}>
         
        </div>
      </div>
    </div>
  );
}

export default App;