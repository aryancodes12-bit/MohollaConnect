import urllib.request
import json

# 1. Login to Metabase
login_payload = {'username': 'admin@localconnect.in', 'password': 'AdminMetabase@1234'}
req = urllib.request.Request(
    'http://localhost:3000/api/session',
    data=json.dumps(login_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
session_id = json.loads(res.read())['id']
headers = {'Content-Type': 'application/json', 'X-Metabase-Session': session_id}

# Find postgres DB id
req_dbs = urllib.request.Request('http://localhost:3000/api/database', headers=headers)
dbs = json.loads(urllib.request.urlopen(req_dbs).read())['data']
pg_db = [d for d in dbs if d['engine'] == 'postgres'][0]
db_id = pg_db['id']
print('Found PostgreSQL DB ID:', db_id)

cards_def = [
    {
        'name': 'Marketplace 45-Day Revenue & Volume Trend',
        'description': 'Daily combined GMV in INR and order volume over the last 45 days',
        'display': 'line',
        'query': '''SELECT 
    o.created_at::date AS "Order Date",
    COUNT(o.id) AS "Total Orders",
    ROUND(COALESCE(SUM(p.price * o.quantity), 0)::numeric, 2) AS "Gross Revenue (INR)"
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.created_at >= NOW() - INTERVAL '45 days'
GROUP BY o.created_at::date
ORDER BY "Order Date" ASC;'''
    },
    {
        'name': 'Top Categories by Revenue',
        'description': 'Revenue and store volume per product category',
        'display': 'row',
        'query': '''SELECT 
    s.category AS "Category",
    COUNT(DISTINCT s.id) AS "Stores",
    COUNT(o.id) AS "Orders",
    ROUND(COALESCE(SUM(p.price * o.quantity), 0)::numeric, 2) AS "Total Revenue (INR)"
FROM stores s
LEFT JOIN products p ON s.id = p.store_id
LEFT JOIN orders o ON p.id = o.product_id
GROUP BY s.category
ORDER BY "Total Revenue (INR)" DESC;'''
    },
    {
        'name': 'Order Fulfillment Funnel',
        'description': 'Conversion counts from Placed to Delivered',
        'display': 'bar',
        'query': '''SELECT 
    status AS "Status",
    COUNT(*) AS "Order Count"
FROM orders
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'PLACED' THEN 1
        WHEN 'CONFIRMED' THEN 2
        WHEN 'OUT_FOR_DELIVERY' THEN 3
        WHEN 'DELIVERED' THEN 4
        ELSE 5
    END;'''
    },
    {
        'name': 'Seller Approval Funnel',
        'description': 'Merchant lifecycle counts from Admin Approval Queue',
        'display': 'bar',
        'query': '''SELECT 
    status AS "Merchant Status",
    COUNT(*) AS "Store Count"
FROM stores
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'APPROVED' THEN 1
        WHEN 'PENDING' THEN 2
        WHEN 'REJECTED' THEN 3
        ELSE 4
    END;'''
    },
    {
        'name': 'Marketplace-Wide Sentiment Distribution',
        'description': 'NLP sentiment polarity scored across all customer reviews',
        'display': 'pie',
        'query': '''SELECT 
    sentiment_label AS "Sentiment",
    COUNT(*) AS "Review Count"
FROM review_sentiment
GROUP BY sentiment_label
ORDER BY "Review Count" DESC;'''
    },
    {
        'name': 'Customer Segment Breakdown (K-Means, k=3)',
        'description': 'Buyer clustering derived from RFM behavioral analysis',
        'display': 'pie',
        'query': '''SELECT 
    segment_label AS "Customer Segment",
    COUNT(*) AS "Buyer Count"
FROM customer_segments
GROUP BY segment_label
ORDER BY "Buyer Count" DESC;'''
    }
]

created_cards = []
for c in cards_def:
    card_payload = {
        'name': c['name'],
        'description': c['description'],
        'display': c['display'],
        'dataset_query': {
            'database': db_id,
            'type': 'native',
            'native': {'query': c['query']}
        },
        'visualization_settings': {}
    }
    req_card = urllib.request.Request(
        'http://localhost:3000/api/card',
        data=json.dumps(card_payload).encode('utf-8'),
        headers=headers
    )
    res_card = urllib.request.urlopen(req_card)
    card_data = json.loads(res_card.read())
    print('Created Question/Card ID:', card_data['id'], '-', card_data['name'])
    created_cards.append(card_data['id'])

# 2. Create the unified Metabase Dashboard
dash_payload = {
    'name': 'LocalConnect — Mohalla Marketplace BI Dashboard',
    'description': 'Executive BI Dashboard connecting to PostgreSQL localconnect_db via analytics_reader (Read-Only)',
    'parameters': []
}
req_dash = urllib.request.Request(
    'http://localhost:3000/api/dashboard',
    data=json.dumps(dash_payload).encode('utf-8'),
    headers=headers
)
res_dash = urllib.request.urlopen(req_dash)
dash_data = json.loads(res_dash.read())
dash_id = dash_data['id']
print('Created Dashboard ID:', dash_id, '-', dash_data['name'])

# 3. Add all cards into the Dashboard grid layout
layouts = [
    # 0: Revenue Trend (full width on top)
    {'card_id': created_cards[0], 'row': 0, 'col': 0, 'size_x': 24, 'size_y': 8},
    # 1: Top Categories (left 14 cols)
    {'card_id': created_cards[1], 'row': 8, 'col': 0, 'size_x': 14, 'size_y': 8},
    # 2: Order Fulfillment Funnel (right 10 cols)
    {'card_id': created_cards[2], 'row': 8, 'col': 14, 'size_x': 10, 'size_y': 8},
    # 3: Seller Approval Funnel (left 8 cols)
    {'card_id': created_cards[3], 'row': 16, 'col': 0, 'size_x': 8, 'size_y': 8},
    # 4: Sentiment Distribution (middle 8 cols)
    {'card_id': created_cards[4], 'row': 16, 'col': 8, 'size_x': 8, 'size_y': 8},
    # 5: Customer Segment Breakdown (right 8 cols)
    {'card_id': created_cards[5], 'row': 16, 'col': 16, 'size_x': 8, 'size_y': 8}
]

for item in layouts:
    add_card_payload = {
        'cardId': item['card_id'],
        'row': item['row'],
        'col': item['col'],
        'size_x': item['size_x'],
        'size_y': item['size_y']
    }
    req_add = urllib.request.Request(
        f'http://localhost:3000/api/dashboard/{dash_id}/cards',
        data=json.dumps(add_card_payload).encode('utf-8'),
        headers=headers
    )
    urllib.request.urlopen(req_add)
    print('Placed Card', item['card_id'], 'in Dashboard')

print(f'\nALL DONE! Metabase Live Dashboard Link: http://localhost:3000/dashboard/{dash_id}')
