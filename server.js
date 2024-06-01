require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const csrf = require('csurf'); // Import csrf middleware
const winston = require('winston');
const flash = require('connect-flash');

// Route imports
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceItemRoutes = require('./routes/serviceItemRoutes');
const apiRoutes = require('./routes/apiRoutes'); // Import API routes
const settingsRoutes = require('./routes/settingsRoutes'); // Import settings routes

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

global.__basedir = __dirname;

const app = express();
const port = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(flash());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.DATABASE_URL)
  .then(() => logger.info('Database connected successfully'))
  .catch((err) => {
    logger.error(`Database connection error: ${err.message}`, err);
    process.exit(1);
  });

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
}));

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Custom middleware to pass the csrfToken and flash messages to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  next();
});

// Session logging middleware
app.use((req, res, next) => {
  const sess = req.session;
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    logger.info(`Session created at: ${new Date().toISOString()}`);
  } else {
    sess.views++;
    logger.info(`Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`);
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/quotes', quoteRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/items', serviceItemRoutes);
app.use('/api', apiRoutes);
app.use('/settings', settingsRoutes);

// Root path response
app.get('/', (req, res) => {
  res.render('index');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).send('Page not found.');
});

// Error handling
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.error(`CSRF token error: ${err.message}`, {
      error: err,
      sessionId: req.sessionID,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    });
    res.status(403).send('Error with CSRF token');
  } else {
    logger.error(`Unhandled application error: ${err.message}`, {
      error: err,
      stack: err.stack,
      sessionId: req.sessionID,
      timestamp: new Date().toISOString(),
    });
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
