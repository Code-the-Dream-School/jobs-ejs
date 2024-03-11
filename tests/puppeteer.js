const puppeteer = require("puppeteer");
const { server } = require("../app");
const { expect } = require("chai");
const { seed_db, testUserPassword } = require("../util/seed_db");
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let testUser=null;

const runTests = async () => {
   let page = null;
   let browser = null;
  // Launch the browser and open a new blank page
  describe("index page test", () => {
    before(async function () {
      this.timeout(5000);
      browser = await puppeteer.launch();
      page = await browser.newPage();
      await page.goto("http://localhost:3000");
    });
    after(async function () {
      this.timeout(5000);
      await browser.close();
      server.close();
      return;
    });
    describe("got to site", function () {
      it("should have completed a connection", function (done) {
        done();
      });
    });
    describe("index page test", function () {
      this.timeout(10000);
      it("finds the index page logon link", async () => {
        this.logonLink = await page.waitForSelector(
          "a ::-p-text(Click this link to logon)",
        );
      });
      it("gets to the logon page", async () => {
        await this.logonLink.click();
        await page.waitForNavigation();
        const email = await page.waitForSelector("input[name=email]");
      });
    });
    describe("logon page test", function () {
      this.timeout(10000);
      it("resolves all the fields", async () => {
        this.email = await page.waitForSelector("input[name=email]");
        this.password = await page.waitForSelector("input[name=password]");
        this.submit = await page.waitForSelector("button ::-p-text(Logon)");
      });
      it("sends the logon", async () => {
        testUser = await seed_db()
        await this.email.type(testUser.email);
        await this.password.type(testUserPassword);
        await this.submit.click();
        await page.waitForNavigation();
        await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`)
        await page.waitForSelector("a ::-p-text(change the secret")
        await page.waitForSelector("a[href=\"/secretWord\"]")    
      });
    });
   });
}

runTests()
