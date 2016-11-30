var ldnode = require('../')
var supertest = require('supertest')
var assert = require('chai').assert
var path = require('path')

// Helper functions for the FS
var rm = require('./test-utils').rm
var write = require('./test-utils').write
// var cp = require('./test-utils').cp
var read = require('./test-utils').read

describe('PATCH', function () {
  // Starting LDP
  var ldp = ldnode({
    root: path.join(__dirname, '/resources/sampleContainer'),
    mount: '/test'
  })
  var server = supertest(ldp)

  it.skip('..................', function (done) {
    rm('sampleContainer/notExisting.ttl')
    server.patch('/notExisting.ttl')
      .set('content-type', 'application/sparql-update')
      .send('INSERT DATA { :test  :hello 456 .}')
      .expect(200)
      .end(function (err, res, body) {
        if (err){
          done(err)
        }
        console.log('@@@@ ' + read('sampleContainer/notExisting.ttl'))
        assert.equal(
          read('sampleContainer/notExisting.ttl'), ''
        )
        rm('sampleContainer/notExisting.ttl')
        done(err)
      })
  })

  describe('DELETE', function () {
    it('reproduce index 1 bug from pad', function (done) {
      var expected = '@prefix dc: <http://purl.org/dc/elements/1.1/>.\n@prefix meeting: <http://www.w3.org/ns/pim/meeting#>.\n@prefix card: <https://www.w3.org/People/Berners-Lee/card#>.\n@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.\n@prefix p: <http://www.w3.org/ns/pim/pad#>.\n@prefix in: </parent/index.ttl#>.\n@prefix n: <http://rdfs.org/sioc/ns#>.\n@prefix flow: <http://www.w3.org/2005/01/wf/flow#>.\n@prefix ic: <http://www.w3.org/2002/12/cal/ical#>.\n@prefix ui: <http://www.w3.org/ns/ui#>.\n\n<#this>\n    dc:author\n       card:i;\n    dc:created\n       "2016-10-25T15:44:42Z"^^xsd:dateTime;\n    dc:title\n       "Shared Notes";\n    a    p:Notepad;\n    p:next\n       <#id1477502276660>.\n   in:this flow:participation <#id1477522707481>; meeting:sharedNotes <#this> .\n   <#id1477502276660> dc:author card:i; n:content ""; p:next <#this> .\n<#id1477522707481>\n    ic:dtstart\n       "2016-10-26T22:58:27Z"^^xsd:dateTime;\n    flow:participant\n       card:i;\n    ui:backgroundColor\n       "#c1d0c8".\n'

      write(`\n\

        @prefix dc: <http://purl.org/dc/elements/1.1/>.
    @prefix meeting: <http://www.w3.org/ns/pim/meeting#>.
    @prefix card: <https://www.w3.org/People/Berners-Lee/card#>.
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
    @prefix p: <http://www.w3.org/ns/pim/pad#>.
    @prefix in: </parent/index.ttl#>.
    @prefix n: <http://rdfs.org/sioc/ns#>.
    @prefix flow: <http://www.w3.org/2005/01/wf/flow#>.
    @prefix ic: <http://www.w3.org/2002/12/cal/ical#>.
    @prefix ui: <http://www.w3.org/ns/ui#>.

    <#this>
        dc:author
           card:i;
        dc:created
           "2016-10-25T15:44:42Z"^^xsd:dateTime;
        dc:title
           "Shared Notes";
        a    p:Notepad;
        p:next
           <#id1477502276660>.
       in:this flow:participation <#id1477522707481>; meeting:sharedNotes <#this> .
       <#id1477502276660> dc:author card:i; n:content ""; p:indent 1; p:next <#this> .
    <#id1477522707481>
        ic:dtstart
           "2016-10-26T22:58:27Z"^^xsd:dateTime;
        flow:participant
           card:i;
        ui:backgroundColor
           "#c1d0c8".\n`,
        'sampleContainer/existingTriple.ttl')

      server.post('/existingTriple.ttl')
        .set('content-type', 'application/sparql-update')
        .send('DELETE {  <#id1477502276660>  <http://www.w3.org/ns/pim/pad#indent> 1 .}')
        .expect(200)
        .end(function (err, res, body) {
          assert.equal(
            read('sampleContainer/existingTriple.ttl'),
            expected)
          rm('sampleContainer/existingTriple.ttl')
          done(err)
        })
    })
  })

  describe('DELETE and INSERT', function () {
    it('should be update a resource using SPARQL-query using `prefix`', function (done) {
      write(
        '@prefix schema: <http://schema.org/> .\n' +
        '@prefix profile: <http://ogp.me/ns/profile#> .\n' +
        '# <http://example.com/timbl#> a schema:Person ;\n' +
        '<#> a schema:Person ;\n' +
        '  profile:first_name "Tim" .\n',
        'sampleContainer/prefixSparql.ttl')
      server.post('/prefixSparql.ttl')
        .set('content-type', 'application/sparql-update')
        .send('@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n' +
          '@prefix schema: <http://schema.org/> .\n' +
          '@prefix profile: <http://ogp.me/ns/profile#> .\n' +
          '@prefix ex: <http://example.org/vocab#> .\n' +
          'DELETE { <#> profile:first_name "Tim" }\n' +
          'INSERT { <#> profile:first_name "Timothy" }')
        .expect(200)
        .end(function (err, res, body) {
          assert.equal(
            read('sampleContainer/prefixSparql.ttl'),
            '@prefix schema: <http://schema.org/>.\n' +
            '@prefix profile: <http://ogp.me/ns/profile#>.\n' +
            '\n' +
            '   <#> profile:first_name "Timothy"; a schema:Person .\n')
          rm('sampleContainer/prefixSparql.ttl')
          done(err)
        })
    })
  })

  describe('INSERT', function () {
    it('should add a new triple', function (done) {
      write(
        '<#current> <#temp> 123 .',
        'sampleContainer/addingTriple.ttl')
      server.post('/addingTriple.ttl')
        .set('content-type', 'application/sparql-update')
        .send('INSERT DATA { :test  :hello 456 .}')
        .expect(200)
        .end(function (err, res, body) {
          assert.equal(
            read('sampleContainer/addingTriple.ttl'),
            '\n' +
            '   <#current> <#temp> 123 .\n' +
            '   <#test> <#hello> 456 .\n')
          rm('sampleContainer/addingTriple.ttl')
          done(err)
        })
    })

    it('should add value to existing triple', function (done) {
      write(
        '<#current> <#temp> 123 .',
        'sampleContainer/addingTripleValue.ttl')
      server.post('/addingTripleValue.ttl')
        .set('content-type', 'application/sparql-update')
        .send('INSERT DATA { :current  :temp 456 .}')
        .expect(200)
        .end(function (err, res, body) {
          assert.equal(
            read('sampleContainer/addingTripleValue.ttl'),
            '\n' +
            '   <#current> <#temp> 123, 456 .\n')
          rm('sampleContainer/addingTripleValue.ttl')
          done(err)
        })
    })

    it('should add value to same subject', function (done) {
      write(
        '<#current> <#temp> 123 .',
        'sampleContainer/addingTripleSubj.ttl')
      server.post('/addingTripleSubj.ttl')
        .set('content-type', 'application/sparql-update')
        .send('INSERT DATA { :current  :temp2 456 .}')
        .expect(200)
        .end(function (err, res, body) {
          assert.equal(
            read('sampleContainer/addingTripleSubj.ttl'),
            '\n' +
            '   <#current> <#temp2> 456; <#temp> 123 .\n')
          rm('sampleContainer/addingTripleSubj.ttl')
          done(err)
        })
    })
  })

  it('nothing should change with empty patch', function (done) {
    write(
      '<#current> <#temp> 123 .',
      'sampleContainer/emptyExample.ttl')
    server.post('/emptyExample.ttl')
      .set('content-type', 'application/sparql-update')
      .send('')
      .expect(200)
      .end(function (err, res, body) {
        assert.equal(
          read('sampleContainer/emptyExample.ttl'),
          '\n' +
          '   <#current> <#temp> 123 .\n')
        rm('sampleContainer/emptyExample.ttl')
        done(err)
      })
  })
})
