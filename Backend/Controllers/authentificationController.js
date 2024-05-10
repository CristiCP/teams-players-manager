const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
module.exports = function(db) {

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'cristipopan1262@gmail.com',
            pass: 'gsoi ifmp ngws spso'
        }
    });

    const sendValidationEmail = (email, token) => {
        const validationLink = `http://localhost:5173/validation?token=${token}`;
        
        const mailOptions = {
            from: 'cristipopan1262@gmail.com',
            to: email,
            subject: 'Account Validation',
            html: `Please click the following link to validate your account: <a href="${validationLink}">${validationLink}</a>`
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    };

    return {
        LoginUser: function(req, res) {
            console.log("Login...");
            const { username, password } = req.body;
            db.query('SELECT * FROM authentication WHERE username = ? AND password = ?', [username, password], (error, results) => {
                if (error) {
                    console.error("Error executing query:", error);
                    res.status(500).send("Internal Server Error");
                } else {
                    if (results.length > 0) {
                        const user = results[0];
                        if (user.isValid) {
                            console.log("Login successful");
                            const token = jwt.sign({ username }, '5nB0$CZ4*!8x@1WQzPmY&rS#6QD!oF$D', { expiresIn: '5h' });
                            db.query('DELETE FROM tokens WHERE username = ?', [username], (deleteError, deleteResults) => {
                                if (deleteError) {
                                    console.error("Error deleting tokens:", deleteError);
                                    res.status(500).send("Internal Server Error");
                                } else {
                                    db.query('INSERT INTO tokens (username, token) VALUES (?, ?)', [username, token], (insertError, insertResults) => {
                                        if (insertError) {
                                            console.error("Error storing token:", insertError);
                                            res.status(500).send("Internal Server Error");
                                        } else {
                                            res.status(200).json(token);
                                        }
                                    });
                                }
                            });
                        } else {
                            console.log("Account not verified");
                            res.status(403).send("Account needs to be verified first");
                            sendValidationEmail(user.email, jwt.sign({ email: user.email }, '5nB0$CZ4*!8x@1WQzPmY&rS#6QD!oF$D', { expiresIn: '5m' }));
                        }
                    } else {
                        console.log("Invalid credentials");
                        res.status(401).send("Invalid credentials");
                    }
                }
            });
        },
        SignUpUser: function(req, res) {
            console.log("Signup...");
            const { email, username, password } = req.body;
            db.query('SELECT * FROM authentication WHERE email = ? OR username = ?', [email, username], (error, results) => {
                if (error) {
                    console.error("Error executing query:", error);
                    res.status(500).send("Internal Server Error");
                } else {
                    if (results.length > 0) {
                        const existingEmail = results.find(result => result.email === email);
                        const existingUsername = results.find(result => result.username === username);
                        if (existingEmail && existingUsername) {
                            console.log("Email and username already exist");
                            res.status(409).send("Email and username already exist");
                        } else if (existingEmail) {
                            console.log("Email already exists");
                            res.status(409).send("Email already exists");
                        } else if (existingUsername) {
                            console.log("Username already exists");
                            res.status(409).send("Username already exists");
                        }
                    } else {
                        db.query('INSERT INTO authentication (email, username, password) VALUES (?, ?, ?)', [email, username, password], (insertError, insertResults) => {
                            if (insertError) {
                                console.error("Error inserting user:", insertError);
                                res.status(500).send("Internal Server Error");
                            } else {
                                console.log("User registered successfully");
                                res.status(201).send("User registered successfully");
                            }
                        });
                    }
                }
            });
        },ValidateUser: function(req, res) {
            const { token } = req.body;
            console.log(token);
            if (!token) {
                console.log("Token is missing");
                return res.status(400).send('Token is missing');
            }
            jwt.verify(token, '5nB0$CZ4*!8x@1WQzPmY&rS#6QD!oF$D', (err, decoded) => {
                if (err) {
                    console.error('Invalid token:', err);
                    return res.status(400).send('Invalid token');
                }
                const { email } = decoded;
                db.query('UPDATE authentication SET isValid = ? WHERE email = ?', [true, email], (updateError, updateResults) => {
                    if (updateError) {
                        console.error('Error updating user:', updateError);
                        return res.status(500).send('Internal Server Error');
                    }
                    console.log('User validated successfully');
                    return res.status(200).send('User validated successfully');
                });
            });
        }
    };
}