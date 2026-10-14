import os
import sys
import pandas as pd
import numpy as np

CACHE_DIR = os.path.join(os.path.dirname(__file__), "data", "cache")
os.environ["SOCCERDATA_DIR"] = CACHE_DIR
import soccerdata as sd

CSV_FILE = os.path.join(os.path.dirname(__file__), "data", "partidos.csv")

def main():
    print("Loading schedule from Understat...")
    us = sd.Understat(leagues="ESP-La Liga", seasons="2026")
    schedule = us.read_schedule()
    
    # Sort by date
    schedule.sort_values(by="date", inplace=True)
    
    existing_data = {}
    if os.path.exists(CSV_FILE):
        try:
            df_exist = pd.read_csv(CSV_FILE, dtype={'match_id': str})
            for _, row in df_exist.iterrows():
                existing_data[str(row["match_id"])] = {
                    "jornada": row["jornada"],
                    "notas": row.get("notas", "")
                }
        except Exception as e:
            print(f"Error reading existing CSV: {e}")
            
    source_has_matchday = "matchday" in schedule.columns
    
    output_rows = []
    
    # To infer matchdays we need to track how many games each team has played
    team_games_played = {}
    
    for idx, (index_tuple, row) in enumerate(schedule.iterrows()):
        match_id = str(row["game_id"])
        
        home = row["home_team"]
        away = row["away_team"]
        
        # Infer matchday if not existing
        team_games_played[home] = team_games_played.get(home, 0) + 1
        team_games_played[away] = team_games_played.get(away, 0) + 1
        
        inferred_matchday = max(team_games_played[home], team_games_played[away])
        
        jornada_fuente = row["matchday"] if source_has_matchday else ""
        
        jornada_val = ""
        notas_val = ""
        
        if match_id in existing_data:
            jornada_val = existing_data[match_id]["jornada"]
            if pd.isna(jornada_val): jornada_val = ""
            notas_val = existing_data[match_id]["notas"]
            if pd.isna(notas_val): notas_val = ""
        else:
            if source_has_matchday and pd.notnull(row["matchday"]):
                jornada_val = int(row["matchday"])
            else:
                jornada_val = inferred_matchday
                
        estado = "jugado" if row["is_result"] else "pendiente"
        # Optional: we can't easily detect 'aplazado' just from Understat without the original schedule, so we just use jugado/pendiente
        
        output_rows.append({
            "match_id": match_id,
            "jornada": jornada_val,
            "fecha": str(row["date"]),
            "local": home,
            "visitante": away,
            "goles_local": row.get("home_goals", ""),
            "goles_visitante": row.get("away_goals", ""),
            "xg_local": row.get("home_xg", ""),
            "xg_visitante": row.get("away_xg", ""),
            "estado": estado,
            "jornada_fuente": jornada_fuente,
            "revisar": False,
            "notas": notas_val
        })
        
    df_out = pd.DataFrame(output_rows)
    
    # Validations
    jornadas_problemas = set()
    incomplete_jornadas = []
    
    # 1. Team has > 38 matches
    team_counts = {}
    for _, r in df_out.iterrows():
        team_counts[r["local"]] = team_counts.get(r["local"], 0) + 1
        team_counts[r["visitante"]] = team_counts.get(r["visitante"], 0) + 1
        
    teams_over_38 = [t for t, c in team_counts.items() if c > 38]
    
    # Group by jornada
    jornada_groups = {}
    for i, r in df_out.iterrows():
        j = r["jornada"]
        if j not in jornada_groups:
            jornada_groups[j] = []
        jornada_groups[j].append(i)
        
    for j, indices in jornada_groups.items():
        if pd.isna(j) or j == "": continue
        
        matches_in_j = df_out.loc[indices]
        
        # Check > 10 matches
        if len(matches_in_j) > 10:
            df_out.loc[indices, "revisar"] = True
            jornadas_problemas.add(j)
            
        # Check duplicate teams
        teams_in_j = list(matches_in_j["local"]) + list(matches_in_j["visitante"])
        if len(teams_in_j) != len(set(teams_in_j)):
            df_out.loc[indices, "revisar"] = True
            jornadas_problemas.add(j)
            
        # If teams have > 38 matches, mark those rows
        for i in indices:
            r = df_out.loc[i]
            if r["local"] in teams_over_38 or r["visitante"] in teams_over_38:
                df_out.at[i, "revisar"] = True
                
        # Check < 10 matches (only count as incomplete if it's not a future matchday, but for simplicity we check if any are played)
        # The prompt says "Una jornada con menos de 10 partidos jugados no es un error, pero imprimela en consola como incompleta."
        jugados = matches_in_j[matches_in_j["estado"] == "jugado"]
        if len(jugados) < 10 and len(jugados) > 0:
            incomplete_jornadas.append((j, len(jugados)))
            
    # Save CSV
    df_out.to_csv(CSV_FILE, index=False)
    
    # Summary
    total_matches = len(df_out)
    jugados = len(df_out[df_out["estado"] == "jugado"])
    pendientes = total_matches - jugados
    
    print("\n--- RESUMEN ---")
    print(f"Partidos totales: {total_matches}")
    print(f"Jugados: {jugados}")
    print(f"Pendientes: {pendientes}")
    
    if source_has_matchday:
        print("La fuente TRAÍA la jornada oficial en sus datos.")
    else:
        print("La fuente NO traía la jornada oficial. Se ha inferido por orden cronológico.")
        
    if jornadas_problemas:
        print(f"Jornadas con problemas (marcadas revisar=TRUE): {sorted(list(jornadas_problemas))}")
    else:
        print("No hay jornadas con problemas (revisar=TRUE).")
        
    if teams_over_38:
        print(f"Equipos con más de 38 partidos: {teams_over_38}")
        
    for j, count in sorted(incomplete_jornadas, key=lambda x: int(float(x[0])) if str(x[0]).replace('.','',1).isdigit() else 0):
        print(f"Jornada {j} incompleta: {count} partidos jugados.")

if __name__ == "__main__":
    main()
