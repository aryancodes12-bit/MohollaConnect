-- Create read-only role for analytics
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_reader') THEN 
        CREATE ROLE analytics_reader WITH LOGIN PASSWORD 'analytics_reader_pass'; 
    END IF; 
END $$;

GRANT CONNECT ON DATABASE localconnect_db TO analytics_reader;
GRANT USAGE ON SCHEMA public TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_reader;

-- Tables owned by analytics service
CREATE TABLE IF NOT EXISTS review_sentiment (
    review_id BIGINT PRIMARY KEY,
    product_id BIGINT,
    store_id BIGINT,
    sentiment_label VARCHAR(32) NOT NULL,
    polarity_score DOUBLE PRECISION NOT NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_segments (
    user_id BIGINT PRIMARY KEY,
    total_spent DOUBLE PRECISION,
    order_frequency INT,
    average_order_value DOUBLE PRECISION,
    days_since_last_order INT,
    segment_label VARCHAR(64) NOT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE review_sentiment TO analytics_reader;
GRANT ALL ON TABLE customer_segments TO analytics_reader;
