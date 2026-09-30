import logging
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from db import get_db_connection

logger = logging.getLogger(__name__)

def cluster_and_store_customer_segments():
    """
    Engineers per-buyer features from orders table:
    - total_spent
    - order_frequency
    - average_order_value
    - days_since_last_order

    Runs K-Means clustering (k=3), labels clusters dynamically based on centroid characteristics,
    and stores results in customer_segments table.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        query = """
            SELECT 
                o.buyer_id AS user_id,
                u.name AS buyer_name,
                u.email,
                COUNT(o.id) AS order_frequency,
                COALESCE(SUM(p.price * o.quantity), 0) AS total_spent,
                COALESCE(AVG(p.price * o.quantity), 0) AS average_order_value,
                EXTRACT(DAY FROM (NOW() - MAX(o.created_at)))::int AS days_since_last_order
            FROM orders o
            JOIN products p ON o.product_id = p.id
            JOIN users u ON o.buyer_id = u.id
            GROUP BY o.buyer_id, u.name, u.email
            HAVING COUNT(o.id) > 0
        """
        cur.execute(query)
        rows = cur.fetchall()

        if len(rows) < 3:
            logger.info("Not enough buyers (%d) for k=3 clustering.", len(rows))
            return {"processed": len(rows), "clusters": 0}

        df = pd.DataFrame(rows)
        features = ["total_spent", "order_frequency", "average_order_value", "days_since_last_order"]
        X = df[features].astype(float)

        # Normalization for KMeans
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        df["cluster"] = kmeans.fit_predict(X_scaled)

        # Inspect centroid characteristics to assign meaningful labels dynamically
        centroids = df.groupby("cluster")[features].mean()

        # Find cluster with highest average order value or total spent -> "High-Spenders"
        high_spender_cluster = centroids["total_spent"].idxmax()

        remaining_clusters = [c for c in centroids.index if c != high_spender_cluster]
        # Of remaining, one with highest frequency -> "Frequent Shoppers"
        frequent_cluster = centroids.loc[remaining_clusters, "order_frequency"].idxmax()
        # Remaining -> "Occasional Buyers"
        occasional_cluster = [c for c in remaining_clusters if c != frequent_cluster][0]

        label_map = {
            high_spender_cluster: "High-Spenders",
            frequent_cluster: "Frequent Shoppers",
            occasional_cluster: "Occasional Buyers"
        }

        df["segment_label"] = df["cluster"].map(label_map)

        upsert_query = """
            INSERT INTO customer_segments (user_id, total_spent, order_frequency, average_order_value, days_since_last_order, segment_label, computed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE 
            SET total_spent = EXCLUDED.total_spent,
                order_frequency = EXCLUDED.order_frequency,
                average_order_value = EXCLUDED.average_order_value,
                days_since_last_order = EXCLUDED.days_since_last_order,
                segment_label = EXCLUDED.segment_label,
                computed_at = EXCLUDED.computed_at
        """

        records = []
        now = datetime.now()
        for _, row in df.iterrows():
            records.append((
                int(row["user_id"]),
                round(float(row["total_spent"]), 2),
                int(row["order_frequency"]),
                round(float(row["average_order_value"]), 2),
                int(row["days_since_last_order"]),
                str(row["segment_label"]),
                now
            ))

        cur.executemany(upsert_query, records)
        conn.commit()
        logger.info("Successfully clustered %d buyers into 3 segments.", len(records))
        return {"processed": len(records), "segments": df["segment_label"].value_counts().to_dict()}

    except Exception as e:
        logger.error("Error in customer segmentation: %s", str(e))
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            cur.close()
            conn.close()

def get_customer_segments_summary():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                cs.user_id,
                u.name as buyer_name,
                u.email,
                cs.total_spent,
                cs.order_frequency,
                cs.average_order_value,
                cs.days_since_last_order,
                cs.segment_label
            FROM customer_segments cs
            JOIN users u ON cs.user_id = u.id
            ORDER BY cs.total_spent DESC
        """)
        rows = cur.fetchall()

        segment_counts = {}
        for r in rows:
            seg = r["segment_label"]
            segment_counts[seg] = segment_counts.get(seg, 0) + 1

        return {
            "totalCustomers": len(rows),
            "distribution": segment_counts,
            "customers": rows
        }
    finally:
        cur.close()
        conn.close()
