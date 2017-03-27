QUnit.test("create", function(assert) { "use strict";
  assert.expect(49);

  var C0 = function() {};
  assert.strictEqual(Constr.enableExtend(C0), C0, '.enableExtend() returns constructor it was given');

  C0 = Constr.create();
  
  assert.ok(C0.extend, 'has .extend() method by default');
  assert.ok(C0.include, 'has .include() method by default');

  C0 = Constr.create({ enableExtend: true });
  assert.ok(C0.extend, 'has .extend() method if enableExtend');
  assert.ok(C0.include, 'has .include() method by default when enableExtend');
  
  C0 = Constr.create({ enableRoles: true });
  assert.ok(C0.extend, 'has .extend() method by default when enableRoles');
  assert.ok(C0.include, 'has .include() method when enableRoles');

  C0 = Constr.create({ enableExtend: false });
  assert.notOk(C0.extend, 'does not have .extend() method if enableExtend is set as false');
  assert.ok(C0.include, 'has .include() method by default when enableExtend is set as false');
  
  C0 = Constr.create({ enableRoles: false });
  assert.ok(C0.extend, 'has .extend() method by default when enableRoles is set to false');
  assert.notOk(C0.include, 'does not have .include() method when enableRoles is set to false');

  var instanceMember = {};

  C0 = Constr.create({
    instanceMembers: {
      instanceMember: instanceMember
    }
  });

  assert.strictEqual(C0.prototype.instanceMember, instanceMember, 'instanceMembers are copied onto the prototype');
  
  var obj = new C0();
  assert.strictEqual(obj.constructor, C0, "when proto is not specified, object's constructor property is the constructor");

  var proto = {};

  C0 = Constr.create({
    proto: proto,
    instanceMembers: {
      instanceMember: instanceMember
    }
  });

  assert.strictEqual(C0.prototype.instanceMember, proto.instanceMember, 'instanceMembers are copied onto the prototype, even when the prototype is specified');

  /**********/

  var count = 0;
  var args;
  proto = {
    test0: function() { return 't0'; },
    test1: function() { return 't1'; }
  };

  var staticMembers = {
    static0: function() { return 's0' },
    static1: function() { return 's1' }
  };

  C0 = Constr.create({
    proto: proto,
    staticMembers: staticMembers,
    body: function() {
      ++count;
      args = Array.prototype.slice.apply(arguments);
    }
  });

  assert.strictEqual(C0.prototype, proto, 'prototype is attached to constructor');
  assert.ok(C0.static0 === staticMembers.static0 && C0.static1 === staticMembers.static1, 'static members are attached to constructor');

  obj = new C0('foo', 'bar');
  assert.strictEqual(count, 1, 'body is executed when object is constructed');
  assert.deepEqual(args, ['foo', 'bar'], 'arguments correctly passed to body');

  var C1 = C0.extend({
    test1: function() { return 't11'; },
    test2: function() { return 't22'; }
  }, {
    static1: function() { return 's11'; },
    static2: function() { return 's22'; }
  });

  assert.strictEqual(Object.getPrototypeOf(C1.prototype), proto, 'prototype chain is maintained on first extension');
  obj = new C1();

  assert.strictEqual(count, 2, 'body is executed when extended constructor is executed');
  assert.strictEqual(obj.test0(), 't0', 'object method is not overridden when not meant to be overridden');
  assert.strictEqual(obj.test1(), 't11', 'object method is overridden when supposed to be overridden');
  assert.strictEqual(obj.test2(), 't22', 'object method is added in extended prototype');
  assert.strictEqual(C1.static0(), 's0', 'static method is not overridden when not meant to be overridden');
  assert.strictEqual(C1.static1(), 's11', 'static method is overridden when supposed to be overridden');
  assert.strictEqual(C1.static2(), 's22', 'static method is added in extended prototype');
  assert.strictEqual(C0.static1(), 's1', 'static method does not override that of the parent constructor');
  assert.notOk(C0.static2, 'static method is not added to parent constructor');
  assert.strictEqual(obj.constructor, C1, 'object has a constructor property that is the extended constructor');

  var C2 = C1.extend({
    test2: function() { return 't222'; },
    test3: function() { return 't333'; }
  }, {
    static2: function() { return 's222'; },
    static3: function() { return 's333'; }
  });

  assert.ok(Object.getPrototypeOf(C2.prototype) === C1.prototype && Object.getPrototypeOf(Object.getPrototypeOf(C2.prototype)) === proto, 'prototype chain is maintained on second extension');
  obj = new C2();

  assert.strictEqual(count, 3, 'body is executed when extended extended constructor is executed');
  assert.ok(obj.test0() === 't0' && obj.test1() === 't11', 'object method is not overridden when not meant to be overriddeni on second extension');
  assert.strictEqual(obj.test2(), 't222', 'object method is overridden when supposed to be overridden on second extension');
  assert.strictEqual(obj.test3(), 't333', 'object method is added in extended prototype on second extension');
  assert.ok(C2.static0() === 's0' && C2.static1() === 's11', 'static method is not overridden when not meant to be overriddeni on second extension');
  assert.strictEqual(C2.static2(), 's222', 'static method is overridden when supposed to be overridden on second extension');
  assert.strictEqual(C2.static3(), 's333', 'static method is added in extended prototype on second extension');
  assert.strictEqual(obj.constructor, C2, 'object has a constructor property that is the extended extended constructor');

  assert.ok(C2.__super__ === C1.prototype && C1.__super__ === C0.prototype, '__super__ of extended constructor is parent constructor');

  assert.ok(obj instanceof C2, 'object is instanceof its constructor');
  assert.ok(obj instanceof C1, 'object is instanceof the parent of the constructor');
  assert.ok(obj instanceof C0, 'object is instanceof of the base constructor');
  assert.ok(!(obj instanceof Constr.create()), 'object is not instance of arbitrary constructor');

  /**********/

  var fn = function() { 
    assert.ok(true, 'when extending with a specified constructor, that constructor is executed when object is instantiated'); 
  };
  
  C0 = Constr.create({
    proto: {
      test0: function() { return 't0'; }	  
    }
  });

  C1 = C0.extend({
    constructor: fn,
    test1: function() { return 't11'; }
  });

  assert.strictEqual(C1, fn, 'when a constructor is extended and a constructor property is specified in the extension, the returned constructor is the constructor property');
  
  obj = new C1();

  assert.strictEqual(obj.test1(), 't11', 'object has method specified in the extension when the extension has a constructor property');
  assert.strictEqual(obj.test0(), 't0', 'object has method inherited from base constructor when the extension has a constructor property');
  
  assert.ok(Object.getPrototypeOf(obj) === C1.prototype && Object.getPrototypeOf(Object.getPrototypeOf(obj)) === C0.prototype, 'prototype chain is maintained when extension has constructor property');
  
  /**********/

  var ret = {};
  C0 = Constr.create({ body: function() { return ret; } });
  assert.strictEqual(new C0(), ret, 'return of body is respected');
});

