import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req1 = urllib.request.Request('https://crests.football-data.org/80.png', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req1, context=ctx) as r:
        with open('public/crests/espanyol.png', 'wb') as f:
            f.write(r.read())
    print("Espanyol PNG downloaded.")
except Exception as e:
    print(f"Espanyol failed: {e}")

req2 = urllib.request.Request('https://crests.football-data.org/84.png', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req2, context=ctx) as r:
        with open('public/crests/malaga.png', 'wb') as f:
            f.write(r.read())
    print("Malaga PNG downloaded.")
except Exception as e:
    print(f"Malaga failed: {e}")
