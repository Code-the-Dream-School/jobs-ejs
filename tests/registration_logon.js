const chai = require("chai");
chai.use(require("chai-http"));
const { app, server } = require("../app");
const expect = chai.expect;

const { factory, seed_db } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;

const User = require("../models/User");

describe("tests for registration and logon", function () {
  after(() => {
    server.close();
  });
  it("should get the registration page", (done) => {
    chai
      .request(app)
      .get("/session/register")
      .send()
      .end((err, res) => {
        expect(err).to.equal(null);
        expect(res).to.have.status(200);
        expect(res).to.have.property("text");
        expect(res.text).to.include("Enter your name");
        const textNoLineEnd = res.text.replaceAll("\n", "");
        const csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
        expect(csrfToken).to.not.be.null;
        this.csrfToken = csrfToken[1];
        expect(res).to.have.property("headers");
        expect(res.headers).to.have.property("set-cookie");
        const cookies = res.headers["set-cookie"];
        this.csrfCookie = cookies.find((element) =>
          element.startsWith("csrfToken"),
        );
        expect(this.csrfCookie).to.not.be.undefined;
        done();
      });
  });
  it("should register the user", async () => {
    this.password = faker.internet.password();
    this.user = await factory.build("user", { password: this.password });
    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };
    const request = chai
      .request(app)
      .post("/session/register")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);
    res = await request;
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Click this link to logon");
    newUser = await User.findOne({ email: this.user.email });
    expect(newUser).to.not.be.null;
  });
  it("should fail to register the same email twice", async () => {
    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };
    const request = chai
      .request(app)
      .post("/session/register")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);
    res = await request;
    expect(res).to.have.status(400);
    expect(res).to.have.property("text");
    expect(res.text).to.include("already registered");
  });
  it("should log the user on", async () => {
    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.csrfToken,
    };
    const request = chai
      .request(app)
      .post("/session/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    res = await request;
    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/");
    const cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    expect(this.sessionCookie).to.not.be.undefined;
  });
  it("should get the index page", (done) => {
    chai
      .request(app)
      .get("/")
      .set("Cookie", this.sessionCookie)
      .send()
      .end((err, res) => {
        expect(err).to.equal(null);
        expect(res).to.have.status(200);
        expect(res).to.have.property("text");
        expect(res.text).to.include(this.user.name);
        done();
      });
  });
});
