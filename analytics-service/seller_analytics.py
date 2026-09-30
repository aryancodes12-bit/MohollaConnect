import logging
from datetime import datetime, timedelta
from db import get_db_connection

logger = logging.getLogger(__name__)

def get_seller_sales_trend(store_id: int, days: int = 45):
    """
    Computes daily revenue and order volume for the store over the specified days.
    Fills in gap days with 0 revenue / 0 orders so charts remain continuous.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                o.created_at::date as order_date,
                COUNT(o.id) as order_count,
                COALESCE(SUM(p.price * o.quantity), 0) as daily_revenue
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE p.store_id = %s
              AND o.created_at >= NOW() - INTERVAL '%s days'
            GROUP BY o.created_at::date
            ORDER BY order_date ASC
        """, (store_id, days))
        db_rows = cur.fetchall()

        # Build complete date sequence over the past `days`
        date_map = {r["order_date"].strftime("%Y-%m-%d"): r for r in db_rows}
        today = datetime.now().date()
        result_series = []

        total_rev = 0.0
        total_orders = 0

        for i in range(days - 1, -1, -1):
            d = today - timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            display_date = d.strftime("%b %d")

            if d_str in date_map:
                rev = float(date_map[d_str]["daily_revenue"])
                count = int(date_map[d_str]["order_count"])
            else:
                rev = 0.0
                count = 0

            total_rev += rev
            total_orders += count

            result_series.append({
                "date": d_str,
                "displayDate": display_date,
                "revenue": round(rev, 2),
                "orderCount": count
            })

        aov = (total_rev / total_orders) if total_orders > 0 else 0.0

        return {
            "storeId": store_id,
            "days": days,
            "totalRevenue": round(total_rev, 2),
            "totalOrders": total_orders,
            "averageOrderValue": round(aov, 2),
            "trend": result_series
        }
    finally:
        cur.close()
        conn.close()

def get_seller_top_products(store_id: int, limit: int = 5):
    """
    Returns top N products for the store ranked by total revenue and units sold.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                p.id as product_id,
                p.title,
                p.price,
                COALESCE(SUM(o.quantity), 0) as units_sold,
                COALESCE(SUM(p.price * o.quantity), 0) as total_revenue
            FROM products p
            LEFT JOIN orders o ON p.id = o.product_id
            WHERE p.store_id = %s
            GROUP BY p.id, p.title, p.price
            HAVING COALESCE(SUM(o.quantity), 0) > 0
            ORDER BY total_revenue DESC
            LIMIT %s
        """, (store_id, limit))
        rows = cur.fetchall()

        formatted = []
        for r in rows:
            formatted.append({
                "productId": r["product_id"],
                "title": r["title"],
                "price": float(r["price"]),
                "unitsSold": int(r["units_sold"]),
                "totalRevenue": round(float(r["total_revenue"]), 2)
            })

        return {
            "storeId": store_id,
            "topProducts": formatted
        }
    finally:
        cur.close()
        conn.close()

def get_seller_sentiment(store_id: int):
    """
    Returns aggregated sentiment breakdown specifically for this seller's products.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                rs.sentiment_label,
                COUNT(rs.review_id) as count,
                COALESCE(AVG(rs.polarity_score), 0) as avg_polarity
            FROM review_sentiment rs
            WHERE rs.store_id = %s
            GROUP BY rs.sentiment_label
        """, (store_id,))
        rows = cur.fetchall()

        total = sum(r["count"] for r in rows)
        distribution = {"Positive": 0, "Neutral": 0, "Negative": 0}
        percentages = {"Positive": 0.0, "Neutral": 0.0, "Negative": 0.0}

        avg_polarity = 0.0
        if total > 0:
            for r in rows:
                lbl = r["sentiment_label"]
                cnt = int(r["count"])
                distribution[lbl] = cnt
                percentages[lbl] = round((cnt / total) * 100, 1)
            avg_polarity = sum(float(r["avg_polarity"]) * r["count"] for r in rows) / total

        return {
            "storeId": store_id,
            "totalReviews": total,
            "averagePolarity": round(avg_polarity, 3),
            "distribution": distribution,
            "percentages": percentages
        }
    finally:
        cur.close()
        conn.close()

