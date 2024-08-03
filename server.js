const express = require('express');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const mustacheExpress = require('mustache-express');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// const nodemailer = require('nodemailer');
// console.log("Email User:", process.env.muzangel77);
// console.log("Email Pass:", process.env.musonera7 ? "Password is set" : "Password is not set");

require('dotenv').config();

// Passport Config
require('./config/passport')(passport);

const app = express();
const port = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Body parser
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// View engine setup
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

// Routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);

// Root route
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      userMessage,
    ]);

    const messageContent = result.response.text();

    res.json({ response: messageContent });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// let transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // Use TLS
//   auth: {
//       user: process.env.muzangel77,
//       pass: process.env.musonera7
//   }
// });

// app.post('/submit-contact', (req, res) => {
//   const { name, email, message } = req.body;
  
//   let mailOptions = {
//       from: `"Contact Form" <${process.env.sparklingsparkles77}>`,
//       to: process.env.muzangel77,
//       replyTo: email,
//       subject: "New Contact Form Submission",
//       text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
//       html: `
//           <h2>New Contact Form Submission</h2>
//           <p><strong>Name:</strong> ${name}</p>
//           <p><strong>Email:</strong> ${email}</p>
//           <p><strong>Message:</strong> ${message}</p>
//       `
//   };

//   // Send email
//   transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//           console.error("Error sending email:", error);
//           res.status(500).json({ message: "Error sending email", error: error.message });
//       } else {
//           console.log("Message sent: %s", info.messageId);
//           res.status(200).json({ message: 'Message sent successfully' });
//       }
//   });
// });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
