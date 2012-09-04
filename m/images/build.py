#!/usr/bin/env python

from subprocess import call
#from PIL import Image

## size of an icon
#w = h = 18

#call(['inkscape', 'symbols.svg', '-e', 'symbols.png'])
#im = Image.open('symbols.png')
#cols = im.size[0] // w
#rows = im.size[1] // h

#for i in range(rows * cols):
#    r = i // cols
#    c = i % cols
#    x0 = c * w
#    y0 = r * h
#    x1 = x0 + w
#    y1 = y0 + h
#    im.crop((x0, y0, x1, y1)).save('apl%d.png' % i, 'PNG')

#with open('symbols.css', 'w') as f:
#    for i in range(rows * cols):
#        f.write('.ui-icon-apl%d { background-image: url("apl%d.png"); }\n' % (i, i))

call(['inkscape', 'cursor.svg', '-e', 'cursor.png'])
call(['inkscape', 'button-lock-light.svg', '-e', 'button-lock-light.png'])
