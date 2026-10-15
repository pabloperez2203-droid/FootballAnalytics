import os
import re
import json
import time
import glob
import unicodedata
import difflib
from pathlib import Path
import requests

# Base Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
CACHE_DIR = SCRIPT_DIR / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

FOTMOB_CACHE_FILE = CACHE_DIR / "fotmob_squads_2026.json"
WIKIDATA_CACHE_FILE = CACHE_DIR / "wikidata_photos.json"

JUGADORES_XG_FILE = PROJECT_DIR / "src" / "data" / "jugadores_xg.json"
MATCH_INTEL_FILE = PROJECT_DIR / "src" / "data" / "match_intel.json"
MATCHES_DIR = PROJECT_DIR / "public" / "data" / "matches"
PLAYER_PHOTOS_FILE = PROJECT_DIR / "public" / "data" / "player_photos.json"
PLAYERS_PHOTOS_FILE = PROJECT_DIR / "public" / "data" / "players_photos.json"

# FotMob team mapping for all 20 LaLiga clubs
TEAM_FOTMOB_MAP = {
    'Barcelona': 8634,
    'Atletico Madrid': 9906,
    'Real Betis': 8603,
    'Real Madrid': 8633,
    'Sevilla': 8302,
    'Real Sociedad': 8560,
    'Alaves': 9866,
    'Deportivo La Coruna': 9783,
    'Celta Vigo': 9910,
    'Athletic Club': 8315,
    'Villarreal': 10205,
    'Espanyol': 8558,
    'Rayo Vallecano': 8370,
    'Getafe': 8305,
    'Racing Santander': 8696,
    'Osasuna': 8371,
    'Levante': 8581,
    'Elche': 10268,
    'Valencia': 10267,
    'Malaga': 9864
}

# Manual aliases for Understat names vs FotMob / Official squad names
MANUAL_ALIASES = {
    ('Alaves', 'carlos benavidez'): 'carlos protesoni',
    ('Alaves', 'youssef lekhedim'): 'youssef enriquez',
    ('Atletico Madrid', 'gimenez'): 'jose maria gimenez',
    ('Barcelona', 'alex balde'): 'alejandro balde',
    ('Osasuna', 'enzo boyomo'): 'flavien boyomo',
    ('Osasuna', 'kike barja'): 'enrique barja',
    ('Real Madrid', 'alvaro fernandez'): 'alvaro carreras',
    ('Sevilla', 'andres castrin'): 'andres lopez',
    ('Espanyol', 'cala'): 'alejandro calatrava',
    ('Levante', 'carlos alvarez'): 'carlos alvarez rivera',
    ('Real Betis', 'jose antonio morante'): 'morante',
    ('Valencia', 'aimar blazquez'): 'aimar blazquez',
    ('Real Madrid', 'kylian mbappe lottin'): 'kylian mbappe',
    ('Real Madrid', 'aurelien tchouameni'): 'aurelien tchouameni',
    ('Real Madrid', 'vinicius junior'): 'vinicius junior',
    ('Barcelona', 'pedri'): 'pedri',
    ('Barcelona', 'gavi'): 'gavi',
    ('Barcelona', 'rodri'): 'rodri',
    ('Atletico Madrid', 'koke'): 'koke',
    ('Celta Vigo', 'iago aspas'): 'iago aspas',
    ('Athletic Club', 'inaki williams'): 'inaki williams',
    ('Athletic Club', 'nico williams'): 'nico williams'
}

def normalize_name(name: str) -> str:
    """Normalize player name: NFKD unaccent, lowercase, alphanumeric cleaning."""
    if not name:
        return ""
    n = ''.join(c for c in unicodedata.normalize('NFKD', str(name)) if unicodedata.category(c) != 'Mn')
    n = n.lower().replace('-', ' ').replace('.', ' ').strip()
    return re.sub(r'\s+', ' ', n)

