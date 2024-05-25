const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const path = require('path');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Post = mongoose.model('Post', postSchema);
const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: true,
}));

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, 'jwtsecret', (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = user;
    const token = jwt.sign({ username: user.username }, 'jwtsecret', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.post('/posts', isAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).send('Title and content are required');
  }
  const post = new Post({ title, content });
  await post.save();
  res.status(201).send(post);
});

app.get('/posts', async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

app.get('/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).send('Post not found');
  }
  res.json(post);
});

app.put('/posts/:id', isAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
  if (!post) {
    return res.status(404).send('Post not found');
  }
  res.json(post);
});

app.delete('/posts/:id', isAuthenticated, async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) {
    return res.status(404).send('Post not found');
  }
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
