
const { connection } = require('mongoose')
require("dotenv").config()

const start = async () => {
    try {
        let mongoURL = process.env.MONGO_URI_TEST
        require("./db/connect")(mongoURL);
        await require("./util/seed_db").seed_db(
    } catch (error) {
      console.log(error);
    }
  };

  start()
  