const _ = require('lodash')
module.exports = _.assign(Documentation, {
  baseRoute,
  currencyParam,
  groupParam,
  makeWrappedProperties
})

const responseProperties = ['lastUpdated', 'payload']
const auth = {
  in: 'header',
  name: 'Authorization',
  required: true,
  description: 'An Authorization Header',
  default: 'Bearer foobarfoobar',
  type: 'string'
}

Documentation.prototype = {
  baseRoute,
  currencyParam,
  groupParam,
  makeWrappedProperties,
  toJSON: function () {
    return this.state
  },
  document: function (route, method, options) {
    const { paths, definitions } = this.state
    const { [route]: path = {} } = paths
    paths[route] = path
    path[method] = baseRoute(options)
    _.assign(definitions, options.definitions)
  }
}

function Documentation (options) {
  if (!(this instanceof Documentation)) {
    return new Documentation(...arguments)
  }
  this.state = _.extend({
    swagger: '2.0.0',
    info: {
      description: 'A ratio converter',
      version: '1.0.0',
      title: 'Bat-Ratios',
      contact: {
        email: 'mmclaughlin@brave.com'
      }
    },
    schemes: ['http', 'https'],
    tags: [{
      name: 'ratios',
      description: 'Converts currencies'
    }, {
      name: 'rates',
      description: 'Previously supported endpoints of all rates'
    }],
    paths: {},
    definitions: {}
  }, options)
}

function baseRoute ({
  tags = [],
  summary,
  description,
  parameters = [],
  responses
}) {
  return {
    tags: [].concat(tags),
    summary,
    description,
    parameters: [auth].concat(parameters),
    responses
  }
}

function currencyParam (name, defaultValue) {
  return {
    in: 'path',
    name,
    required: true,
    allowEmptyValue: false,
    schema: {
      default: defaultValue,
      type: 'string'
    }
  }
}

function groupParam (name, defaultValue) {
  return {
    name,
    in: 'path',
    required: true,
    allowEmptyValue: false,
    schema: {
      default: defaultValue,
      type: 'string',
      enum: ['fiat', 'alt']
    }
  }
}

function makeWrappedProperties (appendage) {
  return {
    type: 'object',
    required: responseProperties,
    properties: {
      value: appendage,
      lastUpdated: {
        type: 'string',
        format: 'date-time'
      }
    }
  }
}
