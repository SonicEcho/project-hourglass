"""立ち絵を、画面に出す大きさに縮める（段階251。2026-11-17）。

使い方: python3 scripts/shrink_portraits.py
  public/assets/portraits/*.webp のうち、縦が HEIGHT より大きい絵を、元の大きさのまま art/portraits_full/ に残してから、
  縦 HEIGHT に縮めて上書きする。まばたき・口パクの元の絵（*_src.webp）は画面で使わないので、縮めない。
  何度走らせてもよい（縮めた絵は、もう一度は縮めない）。新しい立ち絵を入れたら、背景を抜いた後に走らせる。
  まばたき・口パクの部品は scripts/portrait_parts.py が art/portraits_full/ の元の絵から作り、同じ大きさに縮める。
なぜ：画面でいちばん大きく出るのは高精細のスマホで縦1350ほど。元の縦1536 のままだと、展開した絵でメモリが足りなくなっていた
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public/assets/portraits"
FULL = ROOT / "art/portraits_full"
HEIGHT = 1100


def shrink(path: Path) -> bool:
    im = Image.open(path)
    if im.height <= HEIGHT:
        return False
    FULL.mkdir(parents=True, exist_ok=True)
    keep = FULL / path.name
    if not keep.exists():
        keep.write_bytes(path.read_bytes())
    w = round(im.width * HEIGHT / im.height)
    im.convert("RGBA").resize((w, HEIGHT), Image.LANCZOS).save(path, "WEBP", quality=88, method=6)
    return True


if __name__ == "__main__":
    n = sum(shrink(p) for p in sorted(PUBLIC.glob("*.webp")) if not p.stem.endswith("_src"))
    print(f"縮めた立ち絵：{n} 枚（元の絵は {FULL.relative_to(ROOT)}）")
