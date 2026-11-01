#!/usr/bin/env python3
"""Wudland icon: a hanging medieval lantern, drawn as 32x32 pixel art and written as SVG rects.
   lamp.svg       full icon (night sky, glow, lantern)
   lamp-glyph.svg lantern + glow only, transparent (splash / in-app)"""
import math

N = 32
BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
def bayer(x, y): return (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16

C = dict(
    K='#1c1420', I='#3d3044', i='#66566c', h='#8d7c90',     # iron outline / iron / lit iron / highlight
    G='#f0bd58', g='#b07a32', d='#7a4e24',                  # gold trim
    F='#fffbe8', Y='#ffe7a0', y='#ffc85e', O='#f59a3a', R='#e2602c',  # flame + glass glow
    L='#b8682a', A='#c0642a',                                            # leaded lattice on the glass
)

def lantern():
    px = {}
    cx = 15.5
    def put(x, y, c):
        if 0 <= x < N and 0 <= y < N: px[(x, y)] = c
    # ring and hook
    ring = ['..KKKK..', '.KhiiiK.', 'Kh....IK', 'Ki....IK', '.KiIIIK.', '..KKKK..']
    for j, row in enumerate(ring):
        for k, ch in enumerate(row):
            if ch != '.': put(12 + k, j, ch)
    for y in (5, 6):
        put(15, y, 'K'); put(16, y, 'K')
    # finial
    for y, hw in ((7, 1), (8, 2)):
        for x in range(N):
            if abs(x + .5 - cx) <= hw: put(x, y, 'K' if abs(x + .5 - cx) > hw - 1 else 'G')
    # roof: a trapezoid, lit on the left
    for y in range(9, 13):
        hw = 2.5 + (y - 9) * 1.6
        for x in range(N):
            dx = x + .5 - cx
            if abs(dx) <= hw:
                edge = abs(dx) > hw - 1 or y == 9
                put(x, y, 'K' if edge else ('h' if dx < -hw + 2.2 else 'i' if dx < 0 else 'I'))
    # gold band
    for x in range(N):
        dx = x + .5 - cx
        if abs(dx) <= 8.6:
            put(x, 13, 'K' if abs(dx) > 7.6 else ('G' if dx < 3 else 'g'))
    # body: posts and three glowing panes
    for y in range(14, 25):
        for x in range(N):
            dx = x + .5 - cx
            if abs(dx) > 7.6: continue
            if abs(dx) > 6.6: put(x, y, 'K'); continue
            if 5.6 < abs(dx) <= 6.6: put(x, y, 'i' if dx < 0 else 'I'); continue
            if 2.0 < abs(dx) <= 2.9: put(x, y, 'I' if dx > 0 else 'i'); continue
            # glass: brighter toward the flame
            r = math.hypot(dx * .9, (y - 19.6) * .7)
            v = 1 - r / 7.5 + (bayer(x, y) - .5) * .3
            c = 'y' if v > .55 else 'O' if v > .3 else 'A'
            # leaded diamonds on the side panes
            if abs(dx) > 2.9 and ((x + y) % 4 == 0 or (x - y) % 4 == 0): c = 'L' if c != 'Y' else 'y'
            put(x, y, c)
    # the flame in the middle pane
    for y in range(15, 24):
        for x in range(N):
            dx = x + .5 - cx
            t = (y - 15) / 8
            w = max(0, math.sin(t * math.pi * .9) * 2.0 - .1)
            if abs(dx) <= w:
                put(x, y, 'F' if abs(dx) < w * .45 and t > .3 else 'Y' if abs(dx) < w * .85 else 'R')
    put(15, 15, 'R'); put(16, 14, 'R')
    # bottom band, base, drop
    for x in range(N):
        dx = x + .5 - cx
        if abs(dx) <= 8.6: put(x, 25, 'K' if abs(dx) > 7.6 else ('G' if dx < 3 else 'g'))
    for y, hw in ((26, 6.0), (27, 4.6)):
        for x in range(N):
            dx = x + .5 - cx
            if abs(dx) <= hw: put(x, y, 'K' if abs(dx) > hw - 1 or y == 27 else ('i' if dx < 0 else 'I'))
    for y, hw in ((28, 2), (29, 1)):
        for x in range(N):
            if abs(x + .5 - cx) <= hw: put(x, y, 'K' if abs(x + .5 - cx) > hw - 1 else 'g')
    return px

def glow(x, y):
    d = math.hypot((x + .5 - 15.5) / 1.0, (y + .5 - 19.5) / 1.1)
    return max(0, 1 - d / 17)

def svg(bg):
    lamp = lantern()
    rects = []
    if bg:
        for y in range(N):
            for x in range(N):
                t = y / N
                base = (27 + 10 * t, 21 + 8 * t, 52 + 20 * t)
                g = glow(x, y)
                q = max(0, min(3, math.floor(g * 4.2 + bayer(x, y) - .5)))
                steps = [None, (64, 40, 74), (110, 58, 72), (162, 88, 64)]
                c = steps[q] if q else base
                star = (x, y) in {(3, 3), (27, 2), (6, 9), (25, 7), (2, 17), (29, 14), (4, 27), (28, 25), (22, 1)}
                rects.append((x, y, '#f6ecd0' if star and q == 0 else '#%02x%02x%02x' % tuple(int(v) for v in c)))
    else:
        for y in range(N):
            for x in range(N):
                g = glow(x, y)
                q = max(0, min(3, math.floor(g * 4.2 + bayer(x, y) - .5)))
                if q > 0 and (x, y) not in lamp:
                    rects.append((x, y, '#ffb45e', round(q * .16, 2)))
    for (x, y), k in lamp.items():
        rects.append((x, y, C[k]))
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="1024" height="1024" shape-rendering="crispEdges">']
    for r in rects:
        op = ' fill-opacity="%s"' % r[3] if len(r) > 3 else ''
        out.append('<rect x="%d" y="%d" width="1" height="1" fill="%s"%s/>' % (r[0], r[1], r[2], op))
    out.append('</svg>')
    return '\n'.join(out)

open('lamp.svg', 'w').write(svg(True))
open('lamp-glyph.svg', 'w').write(svg(False))
