'use strict';

var nconf = require('nconf');
var databaseName = nconf.get('database');
var winston = require('winston');

if (!databaseName) {
	winston.error(new Error('Database type not set! Run ./skybb setup'));//modified by lwf
	process.exit();
}

if (databaseName==="redis") {
	databaseName = "redisdb"
}

var primaryDB = require('./' + databaseName);

primaryDB.parseIntFields = function (data, intFields, requestedFields) {
	intFields.forEach((field) => {
		if (!requestedFields.length || requestedFields.includes(field)) {
			data[field] = parseInt(data[field], 10) || 0;
		}
	});
};

primaryDB.initSessionStore = function (ttl,callback) {
	const sessionStoreConfig = nconf.get('session_store') || nconf.get('redis') || nconf.get(databaseName);
	let sessionStoreDB = primaryDB;

	if (nconf.get('session_store')) {
		sessionStoreDB = require('./' + sessionStoreConfig.name);
	} else if (nconf.get('redis')) {
		// if redis is specified, use it as session store over others
		sessionStoreDB = require('./redisdb');
	}

	sessionStoreDB.createSessionStore(sessionStoreConfig, ttl, function (err, sessionStore) {
		if (err) {
			return callback(err);
		}
		primaryDB.sessionStore = sessionStore;
		callback();
	});
};

module.exports = primaryDB;
