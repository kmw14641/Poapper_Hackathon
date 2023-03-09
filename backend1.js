const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',  // 수정됨
    database:'poapper_hackathon1'
})

const app = express();
app.use(express.json());

const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
// app.use(cookieParser());
// app.use(cors({
//     origin: true,
//     credentials: true
// }));

app.get('/', (req, res) => {
    db.query(`SELECT currentuser FROM server WHERE id=0`, (err, results) => {
        if(err) throw err;
        res.send(results[0].currentuser);
    });
});

app.get('/problem', (req, res) => {
    db.query(`SELECT * FROM problem`, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
app.post('/problem', (req, res) => {
    const body = req.body;
    db.query(`INSERT INTO problem (host, state, title, body, link) VALUES ('${body.host}', 'notsolved', '${body.title}', '${body.body}', 'empty')`, (err, results) => {
        if(err) throw err;
        res.send();
    });
});
app.put("/problem/:id", (req, res) => {
    const body = req.body;
    const query_id = req.params.id;
    db.query(`UPDATE problem SET host='${body.host}', title='${body.title}', body='${body.body}' WHERE id=${query_id}`, (err, results) => {
        if(err) throw err;
        res.send();
    });
});
app.delete('/problem/:id', (req, res) => {
    const query_id = req.params.id;
    db.query(`DELETE FROM problem WHERE id=${query_id}`, (err, results) => {
        if(err) throw err;
        res.send();
    });
});

app.get('/progressing', (req, res) => {
    db.query(`SELECT * FROM progressing`, (err, results) => {
        if(err) throw err;
        let proj_data = results;
        for(i = 0; i < proj_data.length; i++) {
            db.query(`SELECT * FROM user_${proj_data[i].title}'`, (err, results) => {
                if(err) throw err;
                proj_data[i].user = results;
            });
        }
        res.send(proj_data);
    });
});
app.post('/progressing', (req, res) => {
    const body = req.body;
    db.query(`INSERT INTO progressing (host, title, body) VALUES ('${body.host}', '${body.title}', '${body.body}')`, (err, results) => {
        db.query(`CREATE TABLE user_${body.title}(
            id INT(11) NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            stuID INT(11) NOT NULL,
            userid VARCHAR(100) NOT NULL,
            password VARCHAR(100) NOT NULL,
            PRIMARY KEY(id)
            )`, (err, results) => {
            if(err) throw err;
            db.query(`UPDATE problem SET link='${body.title}', state='solving' WHERE title='${body.link}'`, (err, results) => {
                if(err) throw err;
                res.send();
            });
        });
    });
});
app.put('/progressing/:id', (req, res) => {
    const body = req.body;
    const query_id = req.params.id;
    db.query(`UPDATE progressing SET host='${body.host}', title='${body.title}', body='${body.body}' WHERE id='${query_id}'`, (err, results) => {
        if(err) throw err;
        res.send();
    });
});
app.delete('/progressing/:id', (req, res) => {
    const query_id = req.params.id;
    db.query(`SELECT * FROM progressing WHERE id='${query_id}'`, (err, results) => {
        const proj_title = results[0].title;
        db.query(`SELECT title FROM problem WHERE link='${proj_title}'`, (err, results) => {
            if(err) throw err;
            const prob_title = results[0].title;
            db.query(`UPDATE problem SET state='notsolved', link='empty' WHERE title='${prob_title}'`, (err, results) => {
                if(err) throw err;
                db.query(`DROP TABLE user_${proj_title}`, (err, results) => {
                    if(err) throw err;
                    db.query(`DELETE FROM progressing WHERE id=${query_id}`, (err, results) => {
                        if(err) throw err;
                        res.send();
                    });
                });
            });
        });
    });
});

app.get('/finished', (req, res) => {
    db.query(`SELECT * FROM finished`, (err, results) => {
        if(err) throw err;
        let proj_data = results;
        for(i = 0; i < proj_data.length; i++) {
            db.query(`SELECT * FROM user_${proj_data[i].title}'`, (err, results) => {
                if(err) throw err;
                proj_data[i].user = results;
            });
        }
        res.send(proj_data);
    });
});
app.post('/finished', (req, res) => {
    const body = req.body;
    db.query(`SELECT * FROM progressing WHERE title='${body.title}'`, (err, results) => {
        if(err) throw err;
        db.query(`INSERT INTO finished (host, title, body) VALUES ('${results[0].host}', '${body.title}', '${results[0].body}')`, (err, results) => {
            if(err) throw err;
            db.query(`UPDATE problem SET state='solved' WHERE link='${body.title}'`, (err, results) => {
                if(err) throw err;
                db.query(`DELETE FROM progressing WHERE title='${body.title}'`, (err, results) => {
                    if(err) throw err;
                    res.send();
                });
            });
        });
    });
});

app.get('/progressing/:idx', (req, res) => {
    const proj_idx = req.params.idx;
    db.query(`SELECT * FROM progressing WHERE id='${proj_idx}'`, (err, results) => {
        const proj_title = results[0].title;
        let proj_data = results[0];
        db.query(`SELECT * FROM user_${proj_title}`, (err, results) => {
            if(err) throw err;
            proj_data.user = results;
            res.send(proj_data);
        });
    });
});
app.post('/progressing/:idx', (req, res) => {
    const proj_idx = req.params.idx;
    db.query(`SELECT title FROM progressing WHERE id='${proj_idx}'`, (err, results) => {
        const proj_title = results[0].title;
        db.query(`SELECT currentuser FROM server WHERE id='0'`, (err, results) => {
            db.query(`SELECT * FROM user WHERE userid='${results[0].currentuser}'`, (err, results) => {
                db.query(`INSERT INTO user_${proj_title} (name, stuID, userid, password) VALUES ('${results[0].name}', '${results[0].stuID}', '${results[0].userid}', '${results[0].password}')`, (err, results) => {
                    if(err) throw err;
                    res.send();
                });
            });
        });
    });
});
app.delete('/progressing/user/:idx', (req, res) => {
    const proj_idx = req.params.idx;
    db.query(`SELECT title FROM progressing WHERE id='${proj_idx}'`, (err, results) => {
        const proj_title = results[0].title;
        db.query(`SELECT currentuser FROM server WHERE id='0'`, (err, results) => {
            db.query(`DELETE FROM user_${proj_title} WHERE userid='${results[0].currentuser}'`, (err, results) => {
                if(err) throw err;
                res.send();
            });
        });
    });
});

app.get('/finished/:idx', (req, res) => {
    const proj_idx = req.params.idx;
    db.query(`SELECT * FROM finished WHERE id='${proj_idx}'`, (err, results) => {
        const proj_title = results[0].title;
        let proj_data = results[0];
        db.query(`SELECT * FROM user_${proj_title}`, (err, results) => {
            if(err) throw err;
            proj_data.user = results;
            res.send(proj_data);
        });
    });
});

app.get('/user', (req, res) => {
    db.query(`SELECT currentuser FROM server WHERE id=0`, (err, results) => {
        db.query(`SELECT * FROM user WHERE userid='${results[0].currentuser}'`, (err, results) => {
            if(err) throw err;
            res.send(results[0]);
        });
    });
});
app.post('/user', (req, res) => {  // fail
    const body = req.body;
    const stuint = body.stuid;
    db.query(`INSERT INTO user (name, stuID, userid, password) VALUES ('${body.name}', '${body.collegenumber}', '${body.userid}', '${body.password}')`, (err, results) => {
        if(err) throw err;
        res.send();
    });
});
app.put('/user', (req, res) => {
    const body = req.body;
    db.query(`SELECT currentuser FROM server WHERE id=0`, (err, results) => {
        db.query(`UPDATE user SET name='${body.name}', stuID='${body.collegenumber}', password='${body.password}' WHERE userid='${results[0].currentuser}'`, (err, results) => {
            if(err) throw err;
            res.send();
        });
    });
});
app.delete('/user', (req, res) => {
    db.query(`SELECT currentuser FROM server WHERE id=0`, (err, results) => {
        db.query(`DELETE FROM user WHERE userid='${results[0].currentuser}'`, (err, results) => {
            if(err) throw err;
            res.send();
        });
    });
});

app.put('/login', (req, res) => {
    const body = req.body;
    db.query(`SELECT password FROM user WHERE userid='${body.userid}'`, (err, results) => {
        if(err) throw err;
        if(results[0].password == body.password) {
            db.query(`UPDATE server SET currentuser='${body.userid}' WHERE id=0`, (err, results) => {
                if(err) throw err;
                res.send();
            });
        }
        else res.send('wrong');
    });
});

app.delete('/logout', (req, res) => {
    db.query(`UPDATE server SET currentuser='empty'`, (err, results) => {
        if(err) throw err;
        res.send();
    });
});

app.listen(8080, () => console.log("server is running on 8080 port."));