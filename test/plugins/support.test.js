'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const Fastify = require('fastify');
const Support = require('../../plugins/support');

test('support works standalone', async (t) => {
  const fastify = Fastify();
  fastify.register(Support);

  await fastify.ready();
  assert.equal(fastify.someSupport(), 'hugs');
});
