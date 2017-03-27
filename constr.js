//     constr.js
//     https://github.com/athenahealth/constr.js
//     (c) 2015 athenahealth, Inc.
//
//     Author: Raymond Lam (rlam@athenahealth.com)
//
//     constr.js may be freely distributed under the MIT license

(function(root, factory) { "use strict";

  // If we are in an AMD environment, use define.
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  }
  // CommonJS style export.
  else if (typeof exports === 'object') {
    factory(exports);
  }
  // Else, just declare a public plain object called 'Constructor'.
  else {
    factory(root.Constr = {});
  }

})(this, function(exports) { "use strict";
  var roleCache = {};
  
  // Helper function. Copies all the properties from source to target.
  // Optionally pass into the args object an 'exclude' array, which
  // is an array of property names not to copy from source.
  // Returns the target.
  function extend(target, source, args) {
    var exclude = {};
    
    if (args && args.exclude) {
      for (var i = 0; i < args.exclude.length; ++i) {
        exclude[args.exclude[i]] = true;
      }
    }

    for (var prop in source) {
      if (!args || !exclude.hasOwnProperty(prop)) {
        target[prop] = source[prop];
      }
    }

    return target;
  }

  // Helper function. Returns an integer that is one more than the previous
  // integer it returned. The first integer it returns is 0.
  var sequence = (function() {
    var _sequence = 0;
    
    return function() {
      return _sequence++;
    };
  })();

  // Helper function that is also exported. As an argument takes a function that
  // is to be attached to an object. Returns a function that will at most only
  // be executed once per object that the function is attached to. Subsequent
  // invocations of the function will immediately return the same value as the
  // first invocation, per object. (This is different from Underscore's once
  // function, which returns a function that is only ever executed once ever,
  // regardless of the particular object.)
  function once(func) {
    
    // Identify each 'once' function uniquely.
    var methodID = sequence();

    return function() {
      var obj = this;

      // Provide a place in 'this' to store the result of the first invocation
      // of the method.
      if (!obj._once) {
        obj._once = {};
      }

      // If this is the first time this method is invoked for this object,
      // invoke the original function and store the result.
      if (!obj._once[methodID]) {
        obj._once[methodID] = {
          value: func.apply(obj, arguments)
        };
      }

      // Return the stored result, which will be the one that we just got, or
      // the one from the first invocation.
      return obj._once[methodID].value;
    };
  }

  // Public function. Takes a plain object of arguments and returns a
  // constructor. The arguments are:
  //   body            - A function that is to be executed as the body of the 
  //                     returned constructor.
  //   proto           - The prototype to attach to the returned constructor.
  //   instanceMembers - A object whose attributes will be copied to the
  //                     prototype
  //   staticMembers   - A object whose attributes will be copied to the
  //                     constructor.
  //   enableExtend    - If true, .enableExtend() will be applied to the
  //                     returned constructor. True by default.
  //   enableRoles     - If true, .enableRoles() will be applied to the returned
  //                     constructor. True by default.
  exports.create = function(args) {
    var api = this;

    args = args || {};

    var NewConstructor;

    // If we are supplied with a body, the returned constructor will simply
    // execute it. If we are not suppled with a body, the constructor will be
    // an empty function.
    if (args.body) {
      NewConstructor = function() {
        return args.body.apply(this, arguments);
      };
    }
    else {
      NewConstructor = function() {};
    }

    if (args.proto) {
      NewConstructor.prototype = args.proto;
    }

    if (args.instanceMembers) {
      extend(NewConstructor.prototype, args.instanceMembers);
    }

    if (args.staticMembers) {
      extend(NewConstructor, args.staticMembers);
    }

    // enableExtend is to be true by default.
    if (!('enableExtend' in args) || args.enableExtend) {
      api.enableExtend(NewConstructor);
    }

    // enableRoles is to be true by default.
    if (!('enableRoles' in args) || args.enableRoles) {
      api.enableRoles(NewConstructor);
    }
 
    return NewConstructor;

  },

  // Public function. Given a prototype for a new role, creates and returns that
  // role.
  exports.createRole = function(prototypeProperties) {
    var api = this;
    return api.role().extend(prototypeProperties);
  };

  // Public function. Given a constructor function, attaches to it an .extend()
  // method. Returns the constructor function.
  exports.enableExtend = function(BaseConstructor) {
    var api = this;

    // Returns a constructor that is a 'child' of the given constructor. The
    // 'child' constructor has a prototype chain that correctly runs from the
    // 'child' constructor's prototype through the given constructor's
    // prototype, through its parents' prototypes. .extend() takes two plain
    // objects as arguments. The properties of the first argument are copied
    // onto the 'child' constructor's prototype. The properties of the second
    // argument are copied onto the child constructor itself (useful for
    // defining non-instance methods).
    BaseConstructor.extend = function(prototypeProperties, functionProperties) {
      var ParentConstructor = this;

      // The base constructor should always be run, unless we are supplied with
      // an alternative constructor
      var ExtendedConstructor = (
        prototypeProperties 
        && prototypeProperties.hasOwnProperty('constructor')
      )
        ? prototypeProperties.constructor
        : function() {
          BaseConstructor.apply(this, arguments);
        }
      ;
      
      // We want to set up the prototype chain without actually running the
      // original constructor, so create a constructor for what is to be
      // the prototype. This constructor will copy to itself the passed in
      // prototypeProperties, if applicable.
      var ExtendedPrototype = prototypeProperties
        ? function() {
          extend(this, prototypeProperties);
        }
        : function() {}
      ;

      // Set up the prototype chain.
      ExtendedPrototype.prototype = ParentConstructor.prototype;

      // Create the new prototype. The prototype chain is correctly set up.
      ExtendedConstructor.prototype = new ExtendedPrototype();
      
      // Be sure the objects created from the extended constructor always point
      // back to the constructor.
      ExtendedConstructor.prototype.constructor = ExtendedConstructor;

      // Copy non-instance properties to the new constructor, as appropriate.
      // Don't copy 'prototype' because it is special.
      extend(ExtendedConstructor, ParentConstructor, { exclude: ['prototype'] });
      
      if (functionProperties) {
        extend(ExtendedConstructor, functionProperties, { exclude: ['prototype'] });
      }

      // Add a __super__ static member which points to the parent's prototype
      ExtendedConstructor.__super__ = ParentConstructor.prototype;
      return ExtendedConstructor;
    };

    return BaseConstructor;

  },

  // Public function. Given a constructor function, attaches a .include() method.
  // Returns the constructor function.
  exports.enableRoles = function (BaseConstructor) {
    // Takes as its arguments a one or more Roles (not an array of Roles).
    // Returns a constructor that is a 'child' of the given constructor. The
    // 'child' constructor has a prototype chain that correctly runs from the
    // 'child' constructor's prototype through the given constructor's
    // prototype, through its parents' prototypes. The Role's prototypes will
    // be included in the 'child' constructor's prototype.
    BaseConstructor.include = function () {
      var NewConstructor = this.extend();
    
      var badCollisions = [];
    
      for (var i = 0; i < arguments.length; i++) {
        var Role = arguments[i];
        var roleAPI;

        // No need to instantiate the role's API more than once.
        if (roleCache.hasOwnProperty(Role._roleID)) {
          roleAPI = roleCache[Role._roleID];
        }
        else {
          roleAPI = new Role();
          roleCache[Role._roleID] = roleAPI;
        }
    
        for (var name in roleAPI) {
          // don't mess with the constructor pointer
          if (name === 'constructor') {
            continue;
          }
          // if we haven't encountered name in the include loop yet, then we are
          // safe to include it. Also, if we have encountered name, and it is
          // the same thing as what we've already encountered, then it is
          // also safe to include
          else if (
            !(NewConstructor.prototype.hasOwnProperty(name))
            || NewConstructor.prototype[name] === roleAPI[name]
          ) {
            NewConstructor.prototype[name] = roleAPI[name];
          }
          // track fatal name collisions
          else {
            badCollisions.push(name);
          }
        }
      }

      // If there are name collisions, we cannot continue.
      if (badCollisions.length) {
        throw new Error('The following members of the included roles cause name collisions: ' + badCollisions.join(', '));
      }
      else {
        return NewConstructor;
      }
    };

    return BaseConstructor;
  },

  // Public function. Returns the base Role.
  exports.role = once(function() {
    var api = this;
    var Role = api.create();

    // Be sure that the base Role and every other role that inherits from it has
    // a unique identifier, for caching.
    Role._roleID = sequence();
    Role.extend = (function(extendRole) {
      return function() {
        var ExtendedRole = extendRole.apply(this, arguments);
        ExtendedRole._roleID = sequence();
        return ExtendedRole;
      };
    })(Role.extend);
    return Role;
  });

  // once is a public function.
  exports.once = once;

  // Public function. Given a method and a delay, returns a debounced version
  // of the method that will wait delay number of milliseconds before executing.
  // When a debounced method for a particular object is invoked, and then invoked
  // again for the same object within the delay period, the first invocation will
  // not execute, and the next invocation will delay the full delay period before
  // executing. Calling a debounced method for one object has no effect on the
  // debounced method invocation for a different object. (This is the notable 
  // difference from Underscore's debounce.)
  exports.debounce = function(func, delay) {
    var methodID = sequence();

    function debouncedFunction() {
      var obj = this;
      var args = arguments;

      // Track pending invocations per object.
      if (!obj.hasOwnProperty('_debounce')) {
        obj._debounce = {};
      }

      // Every method has its own sequence.
      if (!obj._debounce.hasOwnProperty(methodID)) {
        obj._debounce[methodID] = 0;
      }

      // Every invocation advances the sequence.
      ++obj._debounce[methodID];

      // Wait delay number of milliseconds, and if this particular invocation
      // of the debounced method is by then still the most recent one, go
      // ahead and execute the function.
      (function(seq) {
        setTimeout(function() {
          if (seq === obj._debounce[methodID]) {
            func.apply(obj, args);
          }
        }, delay);
      })(obj._debounce[methodID]);
    
    
      // Provide a cancel function, which will cancel all pending
      // invocations of this method.
      debouncedFunction.cancel = debouncedFunction.cancel || function() {
          // None of the pending invocations will have this sequence.
          ++obj._debounce[methodID];
      };
    }
        
    return debouncedFunction;
  };

  // Public function. Given a method and an interval (in milliseconds), returns
  // a throttled version of the method. The method will execute at most once in
  // the given interval for instance the method is attached to, even if it is
  // invoked more times in that period. When a method is invoked more than
  // during the interval, at the end of the interval, the latest invocation
  // of that interval will be executed. The throttling of a method for one
  // object has no effect on the throttling of that method for another
  // object. (This is the notable difference from Underscore's throttle.)
  exports.throttle = function(func, interval) {
    var methodID = sequence();

    return function() {
      if (!this.hasOwnProperty('_throttle')) {
        this._throttle = {};
      }
      
      // Executes func and tracks the timestamp.
      function exec() {
        this._throttle[methodID] = {
          previous: (new Date()).getTime()
        };
        func.apply(this, arguments);
      }

      if (this._throttle.hasOwnProperty(methodID)) {
        // Calculate how much time is left in the current interval before we can
        // execute again. Negative remaining means we are already outside the
        // interval and can execute.
        var remaining = interval - ((new Date()).getTime() - this._throttle[methodID].previous);
        
        if (remaining > 0) {
          // The invocation that will be executed is always the latest one in
          // the interval, so always save the arguments.
          this._throttle[methodID].pendingArguments = arguments;
          
          // If we aren't already waiting to execute...
          if (!this._throttle[methodID].pending) {
            this._throttle[methodID].pending = true;
            
            // Wait for as much time as is remaining in the interval,
            // and then execute the invocation using the latest arguments.
            var obj = this;
            setTimeout(function() {
              exec.apply(obj, obj._throttle[methodID].pendingArguments);
            }, remaining);
          }
        }
        else {
          exec.apply(this, arguments);
        }
      }
      else {
        // If this is the first time we've ever invoked the method on this
        // instance, just go ahead and execute it.
        exec.apply(this, arguments);
      }
    };
  };

  // Public function. Given a method and optionally a hashing method, returns
  // a memoized version of the function. Results are cached in the object, as
  // opposed to Underscore's memoize, where results are cached globally.
  exports.memoize = function(func, hasher) {
    var methodID = sequence();

    return function() {
      var hashKey = (hasher
        ? hasher.apply(this, arguments)
        : arguments[0]
      );

      if (!this.hasOwnProperty('_memoized')) {
        this._memoized = {};
      }
      if (!this._memoized.hasOwnProperty(methodID)) {
        this._memoized[methodID] = {};
      }

      if (!this._memoized[methodID].hasOwnProperty(hashKey)) {
        this._memoized[methodID][hashKey] = func.apply(this, arguments);
      }

      return this._memoized[methodID][hashKey];
    };
  };

});
