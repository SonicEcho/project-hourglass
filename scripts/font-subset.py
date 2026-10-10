#!/usr/bin/env python3
"""見出しの書体（Zen Maru Gothic の太字）を、ゲームで使う文字だけに絞って woff2 にする（段階32a）。
手書き風の書体（Hachi Maru Pop。屋台めぐりの「けいかくひょう」の子どもの字。段階32b 調整3）も、同じように絞る。

使い方: pip install fonttools brotli の後に python3 scripts/font-subset.py
- 元の書体は Google Fonts のリポジトリから落とす（リポジトリには入れない。3.7MB あるため）
- 絞る文字：src/ の .ts に書かれている文字すべて＋英数字・記号＋ひらがな・カタカナの全部
- 書き出し：public/assets/fonts/heading.woff2 と、入れた文字の一覧 public/assets/fonts/heading-chars.txt
  （テスト tests/font.test.ts が、src/ に一覧にない字が増えていないかを確かめる）
- 手書き風の書体：英数字・ひらがな・カタカナ＋ src/data/daily.ts の字だけ。public/assets/fonts/hand.woff2 と hand-chars.txt
"""
import pathlib
import subprocess
import sys
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/ZenMaruGothic-Bold.ttf'
OUT = ROOT / 'public/assets/fonts/heading.woff2'
CHARS = ROOT / 'public/assets/fonts/heading-chars.txt'
HAND_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/hachimarupop/HachiMaruPop-Regular.ttf'
HAND_OUT = ROOT / 'public/assets/fonts/hand.woff2'
HAND_CHARS = ROOT / 'public/assets/fonts/hand-chars.txt'
HAND_SOURCES = [ROOT / 'src/data/daily.ts']


def wanted_chars(sources=None) -> str:
    chars = set(chr(c) for c in range(0x20, 0x7F))
    for lo, hi in [(0x3000, 0x303F), (0x3040, 0x309F), (0x30A0, 0x30FF), (0xFF01, 0xFF5E)]:
        chars.update(chr(c) for c in range(lo, hi + 1))
    for p in sources if sources is not None else (ROOT / 'src').rglob('*.ts'):
        chars.update(ch for ch in p.read_text(encoding='utf-8') if ord(ch) >= 0x80)
    # 全角の空白（U+3000）は isprintable() が False になるので、空白は別に入れる
    return ''.join(sorted(c for c in chars if c.isprintable() or c in ' \u3000'))


def subset(url: str, text: str, out: pathlib.Path, chars: pathlib.Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = pathlib.Path(tmp) / 'src.ttf'
        urllib.request.urlretrieve(url, src)
        textfile = pathlib.Path(tmp) / 'chars.txt'
        textfile.write_text(text, encoding='utf-8')
        out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [sys.executable, '-m', 'fontTools.subset', str(src), f'--text-file={textfile}', '--flavor=woff2',
             f'--output-file={out}', '--layout-features=*', '--no-hinting'],
            check=True,
        )
    chars.write_text(text, encoding='utf-8')
    print(f'{out.relative_to(ROOT)}：{len(text)} 字、{out.stat().st_size // 1024} KB')


def main() -> None:
    subset(SRC_URL, wanted_chars(), OUT, CHARS)
    subset(HAND_URL, wanted_chars(HAND_SOURCES), HAND_OUT, HAND_CHARS)


if __name__ == '__main__':
    main()
