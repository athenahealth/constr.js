[![Build Status](https://travis-ci.org/athenahealth/constr.js.svg?branch=master)](https://travis-ci.org/athenahealth/constr.js)

# constr.js

A set of tools to facilitate object-oriented JavaScript programming, supporting both inheritance and composition.

Although much of the functionality provided in this libary is superceded by the `class` functionality of ECMAScript 6, those who do not have the luxury of working in ECMAScript 6 may find this library useful.

## Usage

constr.js is made available as a [UMD](https://github.com/umdjs/umd). When in the context of neither AMD nor CommonJS, the module will exist in the global namespace as the object `Constr`.

## API

### create(options)

Creates a constructor function.

#### options.enableExtend

A boolean. When `true`, applies `enableExtend` on the created constructor. Defaults to `true`.

#### options.enableRoles

A boolean. When `true`, applies `enableRoles` on the created constructor. Defaults to `true`.

#### options.body

A function. Optional. The created constructor will pass its arguments to this body and execute it, where `this` is the newly constructed object, returning its results if any.

#### options.proto

An Object. Optional. The created constructor will have this object as its `prototype`.

#### options.instanceMembers

An Object. Optional. This object's properties will be copied onto the created constructor's properties. If `proto` is specified, the properties will be copied onto `proto`.

#### options.staticMembers

An Object. Optional. This object's properties will be copied onto the created constructor.

### createRole(prototypeProperties)

Creates a role (extends the base role) with the given object's properties copied onto the role's `prototype`.

### debounce(method, delay)

Given a method and a delay, returns a debounced version of the method that will wait delay number of milliseconds before executing.

When a debounced method for a particular object is invoked, and then invoked again for the same object within the delay period, the first invocation will not execute, and the next invocation will delay the full delay period before executing, unless interrupted by another invocation, and so forth. 

The debounced method will also have a `cancel` method, which will cancel any pending invocations.

Calling a debounced method for one object has no effect on the invocation for that same debounced method for a different object. This is a notable difference from [Underscore's debounce](http://underscorejs.org/#debounce).

### enableExtend(constructor)

Attaches an `extend` method to a constructor. `extend` is a way of establishing inheritance hierarchies of constructors and their prototypes, maintaining the correct `prototype` chain from a constructor all the way up to through its ancestors. Returns the constructor.

`extend` optionally takes 2 Objects as its arguments. It returns a constructor that is a 'child' of the given constructor. The first argument's properties are copied onto the 'child' constructor's `prototype`, and this `prototype`'s protototype is the given constructor's `prototype`. The given constructor's 'static members' (properties) are also copied onto the 'child' constructor, and subsequently the properties of the second argument to `extend` are also copied onto the 'child' constructor as 'static members', possibly overriding ones that already exist. The 'child' constructor will inherit the given constructor's `extend` and (if applicable) `include` methods, so 'child' constructors can be likewise extended, and so forth, and each subsequent 'descendent' constructor will have a `prototype` chain that correctly leads up to through all the ancestor constructors to the original constructor on which `enableExtend` was invoked. Every 'descendent' constructor will execute the original constructor on the newly constructed object.

### enableInclude(constructor)

Attaches an `include` method to a constructor, enabling a sort of 'mixin' functionality. Returns the constructor.

`include` takes 0 or more roles as its arguments. A role is a special type of constructor with a `prototype` chain which instantiates a role API object. (There is actually nothing really special about a role -- it is just an empty constructor function with a `prototype` -- except that every role has a unique id used to cache the corresponding role API objects so that they do not have to be repeatedly constructed.) `include` first `extend`s the given constructor, and then copies each member of each of the given roles' API objects onto the 'child' constructor's `prototype`. This composed 'child' constructor is returned, if there are no naming conflicts between the different roles' members. (Otherwise, an error is thrown.)

`role` returns the base role, which has an `extend` and `include` method. One can also create a role with `createRole`, which simply returns an extension of the base role.

### once(method)

Takes a method as its argument and returns a version of it that only executes once per object it is attached to, where subsequent invocations will have no effect, immediately returning the same value as that of the initial invocation. 

Similar to [Underscore's once function](http://underscorejs.org/#once), but with Underscore, `once` returns a function that only executes once ever, regardless of the object it is attached to.

### memoize(method[, hasher])

Returns a memoized version of the given method. The method's result is cached in the object that the method is attached to, where the cache key is the result of the given hasher method (which is given the method's arguments and `this` is set to the object the method is attached to). If no hasher method is given, a default hasher function is used, which simply uses the first argument of the method invocation. 

Similar to [Underscore's memoize function](http://underscorejs.org/#memoize), except that with Underscore, `memoize` does not utilize the attached object as its cache store, so when two objects share the same Underscore memoized method, they also share the same cached values of that method.

### role()

Returns the base role.

### throttle(method[, interval])

Given a method and an interval (in milliseconds), returns a throttled version of the method. The method will execute at most once in the given interval for the object the method is attached to, even if it is invoked more times in that period. When a method is invoked more than once during the interval, at the end of the interval, the latest invocation of that interval will be executed. The throttling of a method for one object has no effect on the throttling of that method for another object. This is a notable difference from [Underscore's throttle](http://underscorejs.org/#throttle).

## Author

Raymond Lam (rlam@athenahealth.com)

## License

MIT
