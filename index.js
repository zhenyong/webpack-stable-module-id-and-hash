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

function hexToNum(str) {
    str = str.toUpperCase();
    var code = ''
    for (var i = 0, len = str.length; i < len; i++) {
        var c = str.charCodeAt(i) + '';
        if ((c + '').length < 2) {
            c = '0' + c
        }
        code += c
    }
    return parseInt(code, 10);
}


function WebpackStableModuleIdAndHash(options) {
    this.options = options || {};
}

WebpackStableModuleIdAndHash.prototype.apply = function(compiler) {

    var usedIds = {};
    var context = compiler.options.context;

    function genModuleId(modulePath) {
        var id = md5(modulePath);
        var len = 4;
        while (usedIds[id.substr(0, len)]) {
            len++;
        }
        id = id.substr(0, len);
        return hexToNum(id)
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
                return md5(source);
            };
        });
    });

};

module.exports = WebpackStableModuleIdAndHash;
