import os
import json
import urllib.request
import re
import ssl

# Ensure SSL works for downloading images
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API_KEY = os.environ.get('FOOTBALL_DATA_API_KEY', '')
HEADERS = { 'X-Auth-Token': API_KEY } if API_KEY else {}

TEAMS_CSV = [
    "Alaves", "Athletic Club", "Atletico Madrid", "Barcelona", "Celta Vigo", 
    "Deportivo La Coruna", "Elche", "Espanyol", "Getafe", "Levante", 
    "Malaga", "Osasuna", "Racing Santander", "Rayo Vallecano", "Real Betis", 
    "Real Madrid", "Real Sociedad", "Sevilla", "Valencia", "Villarreal"
]

def create_slug(text):
    text = text.lower()
    text = text.replace(" ", "-")
    return text

def main():
    print("Fetching teams from football-data.org...")
    req = urllib.request.Request('http://api.football-data.org/v4/competitions/PD/teams', headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching data: {e}")
        return

    api_teams = data.get('teams', [])
    
    # Mapping based on short names / names
    team_mapping = {}
    for api_team in api_teams:
        name = api_team['name']
        short = api_team['shortName']
        crest_url = api_team['crest']
        
        # Simple mapping logic
        mapped_name = None
        for t in TEAMS_CSV:
            if t.lower() in name.lower() or t.lower() in short.lower() or short.lower() in t.lower():
                mapped_name = t
                break
        
        # Manual overrides for tricky names if needed
        if 'Deportivo La Cor' in name: mapped_name = "Deportivo La Coruna"
        elif 'Atlético' in name: mapped_name = "Atletico Madrid"
        elif 'Alavés' in name: mapped_name = "Alaves"
        elif 'Málaga' in name: mapped_name = "Malaga"
        
        if mapped_name:
            team_mapping[mapped_name] = crest_url
            
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "crests")
    os.makedirs(out_dir, exist_ok=True)
    
    crests_registry = []
    
    for team in TEAMS_CSV:
        slug = create_slug(team)
        url = team_mapping.get(team)
        
        is_placeholder = False
        filename = f"{slug}.svg"
        
        if url:
            # Try to download SVG first, fallback to PNG
            svg_url = url.replace('.png', '.svg')
            
            try:
                # Try SVG
                req_svg = urllib.request.Request(svg_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req_svg, context=ctx) as r:
                    content = r.read()
                    with open(os.path.join(out_dir, filename), 'wb') as f:
                        f.write(content)
                    final_url = svg_url
            except:
                try:
                    # Fallback PNG
                    filename = f"{slug}.png"
                    req_png = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req_png, context=ctx) as r:
                        content = r.read()
                        with open(os.path.join(out_dir, filename), 'wb') as f:
                            f.write(content)
                        final_url = url
                except Exception as e:
                    print(f"Failed to download image for {team}: {e}")
                    is_placeholder = True
        else:
            is_placeholder = True
            
        if is_placeholder:
            # Create a placeholder SVG
            filename = f"{slug}.svg"
            placeholder_svg = f'''<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="120" fill="#334155" stroke="#94a3b8" stroke-width="8"/>
    <text x="128" y="145" font-family="sans-serif" font-size="64" font-weight="bold" fill="#f8fafc" text-anchor="middle">{slug[:3].upper()}</text>
</svg>'''
            with open(os.path.join(out_dir, filename), 'w') as f:
                f.write(placeholder_svg)
            final_url = "placeholder"
            
        crests_registry.append({
            "equipo": team,
            "slug": slug,
            "archivo": f"/crests/{filename}",
            "fuente": "football-data.org" if not is_placeholder else "local",
            "url_origen": final_url,
            "requiere_atribucion": not is_placeholder,
            "terminos": "Uso gratuito para proyectos no comerciales o informativos. Requiere enlace de atribución." if not is_placeholder else "N/A",
            "is_placeholder": is_placeholder
        })
        
        print(f"Processed: {team} -> {filename}")
        
    registry_path = os.path.join(out_dir, "crests.json")
    with open(registry_path, 'w') as f:
        json.dump(crests_registry, f, indent=2)
        
    print(f"\nRegistry saved to {registry_path}")

if __name__ == '__main__':
    main()
