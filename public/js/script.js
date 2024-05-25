document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');

  function loadView(view) {
    fetch(view)
      .then(response => response.text())
      .then(html => {
        container.innerHTML = html;
        addFormEventListeners();
        if (view === '/views/blogs.html') {
          loadPosts();
        }
      });
  }

  function addFormEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const postForm = document.getElementById('postForm');

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }

    if (postForm) {
      postForm.addEventListener('submit', handlePost);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      loadView('/views/blogs.html');
    } else {
      alert('Login failed');
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const message = await response.text();
    alert(message);
    loadView('/views/login.html');
  }

  async function handlePost(event) {
    event.preventDefault();
    const title = event.target.title.value;
    const content = event.target.content.value;
    const token = localStorage.getItem('token');
    const response = await fetch('/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    const post = await response.json();
    alert('Post created successfully');
    loadView('/views/blogs.html');
  }

  async function loadPosts() {
    const token = localStorage.getItem('token');
    const response = await fetch('/posts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const posts = await response.json();
    const postList = document.getElementById('postList');
    postList.innerHTML = '';
    posts.forEach(post => {
      const postItem = document.createElement('li');
      postItem.classList.add('post-item');
      postItem.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <div class="post-actions">
          <button class="btn-edit" data-id="${post._id}">Edit</button>
          <button class="btn-delete" data-id="${post._id}">Delete</button>
        </div>
      `;
      postList.appendChild(postItem);
    });
  }

  document.addEventListener('click', async event => {
    if (event.target.matches('.btn-delete')) {
      const postId = event.target.getAttribute('data-id');
      const token = localStorage.getItem('token');
      await fetch(`/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert('Post deleted');
      loadPosts();
    }

    if (event.target.matches('.btn-edit')) {
      // Implement edit functionality as needed
    }

    if (event.target.matches('#createPostBtn')) {
      const modal = document.getElementById('createPostModal');
      modal.style.display = 'block';
    }

    if (event.target.matches('.close')) {
      const modal = document.getElementById('createPostModal');
      modal.style.display = 'none';
    }
  });

  // Load the initial view
  loadView('/views/login.html');
});
