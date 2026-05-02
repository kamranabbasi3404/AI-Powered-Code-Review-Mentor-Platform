const express = require('express');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const User = require('../models/User');

const router = express.Router();

// GET /api/auth/github - Redirect to GitHub OAuth
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  const scope = 'read:user user:email';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  res.json({ url: githubAuthUrl });
});

// GET /api/auth/github/callback - Handle GitHub OAuth callback
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || 'GitHub auth failed' });
    }

    // Fetch user profile from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    const githubUser = await userResponse.json();

    // Fetch email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : '';
    }

    // Create or update user in database
    let user = await User.findOne({ githubId: String(githubUser.id) });

    if (!user) {
      user = await User.create({
        githubId: String(githubUser.id),
        username: githubUser.login,
        displayName: githubUser.name || githubUser.login,
        email: email || '',
        avatarUrl: githubUser.avatar_url,
        profileUrl: githubUser.html_url
      });
    } else {
      user.username = githubUser.login;
      user.displayName = githubUser.name || githubUser.login;
      user.email = email || user.email;
      user.avatarUrl = githubUser.avatar_url;
      user.profileUrl = githubUser.html_url;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
