import os
import csv
import json
import time
import requests
from pathlib import Path
import unicodedata
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_FOOTBALL_KEY")

CSV_PATH = "data/real/jugadores_2026-27.csv"
OUT_DIR = "../public/players"
JSON_OUT = "../public/data/players_photos.json"
CACHE_API = "data/cache/api_football_players.json"

Path(OUT_DIR).mkdir(parents=True, exist_ok=True)
Path(JSON_OUT).parent.mkdir(parents=True, exist_ok=True)
Path(CACHE_API).parent.mkdir(parents=True, exist_ok=True)

def normalize_name(name):
    # Remove accents, lowercase, strip
    n = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
    return n.lower().strip()

def jaccard_similarity(s1, s2):
    s1_words = set(s1.split())
    s2_words = set(s2.split())
    intersection = s1_words.intersection(s2_words)
    union = s1_words.union(s2_words)
    if not union: return 0
    return len(intersection) / len(union)

def is_match(csv_name, api_name, api_first, api_last):
    cn = normalize_name(csv_name)
    an = normalize_name(api_name)
    af = normalize_name(api_first)
    al = normalize_name(api_last)
    
    if cn == an or cn == f"{af} {al}" or cn == al or cn == af:
        return "exacto"
    
    # Check if one is contained in another
    if cn in an or an in cn or cn in f"{af} {al}" or f"{af} {al}" in cn:
        return "probable"
        
    # Jaccard
    sim = jaccard_similarity(cn, f"{af} {al}")
    if sim > 0.4:
        return "probable"
        
    return "dudoso"

def fetch_all_laliga_players():
    # Check cache first
    if os.path.exists(CACHE_API):
        with open(CACHE_API, 'r', encoding='utf-8') as f:
            return json.load(f)
            
    print("Fetching players from API-Football (LaLiga 2026)...")
    headers = {
        'x-apisports-key': API_KEY
    }
    
    all_players = []
    page = 1
    total_pages = 1
    
    while page <= total_pages:
        url = f"https://v3.football.api-sports.io/players?league=140&season=2024&page={page}"
        print(f"Requesting page {page}...")
        res = requests.get(url, headers=headers)
        
        if res.status_code != 200:
            print(f"API Error: {res.status_code} - {res.text}")
            break
            
        data = res.json()
        if 'errors' in data and data['errors']:
            print(f"API Error: {data['errors']}")
            break
            
        response_data = data.get('response', [])
        all_players.extend(response_data)
        
        paging = data.get('paging', {})
        total_pages = paging.get('total', 1)
        
        page += 1
        
        # Rate limit: 10 per minute -> 6 seconds per request
        if page <= total_pages:
            time.sleep(6.5)
            
    # Save cache
    with open(CACHE_API, 'w', encoding='utf-8') as f:
        json.dump(all_players, f, indent=2)
        
    return all_players

def main():
    if not API_KEY:
        print("ERROR: API_FOOTBALL_KEY not found in .env")
        return

    # 1. Load CSV
    csv_players = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_players.append(row)
            
    # 2. Fetch/Load API data
    api_data = fetch_all_laliga_players()
    print(f"Total API players loaded: {len(api_data)}")
    
    # 3. Match and Download
    results = {}
    if os.path.exists(JSON_OUT):
        with open(JSON_OUT, 'r', encoding='utf-8') as f:
            results = json.load(f)
            
    stats = {"exacto": 0, "probable": 0, "dudoso": 0, "no_encontrado": 0, "descargado": 0}
    dudosos_list = []
    
    headers = {'User-Agent': 'Mozilla/5.0'}

    for cp in csv_players:
        pid = cp['player_id']
        pname = cp['player_name']
        pteam = cp['team_name']
        
        # If already exact/probable and file exists, skip download
        local_path = os.path.join(OUT_DIR, f"{pid}.png")
        if pid in results and results[pid]['confianza'] in ['exacto', 'probable'] and os.path.exists(local_path):
            stats[results[pid]['confianza']] += 1
            stats["descargado"] += 1
            continue
            
        # Find best match
        best_match = None
        best_conf = "no_encontrado"
        
        for ap_container in api_data:
            ap = ap_container['player']
            match_type = is_match(pname, ap['name'], ap.get('firstname', ''), ap.get('lastname', ''))
            
            if match_type == "exacto":
                best_match = ap
                best_conf = "exacto"
                break
            elif match_type == "probable" and best_conf != "probable":
                best_match = ap
                best_conf = "probable"
            elif match_type == "dudoso" and best_conf == "no_encontrado":
                best_match = ap
                best_conf = "dudoso"
                
        if best_match and best_conf in ["exacto", "probable"]:
            photo_url = best_match.get('photo')
            if photo_url and "players/none.png" not in photo_url:
                try:
                    img_data = requests.get(photo_url, headers=headers).content
                    with open(local_path, 'wb') as f:
                        f.write(img_data)
                    
                    results[pid] = {
                        "player_id": pid,
                        "nombre": pname,
                        "equipo": pteam,
                        "ruta_local": f"/players/{pid}.png",
                        "api_id": best_match['id'],
                        "confianza": best_conf,
                        "fuente": "api-football"
                    }
                    print(f"[{best_conf}] Baje foto para {pname} -> {pid}.png")
                    stats[best_conf] += 1
                    stats["descargado"] += 1
                    time.sleep(0.2)
                except Exception as e:
                    print(f"Error descargando {pname}: {e}")
            else:
                print(f"[{best_conf}] Sin foto util en API para {pname}")
                best_conf = "dudoso"
                
        if best_conf in ["dudoso", "no_encontrado"]:
            stats[best_conf] += 1
            dudosos_list.append({
                "csv_name": pname, 
                "team": pteam, 
                "api_candidate": best_match['name'] if best_match else "N/A"
            })
            
    # Save JSON
    with open(JSON_OUT, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    print("\n--- INFORME ---")
    print(f"Total procesados: {len(csv_players)}")
    print(f"Exactos: {stats['exacto']}")
    print(f"Probables: {stats['probable']}")
    print(f"Dudosos: {stats['dudoso']}")
    print(f"No encontrados: {stats['no_encontrado']}")
    print(f"Fotos descargadas válidas: {stats['descargado']}")
    print("\nLista de Dudosos / No encontrados:")
    for d in dudosos_list:
        print(f" - CSV: {d['csv_name']} ({d['team']}) -> API: {d['api_candidate']}")

if __name__ == "__main__":
    main()