QUnit.test("Utilities", function(assert) { "use strict";
  assert.expect(41);

  var ready = assert.async();

  var debounceCount = 0;
  var debounceTestObj0 = {
    id: 0,
    debouncedMethod: Constr.debounce(function() {
      var key = Object.keys(this._debounce)[0];
      if (this._debounce[key] < 51) {
        ++debounceCount;
        assert.equal(this._debounce[key], 50, 'debounce, rapid invocation, only final invocation is executed (object #' + this.id + ')');
      }
      else {
        assert.ok(true, 'debounce, delayed invocation executes (object #' + this.id + ')');
      }
    }, 500)
  };

  var i;
  for (i = 0; i < 50; ++i) {
    debounceTestObj0.debouncedMethod();
  }

  setTimeout(function() {
    debounceTestObj0.debouncedMethod();
  }, 700);

  var debounceTestObj1 = {
    id: 1,
    debouncedMethod: debounceTestObj0.debouncedMethod
  };

  for (i = 0; i < 50; ++i) {
    debounceTestObj1.debouncedMethod();
  }

  setTimeout(function() {
    debounceTestObj1.debouncedMethod();
  }, 700);

  var debounceWasRun = 0;
  var debounceTestObj2 = {
    debouncedMethod: Constr.debounce(function() {
      ++debounceWasRun;
    }, 500)
  };

  for (i = 0; i < 10; i++) {
    debounceTestObj2.debouncedMethod();
  }
  debounceTestObj2.debouncedMethod.cancel();

  setTimeout(function() {
    assert.ok(!debounceWasRun, 'debounce, canceled debounce was not run');
  
    for (var j = 0; j < 10; ++j) {
      debounceTestObj2.debouncedMethod();
    }

    setTimeout(function() {
      assert.strictEqual(debounceWasRun, 1, 'debounce, invocations of debounced method after cancellation work correctly');
    }, 1000)
  }, 1000);

  /**********/
  var obj;

  var onceCount = 0;
  var onceTestObj0 = {
    onceMethod: Constr.once(function(i) {
      obj = this;
      ++onceCount;
      return {};
    })
  }

  var result0 = onceTestObj0.onceMethod();
  assert.strictEqual(onceTestObj0.onceMethod(), result0, 'once, same value is always returned per object');
  assert.strictEqual(obj, onceTestObj0, 'once, correct value for this');

  for (i = 0; i < 50; ++i) {
    onceTestObj0.onceMethod();
  }

  assert.strictEqual(onceCount, 1, 'once, method only executed once per object');

  var onceTestObj1 = {
    onceMethod: onceTestObj0.onceMethod
  };

  assert.notStrictEqual(onceTestObj1.onceMethod(), result0, 'once, if method was executed on one object, when invoked on a different object, different result');
  assert.strictEqual(onceCount, 2, 'once, if method was executed on one object, it will execute on the other');
  assert.strictEqual(obj, onceTestObj1, 'once, correct object for this when called for a different object');

  var result1 = onceTestObj1.onceMethod();
  assert.strictEqual(onceTestObj1.onceMethod(), result1, 'once, method executed more than once on second object returns the same result');
  assert.strictEqual(onceCount, 2, 'once, method executes on second object only once');

  /**********/

  var memoizeCount = 0;

  var memoizeTestObj0 = {
    memoizedMethod: Constr.memoize(function(str) {
      obj = this;
      ++memoizeCount;
      return str + '!';
    })
  };

  var result = memoizeTestObj0.memoizedMethod('foo');
  assert.strictEqual(obj, memoizeTestObj0, 'memoize, correct value for this');
  assert.strictEqual(result, 'foo!', 'memoize, correct value is returned when memoized method is called for the first time');
  assert.strictEqual(memoizeTestObj0.memoizedMethod('foo'), result, 'memoize, if a method called on an arg the second time returns the value as that of the first call');
  assert.strictEqual(memoizeCount, 1, 'memoize, if a memoized method is called on the same argument twice, the method is only executed once');

  var memoizeTestObj1 = {
    memoizedMethod: memoizeTestObj0.memoizedMethod
  };

  assert.strictEqual(memoizeTestObj1.memoizedMethod('foo'), 'foo!', 'memoize, correct value is returned when memoized method is called for the first time for a different object');
  assert.strictEqual(obj, memoizeTestObj1, 'memoize, correct value for this when called for a different object');
  assert.strictEqual(memoizeCount, 2, 'memoize, method is executed when memoized method is called for a second object');
  
  memoizeTestObj1.memoizedMethod('foo');

  assert.strictEqual(memoizeCount, 2, 'memoize, if a memoized method is called on the same argument twice for a second object, the method is only executed once');

  assert.strictEqual(memoizeTestObj1.memoizedMethod('bar'), 'bar!', 'memoize, correct value is returned when memoized method is called on a different argument');
  assert.strictEqual(memoizeCount, 3, 'memoize, method is executed when memoized methoid is called on a different argument');

  memoizeCount = 0;

  memoizeTestObj0 = {
    memoizedMethod: Constr.memoize(function(str0, str1) {
      ++memoizeCount;
      return str0 + str1;
    }, function(str0, str1) {
      obj = this;
      return str0 + '::' + str1;
    })
  };

  result = memoizeTestObj0.memoizedMethod('foo', 'bar');
  assert.strictEqual(obj, memoizeTestObj0, 'memozie with hasher, correct value for this in hasher');
  assert.strictEqual(result, 'foobar', 'memoize with hasher, correct value is returned when memoized method is called for the first time');
  assert.strictEqual(memoizeTestObj0.memoizedMethod('foo', 'bar'), result, 'memoize with hasher, if a method called on an arg the second time returns the value as that of the first call');
  assert.strictEqual(memoizeCount, 1, 'memoize with hasher, if a memoized method is called on the same argument twice, the method is only executed once');

  var otherMemoziedMethodExecuted;
  var memoizeTestObj1 = {
    memoizedMethod: memoizeTestObj0.memoizedMethod,
    otherMemoizedMethod: Constr.memoize(function(val) {
      otherMemoziedMethodExecuted = true;
      return val + 'bar';
    })
  };

  assert.strictEqual(memoizeTestObj1.memoizedMethod('foo', 'bar'), 'foobar', 'memoize with hasher, correct value is returned when memoized method is called for the first time for a different object');
  assert.strictEqual(obj, memoizeTestObj1, 'memozie with hasher, correct value for this in hasher when called for a different object.');
  assert.strictEqual(result, 'foobar', 'memoize with hasher, correct value is returned when memoized method is called for the first time');
  assert.strictEqual(memoizeCount, 2, 'memoize with hasher, method is executed when memoized method is called for a second object');
  
  memoizeTestObj1.memoizedMethod('foo', 'bar');

  assert.strictEqual(memoizeCount, 2, 'memoize with hasher, if a memoized method is called on the same argument twice for a second object, the method is only executed once');

  assert.strictEqual(memoizeTestObj1.memoizedMethod('foo', 'baz'), 'foobaz', 'memoize with hasher, correct value is returned when memoized method is called on a different argument');
  assert.strictEqual(memoizeCount, 3, 'memoize with hasher, method is executed when memoized methoid is called on a different argument');

  memoizeTestObj1.otherMemoizedMethod('foo', 'baz');
  otherMemoziedMethodExecuted = false;
  memoizeTestObj1.memoizedMethod('foo', 'baz');
  assert.ok(memoizeTestObj1.otherMemoizedMethod('foo', 'baz') === 'foobar' &&  memoizeTestObj1.memoizedMethod('foo', 'baz') === 'foobaz' && memoizeCount == 3 && otherMemoziedMethodExecuted === false, 'memoization of one method does not interfere with memoization of another method');
  
  memoizeCount = 0;
  
  memoizeTestObj0 = {
    memoizedMethod: Constr.memoize(function(str0, str1) {
      ++memoizeCount;
      return str0 + str1;
    }, function(str0) {
      return str0;
    })
  };

  result = memoizeTestObj0.memoizedMethod('foo', 'bar');
  assert.strictEqual(result, memoizeTestObj0.memoizedMethod('foo', 'baz') , 'memoize with hasher which ignores one of the arguments, correct value is returned when memoized method is called for the second time with ignored argument changed');
  assert.strictEqual(memoizeCount, 1, 'memoize with hasher which ignores one of the arguments, method is called once when memoized method is called a second time with only the ignored argument changed');
  
  /**********/

  
  var throttleTestObj0 = {
    throttleMethod0Results: [],
    throttledMethod0: Constr.throttle(function(value) {
      this.throttleMethod0Results.push(value);
    }, 500)
  };

  throttleTestObj0.throttledMethod0(0);
  setTimeout(function() { throttleTestObj0.throttledMethod0(1) }, 100);
  setTimeout(function() { throttleTestObj0.throttledMethod0(2) }, 200);
  setTimeout(function() { throttleTestObj0.throttledMethod0(3) }, 300);
  setTimeout(function() { throttleTestObj0.throttledMethod0(4) }, 400);
  setTimeout(function() { throttleTestObj0.throttledMethod0(6) }, 600);
  setTimeout(function() { throttleTestObj0.throttledMethod0(7) }, 700);
  setTimeout(function() { throttleTestObj0.throttledMethod0(16) }, 1600);
  setTimeout(function() { assert.deepEqual(throttleTestObj0.throttleMethod0Results, [0, 4, 7, 16], 'when throttled method is invoked multiple times within given interval, first invocation and latest invocation within the interval are executed, and after the interval, invocation is executed'); }, 1700);

  var throttleTestObj1 = {
    throttleMethod0Results: [],
    throttledMethod0: throttleTestObj0.throttledMethod0,
    throttleMethod1Results: [],
    throttledMethod1: Constr.throttle(function(value) {
      this.throttleMethod1Results.push(value);
    }, 500)
  };
  
  throttleTestObj1.throttledMethod0(0);
  setTimeout(function() { throttleTestObj1.throttledMethod0(1) }, 100);
  setTimeout(function() { throttleTestObj1.throttledMethod0(2) }, 200);
  setTimeout(function() { throttleTestObj1.throttledMethod0(3) }, 300);
  setTimeout(function() { throttleTestObj1.throttledMethod0(4) }, 400);
  setTimeout(function() { throttleTestObj1.throttledMethod0(6) }, 600);
  setTimeout(function() { throttleTestObj1.throttledMethod0(7) }, 700);
  setTimeout(function() { throttleTestObj1.throttledMethod0(16) }, 1600);
  setTimeout(function() { assert.deepEqual(throttleTestObj1.throttleMethod0Results, [0, 4, 7, 16], 'throttling of method in one instance does not interfere with throttling of that method in different instance'); }, 1700);
  
  throttleTestObj1.throttledMethod1(0);
  setTimeout(function() { throttleTestObj1.throttledMethod1(1) }, 100);
  setTimeout(function() { throttleTestObj1.throttledMethod1(2) }, 200);
  setTimeout(function() { throttleTestObj1.throttledMethod1(3) }, 300);
  setTimeout(function() { throttleTestObj1.throttledMethod1(4) }, 400);
  setTimeout(function() { throttleTestObj1.throttledMethod1(6) }, 600);
  setTimeout(function() { throttleTestObj1.throttledMethod1(7) }, 700);
  setTimeout(function() { throttleTestObj1.throttledMethod1(16) }, 1600);
  setTimeout(function() { assert.deepEqual(throttleTestObj1.throttleMethod1Results, [0, 4, 7, 16], 'throttling of one method does not interfere with throttling of another'); }, 1700);
 
  /**********/
 
  setTimeout(ready, 3000);
});

