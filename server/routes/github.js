const express = require('express');
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const GITHUB_API = 'https://api.github.com';

// Helper: parse owner/repo from various URL formats
function parseRepoUrl(url) {
  // Handle: https://github.com/owner/repo, owner/repo, etc.
  const match = url.match(/(?:github\.com\/)?([^\/\s]+)\/([^\/\s#?]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

// GET /api/github/repos - Get user's own repos
router.get('/repos', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-login.' });
    }

    const response = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=30`, {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch repositories' });
    }

    const repos = await response.json();
    const simplified = repos.map(r => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      updated_at: r.updated_at,
      html_url: r.html_url,
      private: r.private
    }));

    res.json(simplified);
  } catch (error) {
    console.error('GitHub repos error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// GET /api/github/contents?repo=owner/repo&path=
router.get('/contents', auth, async (req, res) => {
  try {
    const { repo, path = '' } = req.query;
    if (!repo) return res.status(400).json({ error: 'Repository is required' });

    const parsed = parseRepoUrl(repo);
    if (!parsed) return res.status(400).json({ error: 'Invalid repository format' });

    const user = await User.findById(req.user.userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-login.' });
    }

    const apiPath = path ? `/repos/${parsed.owner}/${parsed.repo}/contents/${path}` : `/repos/${parsed.owner}/${parsed.repo}/contents`;
    
    const response = await fetch(`${GITHUB_API}${apiPath}`, {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData.message || 'Failed to fetch contents' });
    }

    const data = await response.json();

    // If it's a single file, return its content
    if (!Array.isArray(data)) {
      // It's a file
      let content = '';
      if (data.encoding === 'base64' && data.content) {
        content = Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return res.json({ type: 'file', name: data.name, path: data.path, content, size: data.size });
    }

    // It's a directory listing
    const items = data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type, // 'file' or 'dir'
      size: item.size || 0
    })).sort((a, b) => {
      // Directories first, then files
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ type: 'dir', items });
  } catch (error) {
    console.error('GitHub contents error:', error);
    res.status(500).json({ error: 'Failed to fetch repository contents' });
  }
});

// GET /api/github/prs?repo=owner/repo
router.get('/prs', auth, async (req, res) => {
  try {
    const { repo } = req.query;
    if (!repo) return res.status(400).json({ error: 'Repository is required' });

    const parsed = parseRepoUrl(repo);
    if (!parsed) return res.status(400).json({ error: 'Invalid repository format' });

    const user = await User.findById(req.user.userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-login.' });
    }

    const response = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}/pulls?state=open&per_page=20`, {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch pull requests' });
    }

    const prs = await response.json();
    const simplified = prs.map(pr => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      user: pr.user.login,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      html_url: pr.html_url
    }));

    res.json(simplified);
  } catch (error) {
    console.error('GitHub PRs error:', error);
    res.status(500).json({ error: 'Failed to fetch pull requests' });
  }
});

// GET /api/github/pr-files?repo=owner/repo&pr=number
router.get('/pr-files', auth, async (req, res) => {
  try {
    const { repo, pr } = req.query;
    if (!repo || !pr) return res.status(400).json({ error: 'Repository and PR number are required' });

    const parsed = parseRepoUrl(repo);
    if (!parsed) return res.status(400).json({ error: 'Invalid repository format' });

    const user = await User.findById(req.user.userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-login.' });
    }

    const response = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}/pulls/${pr}/files?per_page=50`, {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch PR files' });
    }

    const files = await response.json();
    const simplified = files.map(f => ({
      filename: f.filename,
      status: f.status, // added, removed, modified
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch || '',
      raw_url: f.raw_url
    }));

    res.json(simplified);
  } catch (error) {
    console.error('GitHub PR files error:', error);
    res.status(500).json({ error: 'Failed to fetch PR files' });
  }
});

module.exports = router;
