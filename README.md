# 📚 BookMark — Reading List App

A clean, minimal app to keep track of the books you want to read, are currently reading, and have finished. Built with React, TypeScript, and Vite.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-y2eztudj)

## Features

- **Add books** — Enter any title to add it to your list. Duplicates are caught, and titles are capped at 60 characters.
- **Track status** — Every book is in one of three states: _Want to Read_, _Reading_, or _Finished_. Cycle through them with a single click, or pick a specific status from a dropdown menu.
- **Filter & count** — Filter your list by status and see live counts for each category, plus a summary of your totals.
- **Auto-save** — Your list is saved in your browser, so it's still there when you come back.
- **Delete books** — Remove a book anytime from its card or the options menu.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for development and builds
- Local browser storage for persistence (no backend or login required)

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## How It Works

Each book is stored with a title and one of three statuses. The app keeps everything in React state and mirrors it to the browser's local storage, so your reading list survives page reloads. You can filter the visible books by status, and the summary panel shows how many books you have in total, how many you're currently reading, and how many you've finished.

## Notes

- Data is stored locally per browser. Clearing your browser storage will erase your list.
- No accounts, no sign-in — just open and start tracking.
