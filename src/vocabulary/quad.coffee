{format} = require '../formatter'

@['set_⎕'] = (x) -> console.info format(x).join '\n'
@['get_⎕'] = -> throw Error 'Not implemented'
