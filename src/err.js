

class Foo {

  constructor() {
    this.foo = 'cat';

    this.bar = () => {
      console.log(this.foo);
    };

    this.car = (f) => {
      f();
    };

  }



  star(){
    this.car(this.bar);
  }

}


new Foo().star();
