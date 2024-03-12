const multiply = require("../util/multiply");
const expect = require("chai").expect;

describe("testing multiply", function () {
  it("should give 7*6 is 42", (done) => {
    expect(multiply(7, 6)).to.equal(42);
    done();
  });
});
