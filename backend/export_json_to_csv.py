#!/usr/bin/env python3
"""
Script para convertir todos los archivos JSON de src/data/ y public/data/matches/
en archivos CSV optimizados para Microsoft Excel (UTF-8 con BOM).

Genera:
1. Tablas maestras de LaLiga y Champions League (equipos, jugadores, calendarios).
2. Archivos consolidados de partidos (todos los tiros, rendimiento de todos los jugadores, resúmenes).
3. Desglose detallado de cada partido individual en la subcarpeta 'partidos_individuales/'.
4. Exporta tanto a la raíz del proyecto (descargas_csv/) como al Escritorio del usuario (/Users/perez/Desktop/descargas_csv/).
"""

import os
import sys
import json
import shutil
import csv
from pathlib import Path
from typing import List, Dict, Any

# Rutas base
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # /Users/perez/Project_FootData
APP_DIR = BASE_DIR / "football-analytics"
SRC_DATA_DIR = APP_DIR / "src" / "data"
MATCHES_DATA_DIR = APP_DIR / "public" / "data" / "matches"

PROJECT_OUTPUT_DIR = BASE_DIR / "descargas_csv"
DESKTOP_OUTPUT_DIR = Path.home() / "Desktop" / "descargas_csv"


def write_csv_from_dicts(output_path: Path, rows: List[Dict[str, Any]], fieldnames: List[str] = None):
    """Escribe una lista de diccionarios a CSV con codificación utf-8-sig para Excel."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        return 0

    if not fieldnames:
        # Mantener orden y recopilar todas las claves
        seen = set()
        fieldnames = []
        for r in rows:
            for k in r.keys():
                if k not in seen:
                    seen.add(k)
                    fieldnames.append(k)

    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            # Formatear valores booleanos o nulos para Excel
            cleaned_row = {}
            for k in fieldnames:
                v = r.get(k, "")
                if v is None:
                    cleaned_row[k] = ""
                elif isinstance(v, bool):
                    cleaned_row[k] = "SI" if v else "NO"
                elif isinstance(v, (dict, list)):
                    cleaned_row[k] = json.dumps(v, ensure_ascii=False)
                else:
                    cleaned_row[k] = v
            writer.writerow(cleaned_row)

    return len(rows)


def flatten_dict(d: Dict[str, Any], parent_key: str = "", sep: str = "_") -> Dict[str, Any]:
    """Aplana un diccionario anidado."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            items.append((new_key, json.dumps(v, ensure_ascii=False)))
        else:
            items.append((new_key, v))
    return dict(items)


def process_src_data(out_dir: Path) -> List[str]:
    """Convierte los JSONs de src/data/."""
    generated = []

    # 1. Equipos LaLiga
    path = SRC_DATA_DIR / "equipos_xg.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "equipos_laliga_xg.csv", data)
        generated.append(f"equipos_laliga_xg.csv ({count} filas)")

    # 2. Equipos UCL
    path = SRC_DATA_DIR / "equipos_ucl_xg.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "equipos_ucl_xg.csv", data)
        generated.append(f"equipos_ucl_xg.csv ({count} filas)")

    # 3. Equipos Simulado 2026-27
    path = SRC_DATA_DIR / "equipos_2026-27_simulado.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "equipos_2026-27_simulado.csv", data)
        generated.append(f"equipos_2026-27_simulado.csv ({count} filas)")

    # 4. Jugadores LaLiga
    path = SRC_DATA_DIR / "jugadores_xg.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "jugadores_laliga_xg.csv", data)
        generated.append(f"jugadores_laliga_xg.csv ({count} filas)")

    # 5. Jugadores UCL
    path = SRC_DATA_DIR / "jugadores_ucl_xg.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "jugadores_ucl_xg.csv", data)
        generated.append(f"jugadores_ucl_xg.csv ({count} filas)")

    # 6. Jugadores Simulado 2026-27
    path = SRC_DATA_DIR / "jugadores_2026-27_simulado.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "jugadores_2026-27_simulado.csv", data)
        generated.append(f"jugadores_2026-27_simulado.csv ({count} filas)")

    # 7. Match Intel y Match Intel Simulado
    for name, p in [
        ("match_intel_destacado", SRC_DATA_DIR / "match_intel.json"),
        ("match_intel_simulado", SRC_DATA_DIR / "simulado" / "match_intel_simulado.json"),
    ]:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                d = json.load(f)
            # Extraer tiros y jugadores
            shots = d.get("shots", [])
            players = d.get("players", [])
            match_meta = d.get("match", {})
            if shots:
                write_csv_from_dicts(out_dir / f"{name}_tiros.csv", shots)
            if players:
                write_csv_from_dicts(out_dir / f"{name}_jugadores.csv", players)
            if match_meta:
                write_csv_from_dicts(out_dir / f"{name}_resumen.csv", [flatten_dict(match_meta)])
            generated.append(f"{name}_*.csv (resumen, tiros, jugadores)")

    return generated


