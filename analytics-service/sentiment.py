import logging
from datetime import datetime
from textblob import TextBlob
from db import get_db_connection

logger = logging.getLogger(__name__)

def analyze_and_store_sentiments():
    """
    Reads all customer reviews, scores sentiment polarity with TextBlob,
    classifies into Positive, Neutral, or Negative, and persists into review_sentiment table.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Query reviews along with their product_id and store_id
        query = """
            SELECT r.id AS review_id, r.product_id, r.comment_text, r.rating, p.store_id
            FROM reviews r
            JOIN products p ON r.product_id = p.id
        """
        cur.execute(query)
        reviews = cur.fetchall()

        if not reviews:
            logger.info("No reviews found to analyze.")
            return {"processed": 0}

        upsert_query = """
            INSERT INTO review_sentiment (review_id, product_id, store_id, sentiment_label, polarity_score, analyzed_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (review_id) DO UPDATE 
            SET sentiment_label = EXCLUDED.sentiment_label,
                polarity_score = EXCLUDED.polarity_score,
                analyzed_at = EXCLUDED.analyzed_at
        """

        records = []
        now = datetime.now()
        for r in reviews:
            text = r["comment_text"] or ""
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # Range: -1.0 to 1.0

            # Adjust label based on polarity & user rating
            if polarity > 0.15 or (polarity >= 0.05 and r["rating"] >= 4):
                label = "Positive"
            elif polarity < -0.05 or r["rating"] <= 2:
                label = "Negative"
            else:
                label = "Neutral"

            records.append((
                r["review_id"],
                r["product_id"],
                r["store_id"],
                label,
                round(float(polarity), 3),
                now
            ))

        cur.executemany(upsert_query, records)
        conn.commit()
        logger.info("Successfully analyzed and stored sentiments for %d reviews.", len(records))
        return {"processed": len(records)}

    except Exception as e:
        logger.error("Error in sentiment analysis: %s", str(e))
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            cur.close()
            conn.close()

def get_product_sentiment(product_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT sentiment_label, count(*) as count, round(avg(polarity_score)::numeric, 3) as avg_polarity
            FROM review_sentiment
            WHERE product_id = %s
            GROUP BY sentiment_label
        """, (product_id,))
        rows = cur.fetchall()

        total = sum(r["count"] for r in rows)
        distribution = {"Positive": 0, "Neutral": 0, "Negative": 0}
        for r in rows:
            distribution[r["sentiment_label"]] = r["count"]

        avg_polarity = sum(float(r["avg_polarity"] or 0) * r["count"] for r in rows) / total if total > 0 else 0.0

        return {
            "productId": product_id,
            "totalReviews": total,
            "averagePolarity": round(avg_polarity, 3),
            "distribution": distribution
        }
    finally:
        cur.close()
        conn.close()
