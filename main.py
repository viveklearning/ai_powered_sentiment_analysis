from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import pandas as pd
import io

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Authentication dependency
def get_current_user(token: str = Depends(oauth2_scheme)):
    if token != "secure_token":  # Replace with a secure validation method
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"username": "user"}

# Initialize Sentiment Analyzer
analyzer = SentimentIntensityAnalyzer()

@app.post("/analyze", dependencies=[Depends(get_current_user)])
async def analyze_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        data = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")
    
    if "id" not in data.columns or "text" not in data.columns:
        missing_columns = [col for col in ["id", "text"] if col not in data.columns]
        raise HTTPException(
            status_code=400, 
            detail=f"Missing columns: {', '.join(missing_columns)}"
        )

    results = []
    for _, row in data.iterrows():
        text = str(row["text"])  # Ensure text is string
        sentiment = analyzer.polarity_scores(text)
        sentiment_class = (
            "positive" if sentiment["compound"] > 0 else
            "negative" if sentiment["compound"] < 0 else
            "neutral"
        )
        results.append({
            "id": row["id"],
            "text": text,
            "sentiment": sentiment_class,
            "scores": sentiment
        })

    return {"analysis": results}
