const _ = require('lodash')
const boom = require('boom')
const {
  queries
} = require('../postgres')
const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

module.exports = {
  DAY,
  run,
  validate,
  flattenDate,
  latestDate
}

async function run (req, res, next) {
  const { params } = req
  const {
    from,
    until = new Date()
  } = params
  const fromDate = flattenDate(from)
  const untilDate = flattenDate(until)
  validate(fromDate, untilDate)
  const fromNum = fromDate / 1000
  const untilNum = untilDate / 1000
  const missing = await queries.findDatesBetween([fromNum, untilNum])
  console.log(missing)
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
