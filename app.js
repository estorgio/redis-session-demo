const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const flash = require('connect-flash');
const csurf = require('csurf')();

require('dotenv').config();

const app = express();

app.use(session({
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 604800000 }, // 7 days
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({
    url: process.env.SESSION_REDIS_URL,
  }),
}));
app.use((req, res, next) => {
  if (!req.session) {
    next(new Error('An error occured while loading session'));
    return;
  }
  next();
});

app.set('view engine', 'ejs');

app.use('/static/vendor',
  express.static(path.join(__dirname, 'public', 'vendor'),
    { immutable: true, maxAge: '1y' }));
app.use('/static/assets',
  express.static(path.join(__dirname, 'public', 'assets'),
    { maxAge: '1d' }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use((req, res, next) => {
  res.locals.flashSuccess = req.flash('success');
  res.locals.flashError = req.flash('error');
  next();
});

app.get('/', csurf, (req, res) => {
  const csrfToken = req.csrfToken();
  const sessionData = req.session.lists;
  console.log('session:', sessionData);
  res.render('index', { csrfToken, sessionData });
});

app.post('/', csurf, (req, res) => {
  const { key, value } = req.body.data;
  if (!req.session.lists) req.session.lists = [];
  req.session.lists.push({ key, value });
  res.redirect('/');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App has been started on port ${port}`));