def fetch_fotmob_squads(force_refresh: bool = False) -> dict:
    """Fetch complete squads for all 20 LaLiga clubs from FotMob Next.js payload."""
    if not force_refresh and FOTMOB_CACHE_FILE.exists():
        try:
            with open(FOTMOB_CACHE_FILE, 'r', encoding='utf-8') as f:
                cached = json.load(f)
                if len(cached) >= len(TEAM_FOTMOB_MAP):
                    print(f"📦 Usando plantillas en caché ({len(cached)} equipos, {sum(len(v) for v in cached.values())} jugadores)")
                    return cached
        except Exception as e:
            print(f"⚠️ Error leyendo caché de FotMob: {e}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }

    squads = {}
    print("🌐 Descargando plantillas completas de FotMob para los 20 clubes...")

    for team_name, team_id in TEAM_FOTMOB_MAP.items():
        url = f"https://www.fotmob.com/teams/{team_id}/overview/_"
        try:
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', resp.text)
                if match:
                    payload = json.loads(match.group(1))
                    fb = payload.get('props', {}).get('pageProps', {}).get('fallback', {})
                    team_key = f"team-{team_id}"
                    raw_squad = fb.get(team_key, {}).get('squad', {}).get('squad', [])
                    
                    members = []
                    for section in raw_squad:
                        if section.get('title') == 'coach':
                            continue
                        for mem in section.get('members', []):
                            p_id = mem.get('id')
                            if p_id:
                                members.append({
                                    'id': p_id,
                                    'name': mem.get('name', ''),
                                    'normalized_name': normalize_name(mem.get('name', '')),
                                    'role': mem.get('role', {}).get('fallback', ''),
                                    'shirtNumber': mem.get('shirtNumber'),
                                    'photo_url': f"https://images.fotmob.com/image_resources/playerimages/{p_id}.png"
                                })
                    squads[team_name] = members
                    print(f"  ✓ {team_name} (ID {team_id}): {len(members)} futbolistas")
                else:
                    print(f"  ✗ {team_name}: No se encontró __NEXT_DATA__")
            else:
                print(f"  ✗ {team_name}: HTTP {resp.status_code}")
        except Exception as e:
            print(f"  ✗ {team_name}: Error {e}")
        time.sleep(0.15)

    with open(FOTMOB_CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(squads, f, indent=2, ensure_ascii=False)
    print(f"💾 Guardada caché de FotMob en {FOTMOB_CACHE_FILE}")
    return squads

def get_wikidata_photo(player_name: str, wikidata_cache: dict) -> str | None:
    """Fallback search on Wikidata for youth/reserve players."""
    norm = normalize_name(player_name)
    if norm in wikidata_cache:
        return wikidata_cache[norm]

    try:
        url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={requests.utils.quote(player_name)}&language=en&format=json"
        headers = {'User-Agent': 'FootDataAnalyticsBot/1.0 (contact: footdata@project.com)'}
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            results = r.json().get('search', [])
            for res in results[:4]:
                desc = res.get('description', '').lower()
                if any(w in desc for w in ['footballer', 'association football', 'soccer', 'futbolista', 'player']):
                    q_id = res['id']
                    claims_url = f"https://www.wikidata.org/w/api.php?action=wbgetclaims&entity={q_id}&property=P18&format=json"
                    c_resp = requests.get(claims_url, headers=headers, timeout=5)
                    if c_resp.status_code == 200:
                        claims = c_resp.json().get('claims', {}).get('P18', [])
                        if claims:
                            img_file = claims[0]['mainsnak']['datavalue']['value'].replace(' ', '_')
                            photo_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{img_file}"
                            wikidata_cache[norm] = photo_url
                            return photo_url
    except Exception:
        pass

    wikidata_cache[norm] = None
    return None

def match_player_in_squad(team_name: str, player_name: str, squad: list, wikidata_cache: dict) -> tuple[str | None, str, float]:
    """
    Strict matching within the player's own team squad.
    Returns: (photo_url, match_type, score)
    """
    if not squad:
        # Fallback to Wikidata if no squad
        wiki_url = get_wikidata_photo(player_name, wikidata_cache)
        if wiki_url:
            return wiki_url, "wikidata", 0.8
        return None, "none", 0.0

    norm_target = normalize_name(player_name)
    target_tokens = set(norm_target.split())

    # 1. Check manual aliases
    alias_target = MANUAL_ALIASES.get((team_name, norm_target))
    if alias_target:
        for mem in squad:
            if alias_target == mem['normalized_name'] or alias_target in mem['normalized_name']:
                return mem['photo_url'], "alias", 1.0

    # 2. Exact match
    for mem in squad:
        if norm_target == mem['normalized_name']:
            return mem['photo_url'], "exact", 1.0

    # 3. Subset / Superset tokens match (e.g. "Kylian Mbappe" in "Kylian Mbappe Lottin")
    best_subset = None
    best_subset_score = 0.0
    for mem in squad:
        mem_tokens = set(mem['normalized_name'].split())
        if mem_tokens and (mem_tokens.issubset(target_tokens) or target_tokens.issubset(mem_tokens)):
            # Score proportional to overlap
            overlap = len(mem_tokens.intersection(target_tokens)) / max(len(mem_tokens), len(target_tokens))
            if overlap > best_subset_score:
                best_subset_score = overlap
                best_subset = mem

    if best_subset and best_subset_score >= 0.5:
        return best_subset['photo_url'], "tokens_subset", best_subset_score

    # 4. SequenceMatcher fuzzy matching (threshold >= 0.75 within same team)
    best_fuzzy = None
    best_ratio = 0.0
    for mem in squad:
        ratio = difflib.SequenceMatcher(None, norm_target, mem['normalized_name']).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_fuzzy = mem

    if best_fuzzy and best_ratio >= 0.75:
        return best_fuzzy['photo_url'], "fuzzy", best_ratio

    # 5. Wikidata fallback for reserve/youth players
    wiki_url = get_wikidata_photo(player_name, wikidata_cache)
    if wiki_url:
        return wiki_url, "wikidata", 0.8

    return None, "none", best_ratio

def main():
    print("=" * 65)
    print("📸 ACTUALIZADOR DE FOTOS DE JUGADORES (EQUIPO + NOMBRE)")
    print("=" * 65)

    squads = fetch_fotmob_squads()

    # Load Wikidata cache
    wikidata_cache = {}
    if WIKIDATA_CACHE_FILE.exists():
        try:
            with open(WIKIDATA_CACHE_FILE, 'r', encoding='utf-8') as f:
                wikidata_cache = json.load(f)
        except Exception:
            wikidata_cache = {}

    # -------------------------------------------------------------
    # 1. Procesar src/data/jugadores_xg.json
    # -------------------------------------------------------------
    print("\n🔍 Procesando jugadores_xg.json...")
    if not JUGADORES_XG_FILE.exists():
        print(f"❌ Error: {JUGADORES_XG_FILE} no encontrado")
        return

    with open(JUGADORES_XG_FILE, 'r', encoding='utf-8') as f:
        jugadores_data = json.load(f)

    photo_map_team_player = {}
    photo_map_player = {}
    photo_map_by_id = {}

    matched_count = 0
    total_jugadores = len(jugadores_data)

    for p in jugadores_data:
        team_name = p.get('team_name', '')
        player_name = p.get('player_name', '')
        player_id = str(p.get('player_id', ''))
        squad = squads.get(team_name, [])

        photo_url, m_type, score = match_player_in_squad(team_name, player_name, squad, wikidata_cache)
        if photo_url:
            p['photo'] = photo_url
            matched_count += 1
            photo_map_team_player[f"{team_name}|{player_name}"] = photo_url
            photo_map_player[player_name] = photo_url
            if player_id:
                photo_map_by_id[player_id] = {
                    "player_id": player_id,
                    "nombre": player_name,
                    "equipo": team_name,
                    "ruta_local": photo_url,
                    "url": photo_url,
                    "confianza": m_type,
                    "score": round(score, 2)
                }

    coverage_jugadores = (matched_count / total_jugadores) * 100
    print(f"✅ Cobertura jugadores_xg.json: {matched_count}/{total_jugadores} ({coverage_jugadores:.1f}%)")

    # Guardar jugadores_xg.json actualizado con "photo"
    with open(JUGADORES_XG_FILE, 'w', encoding='utf-8') as f:
        json.dump(jugadores_data, f, indent=2, ensure_ascii=False)
    print(f"💾 Guardado {JUGADORES_XG_FILE} con campo 'photo'")

    # -------------------------------------------------------------
    # 2. Procesar public/data/matches/*.json y src/data/match_intel.json
    # -------------------------------------------------------------
    print("\n🏟️ Procesando alineaciones y plantillas de partidos...")
    match_files = sorted(glob.glob(str(MATCHES_DIR / "*.json")))
    
    total_lineup_players = 0
    matched_lineup_players = 0

    for mf_path in match_files:
        if mf_path.endswith("index.json"):
            continue
        try:
            with open(mf_path, 'r', encoding='utf-8') as f:
                m_data = json.load(f)

            home_team = m_data.get('match', {}).get('home_team', '')
            away_team = m_data.get('match', {}).get('away_team', '')

            # Update rosters.h
            if 'rosters' in m_data and isinstance(m_data['rosters'], dict):
                for p_obj in m_data['rosters'].get('h', {}).values():
                    p_name = p_obj.get('player', '')
                    p_id = str(p_obj.get('player_id', ''))
                    total_lineup_players += 1
                    photo_url, _, _ = match_player_in_squad(home_team, p_name, squads.get(home_team, []), wikidata_cache)
                    if photo_url:
                        p_obj['photo'] = photo_url
                        matched_lineup_players += 1
                        photo_map_team_player[f"{home_team}|{p_name}"] = photo_url
                        photo_map_player[p_name] = photo_url
                        if p_id:
                            photo_map_by_id[p_id] = {
                                "player_id": p_id,
                                "nombre": p_name,
                                "equipo": home_team,
                                "ruta_local": photo_url,
                                "url": photo_url
                            }

                # Update rosters.a
                for p_obj in m_data['rosters'].get('a', {}).values():
                    p_name = p_obj.get('player', '')
                    p_id = str(p_obj.get('player_id', ''))
                    total_lineup_players += 1
                    photo_url, _, _ = match_player_in_squad(away_team, p_name, squads.get(away_team, []), wikidata_cache)
                    if photo_url:
                        p_obj['photo'] = photo_url
                        matched_lineup_players += 1
                        photo_map_team_player[f"{away_team}|{p_name}"] = photo_url
                        photo_map_player[p_name] = photo_url
                        if p_id:
                            photo_map_by_id[p_id] = {
                                "player_id": p_id,
                                "nombre": p_name,
                                "equipo": away_team,
                                "ruta_local": photo_url,
                                "url": photo_url
                            }

            # Update players list
            if 'players' in m_data and isinstance(m_data['players'], list):
                for p_obj in m_data['players']:
                    p_name = p_obj.get('name', '')
                    team_side = p_obj.get('team', '')
                    team_actual = home_team if team_side == 'home' else away_team
                    photo_url, _, _ = match_player_in_squad(team_actual, p_name, squads.get(team_actual, []), wikidata_cache)
                    if photo_url:
                        p_obj['photo'] = photo_url

            with open(mf_path, 'w', encoding='utf-8') as f:
                json.dump(m_data, f, indent=2, ensure_ascii=False)

        except Exception as e:
            print(f"⚠️ Error procesando {mf_path}: {e}")

    coverage_lineups = (matched_lineup_players / total_lineup_players) * 100 if total_lineup_players > 0 else 0
    print(f"✅ Cobertura en alineaciones (78 partidos): {matched_lineup_players}/{total_lineup_players} ({coverage_lineups:.1f}%)")

    # Update match_intel.json
    if MATCH_INTEL_FILE.exists():
        try:
            with open(MATCH_INTEL_FILE, 'r', encoding='utf-8') as f:
                intel_data = json.load(f)
            ht = intel_data.get('match', {}).get('home_team', '')
            at = intel_data.get('match', {}).get('away_team', '')

            if 'rosters' in intel_data and isinstance(intel_data['rosters'], dict):
                for p_obj in intel_data['rosters'].get('h', {}).values():
                    p_name = p_obj.get('player', '')
                    url, _, _ = match_player_in_squad(ht, p_name, squads.get(ht, []), wikidata_cache)
                    if url:
                        p_obj['photo'] = url
                for p_obj in intel_data['rosters'].get('a', {}).values():
                    p_name = p_obj.get('player', '')
                    url, _, _ = match_player_in_squad(at, p_name, squads.get(at, []), wikidata_cache)
                    if url:
                        p_obj['photo'] = url

            if 'players' in intel_data and isinstance(intel_data['players'], list):
                for p_obj in intel_data['players']:
                    t_actual = ht if p_obj.get('team') == 'home' else at
                    url, _, _ = match_player_in_squad(t_actual, p_obj.get('name', ''), squads.get(t_actual, []), wikidata_cache)
                    if url:
                        p_obj['photo'] = url

            with open(MATCH_INTEL_FILE, 'w', encoding='utf-8') as f:
                json.dump(intel_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Actualizado {MATCH_INTEL_FILE} con fotos de jugadores")
        except Exception as e:
            print(f"⚠️ Error actualizando {MATCH_INTEL_FILE}: {e}")

    # -------------------------------------------------------------
    # 3. Guardar archivos de caché consolidados
    # -------------------------------------------------------------
    with open(WIKIDATA_CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(wikidata_cache, f, indent=2, ensure_ascii=False)

    # Master player photos map: combines "Team|Player", "Player", and player_id mappings
    consolidated_photos = {
        **photo_map_team_player,
        **photo_map_player,
        "_by_id": photo_map_by_id
    }
    with open(PLAYER_PHOTOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(consolidated_photos, f, indent=2, ensure_ascii=False)
    print(f"💾 Guardado {PLAYER_PHOTOS_FILE} ({len(consolidated_photos)} entradas)")

    # Legacy compatibility file for existing frontend
    with open(PLAYERS_PHOTOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(photo_map_by_id, f, indent=2, ensure_ascii=False)
    print(f"💾 Guardado {PLAYERS_PHOTOS_FILE} ({len(photo_map_by_id)} IDs mapeados)")

    print("\n" + "=" * 65)
    print("✨ ACTUALIZACIÓN DE FOTOS COMPLETADA CON ÉXITO")
    print(f"   📊 Cobertura jugadores_xg: {coverage_jugadores:.1f}%")
    print(f"   📊 Cobertura alineaciones: {coverage_lineups:.1f}%")
    print("=" * 65)

if __name__ == "__main__":
    main()
