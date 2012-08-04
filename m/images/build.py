#!/usr/bin/env python3

from subprocess import call

n = 8 # number of icons in the sprite
w = h = 18 # size of an icon
for i in range(n):
    call([
        'inkscape', 'symbols.svg',
        '-e', 'apl%d.png' % i,
        '-a', '%d:%d:%d:%d' % (i * w, 0, (i + 1) * w, h)
    ])

with open('symbols.css', 'w') as f:
    for i in range(n):
        f.write('.ui-icon-apl%d { background-image: url("apl%d.png"); }' % (i, i))