QUnit.test("Role", function(assert) { "use strict";
  assert.expect(29);

  var Base = function() {};
  assert.strictEqual(Constr.enableRoles(Base), Base, '.enableRoles() returns the constructor it was given');

  Base = Constr.create({
    proto: {
      func: function() {
        return "Func";
      }
    },
    enableRoles: false
  });

  Constr.enableRoles(Base);
  assert.ok(Base.include, '.enableRoles');

  var BasePlusRole = Base.include(
    Constr.createRole({
      test: function() {
        return 'Test';
      }
    })
  );

  var obj = new BasePlusRole();

  assert.strictEqual(obj.test(), 'Test', 'role method is correctly included.');
  assert.strictEqual(obj.func(), 'Func', 'base method is intact when not overriden by role.');

  /**********/

  obj = new Base();
  assert.ok(!obj.test, 'Base prototype not altered by .include()');

  var BaseWithOverridingRole = Base.include(
    Constr.createRole({
      test: function() {
        return 'Test'
      },
      func: function() {
        return 'Func1';
      }
    })
  );

  obj = new BaseWithOverridingRole();
  
  assert.strictEqual(obj.func(), 'Func1', 'Role correctly overrides base method.');
  assert.strictEqual(obj.test(), 'Test', 'role method is still correctly included, even when another of its method overrides a base method.');

  assert.ok(obj instanceof BaseWithOverridingRole, 'object is instanceof constructor which includes role');
  assert.ok(obj instanceof Base, 'object is instanceof constructor in its form before it includes role');

  /**********/

  var ExtendedBase = Base.include(
    Constr.createRole({
      test: function() {
        return 'Test';
      }
    })
  ).extend({
    test: function() {
      return 'Test1';
    }
  });

  obj = new ExtendedBase();
  assert.strictEqual(obj.func(), 'Func', 'base method is still intact after .include() and .extend().');
  assert.strictEqual(obj.test(), 'Test1', 'role method is still correctly overriden by .extend().');

  assert.ok(obj instanceof ExtendedBase, 'object is instanceof constructor which extends a constructor which includes role');
  assert.ok(obj instanceof Base, 'object is instanceof constructor in its form before it includes role and is extended');

  /**********/

  var Role = Constr.createRole({
    test0: function() {
      return 'Test0';
    },
    test1: function() {
      return 'Test1';
    }
  });

  var ExtendedRole = Role.extend({
    test1: function() {
      return 'Test11';
    },
    test2: function() {
      return 'Test2';
    },
    func: function() {
      return 'Func1';
    }
  });

  ExtendedBase = Base.include(ExtendedRole);
  
  obj = new ExtendedBase();
  assert.strictEqual(obj.test0(), 'Test0', 'Extended Role retains Base role method.');
  assert.strictEqual(obj.test1(), 'Test11', 'Extended Role overrides method in Base Role.');
  assert.strictEqual(obj.test2(), 'Test2', 'Extended Role adds a method to Base Role.');
  assert.strictEqual(obj.func(), 'Func1', 'Extended Role overrides a method in Base.');

  ExtendedBase = Base.include(Role);
  obj = new ExtendedBase();
  assert.strictEqual(obj.test1(), 'Test1', '.extend() does not alter Base Role.');

  /**********/

  ExtendedBase = Base.include(
    Constr.createRole({
      test0: function() {
        return 'Test0';
      }
    }),
    Constr.createRole({
      test1: function() {
        return 'Test1';
      }
    })
  );

  obj = new ExtendedBase();
  assert.deepEqual([obj.test0(), obj.test1()], ['Test0', 'Test1'], '.include() multiple roles.');

  /**********/

  ExtendedBase = Base.include(
    Constr.createRole({
      test0: function() {
        return 'Test0';
      }
    }).include(
      Constr.createRole({
        test1: function() {
          return 'Test1';
        }
      })
    )
  );

  obj = new ExtendedBase();
  assert.deepEqual([obj.test0(), obj.test1()], ['Test0', 'Test1'], 'one Role including another Role');

  /**********/

  var Role0 = Role.extend({
    test0: function() {},
    test1: function() {},
    test2: function() {}

  });

  var Role1 = Role.extend({
    test0: function() {},
    test1: function() {}
  });

  assert.throws(
    function() {
      Base.include(
        Role0,
        Role1
      );
    },
    /The following members of the included roles cause name collisions: test\d+, test\d+/,
    '.include() throws an error on a collision'
  );


  /**********/
  
  Role0 = Role.extend({
    test: function() {
      return 'Test';
    }
  });

  Role1 = Role.include(
    Role0
  );

  ExtendedBase = Base.include(
    Role0,
    Role1
  );

  obj = new ExtendedBase();

  assert.strictEqual(obj.test(), 'Test', 'collisions are allowed if the colliding names refer to the same thing');

  /**********/

  var rolePrototype = {
    test0: function() {},
    test1: function() {}
  };

  Role = Constr.createRole(rolePrototype);

  var Constructor0 = Constr.create().include(Role);
  var Constructor1 = Constr.create().include(Role);

  assert.ok(Constructor0.prototype.test0 === Constructor1.prototype.test0 && Constructor0.prototype.test1 === Constructor1.prototype.test1, "When a single role is included in multiple constructors, the constructors share the role's members");

  /**********/

  var bodyArgs;
  Base = Constr.create({
    body: function() {
      bodyArgs = Array.prototype.slice.call(arguments);
    },
    proto: {
      test0: function() { return 'test0'; },
      test1: function() { return 'test1'; }
    }
  });

  ExtendedBase = Base.include(
    Constr.createRole({
      test: function() {}
    })
  );

  obj = new ExtendedBase('test0', 'test1');

  assert.deepEqual(bodyArgs, ['test0', 'test1'], 'constructor returned by .include() runs the original constructor with correct arguments');

  ExtendedBase = Base.extend({
    test1: function() { return 'test11'; },
    test2: function() { return 'test22'; }
  }).include(
    Constr.createRole({
      test2: function() { return 'test222'; },
      test3: function() { return 'test333'; }
    })
  );

  obj = new ExtendedBase('test00', 'test11');
  assert.deepEqual(bodyArgs, ['test00', 'test11'], 'with an extended constructor with role applied, original constructor with correct arguments');
  assert.strictEqual(obj.test0(), 'test0', 'with an extended constructor with role applied, method not overridden remains');
  assert.strictEqual(obj.test1(), 'test11', 'with an extended constructor with role applied, method overridden by extension but not by role, extension version is used');
  assert.strictEqual(obj.test2(), 'test222', 'with an extended constructor with role applied, method overridden by both extension and role, role version is used');
  assert.strictEqual(obj.test3(), 'test333', 'role adds a method to an extended constructor');
});
