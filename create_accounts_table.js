var mysql = require("mysql");

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
  var sql = `CREATE TABLE tbl_accounts(acc_id INT NOT NULL AUTO_INCREMENT,
                                       acc_name VARCHAR(20),
                                       acc_login VARCHAR(20),
                                       acc_password VARCHAR(50), PRIMARY KEY (acc_id))`;
  con.query(sql, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Table created");
  });
});
