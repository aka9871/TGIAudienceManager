import sqlite3
import hashlib
import datetime
from typing import Optional, List, Dict, Any

class DatabaseManager:
    def __init__(self, db_path: str = "ddb_manager.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database with required tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table for authentication
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Assistants table for tracking created assistants
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS assistants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                openai_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                theme TEXT NOT NULL,
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP,
                message_count INTEGER DEFAULT 0,
                file_name TEXT,
                file_type TEXT,
                total_tokens INTEGER DEFAULT 0,
                total_cost_euros REAL DEFAULT 0.0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Messages table for tracking conversations with token usage
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assistant_id INTEGER,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                response_time_ms INTEGER,
                input_tokens INTEGER DEFAULT 0,
                output_tokens INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                cost_euros REAL DEFAULT 0.0,
                FOREIGN KEY (assistant_id) REFERENCES assistants (id)
            )
        ''')
        
        # Activity log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Add new columns to existing tables if they don't exist
        try:
            cursor.execute('ALTER TABLE assistants ADD COLUMN total_tokens INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE assistants ADD COLUMN total_cost_euros REAL DEFAULT 0.0')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE messages ADD COLUMN input_tokens INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE messages ADD COLUMN output_tokens INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE messages ADD COLUMN total_tokens INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE messages ADD COLUMN cost_euros REAL DEFAULT 0.0')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Create default admin user if no users exist
        cursor.execute('SELECT COUNT(*) FROM users')
        if cursor.fetchone()[0] == 0:
            self.create_user('admin', 'admin123', 'admin@ddb.com')
        
        conn.commit()
        conn.close()
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, username: str, password: str, email: str = None) -> bool:
        """Create a new user."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            password_hash = self.hash_password(password)
            cursor.execute(
                'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
                (username, password_hash, email)
            )
            
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            return False
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user and return user data."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        password_hash = self.hash_password(password)
        cursor.execute(
            'SELECT id, username, email FROM users WHERE username = ? AND password_hash = ?',
            (username, password_hash)
        )
        
        user = cursor.fetchone()
        if user:
            # Update last login
            cursor.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                (user[0],)
            )
            conn.commit()
            
            user_data = {
                'id': user[0],
                'username': user[1],
                'email': user[2]
            }
        else:
            user_data = None
        
        conn.close()
        return user_data
    
    def log_assistant_creation(self, openai_id: str, name: str, theme: str, user_id: int, file_name: str, file_type: str):
        """Log assistant creation."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO assistants (openai_id, name, theme, user_id, file_name, file_type, total_tokens, total_cost_euros)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0.0)
        ''', (openai_id, name, theme, user_id, file_name, file_type))
        
        cursor.execute('''
            INSERT INTO activity_log (user_id, action, details)
            VALUES (?, ?, ?)
        ''', (user_id, 'assistant_created', f'Created assistant: {name} for theme: {theme}'))
        
        conn.commit()
        conn.close()
    
    def calculate_gpt4o_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost for GPT-4o in euros."""
        # GPT-4o pricing (as of 2024): $2.50 per 1M input tokens, $10.00 per 1M output tokens
        # Convert USD to EUR (approximate rate: 1 USD = 0.92 EUR)
        usd_to_eur = 0.92
        
        input_cost_usd = (input_tokens / 1_000_000) * 2.50
        output_cost_usd = (output_tokens / 1_000_000) * 10.00
        total_cost_usd = input_cost_usd + output_cost_usd
        
        return total_cost_usd * usd_to_eur
    
    def log_message(self, assistant_openai_id: str, role: str, content: str, response_time_ms: int = None, 
                   input_tokens: int = 0, output_tokens: int = 0):
        """Log a message in conversation with token usage."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get assistant ID from OpenAI ID
        cursor.execute('SELECT id FROM assistants WHERE openai_id = ?', (assistant_openai_id,))
        assistant = cursor.fetchone()
        
        if assistant:
            assistant_id = assistant[0]
            total_tokens = input_tokens + output_tokens
            cost_euros = self.calculate_gpt4o_cost(input_tokens, output_tokens) if role == 'assistant' else 0.0
            
            cursor.execute('''
                INSERT INTO messages (assistant_id, role, content, response_time_ms, input_tokens, output_tokens, total_tokens, cost_euros)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (assistant_id, role, content, response_time_ms, input_tokens, output_tokens, total_tokens, cost_euros))
            
            # Update assistant message count, tokens and cost
            cursor.execute('''
                UPDATE assistants 
                SET message_count = message_count + 1, 
                    last_used = CURRENT_TIMESTAMP,
                    total_tokens = total_tokens + ?,
                    total_cost_euros = total_cost_euros + ?
                WHERE id = ?
            ''', (total_tokens, cost_euros, assistant_id))
        
        conn.commit()
        conn.close()
    
    def get_dashboard_stats(self, user_id: int) -> Dict[str, Any]:
        """Get dashboard statistics for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total assistants
        cursor.execute('SELECT COUNT(*) FROM assistants WHERE user_id = ?', (user_id,))
        total_assistants = cursor.fetchone()[0]
        
        # Total messages
        cursor.execute('''
            SELECT COUNT(*) FROM messages m
            JOIN assistants a ON m.assistant_id = a.id
            WHERE a.user_id = ?
        ''', (user_id,))
        total_messages = cursor.fetchone()[0]
        
        # Total tokens and cost
        cursor.execute('''
            SELECT SUM(a.total_tokens), SUM(a.total_cost_euros) FROM assistants a
            WHERE a.user_id = ?
        ''', (user_id,))
        tokens_cost = cursor.fetchone()
        total_tokens = tokens_cost[0] or 0
        total_cost_euros = tokens_cost[1] or 0.0
        
        # Average response time
        cursor.execute('''
            SELECT AVG(response_time_ms) FROM messages m
            JOIN assistants a ON m.assistant_id = a.id
            WHERE a.user_id = ? AND response_time_ms IS NOT NULL
        ''', (user_id,))
        avg_response_time = cursor.fetchone()[0] or 0
        
        # Most used theme
        cursor.execute('''
            SELECT theme, COUNT(*) as count FROM assistants 
            WHERE user_id = ? 
            GROUP BY theme 
            ORDER BY count DESC 
            LIMIT 1
        ''', (user_id,))
        most_used_theme = cursor.fetchone()
        
        # Recent activity
        cursor.execute('''
            SELECT action, details, created_at FROM activity_log
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        ''', (user_id,))
        recent_activity = cursor.fetchall()
        
        conn.close()
        
        return {
            'total_assistants': total_assistants,
            'total_messages': total_messages,
            'total_tokens': total_tokens,
            'total_cost_euros': round(total_cost_euros, 4),
            'avg_response_time': int(avg_response_time) if avg_response_time else 0,
            'most_used_theme': most_used_theme[0] if most_used_theme else 'N/A',
            'recent_activity': recent_activity
        }
    
    def get_user_assistants(self, user_id: int) -> List[Dict]:
        """Get all assistants for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT openai_id, name, theme, created_at, last_used, message_count, file_name, file_type, total_tokens, total_cost_euros
            FROM assistants
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        
        assistants = []
        for row in cursor.fetchall():
            assistants.append({
                'openai_id': row[0],
                'name': row[1],
                'theme': row[2],
                'created_at': row[3],
                'last_used': row[4],
                'message_count': row[5],
                'file_name': row[6],
                'file_type': row[7],
                'total_tokens': row[8] or 0,
                'total_cost_euros': round(row[9] or 0.0, 4)
            })
        
        conn.close()
        return assistants
    
    def get_assistant_messages(self, assistant_openai_id: str) -> List[Dict]:
        """Get all messages for an assistant."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get assistant ID from OpenAI ID
        cursor.execute('SELECT id FROM assistants WHERE openai_id = ?', (assistant_openai_id,))
        assistant = cursor.fetchone()
        
        if not assistant:
            conn.close()
            return []
        
        assistant_id = assistant[0]
        
        cursor.execute('''
            SELECT role, content, created_at, input_tokens, output_tokens, total_tokens, cost_euros
            FROM messages
            WHERE assistant_id = ?
            ORDER BY created_at ASC
        ''', (assistant_id,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                'role': row[0],
                'content': row[1],
                'timestamp': row[2],
                'input_tokens': row[3] or 0,
                'output_tokens': row[4] or 0,
                'total_tokens': row[5] or 0,
                'cost_euros': round(row[6] or 0.0, 6)
            })
        
        conn.close()
        return messages
    
    def clear_assistant_messages(self, assistant_openai_id: str):
        """Clear all messages for an assistant."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get assistant ID from OpenAI ID
        cursor.execute('SELECT id FROM assistants WHERE openai_id = ?', (assistant_openai_id,))
        assistant = cursor.fetchone()
        
        if assistant:
            assistant_id = assistant[0]
            
            # Delete all messages for this assistant
            cursor.execute('DELETE FROM messages WHERE assistant_id = ?', (assistant_id,))
            
            # Reset message count, tokens and cost
            cursor.execute('''
                UPDATE assistants 
                SET message_count = 0, total_tokens = 0, total_cost_euros = 0.0
                WHERE id = ?
            ''', (assistant_id,))
        
        conn.commit()
        conn.close()
    
    def get_analytics_data(self, user_id: int) -> Dict[str, Any]:
        """Get detailed analytics data for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Cost by assistant
        cursor.execute('''
            SELECT a.name, a.theme, a.total_tokens, a.total_cost_euros, a.message_count
            FROM assistants a
            WHERE a.user_id = ?
            ORDER BY a.total_cost_euros DESC
        ''', (user_id,))
        
        cost_by_assistant = []
        for row in cursor.fetchall():
            cost_by_assistant.append({
                'name': row[0],
                'theme': row[1],
                'total_tokens': row[2] or 0,
                'total_cost_euros': round(row[3] or 0.0, 4),
                'message_count': row[4] or 0
            })
        
        # Daily costs for the last 30 days
        cursor.execute('''
            SELECT DATE(m.created_at) as date, SUM(m.cost_euros) as daily_cost, SUM(m.total_tokens) as daily_tokens
            FROM messages m
            JOIN assistants a ON m.assistant_id = a.id
            WHERE a.user_id = ? AND m.created_at >= date('now', '-30 days')
            GROUP BY DATE(m.created_at)
            ORDER BY date DESC
        ''', (user_id,))
        
        daily_costs = []
        for row in cursor.fetchall():
            daily_costs.append({
                'date': row[0],
                'cost_euros': round(row[1] or 0.0, 4),
                'tokens': row[2] or 0
            })
        
        conn.close()
        
        return {
            'cost_by_assistant': cost_by_assistant,
            'daily_costs': daily_costs
        }
