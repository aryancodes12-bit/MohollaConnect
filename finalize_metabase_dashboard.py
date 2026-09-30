import urllib.request
import json

login_payload = {'username': 'admin@localconnect.in', 'password': 'AdminMetabase@1234'}
req = urllib.request.Request(
    'http://localhost:3000/api/session',
    data=json.dumps(login_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
session_id = json.loads(res.read())['id']
headers = {'Content-Type': 'application/json', 'X-Metabase-Session': session_id}

cards_layout = [
    {
        'id': -1,
        'card_id': 1,
        'row': 0,
        'col': 0,
        'size_x': 24,
        'size_y': 8,
        'series': [],
        'parameter_mappings': [],
        'visualization_settings': {}
    },
    {
        'id': -2,
        'card_id': 2,
        'row': 8,
        'col': 0,
        'size_x': 14,
        'size_y': 8,
        'series': [],
        'parameter_mappings': [],
        'visualization_settings': {}
    },
    {
        'id': -3,
        'card_id': 3,
        'row': 8,
        'col': 14,
        'size_x': 10,
        'size_y': 8,
        'series': [],
        'parameter_mappings': [],
        'visualization_settings': {}
    },
    {
        'id': -4,
        'card_id': 4,
        'row': 16,
        'col': 0,
        'size_x': 8,
        'size_y': 8,
        'series': [],
        'parameter_mappings': [],
        'visualization_settings': {}
    },
    {
        'id': -5,
        'card_id': 5,
        'row': 16,
        'col': 8,
        'size_x': 8,
        'size_y': 8,
        'series': [],
        'parameter_mappings': [],
        'visualization_settings': {}
    },
    {
        'id': -6,
        'card_id': 6,
        'row': 16,
        'col': 16,
        'size_x': 8,
        'size_y': 8,
        'series': [],
        'parameter_mappings': [],
        'visualization_settings': {}
    }
]

req_put = urllib.request.Request(
    'http://localhost:3000/api/dashboard/1/cards',
    data=json.dumps({'cards': cards_layout}).encode('utf-8'),
    headers=headers,
    method='PUT'
)
res_put = urllib.request.urlopen(req_put)
data = json.loads(res_put.read())
print('SUCCESS! Placed', len(data['cards']), 'cards in Metabase Dashboard 1')
for c in data['cards']:
    print(f" - Card {c['card_id']} at row {c['row']} col {c['col']} size {c['size_x']}x{c['size_y']}")
print('\nMetabase Live Dashboard: http://localhost:3000/dashboard/1')
