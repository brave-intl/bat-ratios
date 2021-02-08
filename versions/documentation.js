const _ = require('lodash')
const {
  LOCAL
} = require('$/env')
module.exports = _.assign(Documentation, {
  baseRoute,
  currencyParam,
  groupParam,
  dateParam,
  makeWrappedProperties
})

const schemes = LOCAL ? ['http'] : ['https']

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
  param: {
    date: dateParam,
    group: groupParam,
    currency: currencyParam
  },
  query: {
    list: listQuery
  },
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
    schemes,
    tags: [{
      name: 'history',
      description: 'Get previous daily prices. Previous prices available 12hrs after midnight for timezone +0.'
    }, {
      name: 'ratios',
      description: 'Converts currencies'
    }, {
      name: 'rates',
      description: 'Previously supported endpoints of all rates'
    }, {
      name: 'util',
      description: 'Utility endpoints for adjusting the server state'
    }, {
      name: 'supported',
      description: 'The keys currencies supported'
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

function listQuery (name) {
  return {
    name,
    in: 'query',
    required: false,
    allowEmptyValue: true,
    type: 'array',
    items: {
      type: 'string'
    }
  }
}

function dateParam (name, extension = {}) {
  return Object.assign({
    name,
    in: 'path',
    required: true,
    allowEmptyValue: true,
    schema: {
      oneOf: [{
        type: 'string',
        format: 'date'
      }, {
        type: 'integer'
      }]
    }
  }, extension)
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
