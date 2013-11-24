addVocabulary

  # Decode (`⊥`)
  #
  # 10 ⊥ 3 2 6 9                        <=> 3269
  # 8 ⊥ 3 1                             <=> 25
  # 1760 3 12 ⊥ 1 2 8                   <=> 68
  # 2 2 2 ⊥ 1                           <=> 7
  # 0 20 12 4 ⊥ 2 15 6 3                <=> 2667
  # 1760 3 12 ⊥ 3 3⍴1 1 1 2 0 3 0 1 8   <=> 60 37 80
  # 60 60 ⊥ 3 13                        <=> 193
  # 0 60 ⊥ 3 13                         <=> 193
  # 60 ⊥ 3 13                           <=> 193
  # 2 ⊥ 1 0 1 0                         <=> 10
  # 2 ⊥ 1 2 3 4                         <=> 26
  # 3 ⊥ 1 2 3 4                         <=> 58
  #
  # //gives '(1j1 ⊥ 1 2 3 4) = 5j9', 1 # todo: ⊥ for complex numbers
  #
  # M ← (3 8 ⍴
  # ...                   0 0 0 0 1 1 1 1
  # ...                   0 0 1 1 0 0 1 1
  # ...                   0 1 0 1 0 1 0 1)
  # ... A ← (4 3 ⍴
  # ...                   1 1 1
  # ...                   2 2 2
  # ...                   3 3 3
  # ...                   4 4 4)
  # ... A ⊥ M
  # ...      <=> (4 8⍴
  # ...          0 1 1 2  1  2  2  3
  # ...          0 1 2 3  4  5  6  7
  # ...          0 1 3 4  9 10 12 13
  # ...          0 1 4 5 16 17 20 21)
  #
  # M ← (3 8 ⍴
  # ...          0 0 0 0 1 1 1 1
  # ...          0 0 1 1 0 0 1 1
  # ...          0 1 0 1 0 1 0 1)
  # ... 2 ⊥ M
  # ...      <=> 0 1 2 3 4 5 6 7
  #
  # M ← (3 8 ⍴
  # ...          0 0 0 0 1 1 1 1
  # ...          0 0 1 1 0 0 1 1
  # ...          0 1 0 1 0 1 0 1)
  # ... A ← 2 1 ⍴ 2 10
  # ... A ⊥ M
  # ...      <=> (2 8⍴
  # ...          0 1  2  3   4   5   6   7
  # ...          0 1 10 11 100 101 110 111)
  '⊥': (⍵, ⍺) ->
    assert ⍺
    if !⍴⍴ ⍺ then ⍺ = new APLArray [⍺.unwrap()]
    if !⍴⍴ ⍵ then ⍵ = new APLArray [⍵.unwrap()]
    lastDimA = ⍴(⍺)[⍴⍴(⍺) - 1]
    firstDimB = ⍴(⍵)[0]
    if lastDimA isnt 1 and firstDimB isnt 1 and lastDimA isnt firstDimB
      lengthError()

    a = ⍺.toArray()
    b = ⍵.toArray()
    data = []
    for i in [0 ... a.length / lastDimA]
      for j in [0 ... b.length / firstDimB]
        x = a[i * lastDimA ... (i + 1) * lastDimA]
        y = for k in [0...firstDimB] then b[j + k * (b.length / firstDimB)]
        if x.length is 1 then x = for [0...y.length] then x[0]
        if y.length is 1 then y = for [0...x.length] then y[0]
        z = y[0]
        for k in [1...y.length]
          z = z * x[k] + y[k]
        data.push z

    new APLArray data, ⍴(⍺)[...-1].concat ⍴(⍵)[1..]