def get_marketplace_overview(days: int = 45):
    """
    For the BI overview:
    - Marketplace-wide daily revenue trend
    - Top categories by revenue
    - Order status funnel
    - Total sellers, orders, revenue
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Category breakdown
        cur.execute("""
            SELECT 
                s.category,
                COUNT(DISTINCT s.id) as store_count,
                COUNT(o.id) as order_count,
                COALESCE(SUM(p.price * o.quantity), 0) as total_revenue
            FROM stores s
            LEFT JOIN products p ON s.id = p.store_id
            LEFT JOIN orders o ON p.id = o.product_id
            GROUP BY s.category
            ORDER BY total_revenue DESC
        """)
        categories = cur.fetchall()

        # Order status funnel
        cur.execute("""
            SELECT status, COUNT(*) as count
            FROM orders
            GROUP BY status
        """)
        status_rows = cur.fetchall()
        status_funnel = {r["status"]: r["count"] for r in status_rows}

        # Seller approval funnel
        cur.execute("""
            SELECT status, COUNT(*) as count
            FROM stores
            GROUP BY status
        """)
        seller_status_rows = cur.fetchall()
        seller_funnel = {r["status"]: r["count"] for r in seller_status_rows}

        # Overall sentiment distribution
        cur.execute("""
            SELECT sentiment_label, COUNT(*) as count, COALESCE(AVG(polarity_score), 0) as avg_pol
            FROM review_sentiment
            GROUP BY sentiment_label
        """)
        sent_rows = cur.fetchall()
        total_sent = sum(r["count"] for r in sent_rows)
        sent_dist = {"Positive": 0, "Neutral": 0, "Negative": 0}
        for r in sent_rows:
            sent_dist[r["sentiment_label"]] = int(r["count"])

        # Totals across marketplace
        cur.execute("""
            SELECT 
                COUNT(DISTINCT s.id) as total_sellers,
                COUNT(DISTINCT p.id) as total_products,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(p.price * o.quantity), 0) as total_revenue
            FROM stores s
            LEFT JOIN products p ON s.id = p.store_id
            LEFT JOIN orders o ON p.id = o.product_id
        """)
        totals_row = cur.fetchone()

        # Overall revenue trend (last 45 days)
        cur.execute("""
            SELECT 
                o.created_at::date as order_date,
                COUNT(o.id) as order_count,
                COALESCE(SUM(p.price * o.quantity), 0) as revenue
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.created_at >= NOW() - INTERVAL '%s days'
            GROUP BY o.created_at::date
            ORDER BY order_date ASC
        """, (days,))
        trend_rows = cur.fetchall()

        return {
            "days": days,
            "totals": {
                "totalSellers": int(totals_row["total_sellers"] or 0),
                "totalProducts": int(totals_row["total_products"] or 0),
                "totalOrders": int(totals_row["total_orders"] or 0),
                "totalRevenue": round(float(totals_row["total_revenue"] or 0), 2)
            },
            "sentimentDistribution": sent_dist,
            "totalReviews": total_sent,
            "categories": [
                {
                    "category": r["category"],
                    "storeCount": int(r["store_count"]),
                    "orderCount": int(r["order_count"]),
                    "totalRevenue": round(float(r["total_revenue"]), 2)
                }
                for r in categories
            ],
            "orderStatusFunnel": status_funnel,
            "sellerApprovalFunnel": seller_funnel,
            "marketplaceTrend": [
                {
                    "date": r["order_date"].strftime("%Y-%m-%d"),
                    "displayDate": r["order_date"].strftime("%b %d"),
                    "orders": int(r["order_count"]),
                    "revenue": round(float(r["revenue"]), 2)
                }
                for r in trend_rows
            ]
        }
    finally:
        cur.close()
        conn.close()
