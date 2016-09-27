Solr-Heatmap-Client [![Build Status](https://travis-ci.org/terranodo/angular-search.svg?branch=master)](https://travis-ci.org/terranodo/angular-search)
====

[AngularJS](https://angularjs.org/) + [OpenLayers 3](http://openlayers.org/) interface to query a [Apache Solr](http://lucene.apache.org/solr/) instance based on this [API](http://54.158.101.33:8080/bopws/swagger/#/default).
The Solr instance can be filtered by time, by a search term and by space.

[Solr-Heatmap-Client](http://terrestris.github.io/SolrHeatmap)

Installation
---
Be sure to have at least node version 4 installed.

You must initialize the submodule if you did not already cloned with it

`git submodule update --init`

Install dependencies with

`npm install`

Local environment:
- `npm run server`
- http://localhost:3000/index-dev.html

_Used libraries_:
* AngularJS v1.5.5
* OpenLayers 3 (v3.16.0)
* Bootstrap v3.3.4
