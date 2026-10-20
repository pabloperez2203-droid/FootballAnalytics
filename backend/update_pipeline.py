#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════
  update_pipeline.py — Orquestador Incremental de Datos de LaLiga (Understat)
  
  1. Invalida y refresca la caché de temporada (league_4_season_2026.json).
     Conserva la caché individual match_<id>.json para no repetir peticiones.
  2. Actualiza src/data/equipos_xg.json y src/data/jugadores_xg.json.
  3. Detecta partidos jugados (is_result == True) sin JSON en public/data/matches/
     o pertenecientes a la última jornada jugada, descarga tiros/estadísticas y
     actualiza public/data/matches/index.json y src/data/match_intel.json.
═══════════════════════════════════════════════════════════════════════════
"""

import sys
import os

# Self-bootstrap into virtualenv if needed
try:
    import soccerdata
except ImportError:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(backend_dir, "venv_soccerdata", "bin", "python"),
        os.path.join(backend_dir, "venv", "bin", "python"),
        os.path.join(backend_dir, "venv_soccerdata", "bin", "python3"),
        os.path.join(backend_dir, "venv", "bin", "python3"),
    ]
    for c in candidates:
        if os.path.exists(c):
            os.execv(c, [c] + sys.argv)

import json
import logging
import math
import pandas as pd
from datetime import datetime, timezone
import soccerdata as sd

# ── Paths ────────────────────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BACKEND_DIR, "data", "cache")
REAL_DIR = os.path.join(BACKEND_DIR, "data", "real")
FRONTEND_DATA_DIR = os.path.join(BACKEND_DIR, "..", "src", "data")
PUBLIC_MATCHES_DIR = os.path.join(BACKEND_DIR, "..", "public", "data", "matches")
TEAM_NAMES_FILE = os.path.join(BACKEND_DIR, "team_names.json")
PARTIDOS_CSV_FILE = os.path.join(REAL_DIR, "PartidosJornadas.csv")
VALIDATION_FILE = os.path.join(BACKEND_DIR, "data", "validation_report.json")

os.environ["SOCCERDATA_DIR"] = CACHE_DIR

os.makedirs(PUBLIC_MATCHES_DIR, exist_ok=True)
os.makedirs(FRONTEND_DATA_DIR, exist_ok=True)
os.makedirs(REAL_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("update_pipeline")

LEAGUE = "ESP-La Liga"
SEASON = "2026"
SEASON_LABEL = "2026-27"
NOW_ISO = datetime.now(timezone.utc).isoformat()


# ── Helpers ──────────────────────────────────────────────────────────────
def load_team_names():
    if os.path.exists(TEAM_NAMES_FILE):
        with open(TEAM_NAMES_FILE, "r") as f:
            return json.load(f)
    return {}

def save_team_names(names):
    with open(TEAM_NAMES_FILE, "w") as f:
        json.dump(names, f, indent=2, ensure_ascii=False)

def load_partidos_csv():
    if os.path.exists(PARTIDOS_CSV_FILE):
        return pd.read_csv(PARTIDOS_CSV_FILE, sep=";")
    return pd.DataFrame()


# ── 1. Invalidate General Season Cache ───────────────────────────────────
def invalidate_season_cache():
    """Borra el archivo general de la liga para descargar partidos nuevos sin bloqueo de caché."""
    paths_to_check = [
        os.path.join(CACHE_DIR, "data", "Understat", "league_4_season_2026.json"),
        os.path.join(CACHE_DIR, "data", "Understat", "leagues.json"),
        os.path.expanduser("~/soccerdata/data/Understat/league_4_season_2026.json"),
        os.path.expanduser("~/soccerdata/data/Understat/leagues.json"),
    ]
    invalidated = False
    for p in paths_to_check:
        if os.path.exists(p):
            log.info(f"🔄 Invalidando caché Understat: {p}")
            try:
                os.remove(p)
                invalidated = True
            except Exception as e:
                log.warning(f"  ⚠️ No se pudo eliminar {p}: {e}")
    if not invalidated:
        log.info("ℹ️  No existe caché de temporada previa, se descargará en directo.")


# ── 2. Update Teams & Players Stats ──────────────────────────────────────
def update_teams_and_players():
    log.info("\n📊 Actualizando estadísticas de Equipos y Jugadores...")
    # Import functions from fetch_xg
    sys.path.insert(0, BACKEND_DIR)
    from fetch_xg import fetch_and_aggregate_teams, fetch_players, save

    teams = fetch_and_aggregate_teams()
    players = fetch_players()
    save(teams, players)
    log.info("✅ equipos_xg.json y jugadores_xg.json actualizados correctamente.")
    return teams, players


# ── 3. Incremental Match Processor ───────────────────────────────────────
def update_matches():
    log.info("\n⚽ Procesando partidos jugados incrementalmente...")
    us = sd.Understat(leagues=LEAGUE, seasons=SEASON, no_cache=True)
    schedule = us.read_schedule(force_cache=False)

    played = schedule[schedule["is_result"] == True].copy()
    played.sort_values(by="date", inplace=True)
    log.info(f"  Encontrados {len(played)} partidos jugados en total.")

    team_names = load_team_names()
    df_csv = load_partidos_csv()

    # Map game_id -> matchday
    jornadas_map = {}
    if not df_csv.empty:
        for _, r in df_csv.iterrows():
            jf = r.get("jornada_fuente")
            if pd.notna(jf) and jf != "":
                jornadas_map[str(r["match_id"])] = int(float(jf))
            else:
                jornadas_map[str(r["match_id"])] = int(r["jornada"])

    # Determine latest played matchday
    matchdays_played = [jornadas_map.get(str(r["game_id"]), 1) for _, r in played.iterrows()]
    latest_matchday = max(matchdays_played) if matchdays_played else 1
    log.info(f"  Última jornada jugada detectada: Jornada {latest_matchday}")

    validation_report = {}
    if os.path.exists(VALIDATION_FILE):
        try:
            with open(VALIDATION_FILE, "r") as f:
                validation_report = json.load(f)
        except:
            validation_report = {}

    index_data = []
    updated_or_created = 0
    latest_match_obj = None

    result_map = {
        "Goal": "Gol", "SavedShot": "Parada", "MissedShots": "Fuera",
        "BlockedShot": "Bloqueado", "ShotOnPost": "Palo", "OwnGoal": "Propia"
    }

    # CSV lookup index for updating estado and scores in PartidosJornadas.csv
    csv_dict = {}
    if not df_csv.empty:
        csv_dict = {str(r["match_id"]): idx for idx, r in df_csv.iterrows()}

    for _, match in played.iterrows():
        game_id = str(match["game_id"])
        matchday = jornadas_map.get(game_id, (index_data[-1]["matchday"] if index_data else 1))

        home_team = match["home_team"]
        away_team = match["away_team"]

        if home_team not in team_names:
            team_names[home_team] = home_team
        if away_team not in team_names:
            team_names[away_team] = away_team

        home_mapped = team_names[home_team]
        away_mapped = team_names[away_team]

        out_file = os.path.join(PUBLIC_MATCHES_DIR, f"{game_id}.json")
        needs_review = False

        # Needs fetch if file doesn't exist OR belongs to latest_matchday
        should_fetch = not os.path.exists(out_file) or (matchday == latest_matchday)

        if not should_fetch and os.path.exists(out_file):
            with open(out_file, "r") as f:
                existing = json.load(f)
                needs_review = existing.get("match", {}).get("needs_review", False)
                latest_match_obj = existing
        else:
            log.info(f"  📥 Descargando detalles Match {game_id} (J{matchday}): {home_mapped} vs {away_mapped}")
            try:
                shots = us.read_shot_events(match_id=[match["game_id"]])
                players = us.read_player_match_stats(match_id=[match["game_id"]])
                shots_reset = shots.reset_index()
                players_reset = players.reset_index()

                home_xg_sch = float(match["home_xg"])
                away_xg_sch = float(match["away_xg"])
                home_goals_sch = int(match["home_goals"])
                away_goals_sch = int(match["away_goals"])

                home_xg_shots = float(shots_reset[shots_reset["team"] == home_team]["xg"].sum()) if not shots_reset.empty else home_xg_sch
                away_xg_shots = float(shots_reset[shots_reset["team"] == away_team]["xg"].sum()) if not shots_reset.empty else away_xg_sch

                val_errors = []
                if not math.isclose(home_xg_sch, home_xg_shots, abs_tol=0.08):
                    val_errors.append(f"Home xG mismatch: {home_xg_sch} != {home_xg_shots}")
                if not math.isclose(away_xg_sch, away_xg_shots, abs_tol=0.08):
                    val_errors.append(f"Away xG mismatch: {away_xg_sch} != {away_xg_shots}")

                if val_errors:
                    needs_review = True
                    validation_report[game_id] = val_errors
                elif game_id in validation_report:
                    del validation_report[game_id]

                shots_list = []
                for _, s in shots_reset.iterrows():
                    t = s["team"]
                    is_home = (t == home_team)
                    team_str = "home" if is_home else "away"
                    res_es = result_map.get(str(s["result"]).replace(" ", ""), str(s["result"]))
                    x = float(s["location_x"]) * 100 if pd.notnull(s["location_x"]) else 0
                    y = float(s["location_y"]) * 100 if pd.notnull(s["location_y"]) else 0
                    if team_str == "away":
                        x = 100 - x
                        y = 100 - y

                    shots_list.append({
                        "id": str(s["shot_id"]), "min": int(s["minute"]), "team": team_str,
                        "player": str(s["player"]), "xg": round(float(s["xg"]), 3),
                        "result": res_es, "x": round(x, 1), "y": round(y, 1)
                    })

                players_list = []
                for _, p in players_reset.iterrows():
                    t = p["team"]
                    team_str = "home" if t == home_team else "away"
                    position = str(p.get("position", "Unknown"))
                    is_starter = position != "Sub"
                    players_list.append({
                        "id": str(p["player_id"]), "team": team_str, "name": str(p["player"]),
                        "mins": int(p["minutes"]), "shots": int(p["shots"]),
                        "xg": round(float(p["xg"]), 2), "goals": int(p["goals"]),
                        "position": position, "is_starter": is_starter
                    })

                match_obj = {
                    "id": game_id, "home_team": home_mapped, "home_short": home_mapped[:3].upper(),
                    "away_team": away_mapped, "away_short": away_mapped[:3].upper(),
                    "home_score": home_goals_sch, "away_score": away_goals_sch,
                    "home_xg": home_xg_sch, "away_xg": away_xg_sch, "date": str(match["date"]),
                    "stadium": "N/A", "matchday": matchday, "needs_review": needs_review
                }

                verdict = {
                    "win_probability": {"home": 50, "draw": 25, "away": 25},
                    "best_chance": "Estimación (solo xG)",
                    "most_dangerous": "Estimación (solo xG)",
                    "biggest_surprise": "Estimación (solo xG)"
                }

                stats = {
                    "home": {
                        "shots": len([s for s in shots_list if s["team"]=="home"]),
                        "xg": round(home_xg_shots, 2),
                        "xg_per_shot": round(home_xg_shots/max(1, len([s for s in shots_list if s["team"]=="home"])), 2)
                    },
                    "away": {
                        "shots": len([s for s in shots_list if s["team"]=="away"]),
                        "xg": round(away_xg_shots, 2),
                        "xg_per_shot": round(away_xg_shots/max(1, len([s for s in shots_list if s["team"]=="away"])), 2)
                    }
                }

                # Rosters from Understat match cache
                rosters = {"h": {}, "a": {}}
                candidate_cache_files = [
                    os.path.join(CACHE_DIR, "data", "Understat", f"match_{game_id}.json"),
                    os.path.expanduser(f"~/soccerdata/data/Understat/match_{game_id}.json"),
                    os.path.join(BACKEND_DIR, "data", "cache", "data", "Understat", f"match_{game_id}.json")
                ]
                for cache_file in candidate_cache_files:
                    if os.path.exists(cache_file):
                        try:
                            with open(cache_file, "r") as cf:
                                raw_match = json.load(cf)
                                r = raw_match.get("rosters", {"h": {}, "a": {}})
                                if r and (r.get("h") or r.get("a")):
                                    rosters = r
                                    break
                        except:
                            pass

                match_output = {
                    "is_simulated": False, "match": match_obj, "verdict": verdict,
                    "stats": stats, "shots": shots_list, "players": players_list,
                    "rosters": rosters
                }

                with open(out_file, "w") as f:
                    json.dump(match_output, f, indent=2, ensure_ascii=False)

                latest_match_obj = match_output
                updated_or_created += 1
            except Exception as e:
                log.error(f"  ❌ Error procesando match {game_id}: {e}")

        # Update CSV status if match was played
        if game_id in csv_dict:
            row_idx = csv_dict[game_id]
            df_csv.at[row_idx, "estado"] = "jugado"
            df_csv.at[row_idx, "goles_local"] = int(match["home_goals"])
            df_csv.at[row_idx, "goles_visitante"] = int(match["away_goals"])
            df_csv.at[row_idx, "xg_local"] = float(match["home_xg"])
            df_csv.at[row_idx, "xg_visitante"] = float(match["away_xg"])

        # Index entry
        index_data.append({
            "id": game_id,
            "matchday": matchday,
            "date": str(match["date"]),
            "home_team": home_mapped,
            "away_team": away_mapped,
            "home_score": int(match["home_goals"]),
            "away_score": int(match["away_goals"]),
            "home_xg": float(match["home_xg"]),
            "away_xg": float(match["away_xg"]),
            "needs_review": needs_review
        })

    # Save index.json
    index_file = os.path.join(PUBLIC_MATCHES_DIR, "index.json")
    with open(index_file, "w") as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    log.info(f"✅ public/data/matches/index.json guardado ({len(index_data)} partidos).")

    # Update src/data/match_intel.json with the latest match
    if latest_match_obj:
        intel_file = os.path.join(FRONTEND_DATA_DIR, "match_intel.json")
        with open(intel_file, "w") as f:
            json.dump(latest_match_obj, f, indent=2, ensure_ascii=False)
        log.info(f"✅ src/data/match_intel.json actualizado con Match {latest_match_obj['match']['id']}.")

    # Save validation report & team names
    with open(VALIDATION_FILE, "w") as f:
        json.dump(validation_report, f, indent=2)
    save_team_names(team_names)

    # Save updated PartidosJornadas.csv
    if not df_csv.empty:
        df_csv.to_csv(PARTIDOS_CSV_FILE, sep=";", index=False)
        log.info(f"✅ {PARTIDOS_CSV_FILE} actualizado con los últimos resultados.")

    log.info(f"\n🎉 Partidos nuevos o actualizados en esta ejecución: {updated_or_created}")


def update_ucl():
    log.info("\n" + "=" * 65)
    log.info("  ⭐ ACTUALIZANDO DATOS DE UEFA CHAMPIONS LEAGUE (FOTMOB)")
    log.info("=" * 65)
    try:
        import subprocess
        ucl_script = os.path.join(BACKEND_DIR, "fetch_ucl.py")
        res = subprocess.run([sys.executable, ucl_script], capture_output=True, text=True)
        if res.returncode == 0:
            log.info("✅ Datos de UEFA Champions League actualizados con éxito.")
            if res.stdout:
                for line in res.stdout.strip().splitlines():
                    if "✓" in line or "guardados" in line or "actualizado" in line:
                        log.info(f"   {line.strip()}")
        else:
            log.error(f"❌ Error al actualizar Champions League:\n{res.stderr or res.stdout}")
    except Exception as e:
        log.error(f"❌ Excepción ejecutando fetch_ucl.py: {e}")


# ── Main Entrypoint ──────────────────────────────────────────────────────
def main():
    log.info("=" * 65)
    log.info("  🚀 PIPELINE INCREMENTAL DE ACTUALIZACIÓN DE DATOS (LALIGA + UCL)")
    log.info(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 65)

    invalidate_season_cache()
    update_teams_and_players()
    update_matches()
    update_ucl()

    log.info("\n" + "=" * 65)
    log.info("  ✨ Pipeline completado con éxito (LaLiga + UEFA Champions League).")
    log.info("=" * 65)


if __name__ == "__main__":
    main()