def process_matches_data(out_dir: Path) -> List[str]:
    """Convierte los JSONs de public/data/matches/ y consolida las tablas maestras."""
    generated = []

    # 1. Calendario LaLiga
    laliga_index_path = MATCHES_DATA_DIR / "index.json"
    if laliga_index_path.exists():
        with open(laliga_index_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "calendario_partidos_laliga.csv", data)
        generated.append(f"calendario_partidos_laliga.csv ({count} partidos)")

    # 2. Calendario UCL
    ucl_index_path = MATCHES_DATA_DIR / "ucl_index.json"
    if ucl_index_path.exists():
        with open(ucl_index_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = write_csv_from_dicts(out_dir / "calendario_partidos_ucl.csv", data)
        generated.append(f"calendario_partidos_ucl.csv ({count} partidos)")

    # 3. Procesar todos los archivos individuales de partidos
    all_shots = []
    all_players = []
    all_match_summaries = []

    indiv_dir = out_dir / "partidos_individuales"
    indiv_dir.mkdir(parents=True, exist_ok=True)

    match_files = sorted([f for f in MATCHES_DATA_DIR.glob("*.json") if f.name not in ("index.json", "ucl_index.json")])

    for mf in match_files:
        try:
            with open(mf, "r", encoding="utf-8") as f:
                d = json.load(f)
        except Exception as e:
            print(f"Error leyendo {mf.name}: {e}")
            continue

        match_meta = d.get("match", {})
        match_id = match_meta.get("id") or d.get("id") or mf.stem
        comp = "ucl" if str(match_id).startswith("ucl") or "ucl" in mf.name else "laliga"
        home_team = match_meta.get("home_team") or d.get("homeTeam", "")
        away_team = match_meta.get("away_team") or d.get("awayTeam", "")
        matchday = match_meta.get("matchday") or d.get("matchweek", "")
        date = match_meta.get("date") or d.get("date", "")

        # Resumen del partido
        stats = d.get("stats", {})
        verdict = d.get("verdict", {})
        win_prob = verdict.get("win_probability", {})

        summary_row = {
            "partido_id": match_id,
            "competicion": "UEFA Champions League" if comp == "ucl" else "LaLiga EA Sports",
            "jornada": matchday,
            "fecha": date,
            "local": home_team,
            "visitante": away_team,
            "goles_local": match_meta.get("home_score", d.get("homeGoals", 0)),
            "goles_visitante": match_meta.get("away_score", d.get("awayGoals", 0)),
            "xg_local": match_meta.get("home_xg", d.get("homeXG", 0)),
            "xg_visitante": match_meta.get("away_xg", d.get("awayXG", 0)),
            "tiros_local": stats.get("home", {}).get("shots", ""),
            "tiros_visitante": stats.get("away", {}).get("shots", ""),
            "xg_por_tiro_local": stats.get("home", {}).get("xg_per_shot", ""),
            "xg_por_tiro_visitante": stats.get("away", {}).get("xg_per_shot", ""),
            "prob_victoria_local_pct": win_prob.get("home", ""),
            "prob_empate_pct": win_prob.get("draw", ""),
            "prob_victoria_visitante_pct": win_prob.get("away", ""),
            "estadio": match_meta.get("stadium", "N/A"),
            "es_simulado": d.get("is_simulated", False),
        }
        all_match_summaries.append(summary_row)

        # Tiros
        shots = d.get("shots", [])
        if shots:
            indiv_shots = []
            for s in shots:
                s_copy = {
                    "partido_id": match_id,
                    "competicion": comp,
                    "jornada": matchday,
                    "fecha": date,
                    "local": home_team,
                    "visitante": away_team,
                    **s,
                }
                all_shots.append(s_copy)
                indiv_shots.append(s_copy)
            write_csv_from_dicts(indiv_dir / f"{match_id}_tiros.csv", indiv_shots)

        # Jugadores
        players = d.get("players", [])
        if players:
            indiv_players = []
            for p in players:
                p_copy = {
                    "partido_id": match_id,
                    "competicion": comp,
                    "jornada": matchday,
                    "fecha": date,
                    "local": home_team,
                    "visitante": away_team,
                    **p,
                }
                all_players.append(p_copy)
                indiv_players.append(p_copy)
            write_csv_from_dicts(indiv_dir / f"{match_id}_jugadores.csv", indiv_players)

    # Escribir tablas consolidadas maestras
    count_partidos = write_csv_from_dicts(out_dir / "todos_los_partidos_resumen.csv", all_match_summaries)
    generated.append(f"todos_los_partidos_resumen.csv ({count_partidos} partidos consolidados)")

    count_tiros = write_csv_from_dicts(out_dir / "todos_los_tiros_partidos.csv", all_shots)
    generated.append(f"todos_los_tiros_partidos.csv ({count_tiros} disparos consolidados de toda la temporada)")

    count_jugadores = write_csv_from_dicts(out_dir / "todos_los_jugadores_partidos.csv", all_players)
    generated.append(f"todos_los_jugadores_partidos.csv ({count_jugadores} registros de rendimiento de jugadores)")

    generated.append(f"partidos_individuales/ ({len(match_files)} partidos convertidos individualmente en tiros y jugadores)")

    return generated


def write_readme(out_dir: Path):
    """Escribe una guía en texto plano para el usuario sobre los archivos CSV generados."""
    readme_content = """================================================================================
xG Nexus — Centro de Descargas de Datos en CSV para Microsoft Excel
================================================================================

Todos estos archivos han sido codificados en UTF-8 con BOM (utf-8-sig) para que
puedas abrirlos directamente en Microsoft Excel (Windows o Mac) sin problemas de
caracteres especiales, tildes ni eñes.

--------------------------------------------------------------------------------
ARCHIVOS MAESTROS (EN ESTA CARPETA):
--------------------------------------------------------------------------------

1. COMPETICIONES Y CLASIFICACIONES:
   - equipos_laliga_xg.csv: Tabla completa de LaLiga EA Sports con xG a favor, en contra,
     puntos esperados (xPts), PPDA, pases profundos y diferencial G - xG.
   - equipos_ucl_xg.csv: Tabla completa de la UEFA Champions League (36 equipos fase liga).
   - equipos_2026-27_simulado.csv: Tabla de referencia simulada.

2. JUGADORES Y SCOUTING:
   - jugadores_laliga_xg.csv: Todos los futbolistas de LaLiga con goles, xG, xA, minutos,
     tiros, pases clave, xG Chain y xG Buildup.
   - jugadores_ucl_xg.csv: Todos los futbolistas de la Champions League.
   - jugadores_2026-27_simulado.csv: Base de datos simulada de jugadores.

3. CALENDARIOS Y JORNADAS:
   - calendario_partidos_laliga.csv: Resultados y xG de todas las jornadas disputadas de LaLiga.
   - calendario_partidos_ucl.csv: Resultados y xG de todas las jornadas de la Champions League.

4. TELEMETRÍA GLOBAL Y BIG DATA CONSOLIDADO:
   - todos_los_partidos_resumen.csv: Consolidado con estadísticas de los 124 partidos disputados
     (marcador, xG de cada equipo, tiros, xG/tiro y probabilidades de victoria del modelo).
   - todos_los_tiros_partidos.csv: ¡BASE DE DATOS COMPLETA DE DISPAROS! Cada uno de los miles de tiros
     registrados en la temporada con coordenadas (x, y), minuto, jugador, resultado y valor exacto de xG.
   - todos_los_jugadores_partidos.csv: Rendimiento individual de cada jugador en cada partido disputado.

--------------------------------------------------------------------------------
SUBDIRECTORIO 'partidos_individuales/':
--------------------------------------------------------------------------------
Contiene los archivos CSV individuales de cada encuentro ({id}_tiros.csv y {id}_jugadores.csv)
para que puedas analizar un partido específico de forma aislada.

================================================================================
"""
    with open(out_dir / "LEEME.txt", "w", encoding="utf-8") as f:
        f.write(readme_content)


def main():
    print("=" * 70)
    print("Iniciando exportación de JSONs a CSV compatibles con Microsoft Excel...")
    print("=" * 70)

    # Limpiar y preparar carpeta en raíz del proyecto
    if PROJECT_OUTPUT_DIR.exists():
        shutil.rmtree(PROJECT_OUTPUT_DIR)
    PROJECT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n[1/3] Procesando archivos de {SRC_DATA_DIR.relative_to(BASE_DIR)}...")
    src_results = process_src_data(PROJECT_OUTPUT_DIR)
    for r in src_results:
        print(f"  ✓ {r}")

    print(f"\n[2/3] Procesando archivos de {MATCHES_DATA_DIR.relative_to(BASE_DIR)}...")
    match_results = process_matches_data(PROJECT_OUTPUT_DIR)
    for r in match_results:
        print(f"  ✓ {r}")

    # Escribir LEEME.txt
    write_readme(PROJECT_OUTPUT_DIR)

    # [3/3] Copiar al Escritorio del usuario para máximo confort
    try:
        if DESKTOP_OUTPUT_DIR.exists():
            shutil.rmtree(DESKTOP_OUTPUT_DIR)
        shutil.copytree(PROJECT_OUTPUT_DIR, DESKTOP_OUTPUT_DIR)
        desktop_copied = True
    except Exception as e:
        desktop_copied = False
        print(f"Nota: No se pudo copiar al Escritorio: {e}")

    print("\n" + "=" * 70)
    print("¡EXPORTACIÓN FINALIZADA CON ÉXITO!")
    print("=" * 70)
    print(f"📂 Carpeta en la raíz del proyecto:\n   {PROJECT_OUTPUT_DIR}")
    if desktop_copied:
        print(f"🖥️  Carpeta directa en el Escritorio:\n   {DESKTOP_OUTPUT_DIR}")
    print("\nTotal de archivos generados:")
    total_files = len(list(PROJECT_OUTPUT_DIR.rglob("*.csv"))) + 1
    print(f"  - {total_files} archivos listos para abrir con doble clic en Excel.")
    print("=" * 70)


if __name__ == "__main__":
    main()
