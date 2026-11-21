"""Build one offline HTML file from the static game, using only Python's stdlib."""
from base64 import b64encode
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
page = (root / "index.html").read_text()
page = page.replace('<link rel="stylesheet" href="style.css">', "<style>" + (root / "style.css").read_text() + "</style>")
page = re.sub(r'<script defer src="([\w.-]+)"></script>',
              lambda m: "<script>" + (root / m[1]).read_text() + "</script>", page)
for path in sorted((root / "assets").glob("*")):
    mime = {"png":"image/png", "webp":"image/webp"}[path.suffix[1:]]
    data = b64encode(path.read_bytes()).decode("ascii")
    page = page.replace("assets/" + path.name, f"data:{mime};base64,{data}")
(root / "play.html").write_text(page)
