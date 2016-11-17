# WebpackStableModuleIdAndHash

To provide stable module id and reliable content chunkhash in webpack 1.x, help u make long term cache easily.

## Usage


```
npm install webpack-stable-module-id-and-hash --save-dev

```

Then new a plugin in `plugins` webpack options, only use it in **`Production`** stage build，use OccurrenceOrderPlugin for `Development` is enough.

```
var WebpackStableModuleIdAndHash = require('webpack-stable-module-id-and-hash');
...
plugins: [
...
new WebpackStableModuleIdAndHash()
...
]
```

## Why

Here related discuss from github issue

- [Vendor chunkhash changes when app code changes · Issue #1315 · webpack/webpack](https://github.com/webpack/webpack/issues/1315)

## Target

- Every output `[chunkhash]` should be calcuated (md5) by its **dependencies module contents**.
- Every `module ID` should be stable and **only if** changes because correspond module **file path (or content)** changes.

## How

### Chunkhash

Like [webpack-md5-hash](https://github.com/erm0l0v/webpack-md5-hash)，it calcuate chunkhash by dependen module content. 

But webpack-md5-hash has a shortcoming:

Since module id is not stable, `webpack-md5-hash` sort modules by id may lead some unexpect output, e.p. `chunkhash` is not stable or same chunkhash for different content of output chunk(module id change).

### Stable Module Id

Here some option or plugins support by webpack 1.x, like [OccurrenceOrderPlugin](http://webpack.github.io/docs/list-of-plugins.html#occurrenceorderplugin), [`recordsPath`](http://webpack.github.io/docs/configuration.html#recordspath-recordsinputpath-recordsoutputpath), [DllPlugin & DllReferencePlugin
](http://webpack.github.io/docs/list-of-plugins.html#dllplugin)，they all try to give stable module id，but can not 100% fix problem or require you to check in extra files.

Webpack 2 may fix most part of them with [HashedModuleIdsPlugin](https://github.com/webpack/webpack/blob/master/lib/HashedModuleIdsPlugin.js)

Like what HashedModuleIdsPlugin to do, juse one more thing that it converts the hash to num because webpack 1.x just accept num as module id.

OMG!! Forgive my poor English. Just checkout the source code.

### Module ID collisions may cause builds to fail

This plugin calculates a predictable hash values based on the module file 
names. A hashin algorithm based on MD5 is used to calculate the hash value. 
As with any hash value, collisions are rare, but possible. In the event of a 
collision, a `webpack-stable-module-id-and-hash module id collision` error is
thrown during the Webpack build.
  
In such a situation you can try to choose a different `seed` value to get 
different module IDs that may not collide.
   
The probability of a collision depends on the `hashSize` option. By default 
53 bits are used, which allow 9007199254740992 possible module IDs. This means 
that the probability of a collision is 0.0000000000000011102% multiplied by 
the number of modules in your project.

### Options

The plugin acceps an object with these optional properties:
 
- `hashSize` = Number of bits to use for the module ID. Defaults to the 
maximum, 53 bits. Large hash sizes greatly reduce the probability of a 
collision but lead also to very large module ID numbers for the generated 
code, which might *slightly* incrase Webpack chunk sizes.
- `seed` = Any number between 0 and 31. Different "seed" values cause 
completely different module IDs. This is useful in the event of a collision. 