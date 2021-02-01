var mysql = require("mysql");
var crypto = require('crypto');

var con = mysql.createConnection({
  host: "us-cdbr-east-02.cleardb.com",
  user: "b9e8908b7149e9",
  password: "c3bc325e",
  database: "heroku_44812b76491f5a5",
  port: 3306
});

con.connect(function(err) {
  if (err) {
    throw err;
  };
  console.log("Connected!");

  var rowToBeInserted = {
    acc_name: 'admin', // replace with acc_name chosen by you OR retain the same value
    acc_login: 'admin', // replace with acc_login chosen by you OR retain the same vallue
    acc_password: crypto.createHash('sha256').update("admin").digest('base64') // replace with acc_password chosen by you OR retain the same value
  };

  var sql = ``;
  con.query('INSERT tbl_accounts SET ?', rowToBeInserted, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Value inserted");
  });
});
