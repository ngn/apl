# Simplest solution I can think of:
@exports = {} # shared for all modules
@require = -> @exports # always return the same instance
# (If two modules export the same symbol, they will step on each other's toes.)
