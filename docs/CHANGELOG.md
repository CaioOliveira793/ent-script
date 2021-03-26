# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.1-beta.5](https://github.com/CaioOliveira793/ent-script/compare/v0.1.1-beta.4...v0.1.1-beta.5) (2021-03-26)

### [0.1.1-beta.4](https://github.com/CaioOliveira793/ent-script/compare/v0.1.1-beta.3...v0.1.1-beta.4) (2021-01-03)


### Bug Fixes

* fetch all repository history to create changelog ([0fcdb2f](https://github.com/CaioOliveira793/ent-script/commit/0fcdb2ff4a21ce81a9408497bf943c317b15287f))

### 0.1.1-beta.3 (2021-01-03)

### 0.1.1-beta.2 (2020-12-06)

## 0.1.0 (2020-12-05)


### Features

* add component property types ([19525e1](https://github.com/CaioOliveira793/ent-script/commit/19525e104e9fe66a8a762caa44dab8085ef4255e))
* add method getEntityComponentCount ([8ebb04d](https://github.com/CaioOliveira793/ent-script/commit/8ebb04dbaa7fc5dc80e2365e4746f89c98695bfe))
* add method removeAllComponents ([20538f7](https://github.com/CaioOliveira793/ent-script/commit/20538f7ffce9abce2c382040837be4b7815ed92d))
* add method to clear one type of component ([e205127](https://github.com/CaioOliveira793/ent-script/commit/e20512708940c90c919852a9315e4927a6ab3eba))
* add method to iterate over entities that has a list of components ([150f048](https://github.com/CaioOliveira793/ent-script/commit/150f048310638c18b4d8dadd3051318d452a028e))
* add method to return iterator from component buffer ([87f7306](https://github.com/CaioOliveira793/ent-script/commit/87f7306ab4e2c654df918c02893675961d23854d))
* add pool settings based on component ([bc60bda](https://github.com/CaioOliveira793/ent-script/commit/bc60bda93460e5f22ab45f1580965c77cf8f2100))
* add Registry method to return component data ([dc591ba](https://github.com/CaioOliveira793/ent-script/commit/dc591babb966df650a22f6322a966b22c6c9b0ac))
* add Storage pools of components ([d9967cf](https://github.com/CaioOliveira793/ent-script/commit/d9967cf4b81e2156c8b7c1151e16f3be606e7c6d))
* create and destroy entities ([b025391](https://github.com/CaioOliveira793/ent-script/commit/b025391e814156e72deeda0d482c5234165460f0))
* dynamic Pool buffers ([#6](https://github.com/CaioOliveira793/ent-script/issues/6)) ([64d078f](https://github.com/CaioOliveira793/ent-script/commit/64d078ffc522e917c6a89c6e50137ce4c268787f))
* insert components in entities ([b55fb7c](https://github.com/CaioOliveira793/ent-script/commit/b55fb7cb441a35f659b66ba78eea4b8439662286))
* maps properties types ([9dc2b10](https://github.com/CaioOliveira793/ent-script/commit/9dc2b10dd40c893072e8b48074fcf583238023aa))
* maps properties types of inserted components ([6ad3106](https://github.com/CaioOliveira793/ent-script/commit/6ad3106aae5f9509d2c2ef88c6a62ad6e02208dd))
* remove components ([7e4821e](https://github.com/CaioOliveira793/ent-script/commit/7e4821e5762c99eaac38574a6b4d62c0e2467ff4))
* remove components when destroying entities ([2593ed4](https://github.com/CaioOliveira793/ent-script/commit/2593ed422701a8efd736e73e9832e498eb9953af))
* retrieve the component reference ([99573db](https://github.com/CaioOliveira793/ent-script/commit/99573dbff430341e6e706ef6168724bfee1baaaf))
* return a component reference when insert in the entity ([b929a53](https://github.com/CaioOliveira793/ent-script/commit/b929a536426377ce0c98987fc1f08ae6b2da3cad))
* use free pool section to insert new components ([78a9e41](https://github.com/CaioOliveira793/ent-script/commit/78a9e4122d608fe9a108d6cba42c75191ef5969a))
* verify component existence inside entity ([201e1e2](https://github.com/CaioOliveira793/ent-script/commit/201e1e27d4f6a7686825acad3bb505b605b70f9b))


### Bug Fixes

* ci workflow ([f0d9cab](https://github.com/CaioOliveira793/ent-script/commit/f0d9cab3261dc07cdb51ec9b27fb45bd01ad6a9e))
* component mask creation ([dc6b7d3](https://github.com/CaioOliveira793/ent-script/commit/dc6b7d33e7901c20e87ca5c0d54d4c2bee7f7b3d))
* increase the used pool size when new components are inserted ([8c6bd41](https://github.com/CaioOliveira793/ent-script/commit/8c6bd41e1fea771f521046b2d4eb930862489282))
* use the architecture endianness ([dc4e822](https://github.com/CaioOliveira793/ent-script/commit/dc4e82250b4c4012b3a2da9037a268e6e5fa259c))


### Performance

* create baseSectionReference once and only update poolView ([07b0fa2](https://github.com/CaioOliveira793/ent-script/commit/07b0fa2afce8b927effef76d257dfd898edde0e0))
