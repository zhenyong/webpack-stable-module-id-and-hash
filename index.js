"use strict";

var crypto = require('crypto');
var pathUtil = require('path');

var md5Cache = {}

function md5(content) {
    if (!md5Cache[content]) {
        md5Cache[content] = crypto.createHash('md5').update(content, 'utf-8').digest('hex')
    }
    return md5Cache[content];
}

function compareMod(a, b) {
    return a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0;
}

function getModSrc(module) {
    return module._source && module._source._value || '';
}

function hashToModuleId(hash, seed) {
    // Generate a 28 bit integer using a part of the MD5 hash.
    // Seed is a number 0..31 and the hash is 32 chars (nibbles) long.
    return parseInt((hash + hash).substr(seed, 7), 16);
}


function WebpackStableModuleIdAndHash(options) {
    this.options = options || {};
}

WebpackStableModuleIdAndHash.prototype.apply = function(compiler) {

    var usedIds = {};
    var context = compiler.options.context;
    var seed = (+this.options.seed || 0) % 32;

    function genModuleId(modulePath) {
        var hash = md5(modulePath);
        // generatew a 28 bit integer using a part of the MD5 hash
        var id = hashToModuleId(hash, seed);
        if (usedIds[id])
          throw new Error("webpack-stable-module-id-and-hash module id collision");
        return id
    }

    // Generate module id by md5 value of file path.

    // Since webpack 1.x can not use non-number as module id,
    // convert the md5 (hex) to unique number.

    // spooned from https://github.com/webpack/webpack/blob/master/lib/HashedModuleIdsPlugin.js
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("before-module-ids", function(modules) {
            modules.forEach(function(module) {
                if (module.libIdent && module.id === null) {
                    var modulePath = module.libIdent({
                        context: context
                    });
                    module.id = genModuleId(modulePath);
                    usedIds[module.id] = true;
                }
            });
        });
    });


    // spooned from https://github.com/erm0l0v/webpack-md5-hash
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("chunk-hash", function(chunk, chunkHash) {
            var source = chunk.modules.sort(compareMod).map(getModSrc).join('');
            chunkHash.digest = function() {
                return seed + '-' + md5(source);
            };
        });
    });

};

module.exports = WebpackStableModuleIdAndHash;
