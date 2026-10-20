"""
═══════════════════════════════════════════════════════════════════════════
  fetch_xg.py — Descarga xG y goles reales de La Liga 2026-27
  
  Fuente: Understat vía soccerdata
  Salida:
    data/real/equipos_2026-27.csv      → CSV por equipo
    data/real/jugadores_2026-27.csv    → CSV por jugador
    src/data/equipos_xg.json           → JSON para frontend
    src/data/jugadores_xg.json         → JSON para frontend
═══════════════════════════════════════════════════════════════════════════
"""
import os
import sys
import json
import logging
from datetime import datetime, timezone

CACHE_DIR = os.path.join(os.path.dirname(__file__), "data", "cache")
os.environ["SOCCERDATA_DIR"] = CACHE_DIR

import soccerdata as sd
import pandas as pd

# ─── Config ───────────────────────────────────────────────────────────────
LEAGUE = "ESP-La Liga"
SEASON = "2026"
SEASON_LABEL = "2026-27"

REAL_DIR = os.path.join(os.path.dirname(__file__), "data", "real")
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data")
os.makedirs(REAL_DIR, exist_ok=True)
os.makedirs(FRONTEND_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

NOW_ISO = datetime.now(timezone.utc).isoformat()


# ═══════════════════════════════════════════════════════════════════════════
# EQUIPOS
# ═══════════════════════════════════════════════════════════════════════════

def fetch_and_aggregate_teams() -> pd.DataFrame | None:
    """Descarga stats por partido y agrega por equipo."""
    log.info("\n🏟️  Descargando stats de equipo por partido (Understat)...")
    
    us = sd.Understat(leagues=LEAGUE, seasons=SEASON, no_cache=True)
    
    try:
        raw = us.read_team_match_stats(force_cache=False)
    except Exception as e:
        log.error(f"  ❌ Fallo: {e}")
        return None
    
    if raw is None or raw.empty:
        log.warning("  ⚠️  Sin datos")
        return None
    
    df = raw.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ["_".join(str(c).strip() for c in col if str(c).strip()) for col in df.columns]
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]
    
    log.info(f"  ✅ {len(df)} partidos descargados")
    
    # ── Pivotar: cada partido genera 2 filas (una por equipo) ──
    home = df[["home_team", "home_points", "home_goals", "home_xg", "home_np_xg",
               "away_goals", "away_xg", "home_ppda", "home_deep_completions",
               "home_expected_points"]].rename(columns={
        "home_team": "team",
        "home_points": "pts",
        "home_goals": "goals_for",
        "home_xg": "xg_for",
        "home_np_xg": "np_xg_for",
        "away_goals": "goals_against",
        "away_xg": "xg_against",
        "home_ppda": "ppda",
        "home_deep_completions": "deep_completions",
        "home_expected_points": "expected_points",
    })
    
    away = df[["away_team", "away_points", "away_goals", "away_xg", "away_np_xg",
               "home_goals", "home_xg", "away_ppda", "away_deep_completions",
               "away_expected_points"]].rename(columns={
        "away_team": "team",
        "away_points": "pts",
        "away_goals": "goals_for",
        "away_xg": "xg_for",
        "away_np_xg": "np_xg_for",
        "home_goals": "goals_against",
        "home_xg": "xg_against",
        "away_ppda": "ppda",
        "away_deep_completions": "deep_completions",
        "away_expected_points": "expected_points",
    })
    
    stacked = pd.concat([home, away], ignore_index=True)
    
    # ── Agregar por equipo ──
    teams = stacked.groupby("team").agg(
        matches_played=("goals_for", "size"),
        pts=("pts", "sum"),
        goals_for=("goals_for", "sum"),
        xg_for=("xg_for", "sum"),
        np_xg_for=("np_xg_for", "sum"),
        goals_against=("goals_against", "sum"),
        xg_against=("xg_against", "sum"),
        ppda_avg=("ppda", "mean"),
        deep_completions=("deep_completions", "sum"),
        expected_points=("expected_points", "sum"),
    ).reset_index()
    teams["pts"] = teams["pts"].astype(int)
    teams["diff_pts_xpts"] = (teams["pts"] - teams["expected_points"]).round(2)
    
    # Redondear
    for col in ["xg_for", "np_xg_for", "xg_against", "ppda_avg", "expected_points"]:
        teams[col] = teams[col].round(2)
    
    # Diferencias
    teams["diff_goals_xg"] = (teams["goals_for"] - teams["xg_for"]).round(2)
    teams["diff_goals_xg_against"] = (teams["goals_against"] - teams["xg_against"]).round(2)
    teams["xg_per_match"] = (teams["xg_for"] / teams["matches_played"]).round(2)
    teams["goals_per_match"] = (teams["goals_for"] / teams["matches_played"]).round(2)
    
    # Metadatos
    teams["source"] = "understat"
    teams["fetched_at"] = NOW_ISO
    teams["season"] = SEASON_LABEL
    teams["is_simulated"] = False
    
    # Ordenar por diff descendente
    teams = teams.sort_values("diff_goals_xg", ascending=False).reset_index(drop=True)
    teams.insert(0, "rank", range(1, len(teams) + 1))
    
    log.info(f"  📊 {len(teams)} equipos agregados")
    return teams


