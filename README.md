# DIU EVENT-X

A student portal for finding and managing events, seminars, workshops, competitions, volunteer roles and external opportunities at Daffodil International University (DIU).

This version is a **static website** (plain HTML, CSS and JavaScript). It needs no server or database, so it can be hosted for free on GitHub Pages.

## Features

- **Students:** search and filter events, register, apply as a volunteer, save events, submit posts for approval, get recommendations from their department and interests, view notifications.
- **Admins:** review posts (approve or reject with a note), approve registrations and volunteer applications, manage events and news.
- **Manager:** publish approved posts, manage students and admins (maximum 3 active admins), see reports and an overview chart.
- **Accounts:** register, log in (with Remember me), password reset with a 6-digit code that expires in 10 minutes, and a lock-out prompt after 3 failed logins.

## Demo accounts

Every demo account uses the password `password`.

| Role    | Email                     |
|---------|---------------------------|
| Student | student@diueventx.test    |
| Admin   | admin@diueventx.test      |
| Manager | manager@diueventx.test    |

## Important limits of this version

- All data (accounts, posts, registrations) is saved in the **visitor's own browser** (`localStorage`). Two visitors do not see each other's data. Use **Reset demo data** in the footer to restore the sample data.
- The password reset code is shown on screen, because a static site cannot send email.
- "Continue with Google / Microsoft" only shows a notice. Real sign-in needs a server.
- For a real multi-user system, use the PHP + MySQL version of the project.

## Publish on GitHub Pages

1. Create a new **public** repository on GitHub, for example `diu-event-x`.
2. Upload every file and folder from this project (`index.html`, `assets/`, `.nojekyll`, `README.md`) to the repository root.
3. Open **Settings > Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose the `main` branch and the `/ (root)` folder, then **Save**.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/diu-event-x/`.

### Help people find it on Google

- Give the repository a clear description and topics such as `diu`, `events`, `student-portal`.
- Open [Google Search Console](https://search.google.com/search-console), add your site URL and use **URL Inspection > Request indexing**.
- Link to the site from your profile README, project report or university pages. Google can take several days or weeks to list a new site.

## Project structure

```
index.html
assets/
  css/style.css
  js/app.js
  favicon.svg
.nojekyll
README.md
```
