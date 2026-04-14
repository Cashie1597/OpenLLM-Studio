use crate::error::AppError;
use crate::models::{Conversation, Message};
use rusqlite::{Connection, Result as SqliteResult};
use uuid::Uuid;

/// Get all conversations sorted by updated_at DESC
///
/// Returns conversations in reverse chronological order (most recently updated first).
/// This function queries the conversations table and maps each row to a Conversation struct.
///
/// # Arguments
/// * `conn` - SQLite database connection
///
/// # Returns
/// * `Result<Vec<Conversation>, AppError>` - List of conversations or database error
pub fn get_conversations(conn: &Connection) -> Result<Vec<Conversation>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, model_name, title, created_at, updated_at 
         FROM conversations 
         ORDER BY updated_at DESC"
    )?;

    let conversations = stmt
        .query_map([], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                model_name: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?
        .collect::<SqliteResult<Vec<Conversation>>>()?;

    Ok(conversations)
}

/// Create a new conversation with UUID generation
///
/// Generates a new UUID for the conversation ID and inserts the conversation
/// into the database with the current timestamp for both created_at and updated_at.
///
/// # Arguments
/// * `conn` - SQLite database connection
/// * `model_name` - Name of the Ollama model (e.g., "llama3.2:1b")
/// * `title` - User-visible conversation title
///
/// # Returns
/// * `Result<Conversation, AppError>` - Created conversation or database error
pub fn create_conversation(
    conn: &Connection,
    model_name: &str,
    title: &str,
) -> Result<Conversation, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO conversations (id, model_name, title, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![&id, model_name, title, &now, &now],
    )?;

    Ok(Conversation {
        id,
        model_name: model_name.to_string(),
        title: title.to_string(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_conversation(
    conn: &Connection,
    conversation_id: &str,
    model_name: &str,
    title: &str,
) -> Result<Conversation, AppError> {
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE conversations
         SET model_name = ?1, title = ?2, updated_at = ?3
         WHERE id = ?4",
        rusqlite::params![model_name, title, &now, conversation_id],
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, model_name, title, created_at, updated_at
         FROM conversations
         WHERE id = ?1",
    )?;

    let conversation = stmt.query_row([conversation_id], |row| {
        Ok(Conversation {
            id: row.get(0)?,
            model_name: row.get(1)?,
            title: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;

    Ok(conversation)
}

pub fn delete_conversation(conn: &Connection, conversation_id: &str) -> Result<(), AppError> {
    conn.execute(
        "DELETE FROM conversations WHERE id = ?1",
        rusqlite::params![conversation_id],
    )?;

    Ok(())
}

/// Get all messages for a conversation sorted by created_at ASC
///
/// Returns messages in chronological order (oldest first).
/// This function queries the messages table filtered by conversation_id.
///
/// # Arguments
/// * `conn` - SQLite database connection
/// * `conversation_id` - UUID of the conversation
///
/// # Returns
/// * `Result<Vec<Message>, AppError>` - List of messages or database error
pub fn get_messages(
    conn: &Connection,
    conversation_id: &str,
) -> Result<Vec<Message>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, conversation_id, role, content, created_at 
         FROM messages 
         WHERE conversation_id = ?1 
         ORDER BY created_at ASC"
    )?;

    let messages = stmt
        .query_map([conversation_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?
        .collect::<SqliteResult<Vec<Message>>>()?;

    Ok(messages)
}

/// Save a message with UUID generation and update conversation timestamp
///
/// This function performs two operations in a transaction:
/// 1. Inserts a new message with a generated UUID
/// 2. Updates the conversation's updated_at timestamp
///
/// If either operation fails, the transaction is rolled back.
///
/// # Arguments
/// * `conn` - SQLite database connection
/// * `conversation_id` - UUID of the conversation
/// * `role` - Message role ("user" or "assistant")
/// * `content` - Message content (supports Unicode and special characters)
///
/// # Returns
/// * `Result<Message, AppError>` - Created message or database error
pub fn save_message(
    conn: &mut Connection,
    conversation_id: &str,
    role: &str,
    content: &str,
) -> Result<Message, AppError> {
    // Start transaction
    let tx = conn.transaction()?;

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Insert message
    tx.execute(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) 
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![&id, conversation_id, role, content, &now],
    )?;

    // Update conversation updated_at timestamp
    tx.execute(
        "UPDATE conversations SET updated_at = ?1 WHERE id = ?2",
        rusqlite::params![&now, conversation_id],
    )?;

    // Commit transaction
    tx.commit()?;

    Ok(Message {
        id,
        conversation_id: conversation_id.to_string(),
        role: role.to_string(),
        content: content.to_string(),
        created_at: now,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        
        // Create schema
        conn.execute(
            "CREATE TABLE conversations (
                id TEXT PRIMARY KEY,
                model_name TEXT NOT NULL,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        ).unwrap();

        conn.execute(
            "CREATE TABLE messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )",
            [],
        ).unwrap();

        conn
    }

    #[test]
    fn test_create_conversation() {
        let conn = setup_test_db();
        
        let conversation = create_conversation(&conn, "llama3.2:1b", "Test Conversation").unwrap();
        
        assert!(!conversation.id.is_empty());
        assert_eq!(conversation.model_name, "llama3.2:1b");
        assert_eq!(conversation.title, "Test Conversation");
        assert!(!conversation.created_at.is_empty());
        assert!(!conversation.updated_at.is_empty());
    }

    #[test]
    fn test_get_conversations() {
        let conn = setup_test_db();
        
        // Create multiple conversations
        create_conversation(&conn, "llama3.2:1b", "First").unwrap();
        std::thread::sleep(std::time::Duration::from_millis(10));
        create_conversation(&conn, "gemma2:2b", "Second").unwrap();
        
        let conversations = get_conversations(&conn).unwrap();
        
        assert_eq!(conversations.len(), 2);
        // Most recent should be first
        assert_eq!(conversations[0].title, "Second");
        assert_eq!(conversations[1].title, "First");
    }

    #[test]
    fn test_save_message() {
        let mut conn = setup_test_db();
        
        let conversation = create_conversation(&conn, "llama3.2:1b", "Test").unwrap();
        let message = save_message(&mut conn, &conversation.id, "user", "Hello!").unwrap();
        
        assert!(!message.id.is_empty());
        assert_eq!(message.conversation_id, conversation.id);
        assert_eq!(message.role, "user");
        assert_eq!(message.content, "Hello!");
        assert!(!message.created_at.is_empty());
    }

    #[test]
    fn test_get_messages() {
        let mut conn = setup_test_db();
        
        let conversation = create_conversation(&conn, "llama3.2:1b", "Test").unwrap();
        save_message(&mut conn, &conversation.id, "user", "First message").unwrap();
        std::thread::sleep(std::time::Duration::from_millis(10));
        save_message(&mut conn, &conversation.id, "assistant", "Second message").unwrap();
        
        let messages = get_messages(&conn, &conversation.id).unwrap();
        
        assert_eq!(messages.len(), 2);
        // Chronological order
        assert_eq!(messages[0].content, "First message");
        assert_eq!(messages[1].content, "Second message");
    }

    #[test]
    fn test_save_message_updates_conversation_timestamp() {
        let mut conn = setup_test_db();
        
        let conversation = create_conversation(&conn, "llama3.2:1b", "Test").unwrap();
        let original_updated_at = conversation.updated_at.clone();
        
        std::thread::sleep(std::time::Duration::from_millis(10));
        save_message(&mut conn, &conversation.id, "user", "Hello!").unwrap();
        
        let conversations = get_conversations(&conn).unwrap();
        assert_eq!(conversations.len(), 1);
        assert_ne!(conversations[0].updated_at, original_updated_at);
    }

    #[test]
    fn test_message_unicode_content() {
        let mut conn = setup_test_db();
        
        let conversation = create_conversation(&conn, "llama3.2:1b", "Test").unwrap();
        let content = "Hello 👋 世界 🌍";
        let message = save_message(&mut conn, &conversation.id, "user", content).unwrap();
        
        assert_eq!(message.content, content);
        
        let messages = get_messages(&conn, &conversation.id).unwrap();
        assert_eq!(messages[0].content, content);
    }

    #[test]
    fn test_message_special_characters() {
        let mut conn = setup_test_db();
        
        let conversation = create_conversation(&conn, "llama3.2:1b", "Test").unwrap();
        let content = "Test \"quotes\" and 'apostrophes' and \\backslashes\\ and \nnewlines";
        let message = save_message(&mut conn, &conversation.id, "user", content).unwrap();
        
        assert_eq!(message.content, content);
        
        let messages = get_messages(&conn, &conversation.id).unwrap();
        assert_eq!(messages[0].content, content);
    }

    #[test]
    fn test_transaction_rollback_on_invalid_conversation_id() {
        let mut conn = setup_test_db();
        
        // Enable foreign key constraints
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();
        
        let result = save_message(&mut conn, "non-existent-id", "user", "Hello!");
        
        // Should fail due to foreign key constraint
        assert!(result.is_err());
        
        // Verify no message was inserted
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM messages").unwrap();
        let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_invalid_role_constraint() {
        let conn = setup_test_db();
        
        let conversation = create_conversation(&conn, "llama3.2:1b", "Test").unwrap();
        
        // Try to insert message with invalid role
        let result = conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                Uuid::new_v4().to_string(),
                &conversation.id,
                "invalid_role",
                "Test content",
                chrono::Utc::now().to_rfc3339()
            ],
        );
        
        // Should fail due to CHECK constraint
        assert!(result.is_err());
    }
}

/// Get optimization settings from database
///
/// Returns the singleton optimization settings row.
/// If no settings exist, returns default values.
///
/// # Arguments
/// * `conn` - SQLite database connection
///
/// # Returns
/// * `Result<OptimizationSettings, AppError>` - Settings or database error
pub fn get_optimization_settings(conn: &Connection) -> Result<crate::models::OptimizationSettings, AppError> {
    let mut stmt = conn.prepare(
        "SELECT num_ctx, num_gpu, num_batch, num_thread, flash_attention 
         FROM optimization_settings 
         WHERE id = 1"
    )?;

    let result = stmt.query_row([], |row| {
        Ok(crate::models::OptimizationSettings {
            num_ctx: row.get(0)?,
            num_gpu: row.get(1)?,
            num_batch: row.get(2)?,
            num_thread: row.get(3)?,
            flash_attention: row.get(4)?,
            recommended_quantization: String::new(), // Will be calculated based on hardware
        })
    });

    match result {
        Ok(settings) => Ok(settings),
        Err(_) => {
            // Return defaults if no settings exist
            Ok(crate::models::OptimizationSettings {
                num_ctx: 8192,
                num_gpu: 1,
                num_batch: 512,
                num_thread: 8,
                flash_attention: false,
                recommended_quantization: String::new(),
            })
        }
    }
}

/// Save optimization settings to database
///
/// Updates the singleton optimization settings row.
/// Uses UPSERT pattern to insert or update.
///
/// # Arguments
/// * `conn` - SQLite database connection
/// * `settings` - Optimization settings to save
///
/// # Returns
/// * `Result<(), AppError>` - Success or database error
pub fn save_optimization_settings(
    conn: &Connection,
    settings: &crate::models::OptimizationSettings,
) -> Result<(), AppError> {
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT OR REPLACE INTO optimization_settings 
         (id, num_ctx, num_gpu, num_batch, num_thread, flash_attention, created_at, updated_at) 
         VALUES (1, ?1, ?2, ?3, ?4, ?5, 
                 COALESCE((SELECT created_at FROM optimization_settings WHERE id = 1), ?6), 
                 ?7)",
        rusqlite::params![
            settings.num_ctx,
            settings.num_gpu,
            settings.num_batch,
            settings.num_thread,
            settings.flash_attention,
            &now,
            &now
        ],
    )?;

    Ok(())
}
