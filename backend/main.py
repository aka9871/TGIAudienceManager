from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import PyPDF2
import io
from openai import OpenAI
import time
import requests
import sqlite3
import hashlib
import datetime
from database import DatabaseManager
import jwt
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file (in parent directory)
load_dotenv('../.env')

# Initialize OpenAI client
DEFAULT_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Global client cache
client_cache = {}

def get_openai_client(api_key: str = None):
    """Get OpenAI client with specified API key or default."""
    if api_key is None:
        api_key = DEFAULT_OPENAI_API_KEY
    
    if not api_key:
        raise HTTPException(status_code=400, detail="No OpenAI API key provided")
    
    # Use cached client if available
    if api_key in client_cache:
        return client_cache[api_key]
    
    # Create new client with simplified initialization
    try:
        client = OpenAI(api_key=api_key)
        # Cache the client
        client_cache[api_key] = client
        return client
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating OpenAI client: {str(e)}")

def get_api_key_from_header(x_openai_key: Optional[str] = Header(None)):
    """Extract API key from header or use default."""
    return x_openai_key or DEFAULT_OPENAI_API_KEY

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Initialize database
db = DatabaseManager()

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting DDB TGI Audience Manager API...")
    yield
    # Shutdown
    print("Shutting down DDB TGI Audience Manager API...")

