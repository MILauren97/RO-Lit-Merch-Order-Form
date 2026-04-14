// ── RUST-OLEUM ORDER FORM — SERVER-SIDE AUTH GATE ────────────
// Password is stored as SITE_PASSWORD in Netlify environment variables
// Never visible in source code or browser

export default async function handler(request, context) {
  const url = new URL(request.url);

  // Always allow products.js and static assets through
  if (
    url.pathname === '/products.js' ||
    url.pathname.startsWith('/netlify/') ||
    url.pathname.startsWith('/.netlify/')
  ) {
    return context.next();
  }

  const PASSWORD = Deno.env.get('SITE_PASSWORD');
  const COOKIE_NAME = 'ro_auth';

  // Check for valid auth cookie
  const cookies = request.headers.get('cookie') || '';
  const authCookie = cookies.split(';').find(c => c.trim().startsWith(COOKIE_NAME + '='));
  const cookieVal = authCookie ? authCookie.split('=')[1].trim() : '';

  if (cookieVal === PASSWORD) {
    // Authenticated — let the request through
    return context.next();
  }

  // Handle login form submission (POST)
  if (request.method === 'POST') {
    const formData = await request.formData();
    const submitted = formData.get('password');

    if (submitted === PASSWORD) {
      // Correct — set auth cookie and redirect to page
      const response = new Response(null, {
        status: 302,
        headers: {
          'Location': url.pathname,
          'Set-Cookie': `${COOKIE_NAME}=${PASSWORD}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`
        }
      });
      return response;
    }

    // Wrong password — show login page with error
    return new Response(loginPage(true), {
      status: 401,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Not authenticated — show login page
  return new Response(loginPage(false), {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RUST-OLEUM® Order Form</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#1a1a1a;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;}
    .box{background:white;border-radius:12px;padding:40px 48px;width:360px;max-width:90vw;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);}
    .logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px;}
    .logo-icon{display:grid;grid-template-columns:1fr 1fr;gap:3px;width:32px;height:32px;}
    .logo-icon span{background:#CC1F36;border-radius:2px;display:block;}
    .logo-text{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;color:#1a1a1a;}
    .subtitle{font-size:13px;color:#666;margin-bottom:28px;line-height:1.4;}
    input[type=password]{width:100%;padding:12px 16px;border:2px solid ${error ? '#CC1F36' : '#ddd'};border-radius:8px;font-size:18px;text-align:center;letter-spacing:4px;outline:none;font-family:'DM Sans',sans-serif;background:${error ? '#fff8f8' : 'white'};}
    input[type=password]:focus{border-color:#CC1F36;}
    button{margin-top:16px;width:100%;background:#CC1F36;color:white;border:none;padding:13px;border-radius:8px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;cursor:pointer;}
    button:hover{background:#a50d24;}
    .err{color:#CC1F36;font-size:13px;margin-top:12px;min-height:18px;}
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">
      <div class="logo-icon"><span></span><span></span><span></span><span></span></div>
      <div class="logo-text">RUST-OLEUM®</div>
    </div>
    <div class="subtitle">2025 Literature &amp; Merchandising<br>Order Form</div>
    <form method="POST">
      <input type="password" name="password" placeholder="Enter password" autofocus>
      <button type="submit">ACCESS</button>
      <div class="err">${error ? 'Incorrect password. Please try again.' : ''}</div>
    </form>
  </div>
</body>
</html>`;
}
