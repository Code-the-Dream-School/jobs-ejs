const { app, server } = require("../app");
const Job = require("../models/Job");
const { seed_db, testUserPassword } = require("../util/seed_db");
const get_chai = require("../util/get_chai");

describe("tests for crud operations", function () {
  before(async () => {
    const { expect, request } = await get_chai();
    this.test_user = await seed_db();
    let req = request.execute(app).get("/session/logon").send();
    let res = await req;
    const textNoLineEnd = res.text.replaceAll("\n", "");
    this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken"),
    );
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };
    req = request
      .execute(app)
      .post("/session/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    res = await req;
    cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    expect(this.csrfToken).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
  });
  // after(() => {
  //     server.close();
  //     console.log("closing the server")
  //   });
  it("should bring up a list of 20 jobs", async () => {
    const { expect, request } = await get_chai();
    const req = request
      .execute(app)
      .get("/jobs")
      .set("Cookie", this.sessionCookie)
      .send();
    const res = await req;
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21);
  });
  it("should add a job entry", async () => {
    const { expect, request } = await get_chai();
    const dataToPost = {
      _csrf: this.csrfToken,
      company: "Acme",
      position: "flunky",
    };
    const req = request
      .execute(app)
      .post("/jobs")
      .set("Cookie", this.sessionCookie + ";" + this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);
    await req;
    const jobs = await Job.find({ createdBy: this.test_user._id });
    expect(jobs.length).to.equal(21);
  });
});
