if typeof define isnt 'function' then define = require('amdefine')(module)

define (require) ->
  {exec} = require '../lib/compiler'
  {browserVocabulary} = require '../lib/browser'
  {inherit} = require '../lib/helpers'
  {format} = require '../lib/formatter'

  $.fn.toggleVisibility = ->
    @css 'visibility', if @css('visibility') is 'hidden' then '' else 'hidden'

  extractTextFromDOM = (e) ->
    if e.nodeType in [3, 4]
      e.nodeValue
    else if e.nodeType is 1
      if e.nodeName.toLowerCase() is 'br'
        '\n'
      else
        c = e.firstChild
        r = ''
        while c
          r += extractTextFromDOM c
          c = c.nextSibling
        r

  jQuery ($) ->
    setInterval (-> $('#cursor').toggleVisibility()), 500

    $('#editor').on 'mousedown touchstart mousemove touchmove', (e) ->
      e.preventDefault()
      te = e.originalEvent?.touches?[0] ? e
      x = te.pageX
      y = te.pageY

      # Find the nearest character to (x, y)
      # Compare by Δy first, then by Δx
      bestDY = bestDX = 1 / 0 # infinity
      bestXSide = 0 # 0: must use insertBefore, 1: must use insertAfter
      $bestE = null
      $('#editor span').each ->
        $e = $ @
        p = $e.position()
        x1 = p.left + $e.width() / 2
        y1 = p.top + $e.height() / 2
        dx = Math.abs(x1 - x)
        dy = Math.abs(y1 - y)
        if dy < bestDY or dy is bestDY and dx < bestDX
          $bestE = $e
          bestDX = dx
          bestDY = dy
          bestXSide = (x > x1)
        return

      if $bestE
        if bestXSide
          $('#cursor').insertAfter $bestE
        else
          $('#cursor').insertBefore $bestE

      false

    $('.key').bind 'mousedown touchstart', (event) ->
      event.preventDefault()
      $k = $ @
      $k.addClass 'down'
      if $k.hasClass 'repeatable'
        $k.data 'timeoutId', setTimeout(
          ->
            $k.data 'timeoutId', null
            $k.trigger 'aplkeypress'
            $k.data 'intervalId',
              setInterval (-> $k.trigger 'aplkeypress'), 200
            return
          500
        )
      false

    $('.key').bind 'mouseup touchend', (event) ->
      event.preventDefault()
      $k = $ @
      $k.removeClass 'down'
      clearTimeout $k.data 'timeoutId'
      $k.data 'timeoutId', null
      if (iid = $k.data 'intervalId')?
        clearInterval iid
        $k.data 'intervalId', null
      else
        $k.trigger 'aplkeypress'
      false

    layouts = [
      '1234567890qwertyuiopasdfghjklzxcvbnm'
      '!@#$%^&*()QWERTYUIOPASDFGHJKLZXCVBNM'
      '¨¯<≤=≥>≠∨∧←⍵∈⍴∼↑↓⍳○⋆⍺⌈⌊⍪∇∆∘◇⎕⊂⊃∩∪⊥⊤∣'
      '⍣[]{}«»;⍱⍲,⌽⍷\\⍉\'"⌷⍬⍟⊖+−×⍒⍋/÷⍞⌿⍀⍝.⍎⍕:'
    ]
    alt = shift = 0

    updateLayout = ->
      layout = layouts[2 * alt + shift]
      $('.keyboard .key:not(.special)').each (i) -> $(@).text layout[i]
      return

    updateLayout()

    actions =
      insert: (c) ->
        $('<span>').text(c.replace /\ /g, '\xa0').insertBefore '#cursor'
      enter: -> $('<br>').insertBefore '#cursor'
      backspace: -> $('#cursor').prev().remove()
      exec: ->
        ctx = inherit browserVocabulary
        try
          code = extractTextFromDOM(document.getElementById 'editor')
                  .replace /\xa0/g, ' '
          result = exec code
          $('#result').removeClass('error').text format result
        catch err
          console?.error?(err)
          $('#result').addClass('error').text err.message
        $('#pageInput').hide()
        $('#pageOutput').show()
        return

    $('.key:not(.special)').on 'aplkeypress', -> actions.insert $(@).text()
    $('.enter').on 'aplkeypress', actions.enter
    $('.space').on 'aplkeypress', -> $('<span>&nbsp;</span>').insertBefore '#cursor'
    $('.bksp' ).on 'aplkeypress', actions.backspace
    $('.shift').on 'aplkeypress', -> $(@).toggleClass 'isOn', (shift = 1 - shift); updateLayout()
    $('.alt'  ).on 'aplkeypress', -> $(@).toggleClass 'isOn', (alt   = 1 - alt  ); updateLayout()
    $('.exec' ).on 'aplkeypress', actions.exec

    $('body').keypress (event) ->
      if event.keyCode is 10
        actions.exec()
      else if event.keyCode is 13
        actions.enter()
      else
        actions.insert String.fromCharCode event.charCode
      false

    $('body').keydown (event) ->
      if event.keyCode is 8 then actions.backspace()
      return

    $('#closeOutputButton').bind 'mouseup touchend', (event) ->
      event.preventDefault()
      $('#pageInput').show()
      $('#pageOutput').hide()
      false

    # Bookmarkable source code
    hashParams = {}
    if location.hash
      for nameValue in location.hash.substring(1).split ','
        [name, value] = nameValue.split '='
        hashParams[name] = unescape value
    {code} = hashParams
    if code
      for c in code
        if c is '\n' then actions.enter()
        else actions.insert c
