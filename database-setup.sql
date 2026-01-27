-- PostgreSQL Database Setup Script for SIP
-- Run this in pgAdmin or psql

-- Create database
CREATE DATABASE sip_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the new database
\c sip_db

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sip_db TO postgres;
