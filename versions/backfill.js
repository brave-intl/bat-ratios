const _ = require('lodash')
const boom = require('boom')
const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

module.exports = {
  DAY,
  validate,
  flattenDate,
  latestDate
}

function validate (_from, _until) {
  const from = new Date(_from)
  const until = new Date(_until)
  const today = +flattenDate(new Date())
  const key = _.findKey({
    'invalid from date pattern': () => _.isNaN(+from),
    'invalid until date pattern': () => _.isNaN(+until),
    'from date cannot be today': () => +from === today,
    'until date cannot be today': () => +until === today,
    'from date must be less than or equal to until date': () => from > until,
    'from date cannot be today or later': () => from > today,
    'until date cannot be today or later': () => until > today
  }, (fn) => fn())
  if (key) {
    throw boom.badData(key)
  }
}

function flattenDate (date) {
  const d = new Date(date)
  const flattened = d - (d % DAY)
  return new Date(flattened)
}

function latestDate () {
  return flattenDate(new Date()) - (DAY / 2)
}