# Create FastAPI app
app = FastAPI(
    title="DDB TGI Audience Manager API",
    description="API pour la gestion des assistants IA d'analyse de données",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class MessageRequest(BaseModel):
    message: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    role: Optional[str] = "user"

class LoginResponse(BaseModel):
    user: UserResponse
    token: str

class AssistantResponse(BaseModel):
    id: str
    name: str
    theme: str
    created_at: str
    file_name: Optional[str]
    file_type: Optional[str]
    message_count: int
    total_tokens: Optional[int] = 0
    total_cost_euros: Optional[float] = 0.0

class MessageResponse(BaseModel):
    response: str

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_admin_role(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify token and check if user has admin role."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database to check role
        conn = sqlite3.connect(db.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or user[0] != 'admin':
            raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
        
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def extract_text_from_pdf(pdf_file) -> str:
    """Extract text content from PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

def extract_text_from_json(json_file) -> str:
    """Extract text content from JSON file."""
    try:
        json_content = json.load(json_file)
        return json.dumps(json_content, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing JSON file: {str(e)}")

def extract_text_from_jsonl(jsonl_file) -> str:
    """Extract text content from JSONL file."""
    try:
        lines = []
        content = jsonl_file.read().decode('utf-8')
        for line in content.strip().split('\n'):
            if line.strip():
                json_obj = json.loads(line)
                lines.append(json.dumps(json_obj, ensure_ascii=False))
        return '\n'.join(lines)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing JSONL file: {str(e)}")

def extract_text_from_txt(txt_file) -> str:
    """Extract text content from TXT file."""
    try:
        return txt_file.read().decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing TXT file: {str(e)}")

def create_vector_store_via_api(name: str, file_content: bytes, filename: str, api_key: str) -> Optional[str]:
    """Create vector store using direct API calls with proper file upload."""
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "OpenAI-Beta": "assistants=v2"
        }
        
        # Step 1: Create vector store
        vs_response = requests.post(
            "https://api.openai.com/v1/vector_stores",
            headers=headers,
            json={"name": f"vs_{name}"}
        )
        
        if vs_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to create vector store: {vs_response.text}")
            
        vector_store_id = vs_response.json()["id"]
        
        # Step 2: Upload file to OpenAI Files
        if filename.endswith('.json'):
            content_type = "application/json"
        elif filename.endswith('.jsonl'):
            content_type = "application/x-ndjson"
        elif filename.endswith('.txt'):
            content_type = "text/plain"
        elif filename.endswith('.pdf'):
            content_type = "application/pdf"
        else:
            content_type = "application/octet-stream"
        
        files = {
            'file': (filename, file_content, content_type),
            'purpose': (None, 'assistants')
        }
        
        file_response = requests.post(
            "https://api.openai.com/v1/files",
            headers={"Authorization": f"Bearer {api_key}"},
            files=files
        )
        
        if file_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to upload file: {file_response.text}")
            
        file_id = file_response.json()["id"]
        
        # Step 3: Attach file to vector store
        vs_file_response = requests.post(
            f"https://api.openai.com/v1/vector_stores/{vector_store_id}/files",
            headers=headers,
            json={"file_id": file_id}
        )
        
        if vs_file_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to attach file to vector store: {vs_file_response.text}")
        
        # Wait for file indexing
        max_wait = 30
        wait_count = 0
        
        while wait_count < max_wait:
            vs_status_response = requests.get(
                f"https://api.openai.com/v1/vector_stores/{vector_store_id}",
                headers=headers
            )
            
            if vs_status_response.status_code == 200:
                vs_data = vs_status_response.json()
                file_counts = vs_data.get("file_counts", {})
                
                if file_counts.get("completed", 0) > 0:
                    break
                elif file_counts.get("failed", 0) > 0:
                    break
            
            time.sleep(2)
            wait_count += 2
        
        return vector_store_id
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating vector store: {str(e)}")

def create_openai_assistant(name: str, instructions: str, file_content: bytes, filename: str, file_type: str, api_key: str) -> Optional[str]:
    """Create an OpenAI assistant with vector store and file search."""
    try:
        # Create vector store and upload file
        vector_store_id = create_vector_store_via_api(name, file_content, filename, api_key)
        
        if not vector_store_id:
            raise HTTPException(status_code=500, detail="Failed to create vector store")
        
        # Create assistant instructions
        full_instructions = f"""
{instructions}

You are an assistant that can answer questions about the uploaded {file_type} document. 
Please use the document content to answer user questions accurately and helpfully. 
If a question cannot be answered based on the provided document, please say so clearly.
"""
        
        # Create the assistant
        client = get_openai_client(api_key)
        assistant = client.beta.assistants.create(
            name=name,
            instructions=full_instructions,
            model="gpt-4o",
            tools=[{"type": "file_search"}],
            tool_resources={
                "file_search": {
                    "vector_store_ids": [vector_store_id]
                }
            }
        )
        
        return assistant.id
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating assistant: {str(e)}")

# Store for threads (in production, use Redis or database)
threads_store = {}

def get_or_create_thread(assistant_id: str, api_key: str) -> Optional[str]:
    """Get existing thread or create new one for the assistant."""
    thread_key = f"{assistant_id}_{api_key[:10]}"  # Use API key prefix to separate threads
    
    if thread_key not in threads_store:
        try:
            client = get_openai_client(api_key)
            thread = client.beta.threads.create()
            threads_store[thread_key] = thread.id
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating thread: {str(e)}")
    return threads_store[thread_key]

def send_message_to_assistant(assistant_id: str, message: str, api_key: str) -> tuple[str, int, int]:
    """Send message to assistant and get response with token usage."""
    try:
        client = get_openai_client(api_key)
        thread_id = get_or_create_thread(assistant_id, api_key)
        if not thread_id:
            raise HTTPException(status_code=500, detail="Could not create conversation thread")
        
        # Add message to thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=message
        )
        
        # Create and run assistant
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id
        )
        
        # Wait for completion
        while run.status in ['queued', 'in_progress']:
            time.sleep(1)
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
        
        if run.status == 'completed':
            # Get the completed run to extract token usage
            completed_run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
            
            # Extract token usage
            input_tokens = 0
            output_tokens = 0
            if hasattr(completed_run, 'usage') and completed_run.usage:
                input_tokens = completed_run.usage.prompt_tokens or 0
                output_tokens = completed_run.usage.completion_tokens or 0
            
            # Get messages
            messages = client.beta.threads.messages.list(thread_id=thread_id)
            content = messages.data[0].content[0]
            if content.type == 'text':
                return content.text.value, input_tokens, output_tokens
            else:
                raise HTTPException(status_code=500, detail="Assistant response format is unexpected")
        else:
            raise HTTPException(status_code=500, detail=f"Assistant run failed with status: {run.status}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")

# API Routes

@app.get("/")
async def root():
    return {"message": "DDB TGI Audience Manager API", "version": "1.0.0"}

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = db.authenticate_user(request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token({"user_id": user["id"]})
    
    return LoginResponse(
        user=UserResponse(**user),
        token=token
    )

@app.get("/assistants", response_model=List[AssistantResponse])
async def get_assistants(
    user_id: int = Depends(verify_token),
    api_key: str = Depends(get_api_key_from_header)
):
    try:
        # Get assistants from OpenAI with the provided API key
        client = get_openai_client(api_key)
        assistants = client.beta.assistants.list(limit=100)
        
        # Get additional data from database
        db_assistants = db.get_user_assistants(user_id)
        db_dict = {a['openai_id']: a for a in db_assistants}
        
        result = []
        for assistant in assistants.data:
            db_data = db_dict.get(assistant.id, {})
            result.append(AssistantResponse(
                id=assistant.id,
                name=assistant.name or "Assistant",
                theme=db_data.get('theme', 'N/A'),
                created_at=datetime.datetime.fromtimestamp(assistant.created_at).isoformat(),
                file_name=db_data.get('file_name'),
                file_type=db_data.get('file_type'),
                message_count=db_data.get('message_count', 0),
                total_tokens=db_data.get('total_tokens', 0),
                total_cost_euros=db_data.get('total_cost_euros', 0.0)
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assistants: {str(e)}")

@app.post("/assistants")
async def create_assistant(
    name: str = Form(...),
    theme: str = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(verify_token),
    api_key: str = Depends(get_api_key_from_header)
):
    try:
        # Validate file type
        allowed_types = ['application/json', 'text/plain', 'application/x-ndjson']
        is_jsonl = file.filename.endswith('.jsonl')
        
        if file.content_type not in allowed_types and not is_jsonl:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use JSON, JSONL or TXT.")
        
        # Read file content
        file_content = await file.read()
        
        # Determine file type
        file_type = "JSONL"
        if file.content_type == "application/json":
            file_type = "JSON"
        elif file.filename.endswith('.jsonl'):
            file_type = "JSONL"
        elif file.content_type == "text/plain" or file.filename.endswith('.txt'):
            file_type = "TXT"
        
        # Create universal prompt with the theme
        universal_prompt = f"""Tu es un assistant expert en analyse de données sectorielles.
Tu travailles à partir d'un fichier structuré (JSONL) avec toujours les mêmes champs, dont la signification est :
"Interview" : caractéristique démographique ou comportementale (sexe, âge, opinion, etc.)
"Segment" : segment étudié (par exemple : marque ou modèle de voiture, produit, catégorie, etc.)
"Échantillon" : nombre de personnes interrogées
"(000)" : valeur numérique représentant les milliers de personnes
"% Vert" : pourcentage vertical au sein d'une catégorie
"% Horz" : pourcentage horizontal
"Indice" : indicateur clé : >100 = surreprésentation dans la population cible, <100 = sous-représentation

Le thème du jeu de données à analyser est : {theme}.

Ta mission :
Analyser ces données pour répondre précisément à toute question sur le thème indiqué : profils, comportements, segments différenciants, tendances, etc.
Identifier les segments surreprésentés ("Indice" > 100) et sous-représentés ("Indice" < 100), en illustrant toujours par les valeurs chiffrées pertinentes (indice, % Vert, etc.)
Comparer des segments ou profils si demandé, synthétiser les points saillants, et structurer ta réponse avec : Synthèse, Détail chiffré et Tableau illustratif si pertinent.
Toujours utiliser la signification exacte des champs ci-dessus pour interpréter les résultats.
Si la question de l'utilisateur n'est pas claire, commence par demander une précision.
Commence l'analyse dès la prochaine question utilisateur."""
        
        # Create assistant with universal prompt
        assistant_id = create_openai_assistant(
            name, universal_prompt, file_content, file.filename, file_type, api_key
        )
        
        if assistant_id:
            # Log to database
            db.log_assistant_creation(
                assistant_id, name, theme, user_id, file.filename, file_type
            )
            
            return {"message": f"Assistant '{name}' created successfully", "assistant_id": assistant_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to create assistant")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating assistant: {str(e)}")

@app.delete("/assistants/{assistant_id}")
async def delete_assistant(
    assistant_id: str, 
    user_id: int = Depends(verify_token),
    api_key: str = Depends(get_api_key_from_header)
):
    try:
        client = get_openai_client(api_key)
        client.beta.assistants.delete(assistant_id)
        
        # Remove from threads store
        thread_key = f"{assistant_id}_{api_key[:10]}"
        if thread_key in threads_store:
            del threads_store[thread_key]
        
        return {"message": "Assistant deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting assistant: {str(e)}")

@app.get("/assistants/{assistant_id}/messages", response_model=List[ChatMessage])
async def get_chat_history(assistant_id: str, user_id: int = Depends(verify_token)):
    """Get chat history for an assistant from the database."""
    try:
        messages = db.get_assistant_messages(assistant_id)
        return [
            ChatMessage(
                role=msg['role'],
                content=msg['content'],
                timestamp=msg['timestamp']
            )
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")

@app.delete("/assistants/{assistant_id}/messages")
async def clear_chat_history(
    assistant_id: str, 
    user_id: int = Depends(verify_token),
    api_key: str = Depends(get_api_key_from_header)
):
    """Clear chat history for an assistant."""
    try:
        db.clear_assistant_messages(assistant_id)
        
        # Also clear the thread to start fresh
        thread_key = f"{assistant_id}_{api_key[:10]}"
        if thread_key in threads_store:
            del threads_store[thread_key]
        
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing chat history: {str(e)}")

@app.post("/assistants/{assistant_id}/message", response_model=MessageResponse)
async def send_message(
    assistant_id: str, 
    request: MessageRequest, 
    user_id: int = Depends(verify_token),
    api_key: str = Depends(get_api_key_from_header)
):
    try:
        start_time = time.time()
        response, input_tokens, output_tokens = send_message_to_assistant(assistant_id, request.message, api_key)
        response_time = int((time.time() - start_time) * 1000)
        
        # Log to database with token usage
        db.log_message(assistant_id, "user", request.message, input_tokens=len(request.message.split()))
        db.log_message(assistant_id, "assistant", response, response_time, input_tokens, output_tokens)
        
        return MessageResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")

@app.get("/dashboard/stats")
async def get_dashboard_stats(user_id: int = Depends(verify_token)):
    try:
        stats = db.get_dashboard_stats(user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")

@app.get("/analytics/data")
async def get_analytics_data(user_id: int = Depends(verify_admin_role)):
    """Get detailed analytics data including costs and token usage. Admin only."""
    try:
        analytics = db.get_analytics_data(user_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
