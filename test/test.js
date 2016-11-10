QUnit.test("create", function(assert) { "use strict";
  assert.expect(33);

  var C0 = Constr.create();
  
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

  /**********/

  var count = 0;
  var args;
  var prototype = {
    test0: function() { return 't0'; },
    test1: function() { return 't1'; }
  };

  var staticMembers = {
    static0: function() { return 's0' },
    static1: function() { return 's1' }
  };

  C0 = Constr.create({
    prototype: prototype,
    staticMembers: staticMembers,
    body: function() {
      ++count;
      args = Array.prototype.slice.apply(arguments);
    }
  });

  assert.strictEqual(C0.prototype, prototype, 'prototype is attached to constructor');
  assert.ok(C0.static0 === staticMembers.static0 && C0.static1 === staticMembers.static1, 'static members are attached to constructor');

  var obj = new C0('foo', 'bar');
  assert.strictEqual(count, 1, 'body is executed when object is constructed');
  assert.deepEqual(args, ['foo', 'bar'], 'arguments correctly passed to body');

  var C1 = C0.extend({
    test1: function() { return 't11'; },
    test2: function() { return 't22'; }
  }, {
    static1: function() { return 's11'; },
    static2: function() { return 's22'; }
  });

  assert.strictEqual(Object.getPrototypeOf(C1.prototype), prototype, 'prototype chain is maintained on first extension');
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

  var C2 = C1.extend({
    test2: function() { return 't222'; },
    test3: function() { return 't333'; }
  }, {
    static2: function() { return 's222'; },
    static3: function() { return 's333'; }
  });

  assert.ok(Object.getPrototypeOf(C2.prototype) === C1.prototype && Object.getPrototypeOf(Object.getPrototypeOf(C2.prototype)) === prototype, 'prototype chain is maintained on second extension');
  obj = new C2();

  assert.strictEqual(count, 3, 'body is executed when extended extended constructor is executed');
  assert.ok(obj.test0() === 't0' && obj.test1() === 't11', 'object method is not overridden when not meant to be overriddeni on second extension');
  assert.strictEqual(obj.test2(), 't222', 'object method is overridden when supposed to be overridden on second extension');
  assert.strictEqual(obj.test3(), 't333', 'object method is added in extended prototype on second extension');
  assert.ok(C2.static0() === 's0' && C2.static1() === 's11', 'static method is not overridden when not meant to be overriddeni on second extension');
  assert.strictEqual(C2.static2(), 's222', 'static method is overridden when supposed to be overridden on second extension');
  assert.strictEqual(C2.static3(), 's333', 'static method is added in extended prototype on second extension');

  /**********/

  var ret = {};
  C0 = Constr.create({ body: function() { return ret; } });
  assert.strictEqual(new C0(), ret, 'return of body is respected');
});

QUnit.test("Utilities", function(assert) { "use strict";
  assert.expect(37);

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

  var memoizeTestObj1 = {
    memoizedMethod: memoizeTestObj0.memoizedMethod
  };

  assert.strictEqual(memoizeTestObj1.memoizedMethod('foo', 'bar'), 'foobar', 'memoize with hasher, correct value is returned when memoized method is called for the first time for a different object');
  assert.strictEqual(obj, memoizeTestObj1, 'memozie with hasher, correct value for this in hasher when called for a different object.');
  assert.strictEqual(result, 'foobar', 'memoize with hasher, correct value is returned when memoized method is called for the first time');
  assert.strictEqual(memoizeCount, 2, 'memoize with hasher, method is executed when memoized method is called for a second object');
  
  memoizeTestObj1.memoizedMethod('foo', 'bar');

  assert.strictEqual(memoizeCount, 2, 'memoize with hasher, if a memoized method is called on the same argument twice for a second object, the method is only executed once');

  assert.strictEqual(memoizeTestObj1.memoizedMethod('foo', 'baz'), 'foobaz', 'memoize with hasher, correct value is returned when memoized method is called on a different argument');
  assert.strictEqual(memoizeCount, 3, 'memoize with hasher, method is executed when memoized methoid is called on a different argument');

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
 
  setTimeout(ready, 3000);
});

QUnit.test("Role", function(assert) { "use strict";
  assert.expect(18);

  var Base = Constr.create({
    prototype: {
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
});
