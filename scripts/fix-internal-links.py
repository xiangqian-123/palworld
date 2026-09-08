#!/usr/bin/env python3
"""
fix-internal-links.py —— 把 content/guides/<locale>/ 下 MDX 里写死的 /zh-CN/ 内链替换成对应语言。

用法：
    python fix-internal-links.py            # 处理 en/ja/ru/de（默认）
    python fix-internal-links.py en ja      # 只处理指定语言

背景：翻译 agent 被要求「内链 URL 原样保留」，所以翻译完成后统一用本脚本把
`/zh-CN/guide/xxx` → `/<locale>/guide/xxx`，避免逐篇手工改。
"""
import os
import sys

BASE = os.path.join("content", "guides")
DEFAULT_LOCALES = ["en", "ja", "ru", "de"]


def main(locales):
    total = 0
    for loc in locales:
        d = os.path.join(BASE, loc)
        if not os.path.isdir(d):
            print(f"跳过（目录不存在）: {d}")
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith(".mdx"):
                continue
            p = os.path.join(d, f)
            s = open(p, encoding="utf-8").read()
            s2 = s.replace("/zh-CN/", f"/{loc}/")
            if s2 != s:
                open(p, "w", encoding="utf-8").write(s2)
                total += 1
                print(f"  已改 {p}")
    print(f"\n共修复 {total} 个文件")


if __name__ == "__main__":
    locs = sys.argv[1:] if len(sys.argv) > 1 else DEFAULT_LOCALES
    main(locs)