# ═══════════════════════════════════════════════════════════════════════════
# JUGADORES
# ═══════════════════════════════════════════════════════════════════════════

def fetch_players() -> pd.DataFrame | None:
    """Descarga stats de jugador por temporada."""
    log.info("\n⭐ Descargando stats de jugador (Understat)...")
    
    us = sd.Understat(leagues=LEAGUE, seasons=SEASON, no_cache=True)
    
    try:
        raw = us.read_player_season_stats(force_cache=False)
    except Exception as e:
        log.error(f"  ❌ Fallo: {e}")
        return None
    
    if raw is None or raw.empty:
        log.warning("  ⚠️  Sin datos")
        return None
    
    df = raw.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ["_".join(str(c).strip() for c in col if str(c).strip()) for col in df.columns]
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]
    
    log.info(f"  ✅ {len(df)} jugadores descargados")
    
    # Renombrar para claridad
    rename_map = {}
    if "player" in df.columns:
        rename_map["player"] = "player_name"
    if "team" in df.columns:
        rename_map["team"] = "team_name"
    df = df.rename(columns=rename_map)
    
    # Redondear floats
    float_cols = df.select_dtypes(include="float").columns
    df[float_cols] = df[float_cols].round(2)
    
    # Diferencia
    if "goals" in df.columns and "xg" in df.columns:
        df["diff_goals_xg"] = (df["goals"] - df["xg"]).round(2)
    
    # Metadatos
    df["source"] = "understat"
    df["fetched_at"] = NOW_ISO
    df["season"] = SEASON_LABEL
    df["is_simulated"] = False
    
    log.info(f"  📊 Columnas: {list(df.columns)}")
    return df


# ═══════════════════════════════════════════════════════════════════════════
# GUARDAR
# ═══════════════════════════════════════════════════════════════════════════

def save(teams: pd.DataFrame | None, players: pd.DataFrame | None):
    log.info("\n💾 Guardando...")
    
    if teams is not None:
        p = os.path.join(REAL_DIR, f"equipos_{SEASON_LABEL}.csv")
        teams.to_csv(p, index=False)
        log.info(f"  📁 {p} ({len(teams)} filas)")
        
        p2 = os.path.join(FRONTEND_DIR, "equipos_xg.json")
        teams.to_json(p2, orient="records", force_ascii=False, indent=2)
        log.info(f"  📁 {p2}")
    
    if players is not None:
        p = os.path.join(REAL_DIR, f"jugadores_{SEASON_LABEL}.csv")
        players.to_csv(p, index=False)
        log.info(f"  📁 {p} ({len(players)} filas)")
        
        p2 = os.path.join(FRONTEND_DIR, "jugadores_xg.json")
        if os.path.exists(p2):
            try:
                with open(p2, "r") as f:
                    old_players = json.load(f)
                photo_map_name = {p.get("player_name"): p.get("photo") for p in old_players if p.get("photo")}
                photo_map_id = {str(p.get("player_id")): p.get("photo") for p in old_players if p.get("photo")}
                records = json.loads(players.to_json(orient="records"))
                for r in records:
                    photo = photo_map_name.get(r.get("player_name")) or photo_map_id.get(str(r.get("player_id")))
                    if photo:
                        r["photo"] = photo
                with open(p2, "w") as f:
                    json.dump(records, f, indent=2, ensure_ascii=False)
            except Exception as e:
                log.warning(f"  ⚠️ Error preservando fotos: {e}")
                players.to_json(p2, orient="records", force_ascii=False, indent=2)
        else:
            players.to_json(p2, orient="records", force_ascii=False, indent=2)
        log.info(f"  📁 {p2}")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    log.info("=" * 60)
    log.info("  ⚽ xG vs Goles — La Liga 2026-27 (Understat)")
    log.info(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 60)
    
    teams = fetch_and_aggregate_teams()
    players = fetch_players()
    save(teams, players)
    
    # ── Resumen ──
    log.info("\n" + "=" * 60)
    if teams is not None:
        log.info(f"  Equipos:   {len(teams)} equipos × {len(teams.columns)} cols")
        top5 = teams.head(5)[["rank", "team", "goals_for", "xg_for", "diff_goals_xg"]]
        log.info(f"\n  Top 5 sobrerrendimiento (Goles - xG):\n{top5.to_string(index=False)}")
    else:
        log.info("  Equipos: ❌")
    
    if players is not None:
        log.info(f"\n  Jugadores: {len(players)} jugadores × {len(players.columns)} cols")
        if "diff_goals_xg" in players.columns and "goals" in players.columns:
            top_p = players.nlargest(5, "goals")[["player_name", "team_name", "goals", "xg", "diff_goals_xg"]]
            log.info(f"\n  Top 5 goleadores:\n{top_p.to_string(index=False)}")
    else:
        log.info("  Jugadores: ❌")
    
    log.info("\n" + "=" * 60)


if __name__ == "__main__":
    main()
