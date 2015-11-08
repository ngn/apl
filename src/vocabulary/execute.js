addVocabulary({
  // ⍎'+/ 2 2 ⍴ 1 2 3 4'  ←→ 3 7
  // ⍴⍎'123 456'          ←→ ,2
  // ⍎'{⍵*2} ⍳5'          ←→ 0 1 4 9 16
  // ⍎'undefinedVariable' !!!
  // ⍎'1 2 (3'            !!!
  // ⍎123                 !!!
  '⍎':function(om,al){return al?nonceError():exec(om.toSimpleString())}
})
