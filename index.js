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

function hashToModuleId(hash, seed, hashSize) {
    // Generate a unsigned integer sized <hashSize> bits using a part of the MD5
    // hash. Seed is a number 0..31 and the hash is expected to be 32 chars
    // (nibbles) long.

    // double the hash to allow overflow
    hash = hash + hash;

    // get lower and upper 28 bits
    var lsb = parseInt(hash.substr(seed, 7), 16);
    var msb = parseInt(hash.substr(seed + 7, 7), 16);

    // combine them to get the ID
    // NOTE: Logical operators only work up to 31 bits (because values will be
    // casted to 32bit signed integer), so we use classic arithmetic!
    var lsbBits = Math.min(28, hashSize);
    var msbBits = Math.max(0, hashSize - 28);
    var lsbMask = Math.pow(2, lsbBits) - 1;
    var msbMask = Math.pow(2, msbBits) - 1;
    return (lsb & lsbMask) + ((msb & msbMask) * Math.pow(2, 28));
}


function WebpackStableModuleIdAndHash(options) {
    this.options = options || {};
}

WebpackStableModuleIdAndHash.prototype.apply = function(compiler) {

    var usedIds = {};
    var context = compiler.options.context;
    var seed = (+this.options.seed || 0) % 32;
    var hashSize = (+this.options.hashSize || 53);

    if (hashSize > 53) {
        // In JavaScript, only integers up to 2^53 (exclusive) can be considered
        // safe, see http://www.2ality.com/2013/10/safe-integers.html
        throw new Error("hashSize too large");
    }

    function genModuleId(modulePath) {
        // remove node modules version and loader querys
        // because querys may contains local path.
        modulePath = modulePath.split('!').map(function(i){
            return i.replace(/\/(\.\d+)+?@/g, '/@').replace(/\?.*?$/i, '');
        }).join('!');

        var hash = md5(modulePath);
        // generate a 28 bit integer using a part of the MD5 hash
        var id = hashToModuleId(hash, seed, hashSize);
        if (usedIds.hasOwnProperty(id) && usedIds[id] !== modulePath)
          throw new Error("webpack-stable-module-id-and-hash module id collision");
        return id
    }

    // Generate module id by md5 value of file path.

    // Since webpack 1.x can not use a non-number as a module id,
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
                    usedIds[module.id] = modulePath;
                }
            });
        });
    });


    // spooned from https://github.com/erm0l0v/webpack-md5-hash
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("chunk-hash", function(chunk, chunkHash) {
            var source = chunk.modules.sort(compareMod).map(getModSrc).join('');
            chunkHash.digest = function() {
                return seed + '-' + hashSize + '-' + md5(source);
            };
        });
    });

};

module.exports = WebpackStableModuleIdAndHash;
