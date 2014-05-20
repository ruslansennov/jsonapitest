var assert = require('assert'),
    util = require('../lib/util'),
    response = require('../lib/response');

var res = {
  status: 201,
  headers: {
    "Content-Type": "application/json",
    "Location": "http://example.com/users/2"
  },
  body: {
    user: {
      id: 2,
      name: "Joe"
    }
  }
};

describe('response', function() {
  describe('select', function() {
    it('returns a value from the response given a key', function() {
      assert.deepEqual(response.select(res, {select: 'body.user'}), {id: 2, name: "Joe"});
      assert.equal(response.select(res, {select: 'body.user.id'}), 2);
      assert.equal(response.select(res, {select: 'body.user.name'}), 'Joe');
      assert.equal(response.select(res, {select: 'headers.Location'}), "http://example.com/users/2");

      assert.equal(response.select(res, {select: 'body.user.foo'}), null);
      assert.equal(response.select(res, {select: 'foo'}), null);
    });

    it('returns a value from the response given a key and a regexp pattern', function() {
      assert.equal(response.select(res, {select: 'headers.Location', pattern: "(\\d+)$"}), "2");
      assert.equal(response.select(res, {select: 'headers.Location', pattern: "example\\.com"}), "example.com");
      
      assert.equal(response.select(res, {select: 'headers.Location', pattern: "foobar"}), null);
      assert.equal(response.select(res, {select: 'foobar', pattern: "foobar"}), null);
    });
  });

  describe('save', function() {
    it('saves selected values into the data with certain keys', function() {
      var data = {},
          options = {"user.new": {select: "body.user.id"}};
      response.save(options, res, data);
      assert.deepEqual(data, {"user": {"new": 2}})
    });

    it('overwrites existing data value', function() {
      var data = {"user": {"new": "foobar"}},
          options = {"user.new": {select: "body.user.id"}};
      response.save(options, res, data);
      assert.deepEqual(data, {"user": {"new": 2}})      
    });

    it('writes null if selector doesnt match', function() {
      var data = {},
          options = {"user.new": {select: "foobar"}};
      response.save(options, res, data);
      assert.deepEqual(data, {"user": {"new": null}})
    });

    it('can save multiple values', function() {
      var data = {},
          options = {
            "user.new.name": {select: "body.user.name"},
            "user.new.id": {select: "headers.Location", pattern: "(\\d+)$"}
          };
      response.save(options, res, data);
      assert.deepEqual(data, {"user": {"new": {id: "2", name: "Joe"}}})
    });
  });

  describe('assert', function() {
    it('can check equality for multiple keys on a selector', function() {
      // One or more primitive values
      assert.deepEqual(response.assert({select: 'body.user', equal: {id: 2, name: 'Joe'}}, res), []);
      assert.deepEqual(response.assert({select: 'body.user', equal: {id: 1, name: 'Joe'}}, res),
        [{type: 'equal', select: 'body.user', key: 'id', expected: 1, actual: 2}]);
      assert.deepEqual(response.assert({select: 'body.user', equal: {id: 1, name: 'Peter'}}, res),
        [{type: 'equal', select: 'body.user', key: 'id', expected: 1, actual: 2}, {type: 'equal', select: 'body.user', key: 'name', expected: 'Peter', actual: 'Joe'}]);            

      // object value
      assert.deepEqual(response.assert({select: 'body', equal: {user: {id: 2, name: 'Joe'}}}, res), []);
      assert.deepEqual(response.assert({select: 'body', equal: {user: {id: 1, name: 'Joe'}}}, res),
        [{type: 'equal', select: 'body', key: 'user', expected: {id: 1, name: 'Joe'}, actual: {id: 2, name: 'Joe'}}]);
    });

    it('can validate against a schema', function() {
      var schema1 = {
        type: "object",
        properties: {
          id: {type: "integer"},
          name: {type: "string"}
        },
        required: ["id", "name"],
        additionalProperties: false
      },
      res1 = {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Location": "http://example.com/users/2"
        },
        body: {
          user: {
            id: 2,
            name: "Joe"
          }
        }
      },
      res2 = {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Location": "http://example.com/users/2"
        },
        body: {
          user: {
            foo: 2,
            name: "Joe"
          }
        }
      },
      result = null;

      // no errors
      assert.deepEqual(response.assert({select: 'body.user', schema: schema1}, res1), []);
      assert.deepEqual(response.assert({select: 'body.user', schema: schema1, equal: {id: 2}}, res1), []);
      assert.deepEqual(response.assert({select: 'status', schema: {type: "integer"}}, res1), []);

      // schema doesn't match
      result = response.assert({select: 'body.user', schema: schema1}, res2);
      assert.equal(result.length, 1);
      assert.equal(result[0].type, 'schema');
      assert(result[0].errors);

      // equals check doesn't match
      result = response.assert({select: 'body.user', schema: schema1, equal: {id: 9}}, res1);
      assert.equal(result.length, 1);
      assert.equal(result[0].type, 'equal');

      // schema and equals both don't match
      result = response.assert({select: 'body.user', schema: schema1, equal: {name: 'Peter'}}, res2);
      assert.equal(result.length, 2);
      assert.equal(result[0].type, 'schema');
      assert(result[0].errors);
      assert.deepEqual(result[1], {type: 'equal', select: 'body.user', key: 'name', expected: 'Peter', actual: 'Joe'});
    });
  });

  describe('assertAll', function() {
    it('collects results from multiple assertions plus the status assertion', function() {
      // TODO
    });
  });

  describe('process', function() {
    it('invokes save and assertAll', function() {
      // TODO
    });    
  });
});
