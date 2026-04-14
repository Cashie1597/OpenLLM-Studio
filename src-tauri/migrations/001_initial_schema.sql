-- Initial database schema for OpenLLM Studio
-- Creates tables for conversations and messages with proper constraints and indexes

-- Conversations table: stores chat sessions with models
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    model_name TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Index for sorting conversations by most recently updated
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Messages table: stores individual messages within conversations
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Index for efficiently querying messages by conversation
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Index for sorting messages chronologically within a conversation
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);
